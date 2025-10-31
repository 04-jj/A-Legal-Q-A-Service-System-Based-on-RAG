# 基于RAG架构的智能法律问答系统

## 项目概述

本项目基于RAG（Retrieval-Augmented Generation）架构，设计并实现了一套功能完备的智能法律问答系统。系统集成了用户权限管理、多格式文档解析、智能问答交互、知识库动态管理等核心模块，为法律咨询场景提供专业、准确的智能服务。该项目适合新手小白进行学习。

## 技术架构

### 模型集成策略
- **大语言模型**：DeepSeek-R1（API接入）
- **嵌入模型**：BAAI/bge-small-zh-v1.5（本地部署）
- **重排序模型**：BAAI/bge-reranker-v2-m3（API接入）
- **向量数据库**：FAISS（本地存储）

### 系统架构特点
-  **前后端分离**：Streamlit前端 + Python后端
-  **模块化设计**：各功能模块独立可扩展
-  **安全可靠**：用户权限管理 + 数据隔离
-  **高效检索**：多级缓存 + 向量优化

## 环境配置

### 系统要求
- Python 3.8+
- 内存：≥ 8GB
- 存储：≥ 10GB可用空间

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/04-jj/A-Legal-Q-A-Service-System-Based-on-RAG.git
cd law_system

# 2. 创建虚拟环境
conda create -n your_name python=3.11

# 3. 安装依赖
pip install -r requirements.txt

```
## 项目完成情况

### 已完成
- [x] 多格式文档解析（PDF/DOCX/TXT）
- [x] 文本分块与向量化处理
- [x] 语义向量检索与重排序优化
- [x] 用户认证与权限管理系统
- [x] 知识库动态创建与维护
- [x] 对话历史记录与持久化存储
- [x] 实时问答交互与多轮对话支持
- [x] 前后端分离架构实现

### 进行中
- [ ] 法律领域模型微调优化
- [ ] 多模态交互
- [ ] 案例相似度匹配功能
- [ ] 自动文书生成模块
- [ ] 数据库完善 