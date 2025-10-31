document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const identifierInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');

    let errorTimeout = null;

    // 显示错误消息在手机号输入框上面
    function showError(message, duration = 3000) {
        // 移除现有的错误消息和清除之前的定时器
        hideError();

        if (errorTimeout) {
            clearTimeout(errorTimeout);
            errorTimeout = null;
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-error';
        errorDiv.textContent = message;
        errorDiv.id = 'custom-error';
        errorDiv.style.marginBottom = '15px';

        // 在手机号输入框的父元素前面插入错误消息
        const identifierFormGroup = identifierInput.closest('.form-group');
        if (identifierFormGroup) {
            identifierFormGroup.parentNode.insertBefore(errorDiv, identifierFormGroup);
        } else {
            // 如果找不到.form-group，就在表单开头显示
            form.prepend(errorDiv);
        }

        // 设置自动消失定时器
        errorTimeout = setTimeout(() => {
            hideError();
        }, duration);
    }

    // 隐藏错误消息
    function hideError() {
        const existingError = document.getElementById('custom-error');
        if (existingError) {
            existingError.remove();
        }
        if (errorTimeout) {
            clearTimeout(errorTimeout);
            errorTimeout = null;
        }
    }

    // 手机号格式验证
    identifierInput.addEventListener('blur', function() {
        const identifierValue = this.value.trim();
        const phoneRegex = /^1[3-9]\d{9}$/;

        if (identifierValue && !phoneRegex.test(identifierValue)) {
            this.setCustomValidity('请输入有效的手机号码');
            showError('请输入有效的手机号码', 2000); // 格式错误显示2秒
            return;
        } else {
            this.setCustomValidity('');
            hideError();
        }
    });

    // 密码验证
    passwordInput.addEventListener('blur', function() {
        const passwordValue = this.value.trim();
        if (!passwordValue) {
            showError('请输入密码', 2000); // 密码为空显示2秒
            return;
        }
        hideError();
    });

    // 表单提交验证
    form.addEventListener('submit', function(e) {
        let hasError = false;

        // 验证手机号格式
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(identifierInput.value)) {
            showError('请输入有效的手机号码', 3000);
            hasError = true;
        }

        // 验证密码
        if (!passwordInput.value.trim()) {
            showError('请输入密码', 3000);
            hasError = true;
        }

        if (hasError) {
            e.preventDefault();
        } else {
            // 如果验证通过，隐藏可能存在的错误消息
            hideError();
        }
    });

    // 实时输入时清除错误
    const inputs = [identifierInput, passwordInput];
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            // 清除输入框的错误状态
            this.classList.remove('error');

            // 只有当所有输入都有效时才清除错误消息
            const phoneRegex = /^1[3-9]\d{9}$/;
            const isIdentifierValid = phoneRegex.test(identifierInput.value);
            const isPasswordValid = passwordInput.value.trim().length > 0;

            if (isIdentifierValid && isPasswordValid) {
                hideError();
            }
        });
    });

    // 处理Flash消息的显示（后端返回的错误）
    function handleFlashMessages() {
        const flashMessages = document.querySelector('.flash-messages');
        if (flashMessages) {
            const alerts = flashMessages.querySelectorAll('.alert');
            alerts.forEach(alert => {
                if (alert.classList.contains('alert-error')) {
                    const errorText = alert.textContent;
                    showError(errorText, 3000); // 后端错误显示3秒

                    // 根据错误类型高亮对应的输入框
                    if (errorText.includes('用户不存在') || errorText.includes('手机号')) {
                        identifierInput.classList.add('error');
                    } else if (errorText.includes('密码')) {
                        passwordInput.classList.add('error');
                    }

                    // 移除原始的Flash消息（可选）
                    alert.style.display = 'none';
                }
            });
        }
    }

    // 记住我功能
    const rememberMe = document.querySelector('input[name="remember"]');

    // 检查本地存储中是否有保存的登录信息
    const savedIdentifier = localStorage.getItem('savedIdentifier');
    if (savedIdentifier && rememberMe) {
        identifierInput.value = savedIdentifier;
        rememberMe.checked = true;
    }

    // 表单提交时保存信息
    form.addEventListener('submit', function() {
        if (rememberMe && rememberMe.checked) {
            localStorage.setItem('savedIdentifier', identifierInput.value);
        } else {
            localStorage.removeItem('savedIdentifier');
        }
    });

    // 初始化时处理Flash消息
    handleFlashMessages();

    // 页面点击时也可以清除错误消息
    document.addEventListener('click', function() {
        hideError();
    });
});