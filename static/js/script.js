document.addEventListener('DOMContentLoaded', function() {
    // DOM元素
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const chatBox = document.getElementById('chat-box');
    const newChatBtn = document.getElementById('new-chat-btn');
    const searchChat = document.getElementById('search-chat');
    const historyList = document.getElementById('history-list');
    const kbSelector = document.getElementById('knowledge-base-selector');

    // 状态变量
    let currentChatId = null;
    let chats = [];
    let knowledgeBases = [];

    // 初始化应用
    function init() {
        fetchChats();
        fetchKnowledgeBases();
        setupRecommendationItems();
    }

    // 获取所有知识库
    function fetchKnowledgeBases() {
        fetch('/api/knowledge-bases')
            .then(response => response.json())
            .then(data => {
                knowledgeBases = data;
                renderKnowledgeBaseSelector();
            })
            .catch(error => {
                console.error('获取知识库失败:', error);
            });
    }

    // 渲染知识库选择器
    function renderKnowledgeBaseSelector() {
        if (!kbSelector) return;

        kbSelector.innerHTML = '';

        // 添加默认选项
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- 使用所有知识库 --';
        kbSelector.appendChild(defaultOption);

        // 添加知识库选项
        knowledgeBases.forEach(kb => {
            const option = document.createElement('option');
            option.value = kb.id;
            option.textContent = kb.name;
            kbSelector.appendChild(option);
        });
    }

    // 设置推荐项点击事件
    function setupRecommendationItems() {
        document.querySelectorAll('.recommendation-item').forEach(item => {
            item.addEventListener('click', function() {
                const title = this.querySelector('.recommendation-title').textContent;
                const content = this.querySelector('.recommendation-content').textContent;

                // 创建新对话或使用当前对话
                if (!currentChatId) {
                    createNewChat().then(() => {
                        addMessageToChat('user', title);
                        sendMessage(content);
                    });
                } else {
                    addMessageToChat('user', title);
                    sendMessage(content);
                }
            });
        });
    }

    // 获取所有对话
    function fetchChats() {
        fetch('/api/chats')
            .then(response => {
                if (!response.ok) {
                    throw new Error('获取对话失败');
                }
                return response.json();
            })
            .then(data => {
                chats = data;
                renderHistoryList();

                // 如果有对话，加载最新的一个
                if (chats.length > 0) {
                    loadChat(chats[0].id);
                } else {
                    createNewChat();
                }
            })
            .catch(error => {
                console.error('获取对话失败:', error);
                alert('获取对话历史失败，请刷新页面重试');
            });
    }

    // 创建新对话
    function createNewChat() {
        const kbId = kbSelector ? kbSelector.value : null;

        return fetch('/api/chats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: '新对话',
                knowledge_base_id: kbId
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('创建对话失败');
            }
            return response.json();
        })
        .then(chat => {
            currentChatId = chat.id;
            chats.unshift(chat); // 添加到数组开头
            renderHistoryList();
            clearChatBox();

            // 初始消息由服务器添加，这里不需要再添加
            fetchChatMessages(chat.id);
            return chat.id;
        })
        .catch(error => {
            console.error('创建对话失败:', error);
            alert('创建新对话失败，请重试');
        });
    }

    // 获取对话消息
    function fetchChatMessages(chatId) {
        return fetch(`/api/chats/${chatId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('获取对话消息失败');
                }
                return response.json();
            })
            .then(data => {
                clearChatBox();
                data.messages.forEach(msg => {
                    addMessageToChat(msg.role, msg.content, false);
                });
                scrollToBottom();
                return data;
            })
            .catch(error => {
                console.error('获取对话消息失败:', error);
                alert('获取对话内容失败，请重试');
            });
    }

    // 加载对话
    function loadChat(chatId) {
        currentChatId = chatId;
        fetchChatMessages(chatId);
        renderHistoryList();
    }

    // 更新对话标题
    function updateChatTitle(chatId, newTitle) {
        return fetch(`/api/chats/${chatId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title: newTitle })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('更新对话标题失败');
            }
            return response.json();
        })
        .then(updatedChat => {
            // 更新本地对话列表
            const index = chats.findIndex(chat => chat.id === chatId);
            if (index !== -1) {
                chats[index] = updatedChat;
                renderHistoryList();
            }
            return updatedChat;
        })
        .catch(error => {
            console.error('更新对话标题失败:', error);
            alert('更新对话标题失败，请重试');
        });
    }

    // 删除对话
    function deleteChat(chatId) {
        return fetch(`/api/chats/${chatId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('删除对话失败');
            }
            return response.json();
        })
        .then(data => {
            // 从本地列表中移除
            chats = chats.filter(chat => chat.id !== chatId);
            renderHistoryList();

            // 如果删除的是当前对话，加载最新的或创建新的
            if (currentChatId === chatId) {
                if (chats.length > 0) {
                    loadChat(chats[0].id);
                } else {
                    createNewChat();
                }
            }
            return data;
        })
        .catch(error => {
            console.error('删除对话失败:', error);
            alert('删除对话失败，请重试');
        });
    }

    // 渲染历史记录列表
    function renderHistoryList() {
        historyList.innerHTML = '';

        // 按更新时间排序（最新的在前面）
        const sortedChats = [...chats].sort((a, b) =>
            new Date(b.updated_at) - new Date(a.updated_at));

        sortedChats.forEach(chat => {
            const item = document.createElement('div');
            item.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;

            let kbInfo = '';
            if (chat.knowledge_base_id) {
                const kb = knowledgeBases.find(k => k.id === chat.knowledge_base_id);
                if (kb) {
                    kbInfo = `<div class="history-item-kb">知识库: ${kb.name}</div>`;
                }
            }

            item.innerHTML = `
                <div class="history-item-text">
                    <div class="history-item-content" title="${chat.title || '新对话'}">${chat.title || '新对话'}</div>
                    ${kbInfo}
                    <div class="history-item-date">${formatHistoryDate(chat.updated_at)}</div>
                </div>
                <div class="history-item-actions">
                    <button class="edit-chat" data-id="${chat.id}" title="编辑标题"><i class="fas fa-edit"></i></button>
                    <button class="delete-chat" data-id="${chat.id}" title="删除对话"><i class="fas fa-trash"></i></button>
                </div>
            `;

            item.addEventListener('click', () => {
                if (chat.id !== currentChatId) {
                    loadChat(chat.id);
                }
            });

            historyList.appendChild(item);
        });

        // 添加删除和编辑事件
        document.querySelectorAll('.delete-chat').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const chatId = parseInt(btn.getAttribute('data-id'));
                if (confirm('确定要删除这个对话吗？')) {
                    deleteChat(chatId);
                }
            });
        });

        document.querySelectorAll('.edit-chat').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const chatId = parseInt(btn.getAttribute('data-id'));
                const chat = chats.find(c => c.id === chatId);
                if (chat) {
                    const newTitle = prompt('请输入新的对话标题', chat.title || '新对话');
                    if (newTitle && newTitle.trim() !== '') {
                        updateChatTitle(chatId, newTitle.trim());
                    }
                }
            });
        });
    }

    // 格式化历史记录日期
    function formatHistoryDate(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        // 转换为本地时间
        const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);

        const now = new Date();

        if (localDate.toDateString() === now.toDateString()) {
            return '今天 ' + localDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (localDate.toDateString() === yesterday.toDateString()) {
            return '昨天 ' + localDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }

        return localDate.toLocaleDateString() + ' ' + localDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    // 清空聊天框
    function clearChatBox() {
        chatBox.innerHTML = '';
    }

    // 添加消息到聊天框
    function addMessageToChat(sender, message, save = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `${sender}-message`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'avatar';
        avatarDiv.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        // 处理消息内容，将点分行显示
        let formattedMessage = escapeHtml(message);
        formattedMessage = formattedMessage.replace(/(•|·)\s*/g, '<br>• ');
        formattedMessage = formattedMessage.replace(/(\d+\.)\s*/g, '<br>$1 ');
        formattedMessage = formattedMessage.replace(/-\s*/g, '<br>- ');

        contentDiv.innerHTML = formattedMessage;

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);

        chatBox.appendChild(messageDiv);
        scrollToBottom();
    }

    // HTML转义函数
    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // 滚动到底部
    function scrollToBottom() {
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // 添加加载消息
    function addLoadingMessage(id) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = id;
        loadingDiv.className = 'bot-message';
        loadingDiv.innerHTML = `
            <div class="avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content">
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        chatBox.appendChild(loadingDiv);
        scrollToBottom();
    }

    // 移除加载消息
    function removeLoadingMessage(id) {
        const loadingDiv = document.getElementById(id);
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    // 发送消息
    function sendMessage(message) {
        if (!message.trim() || !currentChatId) return;

        // 添加加载状态
        const loadingId = 'loading-' + Date.now();
        addLoadingMessage(loadingId);

        // 构建表单数据
        const formData = new FormData();
        formData.append('user_input', message);
        formData.append('chat_id', currentChatId);

        // 如果存在知识库选择器，添加选择的知识库ID
        if (kbSelector && kbSelector.value) {
            formData.append('knowledge_base_id', kbSelector.value);
        }

        // 发送请求
        fetch('/ask', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('获取回复失败');
            }
            return response.json();
        })
        .then(data => {
            removeLoadingMessage(loadingId);
            addMessageToChat('bot', data.response);

            // 更新对话标题
            if (message.length > 0) {
                const newTitle = message.length > 10 ? message.substring(0, 10) + '...' : message;
                updateChatTitle(currentChatId, newTitle);
            }

            // 更新对话列表中的时间和标题
            fetchChats();
        })
        .catch(error => {
            removeLoadingMessage(loadingId);
            addMessageToChat('bot', '抱歉，获取回复时出现了问题。');
            console.error('Error:', error);
        });
    }

    // 事件监听
    sendBtn.addEventListener('click', function() {
        const message = userInput.value.trim();
        if (message) {
            addMessageToChat('user', message);
            userInput.value = '';
            sendMessage(message);
        }
    });

    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendBtn.click();
        }
    });

    newChatBtn.addEventListener('click', createNewChat);

    searchChat.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const filteredChats = chats.filter(chat =>
            chat.title.toLowerCase().includes(searchTerm)
        );

        // 重新渲染过滤后的列表
        historyList.innerHTML = '';
        filteredChats.forEach(chat => {
            const item = document.createElement('div');
            item.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;

            let kbInfo = '';
            if (chat.knowledge_base_id) {
                const kb = knowledgeBases.find(k => k.id === chat.knowledge_base_id);
                if (kb) {
                    kbInfo = `<div class="history-item-kb">知识库: ${kb.name}</div>`;
                }
            }

            item.innerHTML = `
                <div class="history-item-text">
                    <div class="history-item-content" title="${chat.title || '新对话'}">${chat.title || '新对话'}</div>
                    ${kbInfo}
                    <div class="history-item-date">${formatHistoryDate(chat.updated_at)}</div>
                </div>
                <div class="history-item-actions">
                    <button class="edit-chat" data-id="${chat.id}" title="编辑标题"><i class="fas fa-edit"></i></button>
                    <button class="delete-chat" data-id="${chat.id}" title="删除对话"><i class="fas fa-trash"></i></button>
                </div>
            `;

            item.addEventListener('click', () => {
                if (chat.id !== currentChatId) {
                    loadChat(chat.id);
                }
            });

            historyList.appendChild(item);
        });

        // 重新绑定事件
        document.querySelectorAll('.delete-chat').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const chatId = parseInt(btn.getAttribute('data-id'));
                if (confirm('确定要删除这个对话吗？')) {
                    deleteChat(chatId);
                }
            });
        });

        document.querySelectorAll('.edit-chat').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const chatId = parseInt(btn.getAttribute('data-id'));
                const chat = chats.find(c => c.id === chatId);
                if (chat) {
                    const newTitle = prompt('请输入新的对话标题', chat.title || '新对话');
                    if (newTitle && newTitle.trim() !== '') {
                        updateChatTitle(chatId, newTitle.trim());
                    }
                }
            });
        });
    });

    // 初始化
    init();
});