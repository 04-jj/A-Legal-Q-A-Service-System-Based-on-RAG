from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader  # 新增TextLoader
from langchain_openai import ChatOpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
import os
import requests
from typing import List, Tuple, Dict


class DeepSeekApiRag:
    def __init__(self, api_key: str, db_path: str = "law_faiss"):
        # 1. 初始化嵌入模型
        print("正在加载嵌入模型...")
        self.embedding_model = HuggingFaceEmbeddings(model_name='BAAI/bge-small-zh-v1.5')

        # 2. 初始化DeepSeek API
        print("正在初始化DeepSeek API...")
        self.llm = ChatOpenAI(
            api_key=api_key,
            base_url="https://api.deepseek.com/v1",
            model="deepseek-chat",
        )

        # 3. 初始化向量数据库
        self.db_path = db_path
        self.vector_db = None
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=200,
            chunk_overlap=20,
            length_function=len
        )

        # 4. 初始化Reranker配置
        self.reranker_api_key = "your_key"
        self.reranker_url = "https://api.siliconflow.cn/v1/rerank"
        self.reranker_model = "BAAI/bge-reranker-v2-m3"

        if os.path.exists(db_path):
            self.load_vector_db()

    def _rerank_documents(
            self,
            query: str,
            documents: List[str],
            top_k: int = 3
    ) -> List[Tuple[str, float]]:
        if not self.reranker_api_key:
            print("未设置 Reranker API 密钥，跳过重排序")
            return [(doc, 0.0) for doc in documents[:top_k]]

        headers = {
            "Authorization": f"Bearer {self.reranker_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.reranker_model,
            "query": query,
            "documents": documents
        }

        try:
            response = requests.post(
                self.reranker_url,
                json=payload,
                headers=headers,
                timeout=30)
            response.raise_for_status()
            results = response.json().get("results", [])

            reranked = sorted(
                zip(documents, [res["relevance_score"] for res in results]),
                key=lambda x: x[1],
                reverse=True
            )
            return reranked[:top_k]
        except Exception as e:
            print(f"Reranker 调用失败: {e}")
            return [(doc, 0.0) for doc in documents[:top_k]]

    def add_documents(self, documents: List[str], save_to_disk: bool = True):
        if not documents:
            return

        if self.vector_db is None:
            self.vector_db = FAISS.from_texts(documents, self.embedding_model)
        else:
            self.vector_db.add_texts(documents)

        if save_to_disk:
            self.save_vector_db()

    def add_file_documents(self, file_path: str, save_to_disk: bool = True):
        # 支持TXT文件
        if file_path.lower().endswith('.pdf'):
            loader = PyPDFLoader(file_path)
        elif file_path.lower().endswith(('.doc', '.docx')):
            loader = Docx2txtLoader(file_path)
        elif file_path.lower().endswith('.txt'):
            loader = TextLoader(file_path, encoding='utf-8')  # 处理TXT文件
        else:
            print(f"不支持的文件格式: {file_path}")
            return

        pages = loader.load()
        documents = self.text_splitter.split_documents(pages)
        texts = [doc.page_content for doc in documents]
        self.add_documents(texts, save_to_disk)

    def add_folder_documents(self, folder_path: str, save_to_disk: bool = True):
        supported_extensions = ('.pdf', '.doc', '.docx', '.txt')  # TXT

        if not os.path.exists(folder_path):
            print(f"文件夹不存在: {folder_path}")
            return

        for filename in os.listdir(folder_path):
            if filename.lower().endswith(supported_extensions):
                file_path = os.path.join(folder_path, filename)
                print(f"正在处理文件: {file_path}")
                self.add_file_documents(file_path, save_to_disk=False)

        if save_to_disk and self.vector_db is not None:
            self.save_vector_db()

    def save_vector_db(self):
        if self.vector_db is not None:
            self.vector_db.save_local(self.db_path)

    def load_vector_db(self):
        self.vector_db = FAISS.load_local(
            self.db_path,
            self.embedding_model,
            allow_dangerous_deserialization=True
        )

    def retrieve_documents(self, query: str, top_k: int = 3) -> List[Tuple[str, float]]:
        """检索 + 重排序"""
        if self.vector_db is None:
            raise ValueError("知识库中没有文档，请先添加文档")

        docs_and_scores = self.vector_db.similarity_search_with_score(query, k=10)
        initial_docs = [doc.page_content for doc, _ in docs_and_scores]

        reranked_docs = self._rerank_documents(query, initial_docs, top_k=top_k)

        return [
            (doc, next(score for d, score in docs_and_scores if d.page_content == doc))
            for doc, _ in reranked_docs
        ]

    def generate_response(self, query: str, top_k: int = 3) -> Dict:
        """生成RAG回答"""
        try:
            retrieved_docs = self.retrieve_documents(query, top_k=top_k)
        except ValueError:
            retrieved_docs = []

        context = ""
        if retrieved_docs:
            context_parts = []
            for i, (doc, score) in enumerate(retrieved_docs):
                short_doc = doc[:200] + "..." if len(doc) > 200 else doc
                context_parts.append(f"【相关文档{i + 1}】(相似度:{score:.2f}): {short_doc}")
            context = "\n\n".join(context_parts)

        prompt = f"""你是一位专业但平易近人的法律顾问。请严格遵循以下要求回答用户的法律咨询：

        1. 分析问题: {query}
        2. 回答依据: 你要基于{context}来进行回答
        3.  回答要求：
            完整性判断：
                清晰、准确地解答用户问题，基于上下文给出专业、易懂的回答。
                如果提供的上下文不足或缺失关键信息，无法形成完整或可靠的答案，请明确告知用户：“根据您提供的现有信息，我无法给出完整的法律建议。”
            信息呈现：
                确保信息清晰、有条理。
                关键点突出： 使用清晰的分点或简短段落列出核心信息、法律要点、结论或建议。避免冗长的纯文本段落。每一个分点都要独立成段！！！
            专业性与平易近人：
                使用专业、准确的法律术语（当上下文提供时）。
                用通俗易懂的语言解释复杂的法律概念（基于上下文解释）。
                保持语气专业、客观、有帮助，避免过于生硬或学术化。
        4. 请仔细阅读{context}，并生成几个普通用户最可能提出的、与此内容直接相关的问题。
        请基于以上要求，对用户的问题进行回答："""

        response = self.llm.invoke(prompt).content
        response = response.replace('*', '').replace('#', '').strip()
        return {
            "response": response,
            "context": context,
            "retrieved_documents": [doc[0] for doc in retrieved_docs]
        }