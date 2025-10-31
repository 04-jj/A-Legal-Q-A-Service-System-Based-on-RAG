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
    let currentStreamingMessageId = null;

    // 初始化应用
    function init(){
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
                const content = this.querySelector('.recommendation-content').textContent;

                if (!currentChatId) {
                    createNewChat().then(() => {
                        sendMessage(content);
                    });
                } else {
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

            // 限制标题长度
            let title = chat.title || '新对话';
            if (title.length > 25) {
                title = title.substring(0, 25) + '...';
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

        // 如果是用户消息且需要保存，更新对话标题
        if (save && sender === 'user' && currentChatId) {
            // 使用消息的前20个字符作为标题
            const newTitle = message.substring(0, 20) + (message.length > 20 ? '...' : '');
            updateChatTitle(currentChatId, newTitle);
        }
    }

    // 发送消息 - 主要修改部分
    function sendMessage(message = null) {
        const messageText = message || userInput.value.trim();

        if (!messageText) return;

        // 清空输入框
        if (!message) {
            userInput.value = '';
        }

        // 如果没有当前对话，创建一个
        if (!currentChatId) {
            createNewChat().then(() => {
                sendMessage(messageText);
            });
            return;
        }

        // 添加用户消息
        addMessageToChat('user', messageText);

        // 显示加载动画
        const loadingDiv = document.createElement('div');
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

        // 获取知识库ID
        const kbId = kbSelector ? kbSelector.value : '';

        // 发送到服务器 - 使用正确的路由
        fetch('/ask_stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'user_input': messageText,
                'chat_id': currentChatId,
                'knowledge_base_id': kbId
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('发送消息失败: ' + response.status);
            }
            return handleStreamResponse(response, loadingDiv);
        })
        .catch(error => {
            console.error('发送消息失败:', error);
            // 移除加载动画
            if (loadingDiv.parentNode) {
                chatBox.removeChild(loadingDiv);
            }
            // 显示错误消息
            addMessageToChat('bot', '抱歉，发送消息时出现错误，请稍后重试。错误: ' + error.message);
        });
    }

    // 更新消息内容
    function updateMessageContent(contentDiv, content) {
        let formattedContent = escapeHtml(content);
        formattedContent = formattedContent.replace(/(•|·)\s*/g, '<br>• ');
        formattedContent = formattedContent.replace(/(\d+\.)\s*/g, '<br>$1 ');
        formattedContent = formattedContent.replace(/-\s*/g, '<br>- ');
        contentDiv.innerHTML = formattedContent;
    }

    // 保存完整消息
    function saveCompleteMessage(fullResponse) {
    // 更新对话列表
    fetchChats();

    // 移除streaming内容的ID，避免重复
    const streamingContent = document.getElementById('streaming-content');
    if (streamingContent) {
        streamingContent.removeAttribute('id');
    }

    // 强制刷新当前对话的消息，确保显示保存后的状态
    if (currentChatId) {
        setTimeout(() => {
            fetchChatMessages(currentChatId);
        }, 500);
    }
}

// 修改处理流式响应的函数，添加更好的完成处理
function handleStreamResponse(response, loadingDiv) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedResponse = '';

    // 移除加载动画
    if (loadingDiv.parentNode) {
        chatBox.removeChild(loadingDiv);
    }

    // 创建新的机器人消息容器
    const botMessageDiv = document.createElement('div');
    botMessageDiv.className = 'bot-message';
    botMessageDiv.innerHTML = `
        <div class="avatar"><i class="fas fa-robot"></i></div>
        <div class="message-content" id="streaming-content"></div>
    `;
    chatBox.appendChild(botMessageDiv);
    scrollToBottom();

    const contentDiv = document.getElementById('streaming-content');

    function read() {
        return reader.read().then(({ done, value }) => {
            if (done) {
                // 流式传输完成，保存完整消息
                console.log('流式传输完成，完整响应:', accumulatedResponse);
                saveCompleteMessage(accumulatedResponse);
                return;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            lines.forEach(line => {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);

                    // 检查是否传输结束
                    if (data === '[DONE]' || (data.includes('"done"') && data.includes('true'))) {
                        console.log('收到完成信号，完整响应:', accumulatedResponse);
                        saveCompleteMessage(accumulatedResponse);
                        return;
                    }

                    // 检查是否有错误
                    if (data.includes('"error"')) {
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.error) {
                                accumulatedResponse = parsed.error;
                                updateMessageContent(contentDiv, accumulatedResponse);
                                saveCompleteMessage(accumulatedResponse);
                                return;
                            }
                        } catch (e) {
                            console.error('解析错误信息失败:', e);
                        }
                    }

                    try {
                        // 解析JSON数据
                        if (data.startsWith('{') && data.endsWith('}')) {
                            const parsed = JSON.parse(data);
                            if (parsed.content) {
                                accumulatedResponse += parsed.content;
                                updateMessageContent(contentDiv, accumulatedResponse);
                            }
                        } else if (data !== '[DONE]' && !data.includes('"done"') && !data.includes('"error"')) {
                            // 普通文本数据
                            accumulatedResponse += data;
                            updateMessageContent(contentDiv, accumulatedResponse);
                        }
                    } catch (e) {
                        // 如果不是JSON，当作普通文本处理
                        if (data !== '[DONE]' && !data.includes('"done"') && !data.includes('"error"')) {
                            accumulatedResponse += data;
                            updateMessageContent(contentDiv, accumulatedResponse);
                        }
                    }

                    scrollToBottom();
                }
            });

            return read();
        });
    }

    return read().catch(error => {
        console.error('流式读取失败:', error);
        contentDiv.innerHTML = '抱歉，生成回复时出现错误。';
        saveCompleteMessage(accumulatedResponse);
    });
}

    // 滚动到底部
    function scrollToBottom() {
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // HTML转义
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 事件监听器
    sendBtn.addEventListener('click', () => sendMessage());
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    newChatBtn.addEventListener('click', () => {
        createNewChat();
    });

    searchChat.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const items = historyList.querySelectorAll('.history-item');

        items.forEach(item => {
            const content = item.querySelector('.history-item-content').textContent.toLowerCase();
            if (content.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });

    // 知识库选择器变更事件
    if (kbSelector) {
        kbSelector.addEventListener('change', () => {
            // 当知识库变更时，可以重新加载当前对话或创建新对话
            // 这里选择创建新对话
            createNewChat();
        });
    }

    // 初始化应用
    init();
});