document.addEventListener('DOMContentLoaded', function() {
    // 初始化函数
    function init() {
        setupFormValidation();
        setupCharacterCount();
        setupFormSubmission();
        setupDocumentList();
    }

    // 设置表单验证
    function setupFormValidation() {
        const form = document.querySelector('.kb-form');
        const nameInput = document.getElementById('name');
        const descriptionTextarea = document.getElementById('description');

        if (form) {
            form.addEventListener('submit', function(e) {
                if (!validateForm()) {
                    e.preventDefault();
                    showError('请正确填写所有必填字段');
                }
            });
        }

        // 实时验证名称字段
        if (nameInput) {
            nameInput.addEventListener('blur', validateName);
            nameInput.addEventListener('input', function() {
                clearError(this);
            });
        }

        // 实时验证描述字段
        if (descriptionTextarea) {
            descriptionTextarea.addEventListener('input', function() {
                clearError(this);
                updateCharacterCount(this, 'description-count');
            });
        }
    }

    // 验证表单
    function validateForm() {
        const nameInput = document.getElementById('name');
        const descriptionTextarea = document.getElementById('description');

        let isValid = true;

        if (!validateName()) {
            isValid = false;
        }

        if (descriptionTextarea && descriptionTextarea.value.length > 500) {
            showError(descriptionTextarea, '描述不能超过500个字符');
            isValid = false;
        }

        return isValid;
    }

    // 验证名称
    function validateName() {
        const nameInput = document.getElementById('name');
        if (!nameInput) return true;

        const name = nameInput.value.trim();

        if (name.length === 0) {
            showError(nameInput, '知识库名称不能为空');
            return false;
        }

        if (name.length < 2) {
            showError(nameInput, '知识库名称至少需要2个字符');
            return false;
        }

        if (name.length > 50) {
            showError(nameInput, '知识库名称不能超过50个字符');
            return false;
        }

        clearError(nameInput);
        return true;
    }

    // 设置字符计数
    function setupCharacterCount() {
        const descriptionTextarea = document.getElementById('description');
        if (descriptionTextarea) {
            // 创建字符计数显示
            const countDiv = document.createElement('div');
            countDiv.className = 'character-count';
            countDiv.id = 'description-count';
            countDiv.textContent = `${descriptionTextarea.value.length}/500`;

            descriptionTextarea.parentNode.appendChild(countDiv);

            // 根据初始长度设置颜色
            updateCharacterCount(descriptionTextarea, 'description-count');

            // 监听输入
            descriptionTextarea.addEventListener('input', function() {
                updateCharacterCount(this, 'description-count');
            });
        }
    }

    // 更新字符计数
    function updateCharacterCount(textarea, countId) {
        const countDiv = document.getElementById(countId);
        if (!countDiv) return;

        const length = textarea.value.length;
        countDiv.textContent = `${length}/500`;

        // 根据长度改变颜色
        countDiv.classList.remove('warning', 'error');
        if (length > 400) {
            countDiv.classList.add('warning');
        }
        if (length > 500) {
            countDiv.classList.add('error');
        }
    }

    // 设置表单提交
    function setupFormSubmission() {
        const form = document.querySelector('.kb-form');
        const submitBtn = form?.querySelector('.btn-submit');

        if (form && submitBtn) {
            form.addEventListener('submit', function() {
                // 禁用提交按钮防止重复提交
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 保存中...';

                // 添加加载状态
                form.classList.add('loading');
            });
        }

        // 取消按钮点击效果
        const cancelBtn = document.querySelector('.btn-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function(e) {
                // 检查表单是否有更改
                if (isFormModified()) {
                    const confirmLeave = confirm('您有未保存的更改，确定要离开吗？');
                    if (!confirmLeave) {
                        e.preventDefault();
                    }
                }
            });
        }
    }

    // 检查表单是否被修改
    function isFormModified() {
        const nameInput = document.getElementById('name');
        const descriptionTextarea = document.getElementById('description');
        const originalName = nameInput?.getAttribute('data-original') || nameInput?.value;
        const originalDescription = descriptionTextarea?.getAttribute('data-original') || descriptionTextarea?.value;

        return (nameInput && nameInput.value.trim() !== originalName) ||
               (descriptionTextarea && descriptionTextarea.value.trim() !== originalDescription);
    }

    // 设置文档列表交互
    function setupDocumentList() {
        const documentItems = document.querySelectorAll('.document-item');

        documentItems.forEach(item => {
            // 悬停效果
            item.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#f1f1f1';
                this.style.transform = 'translateX(5px)';
            });

            item.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '#f9f9f9';
                this.style.transform = 'translateX(0)';
            });

            // 点击效果（可以扩展为查看文档详情）
            item.addEventListener('click', function() {
                // 这里可以添加查看文档详情的功能
                console.log('查看文档详情');
            });
        });

        // 设置文件图标颜色
        setupFileIcons();
    }

    // 设置文件图标颜色和样式
    function setupFileIcons() {
        const fileIcons = document.querySelectorAll('.document-name i');

        fileIcons.forEach(icon => {
            const classList = icon.className;
            if (classList.includes('fa-file-pdf')) {
                icon.style.color = '#e63946';
            } else if (classList.includes('fa-file-word')) {
                icon.style.color = '#2b579a';
            } else {
                icon.style.color = '#495057';
            }
        });
    }

    // 显示错误信息
    function showError(input, message) {
        // 移除之前的错误信息
        clearError(input);

        // 添加错误样式
        input.style.borderColor = 'var(--danger-color)';

        // 创建错误消息元素
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.color = 'var(--danger-color)';
        errorDiv.style.fontSize = '0.8rem';
        errorDiv.style.marginTop = '5px';
        errorDiv.textContent = message;

        input.parentNode.appendChild(errorDiv);
    }

    // 清除错误信息
    function clearError(input) {
        input.style.borderColor = '';

        const errorDiv = input.parentNode.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    // 显示全局错误消息
    function showGlobalError(message) {
        // 创建错误消息元素
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-error';
        errorDiv.textContent = message;

        // 添加到消息容器
        const flashContainer = document.querySelector('.flash-messages');
        if (flashContainer) {
            flashContainer.appendChild(errorDiv);
        } else {
            // 如果没有消息容器，添加到表单前面
            const form = document.querySelector('.kb-form');
            if (form) {
                form.parentNode.insertBefore(errorDiv, form);
            }
        }

        // 5秒后自动移除
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    // 保存原始表单值用于比较
    function saveOriginalValues() {
        const nameInput = document.getElementById('name');
        const descriptionTextarea = document.getElementById('description');

        if (nameInput) {
            nameInput.setAttribute('data-original', nameInput.value);
        }
        if (descriptionTextarea) {
            descriptionTextarea.setAttribute('data-original', descriptionTextarea.value);
        }
    }

    // 初始化页面
    init();
    // 保存原始值
    saveOriginalValues();
});