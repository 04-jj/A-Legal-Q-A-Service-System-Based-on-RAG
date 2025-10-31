document.addEventListener('DOMContentLoaded', function() {
    // 初始化函数
    function init() {
        setupEventListeners();
        confirmDeletions();
    }

    // 设置事件监听器
    function setupEventListeners() {
        // 知识库项目的悬停效果
        const kbItems = document.querySelectorAll('.kb-item');
        kbItems.forEach(item => {
            item.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.1)';
            });

            item.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            });
        });

        // 新建知识库按钮
        const newKbBtn = document.querySelector('.btn-new-kb');
        if (newKbBtn) {
            newKbBtn.addEventListener('click', function(e) {
                // 这里可以添加一些动画效果
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 150);
            });
        }

        // 菜单项点击效果
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', function() {
                menuItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    // 确认删除操作
    function confirmDeletions() {
        const deleteForms = document.querySelectorAll('form[onsubmit]');
        deleteForms.forEach(form => {
            const originalOnSubmit = form.onsubmit;
            form.onsubmit = function(e) {
                // 如果已经有确认对话框，就使用原有的
                if (form.getAttribute('onsubmit').includes('confirm')) {
                    return originalOnSubmit.call(this, e);
                }

                // 否则显示确认对话框
                const kbName = form.closest('.kb-item')?.querySelector('.kb-name')?.textContent || '这个知识库';
                const result = confirm(`确定要删除"${kbName.trim()}"吗？所有关联文档也将被删除。`);
                return result;
            };
        });
    }

    // 显示消息提示
    function showMessage(message, type = 'success') {
        // 创建消息元素
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type}`;
        messageDiv.textContent = message;

        // 添加到消息容器
        const flashContainer = document.querySelector('.flash-messages');
        if (flashContainer) {
            flashContainer.appendChild(messageDiv);

            // 3秒后自动移除
            setTimeout(() => {
                messageDiv.remove();
            }, 3000);
        }
    }

    // 初始化页面
    init();
});