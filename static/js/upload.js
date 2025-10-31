document.addEventListener('DOMContentLoaded', function() {
    // DOM元素
    const fileUploadArea = document.getElementById('file-upload-area');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const fileList = document.getElementById('file-list');
    const urlInput = document.getElementById('url-input');
    const addUrlBtn = document.getElementById('add-url-btn');
    const urlList = document.getElementById('url-list');
    const uploadBtn = document.getElementById('upload-btn');
    const uploadForm = document.getElementById('upload-form');
    const uploadMethodBtns = document.querySelectorAll('.upload-method');
    const fileUploadSection = document.getElementById('file-upload-section');
    const urlUploadSection = document.getElementById('url-upload-section');
    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const previewContent = document.getElementById('preview-content');

    // 状态变量
    let selectedFiles = [];
    let selectedUrls = [];
    let currentUploadMethod = 'file';

    // 初始化事件监听器
    function init() {
        setupUploadMethods();
        setupFileUpload();
        setupUrlUpload();
        setupFormSubmission();
    }

    // 设置上传方式切换
    function setupUploadMethods() {
        uploadMethodBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const method = this.getAttribute('data-method');
                switchUploadMethod(method);
            });
        });
    }

    // 切换上传方式
    function switchUploadMethod(method) {
        currentUploadMethod = method;

        // 更新激活状态
        uploadMethodBtns.forEach(btn => {
            if (btn.getAttribute('data-method') === method) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 显示对应的上传区域
        if (method === 'file') {
            fileUploadSection.style.display = 'block';
            urlUploadSection.style.display = 'none';
        } else {
            fileUploadSection.style.display = 'none';
            urlUploadSection.style.display = 'block';
        }

        // 清空预览
        clearPreview();
    }

    // 设置文件上传相关事件
    function setupFileUpload() {
        // 点击上传区域选择文件
        fileUploadArea.addEventListener('click', function() {
            fileInput.click();
        });

        // 浏览按钮选择文件
        browseBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            fileInput.click();
        });

        // 文件选择事件
        fileInput.addEventListener('change', function(e) {
            handleFileSelection(e.target.files);
        });

        // 拖放事件
        fileUploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });

        fileUploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
        });

        fileUploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            handleFileSelection(e.dataTransfer.files);
        });
    }

    // 处理文件选择
    function handleFileSelection(files) {
        const newFiles = Array.from(files);

        // 验证文件类型和大小
        const validFiles = newFiles.filter(file => {
            const isValidType = validateFileType(file);
            const isValidSize = validateFileSize(file);

            if (!isValidType) {
                alert(`文件 "${file.name}" 的类型不支持。支持的文件类型：PDF, Word, Excel, PowerPoint, TXT。`);
                return false;
            }

            if (!isValidSize) {
                alert(`文件 "${file.name}" 的大小超过限制（最大 10MB）。`);
                return false;
            }

            return true;
        });

        // 添加到文件列表
        selectedFiles = [...selectedFiles, ...validFiles];
        renderFileList();
        updatePreview();
    }

    // 验证文件类型
    function validateFileType(file) {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain'
        ];

        const fileExtension = file.name.split('.').pop().toLowerCase();
        const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];

        return allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);
    }

    // 验证文件大小
    function validateFileSize(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        return file.size <= maxSize;
    }

    // 渲染文件列表
    function renderFileList() {
        fileList.innerHTML = '';

        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';

            const fileSize = formatFileSize(file.size);

            fileItem.innerHTML = `
                <div class="file-info">
                    <i class="fas fa-file file-icon"></i>
                    <div>
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${fileSize}</div>
                    </div>
                </div>
                <button class="file-remove" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;

            fileList.appendChild(fileItem);
        });

        // 添加删除事件
        document.querySelectorAll('.file-remove').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const index = parseInt(this.getAttribute('data-index'));
                removeFile(index);
            });
        });
    }

    // 移除文件
    function removeFile(index) {
        selectedFiles.splice(index, 1);
        renderFileList();
        updatePreview();
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 设置URL上传相关事件
    function setupUrlUpload() {
        addUrlBtn.addEventListener('click', function() {
            addUrl();
        });

        urlInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addUrl();
            }
        });
    }

    // 添加URL
    function addUrl() {
        const url = urlInput.value.trim();

        if (!url) {
            alert('请输入URL地址');
            return;
        }

        if (!validateUrl(url)) {
            alert('请输入有效的URL地址（必须以 http:// 或 https:// 开头）');
            return;
        }

        selectedUrls.push(url);
        renderUrlList();
        urlInput.value = '';
        updatePreview();
    }

    // 验证URL格式
    function validateUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }

    // 渲染URL列表
    function renderUrlList() {
        urlList.innerHTML = '';

        selectedUrls.forEach((url, index) => {
            const urlItem = document.createElement('div');
            urlItem.className = 'url-item';

            urlItem.innerHTML = `
                <div class="url-info" title="${url}">${url}</div>
                <button class="url-remove" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;

            urlList.appendChild(urlItem);
        });

        // 添加删除事件
        document.querySelectorAll('.url-remove').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                removeUrl(index);
            });
        });
    }

    // 移除URL
    function removeUrl(index) {
        selectedUrls.splice(index, 1);
        renderUrlList();
        updatePreview();
    }

    // 更新预览
    function updatePreview() {
        if (currentUploadMethod === 'file') {
            updateFilePreview();
        } else {
            updateUrlPreview();
        }
    }

    // 更新文件预览
    function updateFilePreview() {
        if (selectedFiles.length === 0) {
            showPreviewPlaceholder();
            return;
        }

        let previewHtml = '<h4>选择的文件：</h4><ul>';

        selectedFiles.forEach(file => {
            const fileSize = formatFileSize(file.size);
            previewHtml += `
                <li style="margin-bottom: 10px;">
                    <strong>${file.name}</strong> (${fileSize})
                </li>
            `;
        });

        previewHtml += '</ul>';
        previewContent.innerHTML = previewHtml;
    }

    // 更新URL预览
    function updateUrlPreview() {
        if (selectedUrls.length === 0) {
            showPreviewPlaceholder();
            return;
        }

        let previewHtml = '<h4>选择的URL：</h4><ul>';

        selectedUrls.forEach(url => {
            previewHtml += `
                <li style="margin-bottom: 10px; word-break: break-all;">
                    <i class="fas fa-link" style="color: var(--primary-color);"></i>
                    ${url}
                </li>
            `;
        });

        previewHtml += '</ul>';
        previewContent.innerHTML = previewHtml;
    }

    // 显示预览占位符
    function showPreviewPlaceholder() {
        previewContent.innerHTML = `
            <div class="preview-placeholder">
                <i class="fas fa-file-upload"></i>
                <p>选择文件或添加URL后，预览将显示在这里</p>
            </div>
        `;
    }

    // 清空预览
    function clearPreview() {
        showPreviewPlaceholder();
    }

    // 设置表单提交
    function setupFormSubmission() {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleUpload();
        });
    }

    // 处理上传
    function handleUpload() {
        if (currentUploadMethod === 'file' && selectedFiles.length === 0) {
            alert('请选择要上传的文件');
            return;
        }

        if (currentUploadMethod === 'url' && selectedUrls.length === 0) {
            alert('请添加要处理的URL');
            return;
        }

        // 显示进度条
        progressContainer.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = '准备上传...';

        // 禁用上传按钮
        uploadBtn.disabled = true;
        uploadBtn.textContent = '上传中...';

        if (currentUploadMethod === 'file') {
            uploadFiles();
        } else {
            uploadUrls();
        }
    }

    // 上传文件
    function uploadFiles() {
        const formData = new FormData();

        selectedFiles.forEach(file => {
            formData.append('files', file);
        });

        // 模拟上传进度
        simulateUploadProgress()
            .then(() => {
                // 实际项目中，这里应该发送到服务器
                fetch('/api/upload/files', {
                    method: 'POST',
                    body: formData
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('上传失败');
                    }
                    return response.json();
                })
                .then(data => {
                    showUploadSuccess('文件上传成功！');
                    resetForm();
                })
                .catch(error => {
                    console.error('上传失败:', error);
                    showUploadError('文件上传失败，请重试');
                });
            });
    }

    // 上传URL
    function uploadUrls() {
        // 模拟上传进度
        simulateUploadProgress()
            .then(() => {
                // 实际项目中，这里应该发送到服务器
                fetch('/api/upload/urls', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ urls: selectedUrls })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('处理URL失败');
                    }
                    return response.json();
                })
                .then(data => {
                    showUploadSuccess('URL处理成功！');
                    resetForm();
                })
                .catch(error => {
                    console.error('处理URL失败:', error);
                    showUploadError('URL处理失败，请重试');
                });
            });
    }

    // 模拟上传进度
    function simulateUploadProgress() {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 10;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    resolve();
                }
                progressFill.style.width = progress + '%';
                progressText.textContent = `上传中... ${Math.round(progress)}%`;
            }, 200);
        });
    }

    // 显示上传成功
    function showUploadSuccess(message) {
        progressFill.style.backgroundColor = 'var(--success-color)';
        progressText.textContent = message;

        // 延迟跳转
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
    }

    // 显示上传错误
    function showUploadError(message) {
        progressFill.style.backgroundColor = 'var(--danger-color)';
        progressText.textContent = message;

        // 重新启用上传按钮
        uploadBtn.disabled = false;
        uploadBtn.textContent = '开始上传';
    }

    // 重置表单
    function resetForm() {
        selectedFiles = [];
        selectedUrls = [];
        renderFileList();
        renderUrlList();
        clearPreview();

        // 隐藏进度条
        setTimeout(() => {
            progressContainer.style.display = 'none';
            uploadBtn.disabled = false;
            uploadBtn.textContent = '开始上传';
        }, 2000);
    }

    // 初始化应用
    init();
});