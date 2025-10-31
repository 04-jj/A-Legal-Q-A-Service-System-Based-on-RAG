document.addEventListener('DOMContentLoaded', function() {
    // 密码确认验证
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm_password');
    const form = document.querySelector('form');
    const phoneInput = document.getElementById('phone');
    const usernameInput = document.getElementById('username');

    let errorTimeout = null;
    let currentErrorType = ''; // 记录当前错误类型

    // 显示错误消息在手机号输入框上面
    function showError(message, duration = 3000, errorType = '') {
        // 如果已经有相同类型的错误在显示，就不重复显示
        if (currentErrorType === errorType && document.getElementById('custom-error')) {
            return;
        }

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
        const phoneFormGroup = phoneInput.closest('.form-group');
        if (phoneFormGroup) {
            phoneFormGroup.parentNode.insertBefore(errorDiv, phoneFormGroup);
        } else {
            // 如果找不到.form-group，就在表单开头显示
            form.prepend(errorDiv);
        }

        currentErrorType = errorType;

        // 设置自动消失定时器
        errorTimeout = setTimeout(() => {
            hideError();
        }, duration);
    }

    // 隐藏错误消息（带动画）
    function hideError() {
        const existingError = document.getElementById('custom-error');
        if (existingError) {
            // 添加淡出动画
            existingError.classList.add('fade-out');
            // 动画结束后移除元素
            setTimeout(() => {
                if (existingError.parentNode) {
                    existingError.parentNode.removeChild(existingError);
                }
            }, 300); // 匹配CSS动画时间
        }
        if (errorTimeout) {
            clearTimeout(errorTimeout);
            errorTimeout = null;
        }
        currentErrorType = '';
    }

    // 统一的验证函数
    function validateAllFields() {
        const phoneValue = phoneInput.value.trim();
        const usernameValue = usernameInput.value.trim();
        const passwordValue = password.value;
        const confirmPasswordValue = confirmPassword.value;

        const phoneRegex = /^1[3-9]\d{9}$/;

        // 按优先级显示错误（手机号 > 用户名 > 密码）
        if (!phoneValue) {
            return { isValid: false, message: '请输入手机号码', type: 'phone_empty' };
        }

        if (!phoneRegex.test(phoneValue)) {
            return { isValid: false, message: '请输入有效的手机号码', type: 'phone_invalid' };
        }

        if (!usernameValue) {
            return { isValid: false, message: '请输入用户名', type: 'username_empty' };
        }

        if (usernameValue.length < 2) {
            return { isValid: false, message: '用户名长度至少为2位', type: 'username_short' };
        }

        if (!passwordValue) {
            return { isValid: false, message: '请输入密码', type: 'password_empty' };
        }

        if (passwordValue.length < 6) {
            return { isValid: false, message: '密码长度至少为6位', type: 'password_short' };
        }

        if (passwordValue !== confirmPasswordValue) {
            return { isValid: false, message: '密码不匹配', type: 'password_mismatch' };
        }

        return { isValid: true };
    }

    // 实时验证函数（不显示错误，只清除错误）
    function validateRealTime() {
        const result = validateAllFields();
        if (result.isValid) {
            hideError();
        }
        return result.isValid;
    }

    // 提交验证函数（显示错误）
    function validateForSubmit() {
        const result = validateAllFields();
        if (!result.isValid) {
            showError(result.message, 3000, result.type);
            return false;
        }
        return true;
    }

    // 输入框失去焦点时的验证
    phoneInput.addEventListener('blur', function() {
        const phoneValue = this.value.trim();
        const phoneRegex = /^1[3-9]\d{9}$/;

        if (phoneValue && !phoneRegex.test(phoneValue)) {
            showError('请输入有效的手机号码', 2000, 'phone_invalid');
        } else {
            validateRealTime();
        }
    });

    usernameInput.addEventListener('blur', function() {
        const usernameValue = this.value.trim();
        if (usernameValue && usernameValue.length < 2) {
            showError('用户名长度至少为2位', 2000, 'username_short');
        } else {
            validateRealTime();
        }
    });

    password.addEventListener('blur', function() {
        const passwordValue = this.value;
        if (passwordValue && passwordValue.length < 6) {
            showError('密码长度至少为6位', 2000, 'password_short');
        } else {
            validateRealTime();
        }
    });

    confirmPassword.addEventListener('blur', function() {
        if (password.value !== this.value) {
            showError('密码不匹配', 2000, 'password_mismatch');
        } else {
            validateRealTime();
        }
    });

    // 实时输入时清除错误和验证状态
    const inputs = [phoneInput, usernameInput, password, confirmPassword];
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            // 清除输入框的错误状态
            this.classList.remove('error');

            // 实时验证但不显示错误
            validateRealTime();

            // 特定字段的实时验证
            if (this === password || this === confirmPassword) {
                if (password.value && confirmPassword.value && password.value === confirmPassword.value) {
                    hideError();
                }
            }
        });
    });

    // 表单提交验证
    form.addEventListener('submit', function(e) {
        if (!validateForSubmit()) {
            e.preventDefault();
        } else {
            // 如果验证通过，隐藏可能存在的错误消息
            hideError();
        }
    });

    // 处理Flash消息的显示（后端返回的错误）
    function handleFlashMessages() {
        const flashMessages = document.querySelector('.flash-messages');
        if (flashMessages) {
            const alerts = flashMessages.querySelectorAll('.alert');
            alerts.forEach(alert => {
                if (alert.classList.contains('alert-error')) {
                    const errorText = alert.textContent;
                    showError(errorText, 3000, 'backend_error');

                    // 根据错误类型高亮对应的输入框
                    if (errorText.includes('手机号') || errorText.includes('已注册')) {
                        phoneInput.classList.add('error');
                    } else if (errorText.includes('用户名')) {
                        usernameInput.classList.add('error');
                    } else if (errorText.includes('密码')) {
                        password.classList.add('error');
                        confirmPassword.classList.add('error');
                    }

                    // 移除原始的Flash消息
                    alert.style.display = 'none';
                }
            });
        }
    }

    // 初始化时处理Flash消息
    handleFlashMessages();

    // 页面点击时也可以清除错误消息
    document.addEventListener('click', function() {
        hideError();
    });
});