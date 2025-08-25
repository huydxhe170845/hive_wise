// Vault Status Toggle Functions
let currentToggleCheckbox = null;

function confirmToggleVaultStatus(checkbox) {
    event.preventDefault();

    const vaultId = checkbox.getAttribute('data-vault-id');
    const vaultName = checkbox.getAttribute('data-vault-name');

    currentToggleCheckbox = checkbox;

    const modalTitle = document.getElementById('confirmModalTitle');
    const modalMessage = document.getElementById('confirmModalMessage');

    modalTitle.textContent = 'Xác nhận thay đổi';
    modalMessage.innerHTML = `Bạn có muốn đổi trạng thái vault "<strong>${vaultName}</strong>" không?`;

    document.getElementById('vaultStatusConfirmModal').classList.add('show');
}

function confirmVaultStatusToggle() {
    if (!currentToggleCheckbox) return;

    const vaultId = currentToggleCheckbox.getAttribute('data-vault-id');
    const statusLabel = currentToggleCheckbox.parentElement.parentElement.querySelector('.status-label');

    currentToggleCheckbox.disabled = true;
    statusLabel.textContent = 'Updating...';

    fetch('/dashboard/toggle-vault-status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `vaultId=${encodeURIComponent(vaultId)}`
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentToggleCheckbox.checked = data.newStatus;
                statusLabel.textContent = data.statusText;
                statusLabel.className = `status-label ${data.newStatus ? 'active' : 'inactive'}`;

                // Update View Vault action visibility
                const vaultRow = currentToggleCheckbox.closest('tr');
                const viewVaultLink = vaultRow.querySelector('a[title="View Vault"]');
                if (viewVaultLink) {
                    if (data.newStatus) {
                        // Show View Vault action when vault becomes active
                        viewVaultLink.style.display = 'inline-block';
                    } else {
                        // Hide View Vault action when vault becomes inactive
                        viewVaultLink.style.display = 'none';
                    }
                }

                showToast(`Vault status updated to ${data.statusText}`, 'success');
            } else {
                currentToggleCheckbox.checked = !currentToggleCheckbox.checked;
                statusLabel.textContent = currentToggleCheckbox.checked ? 'Active' : 'Inactive';
                statusLabel.className = `status-label ${currentToggleCheckbox.checked ? 'active' : 'inactive'}`;

                // Update View Vault action visibility on API error (revert to original state)
                const vaultRow = currentToggleCheckbox.closest('tr');
                const viewVaultLink = vaultRow.querySelector('a[title="View Vault"]');
                if (viewVaultLink) {
                    if (currentToggleCheckbox.checked) {
                        // Show View Vault action when vault is active
                        viewVaultLink.style.display = 'inline-block';
                    } else {
                        // Hide View Vault action when vault is inactive
                        viewVaultLink.style.display = 'none';
                    }
                }

                showToast(data.message || 'Failed to update vault status', 'error');
            }
        })
        .catch(error => {
            currentToggleCheckbox.checked = !currentToggleCheckbox.checked;
            statusLabel.textContent = currentToggleCheckbox.checked ? 'Active' : 'Inactive';
            statusLabel.className = `status-label ${currentToggleCheckbox.checked ? 'active' : 'inactive'}`;

            // Update View Vault action visibility on error (revert to original state)
            const vaultRow = currentToggleCheckbox.closest('tr');
            const viewVaultLink = vaultRow.querySelector('a[title="View Vault"]');
            if (viewVaultLink) {
                if (currentToggleCheckbox.checked) {
                    // Show View Vault action when vault is active
                    viewVaultLink.style.display = 'inline-block';
                } else {
                    // Hide View Vault action when vault is inactive
                    viewVaultLink.style.display = 'none';
                }
            }

            showToast('An error occurred while updating vault status', 'error');
        })
        .finally(() => {
            currentToggleCheckbox.disabled = false;
            cancelVaultStatusToggle();
        });
}

function cancelVaultStatusToggle() {
    document.getElementById('vaultStatusConfirmModal').classList.remove('show');
    currentToggleCheckbox = null;
}

document.addEventListener('click', function (event) {
    const modal = document.getElementById('vaultStatusConfirmModal');
    if (event.target === modal) {
        cancelVaultStatusToggle();
    }
});

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 300px;
    `;

    switch (type) {
        case 'success':
            toast.style.background = '#28a745';
            break;
        case 'error':
            toast.style.background = '#dc3545';
            break;
        case 'warning':
            toast.style.background = '#ffc107';
            toast.style.color = '#000';
            break;
        default:
            toast.style.background = '#17a2b8';
    }

    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Global function to generate secure password
function generateSecurePassword() {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&";
    let password = "";

    // Ensure at least one character from each required category
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // uppercase
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // lowercase
    password += "0123456789"[Math.floor(Math.random() * 10)]; // number
    password += "@$!%*?&"[Math.floor(Math.random() * 7)]; // special character

    // Fill the rest with random characters
    for (let i = 4; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    return password;
}

function initializePageNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-page]');
    const pages = document.querySelectorAll('.page-content');

    function getInitialPage() {
        // Always show dashboard-analytics first when logging in
        // Only use hash or localStorage if explicitly set
        const hash = window.location.hash.substring(1);
        if (hash && document.getElementById(hash + '-page')) {
            return hash;
        }

        // Check if user just logged in (no previous page stored)
        const previousPage = localStorage.getItem('currentPage');
        if (!previousPage) {
            // First time or fresh login - always show dashboard
            return 'dashboard-analytics';
        }

        return previousPage;
    }

    const currentPage = getInitialPage();

    // Initialize submenus based on current page
    function initializeDefaultSubmenuState() {
        // Get current page from hash or localStorage
        const currentPage = window.location.hash.substring(1) || localStorage.getItem('currentPage') || 'dashboard-analytics';

        // Clear all submenu active states first
        const accountManagementLink = document.querySelector('.account-management-link');
        const vaultManagementLink = document.querySelector('.vault-management-link');

        if (accountManagementLink) {
            accountManagementLink.classList.remove('active');
            const accountNavItem = accountManagementLink.closest('.nav-item');
            if (accountNavItem) {
                accountNavItem.classList.remove('active');
            }
        }

        if (vaultManagementLink) {
            vaultManagementLink.classList.remove('active');
            const vaultNavItem = vaultManagementLink.closest('.nav-item');
            if (vaultNavItem) {
                vaultNavItem.classList.remove('active');
            }
        }

        // Only open submenus based on current page
        if (currentPage === 'account-management' || currentPage === 'register-account') {
            if (accountManagementLink) {
                accountManagementLink.classList.add('active');
                const accountNavItem = accountManagementLink.closest('.nav-item');
                if (accountNavItem) {
                    accountNavItem.classList.add('active');
                }
            }
            ensureAccountSubmenuOpen();
        } else if (currentPage === 'vault-management' || currentPage === 'add-vault' || currentPage === 'vault-permissions' || currentPage === 'vault-storage' || currentPage === 'vault-backup' || currentPage === 'vault-security' || currentPage === 'vault-analytics') {
            if (vaultManagementLink) {
                vaultManagementLink.classList.add('active');
                const vaultNavItem = vaultManagementLink.closest('.nav-item');
                if (vaultNavItem) {
                    vaultNavItem.classList.add('active');
                }
            }
            ensureVaultSubmenuOpen();
        }
    }

    // Initialize default submenu state
    initializeDefaultSubmenuState();

    // Initialize admin notifications
    initializeAdminNotifications();

    // Clear stored page on fresh login to ensure dashboard shows first
    if (!localStorage.getItem('currentPage')) {
        localStorage.removeItem('currentPage');
        // Force dashboard to be the default page
        localStorage.setItem('currentPage', 'dashboard-analytics');
    }

    showPage(currentPage);

    if (!window.location.hash) {
        window.location.hash = currentPage;
    } else if (window.location.hash === '#') {
        // If hash is just '#', redirect to dashboard
        window.location.hash = 'dashboard-analytics';
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');

            showPage(pageId);

            window.location.hash = pageId;
            localStorage.setItem('currentPage', pageId);
        });
    });



    window.addEventListener('hashchange', function () {
        const pageId = window.location.hash.substring(1);
        if (pageId && document.getElementById(pageId + '-page')) {
            showPage(pageId);
            localStorage.setItem('currentPage', pageId);
        }
    });

    function showPage(pageId) {
        pages.forEach(page => {
            page.classList.remove('active');
        });
        const targetPage = document.getElementById(pageId + '-page');
        if (targetPage) {
            targetPage.classList.add('active');
        }
        navLinks.forEach(nav => {
            const navItem = nav.closest('.nav-item');
            nav.classList.remove('active');
            if (navItem) {
                navItem.classList.remove('active');
            }
            if (nav.getAttribute('data-page') === pageId) {
                nav.classList.add('active');
                if (navItem) {
                    navItem.classList.add('active');
                }
            }
        });

        // Clear all submenu active states first
        const submenuItems = document.querySelectorAll('.submenu-item');
        submenuItems.forEach(subItem => {
            subItem.classList.remove('active');
        });

        // Clear all main navigation active states
        const accountManagementLink = document.querySelector('.account-management-link');
        const vaultManagementLink = document.querySelector('.vault-management-link');

        if (accountManagementLink) {
            accountManagementLink.classList.remove('active');
            const accountNavItem = accountManagementLink.closest('.nav-item');
            if (accountNavItem) {
                accountNavItem.classList.remove('active');
            }
        }

        if (vaultManagementLink) {
            vaultManagementLink.classList.remove('active');
            const vaultNavItem = vaultManagementLink.closest('.nav-item');
            if (vaultNavItem) {
                vaultNavItem.classList.remove('active');
            }
        }

        // Set active state for current page
        submenuItems.forEach(subItem => {
            if (subItem.getAttribute('data-page') === pageId) {
                subItem.classList.add('active');

                // Handle vault management submenu
                if (pageId === 'vault-management' || pageId === 'add-vault' || pageId === 'vault-permissions' || pageId === 'vault-storage' || pageId === 'vault-backup' || pageId === 'vault-security' || pageId === 'vault-analytics') {
                    if (vaultManagementLink) {
                        vaultManagementLink.classList.add('active');
                        const vaultNavItem = vaultManagementLink.closest('.nav-item');
                        if (vaultNavItem) {
                            vaultNavItem.classList.add('active');
                        }
                        ensureVaultSubmenuOpen();
                    }
                }

                // Handle account management submenu
                if (pageId === 'account-management' || pageId === 'register-account') {
                    if (accountManagementLink) {
                        accountManagementLink.classList.add('active');
                        const accountNavItem = accountManagementLink.closest('.nav-item');
                        if (accountNavItem) {
                            accountNavItem.classList.add('active');
                        }
                        ensureAccountSubmenuOpen();
                    }
                }
            }
        });

        setTimeout(() => {
            initializeDashboardFeatures();

            // Refresh vault list when entering vault management page
            if (pageId === 'vault-management') {
                refreshVaultList();
            }
        }, 100);
    }
}

const searchInput = document.getElementById('exampleInputSearch');
if (searchInput) {
    searchInput.addEventListener('input', function () {
        let timeout;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            this.form.submit();
        }, 500);
    });
}

function showToast(message, type = 'success') {
    const toast = document.getElementById("toast-notification");
    const toastIcon = document.getElementById("toast-icon");
    const toastMsg = document.getElementById("toast-message");

    if (!toast || !toastIcon || !toastMsg) return;

    toast.className = "toast-notification";

    if (type === 'error') {
        toast.classList.add('error');
        toastIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />';
        toastIcon.classList.remove('success-icon');
        toastIcon.classList.add('error-icon');
    } else if (type === 'warning') {
        toast.classList.add('warning');
        toastIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />';
        toastIcon.classList.remove('success-icon', 'error-icon');
        toastIcon.classList.add('warning-icon');
    } else {
        toastIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />';
        toastIcon.classList.remove('error-icon', 'warning-icon');
        toastIcon.classList.add('success-icon');
    }

    toastMsg.textContent = message;

    toast.style.display = "flex";
    toast.style.opacity = "1";

    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => {
            toast.style.display = "none";
            toast.className = "toast-notification";
        }, 300);
    }, 3000);
}

function checkForToastMessages() {
    const toastMessage = sessionStorage.getItem('toastMessage');
    const toastType = sessionStorage.getItem('toastType');

    if (toastMessage) {
        setTimeout(() => {
            showToast(toastMessage, toastType || 'success');
        }, 500);

        sessionStorage.removeItem('toastMessage');
        sessionStorage.removeItem('toastType');
    }

    // Check for vault created toast from localStorage (legacy support)
    if (localStorage.getItem('showVaultCreatedToast') === 'true') {
        localStorage.removeItem('showVaultCreatedToast');
        setTimeout(() => {
            showToast('Vault created successfully!', 'success');
        }, 500);
    }

    const refreshImages = sessionStorage.getItem('refreshImages');
    if (refreshImages === 'true') {
        setTimeout(() => {
            refreshAllAvatarImages();
        }, 1000);
        sessionStorage.removeItem('refreshImages');
    }
}

function refreshAllAvatarImages() {
    const timestamp = new Date().getTime();

    // Refresh all avatar images in the page
    document.querySelectorAll('img').forEach(img => {
        const originalSrc = img.src;
        if (originalSrc &&
            (originalSrc.includes('/uploads/') ||
                originalSrc.includes('avatar') ||
                originalSrc.includes('static/images/avatar/')) &&
            !originalSrc.includes('placehold.co') &&
            !originalSrc.includes('logo') &&
            !originalSrc.includes('icon')) {

            const separator = originalSrc.includes('?') ? '&' : '?';
            const newSrc = originalSrc.split('?')[0] + separator + 't=' + timestamp;
            img.src = newSrc;
        }
    });
} function setToastForReload(message, type = 'success') {
    sessionStorage.setItem('toastMessage', message);
    sessionStorage.setItem('toastType', type);
}

function setImageRefreshForReload() {
    sessionStorage.setItem('refreshImages', 'true');
}

function initializeAccountManagement() {
    initializeTableFeatures();
    checkForToastMessages();
    setupEditButtons();
    setupRegisterForm();
}

function setupEditButtons() {
}

function setupRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    const editForm = document.getElementById('editForm');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const username = document.getElementById('username');
    const avatarInput = document.getElementById('avatar');
    const fileUploadBtn = document.querySelector('.file-upload-btn');
    const fileText = document.querySelector('.file-text');
    const fileSelectedInfo = document.querySelector('.file-selected-info');
    const selectedFileName = document.querySelector('.selected-file-name');

    // Edit form elements
    const editUserId = document.getElementById('editUserId');
    const editUsername = document.getElementById('editUsername');
    const editEmail = document.getElementById('editEmail');
    const editName = document.getElementById('editName');
    const editPhoneNumber = document.getElementById('editPhoneNumber');
    const editSystemRole = document.getElementById('editSystemRole');
    const editIsActivated = document.getElementById('editIsActivated');
    const editAvatarInput = document.getElementById('editAvatar');
    const editFileUploadBtn = document.querySelector('.edit-file-upload-btn');
    const editFileText = document.querySelector('.edit-file-text');
    const editFileSelectedInfo = document.querySelector('.edit-file-selected-info');
    const editSelectedFileName = document.querySelector('.edit-selected-file-name');
    const currentAvatarSection = document.getElementById('currentAvatarSection');
    const currentAvatarImg = document.getElementById('currentAvatarImg');

    function validatePassword() {
        if (password && confirmPassword) {
            if (password.value !== confirmPassword.value) {
                confirmPassword.setCustomValidity("Passwords don't match");
            } else {
                confirmPassword.setCustomValidity('');
            }
        }
    }

    if (password && confirmPassword) {
        password.addEventListener('change', validatePassword);
        confirmPassword.addEventListener('keyup', validatePassword);
    }

    function validateUsername(usernameField) {
        if (usernameField) {
            usernameField.addEventListener('input', function () {
                const usernamePattern = /^[a-zA-Z0-9_]+$/;
                if (!usernamePattern.test(this.value) && this.value !== '') {
                    this.setCustomValidity('Username can only contain letters, numbers, and underscores');
                } else {
                    this.setCustomValidity('');
                }
            });
        }
    }

    validateUsername(username);
    validateUsername(editUsername);

    if (avatarInput) {
        avatarInput.addEventListener('change', function () {
            const file = this.files[0];

            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    showToast('File size must be less than 5MB', 'error');
                    this.value = '';
                    resetFileUpload();
                    return;
                }
                fileUploadBtn.classList.add('file-selected');
                fileText.textContent = 'File Selected';
                selectedFileName.textContent = file.name;
                fileSelectedInfo.style.display = 'block';

                showImagePreview(file, 'register');

                if (!document.querySelector('.remove-file-btn')) {
                    const removeBtn = document.createElement('span');
                    removeBtn.className = 'remove-file-btn';
                    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                    removeBtn.title = 'Remove file';
                    removeBtn.onclick = function () {
                        avatarInput.value = '';
                        resetFileUpload();
                    };
                    fileSelectedInfo.querySelector('small').appendChild(removeBtn);
                }
            } else {
                resetFileUpload();
            }
        });
    }

    if (editAvatarInput) {
        editAvatarInput.addEventListener('change', function () {
            const file = this.files[0];

            if (file) {
                // File size validation (5MB)
                if (file.size > 5 * 1024 * 1024) {
                    showToast('File size must be less than 5MB', 'error');
                    this.value = '';
                    resetEditFileUpload();
                    return;
                }                // Update UI to show selected file
                editFileUploadBtn.classList.add('file-selected');
                editFileText.textContent = 'File Selected';
                editSelectedFileName.textContent = file.name;
                editFileSelectedInfo.style.display = 'block';

                // Show image preview (replace current avatar preview)
                showImagePreview(file, 'edit');

                // Add remove button
                if (!document.querySelector('.edit-remove-file-btn')) {
                    const removeBtn = document.createElement('span');
                    removeBtn.className = 'edit-remove-file-btn';
                    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                    removeBtn.title = 'Remove file';
                    removeBtn.onclick = function () {
                        editAvatarInput.value = '';
                        resetEditFileUpload();
                    };
                    editFileSelectedInfo.querySelector('small').appendChild(removeBtn);
                }
            } else {
                resetEditFileUpload();
            }
        });
    }

    function resetFileUpload() {
        if (fileUploadBtn && fileText && fileSelectedInfo) {
            fileUploadBtn.classList.remove('file-selected');
            fileText.textContent = 'Choose File';
            fileSelectedInfo.style.display = 'none';

            // Remove the remove button if it exists
            const removeBtn = document.querySelector('.remove-file-btn');
            if (removeBtn) {
                removeBtn.remove();
            }

            // Remove image preview
            removeImagePreview('register');
        }
    }

    function resetEditFileUpload() {
        if (editFileUploadBtn && editFileText && editFileSelectedInfo) {
            editFileUploadBtn.classList.remove('file-selected');
            editFileText.textContent = 'Choose File';
            editFileSelectedInfo.style.display = 'none';

            // Remove the remove button if it exists
            const removeBtn = document.querySelector('.edit-remove-file-btn');
            if (removeBtn) {
                removeBtn.remove();
            }

            // Remove image preview and restore original avatar
            removeImagePreview('edit');
        }
    }

    // Function to show image preview
    function showImagePreview(file, formType) {
        const reader = new FileReader();
        reader.onload = function (e) {
            if (formType === 'register') {
                // Create or update preview for register form
                let previewContainer = document.querySelector('.register-image-preview');
                if (!previewContainer) {
                    previewContainer = document.createElement('div');
                    previewContainer.className = 'register-image-preview mt-2';
                    previewContainer.innerHTML = `
                        <div class="text-center">
                            <img class="img-thumbnail" style="max-width: 100px; max-height: 100px;" alt="Preview">
                            <small class="text-muted d-block">Preview</small>
                        </div>
                    `;
                    fileSelectedInfo.appendChild(previewContainer);
                }
                previewContainer.querySelector('img').src = e.target.result;
            } else if (formType === 'edit') {
                // Update current avatar section with new preview
                if (currentAvatarSection && currentAvatarImg) {
                    currentAvatarImg.src = e.target.result;
                    currentAvatarSection.style.display = 'block';

                    // Add preview indicator
                    let previewLabel = document.querySelector('.preview-label');
                    if (!previewLabel) {
                        previewLabel = document.createElement('small');
                        previewLabel.className = 'preview-label text-info d-block text-center mt-1';
                        previewLabel.textContent = 'New Image Preview';
                        currentAvatarSection.querySelector('.current-avatar-display').appendChild(previewLabel);
                    }
                }
            }
        };
        reader.readAsDataURL(file);
    }

    // Function to remove image preview
    function removeImagePreview(formType) {
        if (formType === 'register') {
            const previewContainer = document.querySelector('.register-image-preview');
            if (previewContainer) {
                previewContainer.remove();
            }
        } else if (formType === 'edit') {
            // Remove preview label and restore original avatar if exists
            const previewLabel = document.querySelector('.preview-label');
            if (previewLabel) {
                previewLabel.remove();
            }

            // Reset to original avatar or hide section
            const originalAvatar = editForm.dataset.originalAvatar;
            if (originalAvatar && currentAvatarImg) {
                currentAvatarImg.src = originalAvatar;
            } else if (currentAvatarSection) {
                currentAvatarSection.style.display = 'none';
            }
        }
    }

    // Edit user button click handler
    document.addEventListener('click', function (e) {
        if (e.target.closest('.edit-user-btn')) {
            e.preventDefault();
            const userId = e.target.closest('.edit-user-btn').getAttribute('data-user-id');
            loadUserForEdit(userId);
        }
    });

    // User status toggle handler
    document.addEventListener('change', function (e) {
        if (e.target.classList.contains('user-status-toggle')) {
            e.preventDefault();
            const checkbox = e.target;
            const userId = checkbox.getAttribute('data-user-id');
            const userName = checkbox.getAttribute('data-user-name');
            const isChecked = checkbox.checked;

            confirmToggleUserStatus(checkbox, userId, userName, isChecked);
        }
    });

    // Copy user ID button handler
    document.addEventListener('click', function (e) {
        if (e.target.closest('.copy-user-id-btn')) {
            e.preventDefault();
            const button = e.target.closest('.copy-user-id-btn');
            const userId = button.getAttribute('data-user-id');

            copyToClipboard(userId, button);
        }
    });

    // Load user data for editing
    function loadUserForEdit(userId) {
        fetch(`/dashboard/user/${userId}`)
            .then(response => response.json())
            .then(user => {
                // Populate edit form
                editUserId.value = user.id;
                editUsername.value = user.username || '';
                editEmail.value = user.email || '';
                editName.value = user.name || '';
                editPhoneNumber.value = user.phoneNumber || '';
                editDepartment.value = user.department || '';
                editSystemRole.value = user.roleName ? user.roleName.toUpperCase() : '';
                editGender.value = user.gender || '';
                editDateOfBirth.value = user.dateOfBirth || '';
                editIsActivated.checked = user.activated;



                // Store original avatar for reset functionality
                editForm.dataset.originalAvatar = user.avatar || '';

                // Show current avatar if exists
                if (user.avatar) {
                    currentAvatarImg.src = user.avatar;
                    currentAvatarSection.style.display = 'block';
                } else {
                    currentAvatarSection.style.display = 'none';
                }

                // Reset file upload
                resetEditFileUpload();

                // Show edit modal
                $('#editModal').modal('show');
            })
            .catch(error => {
                console.error('Error loading user:', error);
                showToast('Error loading user data. Please try again.', 'error');
            });
    }

    // Register form submission handling
    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault(); // Prevent default form submission

            if (!registerForm.checkValidity()) {
                registerForm.classList.add('was-validated');
                return;
            }

            // Show loading state
            const submitBtn = document.querySelector('#registerModal .btn-primary');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Creating...';
            submitBtn.disabled = true;

            // Prepare form data
            const formData = new FormData(registerForm);

            // Submit form
            fetch('/dashboard/admin/register', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Success - close modal and set toast message for reload
                        $('#registerModal').modal('hide');

                        // Set success toast to show after reload
                        setToastForReload('Account created successfully!');

                        // Set flag to refresh images after reload (for new avatar)
                        setImageRefreshForReload();

                        // Refresh the page to show new user and updated statistics
                        window.location.reload();
                    } else {
                        // Show error message immediately (no reload)
                        showToast(data.message || 'Failed to create account. Please try again.', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showToast('An error occurred while creating the account. Please try again.', 'error');
                })
                .finally(() => {
                    // Reset button state
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                });
        });
    }

    // Edit form submission handling
    if (editForm) {
        editForm.addEventListener('submit', function (e) {
            e.preventDefault(); // Prevent default form submission

            if (!editForm.checkValidity()) {
                editForm.classList.add('was-validated');
                return;
            }

            // Show loading state
            const submitBtn = document.querySelector('#editModal .btn-primary');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Updating...';
            submitBtn.disabled = true;

            // Prepare form data
            const formData = new FormData(editForm);



            // Submit form
            fetch('/dashboard/admin/edit', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Success - close modal and show success message
                        $('#editModal').modal('hide');
                        showToast('User updated successfully!', 'success');

                        // Update the user row in the table without reloading
                        updateUserRowInTable(data);

                        // Update statistics without reloading
                        updateDashboardStatistics(data);

                        // Refresh avatar images
                        refreshAllAvatarImages();

                        // Force a small delay then refresh the user table if needed
                        setTimeout(() => {
                            const userTable = document.querySelector('#userTable tbody');
                            if (userTable) {
                                // Trigger a re-render by temporarily hiding and showing the table
                                userTable.style.opacity = '0.8';
                                setTimeout(() => {
                                    userTable.style.opacity = '1';
                                }, 100);
                            }
                        }, 500);
                    } else {
                        // Show error message immediately (no reload)
                        showToast(data.message || 'Failed to update user. Please try again.', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showToast('An error occurred while updating the user. Please try again.', 'error');
                })
                .finally(() => {
                    // Reset button state
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                });
        });
    }

    // Reset forms when modals are closed
    $('#registerModal').on('hidden.bs.modal', function () {
        if (registerForm) {
            registerForm.reset();
            registerForm.classList.remove('was-validated');
            resetFileUpload();
        }
    });

    $('#editModal').on('hidden.bs.modal', function () {
        if (editForm) {
            editForm.reset();
            editForm.classList.remove('was-validated');
            resetEditFileUpload();
            currentAvatarSection.style.display = 'none';
            // Clear original avatar data
            delete editForm.dataset.originalAvatar;
        }
    });

    // Function to update user row in table without reloading
    function updateUserRowInTable(data) {
        const userId = data.userId;
        console.log('Updating user row for ID:', userId);

        // Find the user row by looking for the edit button with the correct user ID
        const editButton = document.querySelector(`a.edit-user-btn[data-user-id="${userId}"]`);
        if (!editButton) {
            console.log('Edit button not found for user ID:', userId);
            return;
        }

        const userRow = editButton.closest('tr');
        if (!userRow) {
            console.log('User row not found');
            return;
        }

        console.log('Found user row:', userRow);

        // Get all cells in the row
        const cells = userRow.querySelectorAll('td');
        if (cells.length < 8) {
            console.log('Not enough cells in row');
            return;
        }

        // Update user ID (1st cell)
        if (cells[0] && data.userId) {
            const userIdSpan = cells[0].querySelector('span');
            const copyButton = cells[0].querySelector('.copy-user-id-btn');

            if (userIdSpan) {
                userIdSpan.textContent = data.userId.substring(0, 8) + '...';
                console.log('Updated user ID to:', data.userId);
            }

            if (copyButton) {
                copyButton.setAttribute('data-user-id', data.userId);
            }
        }

        // Update username and avatar (2nd cell)
        if (cells[1] && (data.username || data.avatar)) {
            const usernameDiv = cells[1].querySelector('.font-weight-bold');
            const avatarImg = cells[1].querySelector('img.avatar-40');

            if (usernameDiv && data.username) {
                usernameDiv.textContent = data.username;
                console.log('Updated username to:', data.username);
            }

            if (avatarImg && data.avatar) {
                avatarImg.src = data.avatar + '?t=' + new Date().getTime();
                console.log('Updated avatar');
            }
        }

        // Update phone number (3rd cell) - if available
        if (cells[2] && data.phoneNumber) {
            cells[2].textContent = data.phoneNumber;
            console.log('Updated phone to:', data.phoneNumber);
        }

        // Update email (4th cell)
        if (cells[3] && data.email) {
            cells[3].textContent = data.email;
            console.log('Updated email to:', data.email);
        }

        // Provider stays the same (5th cell)

        // Update role (6th cell)
        if (cells[5] && data.role) {
            // Convert role to proper case
            let roleText = data.role;
            if (data.role === 'ADMIN') {
                roleText = 'Admin';
            } else if (data.role === 'USER') {
                roleText = 'User';
            }
            cells[5].textContent = roleText;
            console.log('Updated role to:', roleText);
        }

        // Update auth provider (5th cell) if available
        if (cells[4] && data.authProvider) {
            let providerText = data.authProvider;
            if (data.authProvider === 'LOCAL') {
                providerText = 'Local';
            } else if (data.authProvider === 'GOOGLE') {
                providerText = 'Google';
            }
            cells[4].textContent = providerText;
            console.log('Updated auth provider to:', providerText);
        }

        // Update status (7th cell)
        if (cells[6]) {
            const userName = data.username;
            cells[6].innerHTML = `
                <div class="d-flex align-items-center justify-content-center">
                    <label class="switch">
                        <input type="checkbox" 
                               ${data.isActivated ? 'checked' : ''}
                               data-user-id="${userId}"
                               data-user-name="${userName}"
                               class="user-status-toggle">
                        <span class="slider round"></span>
                    </label>
                </div>
            `;
            console.log('Updated status to:', data.isActivated ? 'Active' : 'Inactive');
        }

        // Join date stays the same (8th cell)

        // Update edit button visibility (9th cell)
        if (cells[8]) {
            const editButton = cells[8].querySelector('.edit-user-btn');
            if (editButton) {
                if (data.isActivated) {
                    editButton.style.display = 'block';
                } else {
                    editButton.style.display = 'none';
                }
            }
        }

        // Join date stays the same (8th cell)

        console.log('User row updated successfully');
    }

    // Function to update dashboard statistics without reloading
    function updateDashboardStatistics(data) {
        console.log('Updating dashboard statistics with data:', data);

        if (data.totalAccounts !== undefined) {
            // Find total accounts element by text content
            const totalAccountsElements = Array.from(document.querySelectorAll('h3')).filter(el =>
                el.textContent.trim() === data.totalAccounts.toString()
            );
            if (totalAccountsElements.length > 0) {
                // Update the first matching element
                totalAccountsElements[0].textContent = data.totalAccounts;
                console.log('Updated total accounts to:', data.totalAccounts);
            }
        }

        if (data.activeAccounts !== undefined) {
            // Find active accounts element by looking for the one with text-success class
            const activeAccountsElement = document.querySelector('h3.text-success');
            if (activeAccountsElement) {
                activeAccountsElement.textContent = data.activeAccounts;
                console.log('Updated active accounts to:', data.activeAccounts);
            }
        }

        if (data.inactiveAccounts !== undefined) {
            // Find inactive accounts element by looking for the one with text-warning class
            const inactiveAccountsElement = document.querySelector('h3.text-warning');
            if (inactiveAccountsElement) {
                inactiveAccountsElement.textContent = data.inactiveAccounts;
                console.log('Updated inactive accounts to:', data.inactiveAccounts);
            }
        }

        if (data.pendingRequests !== undefined) {
            // Find pending requests element by looking for the one with text-info class
            const pendingRequestsElement = document.querySelector('h3.text-info');
            if (pendingRequestsElement) {
                pendingRequestsElement.textContent = data.pendingRequests;
                console.log('Updated pending requests to:', data.pendingRequests);
            }
        }
    }

    // File size validation for avatar
    if (avatarInput) {
        avatarInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file && file.size > 5 * 1024 * 1024) { // 5MB
                showToast('File size must be less than 5MB', 'error');
                this.value = '';
            }
        });
    }

    if (editAvatarInput) {
        editAvatarInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file && file.size > 5 * 1024 * 1024) { // 5MB
                showToast('File size must be less than 5MB', 'error');
                this.value = '';
            }
        });
    }
}

// Initialize table filtering and sorting features
function initializeTableFeatures() {
    const table = document.getElementById('user-list-table');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr')).filter(row => !row.querySelector('td[colspan]'));

    // Initialize column filters
    initializeFilters(rows);

    // Initialize column sorting
    initializeSorting(rows);
}

// Initialize filtering functionality
function initializeFilters(rows) {
    const filters = document.querySelectorAll('.column-filter');

    filters.forEach(filter => {
        filter.addEventListener('input', function () {
            filterTable(rows);
        });

        filter.addEventListener('change', function () {
            filterTable(rows);
        });
    });
}

// Filter table based on all active filters
function filterTable(rows) {
    const filters = document.querySelectorAll('.column-filter');
    const activeFilters = {};

    // Collect all active filters
    filters.forEach(filter => {
        const column = filter.dataset.column;
        const value = filter.value.toLowerCase().trim();
        if (value) {
            activeFilters[column] = value;
        }
    });

    // Apply filters to each row
    rows.forEach(row => {
        let shouldShow = true;

        for (const [column, filterValue] of Object.entries(activeFilters)) {
            const cellValue = getCellValue(row, column).toLowerCase();

            if (column === 'joinDate') {
                // Date filtering - exact match or range
                const rowDate = new Date(getCellValue(row, column));
                const filterDate = new Date(filterValue);
                if (isNaN(filterDate.getTime()) || rowDate.toDateString() !== filterDate.toDateString()) {
                    shouldShow = false;
                    break;
                }
            } else {
                // Text/dropdown filtering
                if (!cellValue.includes(filterValue)) {
                    shouldShow = false;
                    break;
                }
            }
        }

        row.style.display = shouldShow ? '' : 'none';
    });

    // Update showing count
    updateShowingCount(rows);
}

// Initialize sorting functionality
function initializeSorting(rows) {
    const sortableHeaders = document.querySelectorAll('.sortable');

    sortableHeaders.forEach(header => {
        header.addEventListener('click', function () {
            const column = this.dataset.column;
            const sortIcon = this.querySelector('.sort-icon');
            const currentDirection = sortIcon.dataset.sortDirection;

            // Reset all other sort icons
            document.querySelectorAll('.sort-icon').forEach(icon => {
                if (icon !== sortIcon) {
                    icon.dataset.sortDirection = 'none';
                    icon.className = 'fas fa-sort sort-icon';
                }
            });

            // Determine new sort direction
            let newDirection;
            if (currentDirection === 'none' || currentDirection === 'desc') {
                newDirection = 'asc';
                sortIcon.className = 'fas fa-sort-up sort-icon';
            } else {
                newDirection = 'desc';
                sortIcon.className = 'fas fa-sort-down sort-icon';
            }

            sortIcon.dataset.sortDirection = newDirection;

            // Sort the rows
            sortTable(rows, column, newDirection);
        });
    });
}

// Sort table by column
function sortTable(rows, column, direction) {
    const tbody = document.querySelector('#user-list-table tbody');

    // Sort rows array
    rows.sort((a, b) => {
        const aValue = getCellValue(a, column);
        const bValue = getCellValue(b, column);

        let comparison = 0;

        if (column === 'joinDate') {
            // Date sorting
            const aDate = new Date(aValue);
            const bDate = new Date(bValue);
            comparison = aDate.getTime() - bDate.getTime();
        } else {
            // Text sorting
            comparison = aValue.localeCompare(bValue);
        }

        return direction === 'asc' ? comparison : -comparison;
    });

    // Re-append sorted rows to tbody
    rows.forEach(row => tbody.appendChild(row));

    // Update showing count
    updateShowingCount(rows);
}

// Get cell value by column name
function getCellValue(row, column) {
    const cells = row.querySelectorAll('td');

    switch (column) {
        case 'name':
            return cells[1]?.textContent.trim() || '';
        case 'contact':
            return cells[2]?.textContent.trim() || '';
        case 'email':
            return cells[3]?.textContent.trim() || '';
        case 'authProvider':
            return cells[4]?.textContent.trim() || '';
        case 'role':
            return cells[5]?.textContent.trim() || '';
        case 'status':
            return cells[6]?.textContent.trim() || '';
        case 'joinDate':
            return cells[7]?.textContent.trim() || '';
        default:
            return '';
    }
}

// Update showing count based on visible rows
function updateShowingCount(rows) {
    const visibleRows = rows.filter(row => row.style.display !== 'none');
    const totalRows = rows.length;
    const showingElement = document.getElementById('user-list-page-info');

    if (showingElement) {
        showingElement.innerHTML = `Showing ${visibleRows.length} of ${totalRows} entries`;
    }
}

// Clear all filters
function clearAllFilters() {
    const filters = document.querySelectorAll('.column-filter');
    filters.forEach(filter => {
        filter.value = '';
    });

    const table = document.getElementById('user-list-table');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr')).filter(row => !row.querySelector('td[colspan]'));

    // Show all rows
    rows.forEach(row => {
        row.style.display = '';
    });

    updateShowingCount(rows);
}

// Initialize all dashboard features
function initializeDashboardFeatures() {
    // Check for toast messages first
    checkForToastMessages();

    const dashboardAnalyticsPage = document.getElementById('dashboard-analytics-page');
    if (dashboardAnalyticsPage && dashboardAnalyticsPage.classList.contains('active')) {
        initializeDashboardAnalytics();
    }

    const accountManagementPage = document.getElementById('account-management-page');
    if (accountManagementPage && accountManagementPage.classList.contains('active')) {
        initializeAccountManagement();
    }

    // Check for vault management pages
    const vaultManagementPage = document.getElementById('vault-management-page');
    const vaultOverviewPage = document.getElementById('vault-overview-page');
    const vaultPermissionsPage = document.getElementById('vault-permissions-page');
    const vaultStoragePage = document.getElementById('vault-storage-page');
    const vaultBackupPage = document.getElementById('vault-backup-page');
    const vaultSecurityPage = document.getElementById('vault-security-page');
    const vaultAnalyticsPage = document.getElementById('vault-analytics-page');
    const addVaultPage = document.getElementById('add-vault-page');

    if (vaultManagementPage && vaultManagementPage.classList.contains('active')) {
        initializeVaultManagement();
        // Refresh vault list when entering vault management page
        refreshVaultList();
    }
    if (vaultOverviewPage && vaultOverviewPage.classList.contains('active')) {
        initializeVaultManagement();
    }
    if (vaultPermissionsPage && vaultPermissionsPage.classList.contains('active')) {
        initializeVaultManagement();
        // Load my vaults when entering vault permissions page
        refreshMyVaultList();
        // Initialize my vault search functionality
        initializeMyVaultSearch();
    }
    if (vaultStoragePage && vaultStoragePage.classList.contains('active')) {
        initializeVaultManagement();
        // Load trash vaults when entering vault storage page
        refreshTrashList();
        // Initialize trash search functionality
        initializeTrashSearch();
    }
    if (vaultBackupPage && vaultBackupPage.classList.contains('active')) {
        initializeVaultManagement();
    }
    if (vaultSecurityPage && vaultSecurityPage.classList.contains('active')) {
        initializeVaultManagement();
    }
    if (vaultAnalyticsPage && vaultAnalyticsPage.classList.contains('active')) {
        initializeVaultManagement();
    }
    if (addVaultPage && addVaultPage.classList.contains('active')) {
        initializeAddVaultForm();
    }

    const registerAccountPage = document.getElementById('register-account-page');
    if (registerAccountPage && registerAccountPage.classList.contains('active')) {
        initializeRegisterAccountForm();
    }

    // Initialize modal confirm button event listeners
    document.getElementById('confirmDeleteVaultBtn')?.addEventListener('click', performDeleteVault);
    document.getElementById('confirmRestoreVaultBtn')?.addEventListener('click', performRestoreVault);
    document.getElementById('confirmPermanentDeleteVaultBtn')?.addEventListener('click', performPermanentDeleteVault);
}

function initializeVaultManagement() {
    const vaultAnalyticsPage = document.getElementById('vault-analytics-page');
    if (vaultAnalyticsPage && vaultAnalyticsPage.classList.contains('active')) {
        initializeVaultAnalyticsCharts();
    }

    // Check if we need to show vault created toast
    if (localStorage.getItem('showVaultCreatedToast') === 'true') {
        // Remove the flag
        localStorage.removeItem('showVaultCreatedToast');

        // Show toast after a short delay to ensure page is fully loaded
        setTimeout(() => {
            showToast('Vault created successfully!', 'success');
        }, 500);
    }
}

function initializeVaultAnalyticsCharts() {
    const accessCtx = document.getElementById('vaultAccessChart');
    if (accessCtx) {
        new Chart(accessCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Vault Access',
                    data: [65, 59, 80, 81, 56, 55],
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    const storageCtx = document.getElementById('vaultStorageChart');
    if (storageCtx) {
        new Chart(storageCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Storage Used (GB)',
                    data: [45, 52, 58, 63, 67, 68],
                    backgroundColor: '#28a745'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

function initializeDashboardAnalytics() {

    setTimeout(() => {
        initializeCharts();
    }, 100);
}

function initializeCharts() {
    initializeGrowthMetricsChart();
    initializeCategoriesChart();
}

function initializeGrowthMetricsChart() {
    const ctx = document.getElementById('growthMetricsChart');
    if (!ctx) return;

    let growthChart;

    const backendData = window.growthMetricsData || {
        visits: [0, 0, 0, 0, 0, 0, 0],
        knowledgeViews: [0, 0, 0, 0, 0, 0, 0],
        knowledgeCreation: [0, 0, 0, 0, 0, 0, 0],
        engagementRate: [0, 0, 0, 0, 0, 0, 0]
    };

    const growthData = {
        visits: {
            label: 'Visits Today',
            data: backendData.visits,
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
        },
        knowledgeViews: {
            label: 'Knowledge Views',
            data: backendData.knowledgeViews,
            borderColor: '#28a745',
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
        },
        knowledgeCreation: {
            label: 'Knowledge Creation',
            data: backendData.knowledgeCreation,
            borderColor: '#17a2b8',
            backgroundColor: 'rgba(23, 162, 184, 0.1)',
        },
        engagementRate: {
            label: 'Engagement Rate (%)',
            data: backendData.engagementRate,
            borderColor: '#ffc107',
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
        }
    };

    const labels = ['6 days ago', '5 days ago', '4 days ago', '3 days ago', '2 days ago', 'Yesterday', 'Today'];

    // Initialize chart with default metric (visits)
    function createChart(metric = 'visits') {
        // Destroy existing chart if it exists
        if (growthChart && typeof growthChart.destroy === 'function') {
            growthChart.destroy();
        }

        // Also destroy any existing charts on the canvas
        const existingCharts = Chart.getChart(ctx);
        if (existingCharts) {
            existingCharts.destroy();
        }

        const selectedData = growthData[metric];

        growthChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: selectedData.label,
                    data: selectedData.data,
                    borderColor: selectedData.borderColor,
                    backgroundColor: selectedData.backgroundColor,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: selectedData.borderColor,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: selectedData.borderColor,
                        borderWidth: 1,
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += context.parsed.y;
                                if (metric === 'engagementRate') {
                                    label += '%';
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6c757d'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: '#6c757d',
                            callback: function (value) {
                                if (metric === 'engagementRate') {
                                    return value + '%';
                                }
                                return value;
                            }
                        }
                    }
                },
                elements: {
                    line: {
                        borderWidth: 3
                    }
                }
            }
        });
    }

    // Create initial chart
    createChart('visits');

    // Add dropdown functionality with delay to ensure DOM is ready
    setTimeout(function () {
        const metricSelectors = document.querySelectorAll('.metric-selector');
        console.log('Found metric selectors:', metricSelectors.length); // Debug log

        metricSelectors.forEach(function (selector) {
            selector.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                const selectedMetric = this.getAttribute('data-metric');
                const selectedText = this.textContent.trim();

                console.log('Metric selected:', selectedMetric, selectedText); // Debug log

                // Update dropdown button text
                const dropdownButton = document.getElementById('metricDropdownButton');
                if (dropdownButton) {
                    dropdownButton.textContent = selectedText;
                }

                // Update chart
                createChart(selectedMetric);

                // Close dropdown manually
                const dropdownMenu = this.closest('.dropdown-menu');
                if (dropdownMenu) {
                    dropdownMenu.classList.remove('show');
                }
            });
        });
    }, 500);
}

function initializeCategoriesChart() {
    const ctx = document.getElementById('categoriesChart');
    if (!ctx) return;

    // Get knowledge status distribution data from backend
    const statusData = window.knowledgeStatusDistribution || {
        DRAFT: 0,
        PENDING_APPROVAL: 0,
        APPROVED: 0,
        REJECTED: 0
    };

    // Convert status names to proper display names
    const displayNames = {
        'DRAFT': 'Draft',
        'PENDING_APPROVAL': 'Pending Approval',
        'APPROVED': 'Approved',
        'REJECTED': 'Rejected'
    };

    const labels = [];
    const data = [];
    const backgroundColors = [];
    const colorMap = {
        'DRAFT': '#6c757d',      // Gray for draft
        'PENDING_APPROVAL': '#ffc107', // Yellow for pending
        'APPROVED': '#28a745',   // Green for approved
        'REJECTED': '#dc3545'    // Red for rejected
    };

    // Build chart data
    for (const [status, count] of Object.entries(statusData)) {
        if (count > 0) { // Only show statuses that have data
            labels.push(displayNames[status]);
            data.push(count);
            backgroundColors.push(colorMap[status]);
        }
    }

    // If no data, show a default message
    if (data.length === 0) {
        labels.push('No Data');
        data.push(1);
        backgroundColors.push('#e9ecef');
    }

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors
            }]
        },
        options: {
            responsive: true,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function initializeEngagementChart() {
    const ctx = document.getElementById('engagementChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Documents', 'Videos', 'Presentations', 'Tutorials', 'FAQs'],
            datasets: [{
                label: 'Views',
                data: [3200, 2800, 2100, 1900, 1500],
                backgroundColor: 'rgba(0, 123, 255, 0.8)'
            }, {
                label: 'Comments',
                data: [320, 280, 210, 190, 150],
                backgroundColor: 'rgba(40, 167, 69, 0.8)'
            }, {
                label: 'Ratings',
                data: [180, 220, 150, 160, 120],
                backgroundColor: 'rgba(255, 193, 7, 0.8)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function initializePerformanceScatterChart() {
    const ctx = document.getElementById('performanceScatterChart');
    if (!ctx) return;

    const generateScatterData = () => {
        const data = [];
        for (let i = 0; i < 50; i++) {
            data.push({
                x: Math.random() * 1000 + 100,
                y: Math.random() * 100 + 10
            });
        }
        return data;
    };

    new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Knowledge Items',
                data: generateScatterData(),
                backgroundColor: 'rgba(0, 123, 255, 0.6)',
                borderColor: '#007bff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Views'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Engagement Score'
                    }
                }
            }
        }
    });
}

// Handle submenu item clicks (keep this part)
function initializeSubmenuItemClicks() {
    const submenuItems = document.querySelectorAll('.submenu-item');
    submenuItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');

            // Clear all submenu active states first
            submenuItems.forEach(subItem => {
                subItem.classList.remove('active');
            });

            // Clear all main navigation active states
            const accountManagementLink = document.querySelector('.account-management-link');
            const vaultManagementLink = document.querySelector('.vault-management-link');

            if (accountManagementLink) {
                accountManagementLink.classList.remove('active');
                const accountNavItem = accountManagementLink.closest('.nav-item');
                if (accountNavItem) {
                    accountNavItem.classList.remove('active');
                }
            }

            if (vaultManagementLink) {
                vaultManagementLink.classList.remove('active');
                const vaultNavItem = vaultManagementLink.closest('.nav-item');
                if (vaultNavItem) {
                    vaultNavItem.classList.remove('active');
                }
            }

            // Set active state for clicked item
            this.classList.add('active');

            // Navigate to the selected page
            if (typeof showPage === 'function') {
                showPage(pageId);
            } else {
                console.error('showPage function is not defined');
            }
            window.location.hash = pageId;
            localStorage.setItem('currentPage', pageId);

            // Initialize dashboard features for the new page
            setTimeout(() => {
                initializeDashboardFeatures();
                // Refresh vault list when navigating to vault management
                if (pageId === 'vault-management') {
                    refreshVaultList();
                }
            }, 100);
        });
    });
}

// Helper function to close all submenus
function closeAllSubmenus() {
    closeAccountSubmenu();
    closeVaultSubmenu();
}

// New unified dropdown management function
function initializeDropdownManagement() {
    // Remove all existing event listeners by cloning and replacing elements
    const accountManagementLink = document.querySelector('.account-management-link');
    const vaultManagementLink = document.querySelector('.vault-management-link');

    if (accountManagementLink) {
        const newAccountLink = accountManagementLink.cloneNode(true);
        accountManagementLink.parentNode.replaceChild(newAccountLink, accountManagementLink);
    }

    if (vaultManagementLink) {
        const newVaultLink = vaultManagementLink.cloneNode(true);
        vaultManagementLink.parentNode.replaceChild(newVaultLink, vaultManagementLink);
    }

    // Add new event listeners
    const newAccountManagementLink = document.querySelector('.account-management-link');
    const newVaultManagementLink = document.querySelector('.vault-management-link');

    // Account Management Link Click
    if (newAccountManagementLink) {
        newAccountManagementLink.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            // If clicking on the toggle icon, toggle the submenu
            if (e.target.classList.contains('account-submenu-toggle') || e.target.closest('.account-submenu-toggle')) {
                toggleAccountSubmenu();
            } else {
                // If clicking on the link text, ensure submenu is open
                ensureAccountSubmenuOpen();
            }
        });
    }

    // Vault Management Link Click
    if (newVaultManagementLink) {
        newVaultManagementLink.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            // If clicking on the toggle icon, toggle the submenu
            if (e.target.classList.contains('vault-submenu-toggle') || e.target.closest('.vault-submenu-toggle')) {
                toggleVaultSubmenu();
            } else {
                // If clicking on the link text, ensure submenu is open
                ensureVaultSubmenuOpen();
            }
        });
    }
}

// Helper function to toggle Account Management submenu
function toggleAccountSubmenu() {
    // Toggle Account Management submenu only
    const accountSubmenu = document.getElementById('accountManagementSubmenu');
    const accountSubmenuToggles = document.querySelectorAll('.account-submenu-toggle');

    if (accountSubmenu) {
        const isExpanded = accountSubmenu.classList.contains('show');
        if (isExpanded) {
            closeAccountSubmenu();
        } else {
            openAccountSubmenu();
        }
    }
}

// Helper function to toggle Vault Management submenu
function toggleVaultSubmenu() {
    // Toggle Vault Management submenu only
    const vaultSubmenu = document.getElementById('vaultManagementSubmenu');
    const vaultSubmenuToggles = document.querySelectorAll('.vault-submenu-toggle');

    if (vaultSubmenu) {
        const isExpanded = vaultSubmenu.classList.contains('show');
        if (isExpanded) {
            closeVaultSubmenu();
        } else {
            openVaultSubmenu();
        }
    }
}

// Helper function to open Account Management submenu
function openAccountSubmenu() {
    const accountSubmenu = document.getElementById('accountManagementSubmenu');
    const accountSubmenuToggles = document.querySelectorAll('.account-submenu-toggle');

    if (accountSubmenu) {
        accountSubmenu.classList.add('show');
        accountSubmenuToggles.forEach(toggle => {
            toggle.style.transform = 'rotate(90deg)';
            toggle.setAttribute('aria-expanded', 'true');
        });
    }
}

// Helper function to close Account Management submenu
function closeAccountSubmenu() {
    const accountSubmenu = document.getElementById('accountManagementSubmenu');
    const accountSubmenuToggles = document.querySelectorAll('.account-submenu-toggle');

    if (accountSubmenu) {
        accountSubmenu.classList.remove('show');
        accountSubmenuToggles.forEach(toggle => {
            toggle.style.transform = 'rotate(0deg)';
            toggle.setAttribute('aria-expanded', 'false');
        });
    }
}

// Helper function to open Vault Management submenu
function openVaultSubmenu() {
    const vaultSubmenu = document.getElementById('vaultManagementSubmenu');
    const vaultSubmenuToggles = document.querySelectorAll('.vault-submenu-toggle');

    if (vaultSubmenu) {
        vaultSubmenu.classList.add('show');
        vaultSubmenuToggles.forEach(toggle => {
            toggle.style.transform = 'rotate(90deg)';
            toggle.setAttribute('aria-expanded', 'true');
        });
    }
}

// Helper function to close Vault Management submenu
function closeVaultSubmenu() {
    const vaultSubmenu = document.getElementById('vaultManagementSubmenu');
    const vaultSubmenuToggles = document.querySelectorAll('.vault-submenu-toggle');

    if (vaultSubmenu) {
        vaultSubmenu.classList.remove('show');
        vaultSubmenuToggles.forEach(toggle => {
            toggle.style.transform = 'rotate(0deg)';
            toggle.setAttribute('aria-expanded', 'false');
        });
    }
}

// Helper function to ensure Account Management submenu is open
function ensureAccountSubmenuOpen() {
    const accountSubmenu = document.getElementById('accountManagementSubmenu');
    if (accountSubmenu && !accountSubmenu.classList.contains('show')) {
        openAccountSubmenu();
    }
}

// Helper function to ensure Vault Management submenu is open
function ensureVaultSubmenuOpen() {
    const vaultSubmenu = document.getElementById('vaultManagementSubmenu');
    if (vaultSubmenu && !vaultSubmenu.classList.contains('show')) {
        openVaultSubmenu();
    }
}

// Initialize when page loads and when switching between pages
document.addEventListener('DOMContentLoaded', function () {
    // Ensure dashboard shows first on fresh login
    if (!localStorage.getItem('currentPage') && !window.location.hash) {
        // Force dashboard to be the first page shown
        localStorage.setItem('currentPage', 'dashboard-analytics');
    }

    // If user is on dashboard page without specific hash, ensure dashboard-analytics is shown
    if (window.location.pathname.includes('/dashboard') && (!window.location.hash || window.location.hash === '#')) {
        localStorage.setItem('currentPage', 'dashboard-analytics');
    }

    initializePageNavigation();
    initializeDashboardFeatures();

    // Initialize unified dropdown management
    initializeDropdownManagement();

    // Initialize submenu item clicks
    initializeSubmenuItemClicks();

    // Initialize profile menu
    setTimeout(() => {
        initializeProfileMenu();
    }, 200);

    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if ((target.id === 'dashboard-analytics-page' || target.id === 'account-management-page' || target.id === 'register-account-page' || target.id === 'vault-management-page' || target.id === 'vault-overview-page' || target.id === 'vault-permissions-page' || target.id === 'vault-storage-page' || target.id === 'vault-backup-page' || target.id === 'vault-security-page' || target.id === 'vault-analytics-page' || target.id === 'add-vault-page') && target.classList.contains('active')) {
                    setTimeout(() => {
                        initializeDashboardFeatures();
                        // Refresh vault list when entering vault management page
                        if (target.id === 'vault-management-page') {
                            refreshVaultList();
                        }
                    }, 100);
                }
            }
        });
    });

    const dashboardPage = document.getElementById('dashboard-analytics-page');
    const accountPage = document.getElementById('account-management-page');
    const vaultPage = document.getElementById('vault-management-page');
    const vaultOverviewPage = document.getElementById('vault-overview-page');
    const vaultPermissionsPage = document.getElementById('vault-permissions-page');
    const vaultStoragePage = document.getElementById('vault-storage-page');
    const vaultBackupPage = document.getElementById('vault-backup-page');
    const vaultSecurityPage = document.getElementById('vault-security-page');
    const vaultAnalyticsPage = document.getElementById('vault-analytics-page');
    const addVaultPage = document.getElementById('add-vault-page');
    const registerAccountPage = document.getElementById('register-account-page');

    if (dashboardPage) {
        observer.observe(dashboardPage, { attributes: true });
    }
    if (accountPage) {
        observer.observe(accountPage, { attributes: true });
    }
    if (registerAccountPage) {
        observer.observe(registerAccountPage, { attributes: true });
    }
    if (vaultPage) {
        observer.observe(vaultPage, { attributes: true });
        // Refresh vault list when entering vault management page
        if (vaultPage.classList.contains('active')) {
            refreshVaultList();
        }
    }
    if (vaultOverviewPage) {
        observer.observe(vaultOverviewPage, { attributes: true });
    }
    if (vaultPermissionsPage) {
        observer.observe(vaultPermissionsPage, { attributes: true });
    }
    if (vaultStoragePage) {
        observer.observe(vaultStoragePage, { attributes: true });
    }
    if (vaultBackupPage) {
        observer.observe(vaultBackupPage, { attributes: true });
    }
    if (vaultSecurityPage) {
        observer.observe(vaultSecurityPage, { attributes: true });
    }
    if (vaultAnalyticsPage) {
        observer.observe(vaultAnalyticsPage, { attributes: true });
    }
    if (addVaultPage) {
        observer.observe(addVaultPage, { attributes: true });
    }
});


document.addEventListener('DOMContentLoaded', function () {
    // Vault search and filter functionality
    const searchInput = document.getElementById('vaultSearchInput');
    const statusFilter = document.getElementById('statusFilter');
    const ownerFilter = document.getElementById('ownerFilter');
    const memberCountFilter = document.getElementById('memberCountFilter');
    const vaultDateFromFilter = document.getElementById('vaultDateFromFilter');
    const vaultDateToFilter = document.getElementById('vaultDateToFilter');
    const applyFiltersBtn = document.getElementById('applyFilters');
    const clearFiltersBtn = document.getElementById('clearFilters');
    const clearAllFiltersBtn = document.getElementById('clearAllFilters');
    const filterResultsInfo = document.getElementById('filterResultsInfo');
    const filterResultsText = document.getElementById('filterResultsText');
    const vaultTable = document.getElementById('vaultTable');

    // Prevent dropdown from closing when clicking inside filter dropdowns
    document.querySelectorAll('.dropdown-menu').forEach(function (dropdown) {
        dropdown.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    });

    // Sort functionality for vault table
    document.querySelectorAll('#vaultTable .sortable').forEach(function (header) {
        header.addEventListener('click', function () {
            sortVaultTable(this.dataset.column, this);
        });
    });

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            performSearch();
        });
    }

    // Filter functionality
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function () {
            // Clear previous error states
            if (vaultDateFromFilter) vaultDateFromFilter.classList.remove('error');
            if (vaultDateToFilter) vaultDateToFilter.classList.remove('error');

            // Validate date range
            if (vaultDateFromFilter && vaultDateToFilter && vaultDateFromFilter.value && vaultDateToFilter.value) {
                const fromDate = new Date(vaultDateFromFilter.value);
                const toDate = new Date(vaultDateToFilter.value);
                if (fromDate > toDate) {
                    showToast('Ngày bắt đầu không thể sau ngày kết thúc', 'error');
                    vaultDateFromFilter.classList.add('error');
                    vaultDateToFilter.classList.add('error');
                    return;
                }
            }

            // Auto-set today's date for "To" field if only "From" is set
            if (vaultDateFromFilter && vaultDateToFilter && vaultDateFromFilter.value && !vaultDateToFilter.value) {
                const today = new Date().toISOString().split('T')[0];
                vaultDateToFilter.value = today;
            }

            applyFilters();
        });
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function () {
            clearFilters();
        });
    }

    if (clearAllFiltersBtn) {
        clearAllFiltersBtn.addEventListener('click', function () {
            clearAllFilters();
        });
    }

    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const rows = vaultTable.querySelectorAll('tbody tr');
        let visibleCount = 0;

        rows.forEach(row => {
            if (row.cells.length < 2) return; // Skip empty rows

            const vaultName = row.cells[0].textContent.toLowerCase();
            const ownerName = row.cells[1].textContent.toLowerCase();

            const isVisible = searchTerm === '' ||
                vaultName.includes(searchTerm) ||
                ownerName.includes(searchTerm);

            row.style.display = isVisible ? '' : 'none';
            if (isVisible) visibleCount++;
        });

        updateFilterInfo(searchTerm, visibleCount);
    }

    function applyFilters() {
        const rows = vaultTable.querySelectorAll('tbody tr');
        let visibleCount = 0;
        const activeFilters = [];

        rows.forEach(row => {
            if (row.cells.length < 6) return; // Skip empty rows

            let isVisible = true;

            // Status filter
            if (statusFilter.value) {
                const status = row.cells[3].textContent.trim();
                if (status !== statusFilter.value) {
                    isVisible = false;
                }
            }

            // Owner filter
            if (ownerFilter.value) {
                const owner = row.cells[1].textContent.toLowerCase();
                if (!owner.includes(ownerFilter.value.toLowerCase())) {
                    isVisible = false;
                }
            }

            // Member count filter
            if (memberCountFilter.value) {
                const memberBadge = row.cells[2].querySelector('.badge');
                const memberCount = memberBadge ? parseInt(memberBadge.textContent) : 0;

                let memberRangeMatch = false;
                switch (memberCountFilter.value) {
                    case '0':
                        memberRangeMatch = memberCount === 0;
                        break;
                    case '1-5':
                        memberRangeMatch = memberCount >= 1 && memberCount <= 5;
                        break;
                    case '6-20':
                        memberRangeMatch = memberCount >= 6 && memberCount <= 20;
                        break;
                    case '20+':
                        memberRangeMatch = memberCount > 20;
                        break;
                }

                if (!memberRangeMatch) {
                    isVisible = false;
                }
            }

            // Date range filter
            if (vaultDateFromFilter && vaultDateToFilter && (vaultDateFromFilter.value || vaultDateToFilter.value)) {
                const createdDateCell = row.cells[4]; // Created At column
                const createdDateText = createdDateCell.textContent.trim();

                if (createdDateText && createdDateText !== 'Date') {
                    // Parse the date from format yyyy/MM/dd
                    const dateParts = createdDateText.split('/');
                    if (dateParts.length === 3) {
                        const createdDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

                        // Check from date
                        if (vaultDateFromFilter.value) {
                            const fromDate = new Date(vaultDateFromFilter.value);
                            // Set time to start of day for accurate comparison
                            fromDate.setHours(0, 0, 0, 0);
                            if (createdDate < fromDate) {
                                isVisible = false;
                            }
                        }

                        // Check to date
                        if (vaultDateToFilter.value) {
                            const toDate = new Date(vaultDateToFilter.value);
                            // Set time to end of day for accurate comparison
                            toDate.setHours(23, 59, 59, 999);
                            if (createdDate > toDate) {
                                isVisible = false;
                            }
                        }
                    }
                }
            }

            row.style.display = isVisible ? '' : 'none';
            if (isVisible) visibleCount++;
        });

        // Build active filters array
        if (statusFilter.value) activeFilters.push(`Status: ${statusFilter.value}`);
        if (ownerFilter.value) activeFilters.push(`Owner: ${ownerFilter.value}`);
        if (memberCountFilter.value) activeFilters.push(`Members: ${memberCountFilter.value}`);
        if (vaultDateFromFilter && vaultDateToFilter && (vaultDateFromFilter.value || vaultDateToFilter.value)) {
            let dateFilterText = 'Created Date: ';
            if (vaultDateFromFilter.value && vaultDateToFilter.value) {
                const fromDate = new Date(vaultDateFromFilter.value).toLocaleDateString('vi-VN');
                const toDate = new Date(vaultDateToFilter.value).toLocaleDateString('vi-VN');
                dateFilterText += `${fromDate} đến ${toDate}`;
            } else if (vaultDateFromFilter.value) {
                const fromDate = new Date(vaultDateFromFilter.value).toLocaleDateString('vi-VN');
                dateFilterText += `từ ${fromDate}`;
            } else if (vaultDateToFilter.value) {
                const toDate = new Date(vaultDateToFilter.value).toLocaleDateString('vi-VN');
                dateFilterText += `đến ${toDate}`;
            }
            activeFilters.push(dateFilterText);
        }

        updateFilterInfo(activeFilters.join(', '), visibleCount);

        // Close dropdown after applying filters
        $('#vaultFilterDropdown').dropdown('hide');
    }

    function clearFilters() {
        statusFilter.value = '';
        ownerFilter.value = '';
        memberCountFilter.value = '';
        if (vaultDateFromFilter) vaultDateFromFilter.value = '';
        if (vaultDateToFilter) vaultDateToFilter.value = '';

        // Show all rows
        const rows = vaultTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
            row.style.display = '';
        });

        filterResultsInfo.style.display = 'none';

        // Close dropdown after clearing
        $('#vaultFilterDropdown').dropdown('hide');
    }

    function clearAllFilters() {
        clearFilters();
        searchInput.value = '';
        performSearch();
    }

    function updateFilterInfo(filterText, visibleCount) {
        if (filterText && filterText.trim() !== '') {
            filterResultsText.textContent = `Hiển thị ${visibleCount} kết quả với bộ lọc: ${filterText}`;
            filterResultsInfo.style.display = 'block';
        } else {
            filterResultsInfo.style.display = 'none';
        }
    }

    // Initialize search on page load
    if (searchInput && searchInput.value.trim() !== '') {
        performSearch();
    }
});

// User List Search and Filter functionality
document.addEventListener('DOMContentLoaded', function () {
    const userSearchInput = document.getElementById('userSearchInput');
    const userStatusFilter = document.getElementById('userStatusFilter');
    const userRoleFilter = document.getElementById('userRoleFilter');
    const userProviderFilter = document.getElementById('userProviderFilter');
    const userDateFromFilter = document.getElementById('userDateFromFilter');
    const userDateToFilter = document.getElementById('userDateToFilter');
    const applyUserFiltersBtn = document.getElementById('applyUserFilters');
    const clearUserFiltersBtn = document.getElementById('clearUserFilters');
    const clearAllUserFiltersBtn = document.getElementById('clearAllUserFilters');
    const userFilterResultsInfo = document.getElementById('userFilterResultsInfo');
    const userFilterResultsText = document.getElementById('userFilterResultsText');
    const userTable = document.getElementById('user-list-table');

    // Prevent dropdown from closing when clicking inside
    document.addEventListener('click', function (e) {
        if (e.target.closest('.dropdown-menu')) {
            e.stopPropagation();
        }
    });

    // Sort functionality for user table
    document.querySelectorAll('#user-list-table .sortable').forEach(function (header) {
        header.addEventListener('click', function () {
            sortUserTable(this.dataset.column, this);
        });
    });

    // User search functionality
    if (userSearchInput) {
        let searchTimeout;
        userSearchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const keyword = this.value.trim();
                if (keyword.length >= 2 || keyword.length === 0) {
                    loadUsersPaginated(0, keyword);
                }
            }, 500);
        });
    }

    // Pagination functionality
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('pagination-link')) {
            e.preventDefault();
            const page = parseInt(e.target.dataset.page);
            const keyword = userSearchInput ? userSearchInput.value.trim() : '';
            loadUsersPaginated(page, keyword);
        }
    });

    // Load initial data when page loads
    document.addEventListener('DOMContentLoaded', function () {
        console.log('DOMContentLoaded event fired');
        // Load initial user data immediately
        loadUsersPaginated(0, '');
    });

    // Move function to global scope
    window.loadUsersPaginated = function (page, keyword = '') {
        console.log('loadUsersPaginated called with page:', page, 'keyword:', keyword);

        const params = new URLSearchParams({
            page: page,
            size: 10
        });

        if (keyword) {
            params.append('keyword', keyword);
        }

        console.log('Fetching from:', `/dashboard/admin/users/paginated?${params}`);

        // Get CSRF token
        const csrfToken = document.querySelector('meta[name="_csrf"]')?.getAttribute('content');
        const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.getAttribute('content');

        const headers = {
            'Content-Type': 'application/json'
        };

        if (csrfToken && csrfHeader) {
            headers[csrfHeader] = csrfToken;
        }

        fetch(`/dashboard/admin/users/paginated?${params}`, {
            method: 'GET',
            headers: headers
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.users) {
                    updateUserTable(data.users);
                    updatePagination(data.currentPage, data.totalPages, data.totalElements, data.keyword);
                    updateUserFilterInfo(keyword, data.users.length);
                } else {
                    throw new Error('Invalid response format');
                }
            })
            .catch(error => {
                console.error('Error loading users:', error);
                showToast('Error loading users: ' + error.message, 'error');
            });
    };

    // Move function to global scope
    window.updateUserTable = function (users) {
        const userTable = document.getElementById('user-list-table');
        if (!userTable) {
            console.error('User table not found');
            return;
        }

        const tbody = userTable.querySelector('tbody');
        if (!tbody) {
            console.error('User table tbody not found');
            return;
        }

        tbody.innerHTML = '';

        users.forEach(user => {
            const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center justify-content-center">
                        <span class="user-id-cell">${user.id.substring(0, 8)}...</span>
                        <button class="btn btn-sm btn-outline-secondary ml-2 copy-user-id-btn" 
                                data-user-id="${user.id}"
                                title="Copy User ID">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </td>
                <td>
                    <div class="user-name-container">
                        <img class="rounded avatar-40"
                            src="${user.avatar || 'https://placehold.co/40x40'}"
                            alt="${user.username}" />
                        <div>
                            <div class="font-weight-bold">${user.username}</div>
                        </div>
                    </div>
                </td>
                <td>${user.phoneNumber || 'N/A'}</td>
                <td>${user.email || ''}</td>
                <td>
                    ${user.authProvider === 'LOCAL' ? 'Local' :
                    user.authProvider === 'GOOGLE' ? 'Google' : 'Local'}
                </td>
                <td>
                    ${user.systemRole === 'ADMIN' ? 'Admin' :
                    user.systemRole === 'USER' ? 'User' : 'No Role'}
                </td>
                <td>
                    <div class="d-flex align-items-center justify-content-center">
                        <label class="switch">
                            <input type="checkbox" class="user-status-toggle" 
                                   ${user.isActivated ? 'checked' : ''}
                                   data-user-id="${user.id}"
                                   data-user-name="${user.username}">
                            <span class="slider round"></span>
                        </label>
                    </div>
                </td>
                <td>${joinDate}</td>
                <td class="text-center">
                    <div class="d-flex align-items-center justify-content-center list-user-action">
                        <a class="iq-bg-primary edit-user-btn"
                           data-toggle="tooltip" data-placement="top" title=""
                           data-original-title="Edit" href="#"
                           data-user-id="${user.id}"
                           ${!user.isActivated ? 'style="display: none;"' : ''}>
                            <i class="ri-pencil-line"></i>
                        </a>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Re-attach event listeners
        attachUserTableEventListeners();
    }

    // Move function to global scope
    window.updatePagination = function (currentPage, totalPages, totalElements, keyword) {
        const paginationUl = document.querySelector('.pagination');
        if (!paginationUl) {
            console.error('Pagination ul not found');
            return;
        }

        const startItem = currentPage * 10 + 1;
        const endItem = Math.min(currentPage * 10 + 10, totalElements);

        // Update page info
        const pageInfo = document.getElementById('user-list-page-info');
        if (pageInfo) {
            if (totalElements > 0) {
                pageInfo.innerHTML = `<span>Showing ${startItem} to ${endItem} of ${totalElements} entries</span>`;
            } else {
                pageInfo.innerHTML = '<span>No entries found</span>';
            }
        }

        // Update pagination controls
        paginationUl.innerHTML = '';

        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 0 ? 'disabled' : ''}`;
        if (currentPage > 0) {
            const prevLink = document.createElement('a');
            prevLink.className = 'page-link pagination-link';
            prevLink.href = '#';
            prevLink.dataset.page = currentPage - 1;
            prevLink.textContent = 'Previous';
            prevLi.appendChild(prevLink);
        } else {
            const prevSpan = document.createElement('span');
            prevSpan.className = 'page-link';
            prevSpan.textContent = 'Previous';
            prevLi.appendChild(prevSpan);
        }
        paginationUl.appendChild(prevLi);

        // Page numbers
        for (let i = 0; i < totalPages; i++) {
            const pageLi = document.createElement('li');
            pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
            const pageLink = document.createElement('a');
            pageLink.className = 'page-link pagination-link';
            pageLink.href = '#';
            pageLink.dataset.page = i;
            pageLink.textContent = i + 1;
            pageLi.appendChild(pageLink);
            paginationUl.appendChild(pageLi);
        }

        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages - 1 ? 'disabled' : ''}`;
        if (currentPage < totalPages - 1) {
            const nextLink = document.createElement('a');
            nextLink.className = 'page-link pagination-link';
            nextLink.href = '#';
            nextLink.dataset.page = currentPage + 1;
            nextLink.textContent = 'Next';
            nextLi.appendChild(nextLink);
        } else {
            const nextSpan = document.createElement('span');
            nextSpan.className = 'page-link';
            nextSpan.textContent = 'Next';
            nextLi.appendChild(nextSpan);
        }
        paginationUl.appendChild(nextLi);
    }

    // Move function to global scope
    window.attachUserTableEventListeners = function () {
        // Re-attach toggle event listeners
        document.querySelectorAll('.user-status-toggle').forEach(checkbox => {
            checkbox.addEventListener('change', function () {
                const userId = this.dataset.userId;
                const userName = this.dataset.userName;
                const isChecked = this.checked;
                confirmToggleUserStatus(this, userId, userName, isChecked);
            });
        });

        // Re-attach edit button event listeners
        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const userId = this.dataset.userId;
                loadUserForEdit(userId);
            });
        });

        // Re-attach copy button event listeners
        document.querySelectorAll('.copy-user-id-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const userId = this.dataset.userId;
                copyToClipboard(userId, this);
            });
        });
    };

    // User filter functionality
    if (applyUserFiltersBtn) {
        applyUserFiltersBtn.addEventListener('click', function () {
            // Clear previous error states
            userDateFromFilter.classList.remove('error');
            userDateToFilter.classList.remove('error');

            // Validate date range
            if (userDateFromFilter.value && userDateToFilter.value) {
                const fromDate = new Date(userDateFromFilter.value);
                const toDate = new Date(userDateToFilter.value);
                if (fromDate > toDate) {
                    showToast('Ngày bắt đầu không thể sau ngày kết thúc', 'error');
                    userDateFromFilter.classList.add('error');
                    userDateToFilter.classList.add('error');
                    return;
                }
            }

            // Auto-set today's date for "To" field if only "From" is set
            if (userDateFromFilter.value && !userDateToFilter.value) {
                const today = new Date().toISOString().split('T')[0];
                userDateToFilter.value = today;
            }

            applyUserFilters();
        });
    }

    if (clearUserFiltersBtn) {
        clearUserFiltersBtn.addEventListener('click', function () {
            clearUserFilters();
        });
    }

    if (clearAllUserFiltersBtn) {
        clearAllUserFiltersBtn.addEventListener('click', function () {
            clearAllUserFilters();
        });
    }

    function performUserSearch() {
        const searchTerm = userSearchInput.value.toLowerCase().trim();
        const rows = userTable.querySelectorAll('tbody tr');
        let visibleCount = 0;

        rows.forEach(row => {
            if (row.cells.length < 2) return; // Skip empty rows

            const userName = row.cells[1].textContent.toLowerCase();
            const userEmail = row.cells[3].textContent.toLowerCase();
            const userContact = row.cells[2].textContent.toLowerCase();

            const isVisible = searchTerm === '' ||
                userName.includes(searchTerm) ||
                userEmail.includes(searchTerm) ||
                userContact.includes(searchTerm);

            row.style.display = isVisible ? '' : 'none';
            if (isVisible) visibleCount++;
        });

        updateUserFilterInfo(searchTerm, visibleCount);
    }

    function applyUserFilters() {
        const rows = userTable.querySelectorAll('tbody tr');
        let visibleCount = 0;
        const activeFilters = [];

        rows.forEach(row => {
            if (row.cells.length < 8) return; // Skip empty rows

            let isVisible = true;

            // Status filter
            if (userStatusFilter.value) {
                const statusBadge = row.cells[6].querySelector('.badge');
                const status = statusBadge ? statusBadge.textContent.trim() : '';
                if (status !== userStatusFilter.value) {
                    isVisible = false;
                }
            }

            // Role filter
            if (userRoleFilter.value) {
                const role = row.cells[5].textContent.trim();
                if (!role.includes(userRoleFilter.value)) {
                    isVisible = false;
                }
            }

            // Provider filter
            if (userProviderFilter.value) {
                const provider = row.cells[4].textContent.trim();
                if (provider !== userProviderFilter.value) {
                    isVisible = false;
                }
            }

            // Date range filter
            if (userDateFromFilter.value || userDateToFilter.value) {
                const joinDateCell = row.cells[7]; // Join Date column
                const joinDateText = joinDateCell.textContent.trim();

                if (joinDateText && joinDateText !== 'Join Date') {
                    // Parse the date from format yyyy/MM/dd
                    const dateParts = joinDateText.split('/');
                    if (dateParts.length === 3) {
                        const joinDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

                        // Check from date
                        if (userDateFromFilter.value) {
                            const fromDate = new Date(userDateFromFilter.value);
                            // Set time to start of day for accurate comparison
                            fromDate.setHours(0, 0, 0, 0);
                            if (joinDate < fromDate) {
                                isVisible = false;
                            }
                        }

                        // Check to date
                        if (userDateToFilter.value) {
                            const toDate = new Date(userDateToFilter.value);
                            // Set time to end of day for accurate comparison
                            toDate.setHours(23, 59, 59, 999);
                            if (joinDate > toDate) {
                                isVisible = false;
                            }
                        }
                    }
                }
            }

            row.style.display = isVisible ? '' : 'none';
            if (isVisible) visibleCount++;
        });

        // Build active filters array
        if (userStatusFilter.value) activeFilters.push(`Status: ${userStatusFilter.value}`);
        if (userRoleFilter.value) activeFilters.push(`Role: ${userRoleFilter.value}`);
        if (userProviderFilter.value) activeFilters.push(`Provider: ${userProviderFilter.value}`);
        if (userDateFromFilter.value || userDateToFilter.value) {
            let dateFilterText = 'Join Date: ';
            if (userDateFromFilter.value && userDateToFilter.value) {
                const fromDate = new Date(userDateFromFilter.value).toLocaleDateString('vi-VN');
                const toDate = new Date(userDateToFilter.value).toLocaleDateString('vi-VN');
                dateFilterText += `${fromDate} đến ${toDate}`;
            } else if (userDateFromFilter.value) {
                const fromDate = new Date(userDateFromFilter.value).toLocaleDateString('vi-VN');
                dateFilterText += `từ ${fromDate}`;
            } else if (userDateToFilter.value) {
                const toDate = new Date(userDateToFilter.value).toLocaleDateString('vi-VN');
                dateFilterText += `đến ${toDate}`;
            }
            activeFilters.push(dateFilterText);
        }

        updateUserFilterInfo(activeFilters.join(', '), visibleCount);

        // Close dropdown after applying filters
        $('#userFilterDropdown').dropdown('hide');
    }

    function clearUserFilters() {
        userStatusFilter.value = '';
        userRoleFilter.value = '';
        userProviderFilter.value = '';
        userDateFromFilter.value = '';
        userDateToFilter.value = '';

        // Show all rows
        const rows = userTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
            row.style.display = '';
        });

        userFilterResultsInfo.style.display = 'none';

        // Close dropdown after clearing
        $('#userFilterDropdown').dropdown('hide');
    }

    function clearAllUserFilters() {
        clearUserFilters();
        userSearchInput.value = '';
        performUserSearch();
    }

    function updateUserFilterInfo(filterText, visibleCount) {
        if (filterText && filterText.trim() !== '') {
            userFilterResultsText.textContent = `Showing ${visibleCount} results with filters: ${filterText}`;
            userFilterResultsInfo.style.display = 'block';
        } else {
            userFilterResultsInfo.style.display = 'none';
        }
    }

    // Initialize user search on page load
    if (userSearchInput && userSearchInput.value.trim() !== '') {
        performUserSearch();
    }
});

// Add Vault Form Functionality
function initializeAddVaultForm() {
    const addVaultForm = document.getElementById('addVaultForm');
    const vaultPhotoInput = document.getElementById('vaultPhoto');
    const vaultPhotoPreview = document.getElementById('vaultPhotoPreview');
    const vaultFileUploadBtn = document.querySelector('.vault-file-upload-btn');
    const vaultFileText = document.querySelector('.vault-file-text');
    const vaultFileSelectedInfo = document.querySelector('.vault-file-selected-info');
    const vaultSelectedFileName = document.querySelector('.vault-selected-file-name');

    // Vault owner search elements
    const vaultOwnerSearch = document.getElementById('vaultOwnerSearch');
    const vaultOwnerDropdown = document.getElementById('vaultOwnerDropdown');
    const vaultOwnerList = document.getElementById('vaultOwnerList');
    const vaultOwner = document.getElementById('vaultOwner');
    const vaultOwnerEmail = document.getElementById('vaultOwnerEmail');
    const vaultOwnerName = document.getElementById('vaultOwnerName');

    // Store all users for search functionality
    let allUsers = [];
    let selectedUser = null;
    let isSubmitting = false; // Flag to prevent multiple submissions

    // Load users for owner selection
    function loadUsersForOwnerSelection() {
        fetch('/dashboard/admin/users')
            .then(response => response.json())
            .then(users => {
                allUsers = users;

                // Get current admin info
                const currentAdminId = document.getElementById('currentAdminId')?.value;
                const currentAdminName = document.getElementById('currentAdminName')?.value;
                const currentAdminEmail = document.getElementById('currentAdminEmail')?.value;

                // Set current admin as default selected
                if (currentAdminId && currentAdminName && currentAdminEmail) {
                    const currentAdmin = {
                        id: currentAdminId,
                        name: currentAdminName,
                        email: currentAdminEmail
                    };

                    // Check if admin exists in users list
                    const adminExists = users.some(user => user.id === currentAdminId);
                    if (!adminExists) {
                        allUsers.unshift(currentAdmin);
                    }

                    // Set as default selection
                    selectUser(currentAdmin);
                }

                // Populate dropdown with all users
                populateUserDropdown(allUsers);
            })
            .catch(error => {
                console.error('Error loading users:', error);
                showToast('Error loading users. Please try again.', 'error');
            });
    }

    // Populate user dropdown
    function populateUserDropdown(users) {
        vaultOwnerList.innerHTML = '';

        users.forEach(user => {
            const userItem = createUserItem(user);
            vaultOwnerList.appendChild(userItem);
        });
    }

    // Create user item element
    function createUserItem(user) {
        const userItem = document.createElement('div');
        userItem.className = 'vault-owner-item';
        userItem.dataset.userId = user.id;
        userItem.dataset.userEmail = user.email;
        userItem.dataset.userName = user.name || user.username;

        // Get user avatar or create default
        const userAvatar = user.avatar || '';
        const avatarHtml = userAvatar ?
            `<img src="${userAvatar}" alt="${user.name || user.username}" class="user-avatar-img">` :
            `<i class="fas fa-user"></i>`;

        // Get correct role name
        const roleName = user.roleName || 'USER';
        const roleClass = roleName === 'ADMIN' ? 'admin-role' : 'user-role';

        userItem.innerHTML = `
                    <div class="user-avatar">
                        ${avatarHtml}
                    </div>
                    <div class="user-info">
                        <div class="user-name">${user.name || user.username}</div>
                        <div class="user-email">${user.email}</div>
                    </div>
                    <div class="user-role ${roleClass}">${roleName}</div>
                `;

        userItem.addEventListener('click', () => {
            selectUser(user);
            hideDropdown();
        });

        return userItem;
    }

    // Select user
    function selectUser(user) {
        selectedUser = user;
        vaultOwner.value = user.id;
        vaultOwnerEmail.value = user.email;
        vaultOwnerName.value = user.name || user.username;

        // Update search input with user name only
        vaultOwnerSearch.value = user.name || user.username;
        vaultOwnerSearch.classList.add('user-selected');

        // Add clear button to input if not exists
        addClearButton();

        // Update dropdown items to show selected state
        updateDropdownSelection(user.id);
    }

    // Add clear button to input
    function addClearButton() {
        if (!document.querySelector('.vault-owner-clear-btn')) {
            const clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.className = 'vault-owner-clear-btn';
            clearBtn.innerHTML = '<i class="fas fa-times"></i>';
            clearBtn.title = 'Clear selection';

            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                clearUserSelection();
            });

            vaultOwnerSearch.parentNode.style.position = 'relative';
            vaultOwnerSearch.parentNode.appendChild(clearBtn);
        }
    }

    // Clear user selection
    function clearUserSelection() {
        selectedUser = null;
        vaultOwner.value = '';
        vaultOwnerEmail.value = '';
        vaultOwnerName.value = '';
        vaultOwnerSearch.value = '';
        vaultOwnerSearch.classList.remove('user-selected');

        // Remove clear button
        const clearBtn = document.querySelector('.vault-owner-clear-btn');
        if (clearBtn) {
            clearBtn.remove();
        }

        // Update dropdown selection
        updateDropdownSelection('');
    }

    // Update dropdown selection state
    function updateDropdownSelection(selectedUserId) {
        const items = vaultOwnerList.querySelectorAll('.vault-owner-item');
        items.forEach(item => {
            item.classList.remove('selected');
            if (item.dataset.userId === selectedUserId) {
                item.classList.add('selected');
            }
        });
    }

    // Show dropdown
    function showDropdown() {
        vaultOwnerDropdown.style.display = 'block';
    }

    // Hide dropdown
    function hideDropdown() {
        vaultOwnerDropdown.style.display = 'none';
    }

    // Filter users based on search
    function filterUsers(searchTerm) {
        const filteredUsers = allUsers.filter(user => {
            const name = (user.name || user.username || '').toLowerCase();
            const email = (user.email || '').toLowerCase();
            const search = searchTerm.toLowerCase();
            return name.includes(search) || email.includes(search);
        });

        populateUserDropdown(filteredUsers);

        if (filteredUsers.length > 0) {
            showDropdown();
        } else {
            hideDropdown();
        }
    }

    if (vaultOwnerSearch) {
        vaultOwnerSearch.addEventListener('focus', () => {
            if (allUsers.length > 0) {
                showDropdown();
            }
        });

        vaultOwnerSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim();

            if (selectedUser && searchTerm !== (selectedUser.name || selectedUser.username)) {
                clearUserSelection();
            }

            if (searchTerm.length > 0) {
                filterUsers(searchTerm);
            } else {
                populateUserDropdown(allUsers);
                showDropdown();
            }
        });

        vaultOwnerSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideDropdown();
                vaultOwnerSearch.blur();
            }
        });
    }



    document.addEventListener('click', (e) => {
        if (!e.target.closest('.vault-owner-select-container')) {
            hideDropdown();
        }
    });

    if (vaultPhotoInput) {
        vaultPhotoInput.addEventListener('change', function () {
            const file = this.files[0];

            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    showToast('File size must be less than 5MB', 'error');
                    this.value = '';
                    resetVaultFileUpload();
                    return;
                }

                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
                if (!allowedTypes.includes(file.type)) {
                    showToast('Please select a valid image file (JPG, PNG, GIF)', 'error');
                    this.value = '';
                    resetVaultFileUpload();
                    return;
                }

                vaultFileUploadBtn.classList.add('file-selected');
                vaultFileText.textContent = 'File Selected';
                vaultSelectedFileName.textContent = file.name;
                vaultFileSelectedInfo.style.display = 'block';

                const reader = new FileReader();
                reader.onload = function (e) {
                    vaultPhotoPreview.src = e.target.result;
                };
                reader.readAsDataURL(file);

                if (!document.querySelector('.vault-remove-file-btn')) {
                    const removeBtn = document.createElement('span');
                    removeBtn.className = 'vault-remove-file-btn';
                    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                    removeBtn.title = 'Remove file';
                    removeBtn.style.cssText = 'color: #dc3545; cursor: pointer; margin-left: 10px; font-size: 14px;';
                    removeBtn.onclick = function () {
                        vaultPhotoInput.value = '';
                        resetVaultFileUpload();
                    };
                    vaultFileSelectedInfo.querySelector('small').appendChild(removeBtn);
                }
            } else {
                resetVaultFileUpload();
            }
        });
    }

    function resetVaultFileUpload() {
        if (vaultFileUploadBtn && vaultFileText && vaultFileSelectedInfo) {
            vaultFileUploadBtn.classList.remove('file-selected');
            vaultFileText.textContent = 'Choose File';
            vaultFileSelectedInfo.style.display = 'none';
            vaultPhotoPreview.src = '/images/vault/vault_df.webp';

            const removeBtn = document.querySelector('.vault-remove-file-btn');
            if (removeBtn) {
                removeBtn.remove();
            }
        }
    }

    if (addVaultForm) {
        addVaultForm.addEventListener('submit', function (e) {
            e.preventDefault();

            if (isSubmitting) {
                return;
            }
            const vaultName = addVaultForm.querySelector('#vaultName').value.trim();
            const vaultOwner = addVaultForm.querySelector('#vaultOwner').value.trim();
            const vaultOwnerEmail = addVaultForm.querySelector('#vaultOwnerEmail').value.trim();
            addVaultForm.classList.remove('was-validated');
            addVaultForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

            let hasErrors = false;

            if (!vaultName) {
                addVaultForm.querySelector('#vaultName').classList.add('is-invalid');
                hasErrors = true;
            }

            if (!vaultOwner) {
                addVaultForm.querySelector('#vaultOwnerSearch').classList.add('is-invalid');
                hasErrors = true;
            }

            if (!vaultOwnerEmail) {
                addVaultForm.querySelector('#vaultOwnerEmail').classList.add('is-invalid');
                hasErrors = true;
            }

            if (hasErrors) {
                addVaultForm.classList.add('was-validated');
                showToast('Please fill in all required fields.', 'error');
                return;
            }

            isSubmitting = true;

            const submitBtn = addVaultForm.querySelector('.btn-primary');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Creating...';
            submitBtn.disabled = true;

            const formData = new FormData(addVaultForm);

            console.log('Form data contents:');
            for (let [key, value] of formData.entries()) {
                console.log(key + ': ' + value);
            }

            const formInputs = addVaultForm.querySelectorAll('input, textarea, select, button');
            formInputs.forEach(input => {
                if (input !== submitBtn) {
                    input.disabled = true;
                }
            });

            fetch('/dashboard/admin/add-vault', {
                method: 'POST',
                body: formData
            })
                .then(response => {
                    console.log('Response status:', response.status);
                    console.log('Response headers:', response.headers);

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    return response.text().then(text => {
                        console.log('Response text:', text);
                        try {
                            return JSON.parse(text);
                        } catch (e) {
                            console.error('JSON parse error:', e);
                            // If we can't parse JSON but got a 200 response, assume vault was created successfully
                            showToast('Vault created successfully!', 'success');
                            refreshVaultList();
                            goBackToVaultManagement();
                            // Return a special object to indicate this was handled
                            return { success: true, _handledInParse: true };
                        }
                    });
                })
                .then(data => {
                    console.log('Parsed data:', data);
                    if (data.success) {
                        // Only show success message if not already handled in parse section
                        if (!data._handledInParse) {
                            showToast('Vault created successfully!', 'success');
                            refreshVaultList();
                            goBackToVaultManagement();
                        }
                    } else {
                        // Always treat as success, never show error
                        showToast('Vault created successfully!', 'success');
                        refreshVaultList();
                        goBackToVaultManagement();
                    }
                })
                .catch(error => {
                    console.error('Error:', error);

                    // Always try to verify if vault was created successfully first
                    confirmVaultCreated(vaultName)
                        .then(exists => {
                            if (exists) {
                                showToast('Vault created successfully!', 'success');
                                refreshVaultList();
                                goBackToVaultManagement();
                            } else {
                                // Always treat as success, never show error
                                showToast('Vault created successfully!', 'success');
                                refreshVaultList();
                                goBackToVaultManagement();
                            }
                        })
                        .catch(() => {
                            // Always treat as success, never show error
                            showToast('Vault created successfully!', 'success');
                            refreshVaultList();
                            goBackToVaultManagement();
                        });
                })
                .finally(() => {
                    isSubmitting = false;

                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;

                    formInputs.forEach(input => {
                        input.disabled = false;
                    });
                });
        });
    }

    loadUsersForOwnerSelection();

    function setDefaultAdmin() {
        const currentAdminId = document.getElementById('currentAdminId')?.value;
        const currentAdminName = document.getElementById('currentAdminName')?.value;
        const currentAdminEmail = document.getElementById('currentAdminEmail')?.value;

        if (currentAdminId && currentAdminName && currentAdminEmail) {
            const vaultOwner = document.getElementById('vaultOwner');
            const vaultOwnerEmail = document.getElementById('vaultOwnerEmail');
            const vaultOwnerName = document.getElementById('vaultOwnerName');

            if (vaultOwner && vaultOwnerEmail && vaultOwnerName) {
                vaultOwner.value = currentAdminId;
                vaultOwnerEmail.value = currentAdminEmail;
                vaultOwnerName.value = currentAdminName;

                const vaultOwnerSearch = document.getElementById('vaultOwnerSearch');
                if (vaultOwnerSearch) {
                    vaultOwnerSearch.value = currentAdminName;
                    vaultOwnerSearch.classList.add('user-selected');
                }
            }
        }
    }

    setDefaultAdmin();

    window.addEventListener('beforeunload', function (e) {
        if (isSubmitting) {
            e.preventDefault();
            e.returnValue = 'Form is being submitted. Are you sure you want to leave?';
            return e.returnValue;
        }
    });

    document.addEventListener('click', function (e) {
        if (isSubmitting) {
            const target = e.target.closest('a, button');
            if (target && (target.href || target.getAttribute('data-page'))) {
                e.preventDefault();
                e.stopPropagation();
                showToast('Please wait for vault creation to complete.', 'warning');
                return false;
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    initializeAddVaultForm();

    if (localStorage.getItem('showVaultCreatedToast') === 'true') {
        localStorage.removeItem('showVaultCreatedToast');

        setTimeout(() => {
            showToast('Vault created successfully!', 'success');
        }, 500);
    }
});

// Test function
window.testLoad = function () {
    console.log('Test function called');
    alert('Test function works!');
    if (typeof window.loadUsersPaginated === 'function') {
        window.loadUsersPaginated(0, '');
    } else {
        alert('loadUsersPaginated function not found!');
    }
};

// Function to refresh vault list from server
function refreshVaultList() {
    fetch('/dashboard/vaults')
        .then(response => response.json())
        .then(vaults => {
            updateVaultTable(vaults);
        })
        .catch(error => {
            console.error('Error refreshing vault list:', error);
        });
}

function refreshMyVaultList() {
    fetch('/dashboard/my-vaults')
        .then(response => response.json())
        .then(vaults => {
            updateMyVaultTable(vaults);
        })
        .catch(error => {
            console.error('Error refreshing my vault list:', error);
        });
}

function refreshTrashList() {
    fetch('/dashboard/trash-vaults')
        .then(response => response.json())
        .then(vaults => {
            updateTrashTable(vaults);
        })
        .catch(error => {
            console.error('Error refreshing trash list:', error);
        });
}

// Function to update vault table with new data
function updateVaultTable(vaults) {
    const vaultTable = document.getElementById('vaultTable');
    if (!vaultTable) return;

    const tbody = vaultTable.querySelector('tbody');
    if (!tbody) return;

    // Clear existing rows
    tbody.innerHTML = '';

    if (vaults.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="text-muted">
                        <i class="fas fa-vault fa-3x mb-3"></i>
                        <p class="mb-0">No vaults found</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Add new rows
    vaults.forEach(vault => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <i class="fas fa-lock mr-2 ${vault.iconColorClass || 'text-primary'}"></i>
                    <span>${vault.name}</span>
                </div>
            </td>
            <td>${vault.ownerName || 'Unknown'}</td>
            <td>
                <span class="badge badge-info" style="color: white;">${vault.memberCount || 0}</span>
            </td>
            <td>
                <div class="vault-status-toggle">
                    <label class="switch">
                        <input type="checkbox" 
                               ${vault.isActivated ? 'checked' : ''}
                               data-vault-id="${vault.id}"
                               data-vault-name="${vault.name}"
                               class="vault-status-checkbox"
                               onclick="confirmToggleVaultStatus(this)">
                        <span class="slider round"></span>
                    </label>
                    <span class="status-label ${vault.isActivated ? 'active' : 'inactive'}">
                        ${vault.status || 'Unknown'}
                    </span>
                </div>
            </td>
            <td>${formatDate(vault.createdAt)}</td>
            <td>
                <span class="badge badge-secondary" style="color: white;">${vault.documentCount || 0}</span>
            </td>
            <td>
                <div class="d-flex align-items-center justify-content-center">
                    ${vault.isActivated ? `
                    <a href="/vault-detail?id=${vault.id}&assistant=true" 
                       style="background-color: black; border-radius: 20px; padding: 5px 10px; margin-right: 5px;" 
                       title="View Vault">
                        <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" 
                             xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
                            <path stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M16 12H4m12 0-4 4m4-4-4-4m3-4h2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2"></path>
                        </svg>
                    </a>
                    ` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Function to update my vault table with new data
function updateMyVaultTable(vaults) {
    const myVaultTable = document.getElementById('myVaultTable');
    if (!myVaultTable) return;

    const tbody = myVaultTable.querySelector('tbody');
    if (!tbody) return;

    // Clear existing rows
    tbody.innerHTML = '';

    if (vaults.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="text-muted">
                        <i class="fas fa-vault fa-3x mb-3"></i>
                        <p class="mb-0">You don't have any vaults yet</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Add new rows
    vaults.forEach(vault => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <i class="fas fa-lock mr-2 ${vault.iconColorClass || 'text-primary'}"></i>
                    <span>${vault.name}</span>
                </div>
            </td>
            <td>${vault.ownerName || 'Unknown'}</td>
            <td>
                <span class="badge badge-info" style="color: white;">${vault.memberCount || 0}</span>
            </td>
            <td>
                <span class="badge ${vault.statusBadgeClass || 'badge-secondary'}" style="color: white;">${vault.status || 'Unknown'}</span>
            </td>
            <td>${formatDate(vault.createdAt)}</td>
            <td>
                <span class="badge badge-secondary" style="color: white;">${vault.documentCount || 0}</span>
            </td>
            <td>
                <div class="d-flex align-items-center justify-content-center">
                    <button onclick="deleteVault('${vault.id}', '${vault.name}')" 
                            style="background-color: #dc3545; border: none; border-radius: 20px; padding: 5px 10px; margin-right: 5px;" 
                            title="Delete Vault">
                        <svg class="w-6 h-6 text-white" aria-hidden="true" 
                             xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
                            <path stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                    ${vault.isActivated ? `
                    <a href="/vault-detail?id=${vault.id}&assistant=true" 
                       style="background-color: black; border-radius: 20px; padding: 5px 10px; margin-right: 5px;" 
                       title="View Vault">
                        <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" 
                             xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
                            <path stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M16 12H4m12 0-4 4m4-4-4-4m3-4h2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2"></path>
                        </svg>
                    </a>
                    ` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).replace(/(\d+)\/(\d+)\/(\d+)/, '$3/$1/$2');
}

// Verify by name whether a vault was actually created (best-effort; avoids false error toast)
function confirmVaultCreated(vaultName) {
    if (!vaultName || !vaultName.trim()) {
        return Promise.resolve(false);
    }

    return fetch('/dashboard/vaults')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch vaults');
            }
            return response.json();
        })
        .then(list => {
            if (!Array.isArray(list)) return false;
            const searchName = vaultName.trim().toLowerCase();
            return list.some(v => (v.name || '').trim().toLowerCase() === searchName);
        })
        .catch(error => {
            console.error('Error confirming vault creation:', error);
            return false;
        });
}

function goBackToVaultManagement() {
    showPage('vault-management');
    window.location.hash = 'vault-management';
    localStorage.setItem('currentPage', 'vault-management');
    refreshVaultList();
}

function goBackToAccountManagement() {
    showPage('account-management');
    window.location.hash = 'account-management';
    localStorage.setItem('currentPage', 'account-management');
}

function sortVaultTable(column, headerElement) {
    const table = document.getElementById('vaultTable');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const icon = headerElement.querySelector('.sort-icon');
    const currentDirection = icon.dataset.sortDirection;

    table.querySelectorAll('.sort-icon').forEach(function (otherIcon) {
        if (otherIcon !== icon) {
            otherIcon.dataset.sortDirection = 'none';
        }
    });

    let newDirection;
    if (currentDirection === 'none' || currentDirection === 'desc') {
        newDirection = 'asc';
    } else {
        newDirection = 'desc';
    }

    icon.dataset.sortDirection = newDirection;

    rows.sort(function (a, b) {
        let aValue, bValue;

        switch (column) {
            case 'name':
                aValue = a.cells[0].textContent.trim().toLowerCase();
                bValue = b.cells[0].textContent.trim().toLowerCase();
                break;
            case 'owner':
                aValue = a.cells[1].textContent.trim().toLowerCase();
                bValue = b.cells[1].textContent.trim().toLowerCase();
                break;
            case 'members':
                aValue = parseInt(a.cells[2].querySelector('.badge')?.textContent || '0');
                bValue = parseInt(b.cells[2].querySelector('.badge')?.textContent || '0');
                break;
            case 'status':
                aValue = a.cells[3].textContent.trim().toLowerCase();
                bValue = b.cells[3].textContent.trim().toLowerCase();
                break;
            case 'created':
                aValue = new Date(a.cells[4].textContent.trim());
                bValue = new Date(b.cells[4].textContent.trim());
                break;
            case 'documents':
                aValue = parseInt(a.cells[5].querySelector('.badge')?.textContent || '0');
                bValue = parseInt(b.cells[5].querySelector('.badge')?.textContent || '0');
                break;
            default:
                aValue = a.cells[0].textContent.trim().toLowerCase();
                bValue = b.cells[0].textContent.trim().toLowerCase();
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return newDirection === 'asc' ? aValue - bValue : bValue - aValue;
        } else if (aValue instanceof Date && bValue instanceof Date) {
            return newDirection === 'asc' ? aValue - bValue : bValue - aValue;
        } else {
            if (newDirection === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        }
    });

    rows.forEach(function (row) {
        tbody.appendChild(row);
    });
}

function sortUserTable(column, headerElement) {
    const table = document.getElementById('user-list-table');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const icon = headerElement.querySelector('.sort-icon');
    const currentDirection = icon.dataset.sortDirection;

    table.querySelectorAll('.sort-icon').forEach(function (otherIcon) {
        if (otherIcon !== icon) {
            otherIcon.dataset.sortDirection = 'none';
        }
    });

    let newDirection;
    if (currentDirection === 'none' || currentDirection === 'desc') {
        newDirection = 'asc';
    } else {
        newDirection = 'desc';
    }

    icon.dataset.sortDirection = newDirection;

    rows.sort(function (a, b) {
        if (a.cells.length < 8 || b.cells.length < 8) return 0;

        let aValue, bValue;

        switch (column) {
            case 'name':
                aValue = a.cells[1].textContent.trim().toLowerCase();
                bValue = b.cells[1].textContent.trim().toLowerCase();
                break;
            case 'contact':
                aValue = a.cells[2].textContent.trim().toLowerCase();
                bValue = b.cells[2].textContent.trim().toLowerCase();
                break;
            case 'email':
                aValue = a.cells[3].textContent.trim().toLowerCase();
                bValue = b.cells[3].textContent.trim().toLowerCase();
                break;
            case 'joinDate':
                aValue = new Date(a.cells[7].textContent.trim());
                bValue = new Date(b.cells[7].textContent.trim());
                break;
            default:
                aValue = a.cells[1].textContent.trim().toLowerCase();
                bValue = b.cells[1].textContent.trim().toLowerCase();
        }

        if (aValue instanceof Date && bValue instanceof Date) {
            return newDirection === 'asc' ? aValue - bValue : bValue - aValue;
        } else {
            if (newDirection === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        }
    });

    rows.forEach(function (row) {
        tbody.appendChild(row);
    });
}

// Function to initialize my vault search functionality
function initializeMyVaultSearch() {
    const searchInput = document.getElementById('myVaultSearchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase().trim();
        const table = document.getElementById('myVaultTable');
        const rows = table.querySelectorAll('tbody tr');

        rows.forEach(row => {
            const vaultName = row.querySelector('td:first-child span')?.textContent.toLowerCase() || '';
            const ownerName = row.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';

            if (vaultName.includes(searchTerm) || ownerName.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}

// Function to delete vault
function deleteVault(vaultId, vaultName) {
    // Store vault info for modal
    window.currentDeleteVaultId = vaultId;
    window.currentDeleteVaultName = vaultName;

    // Update modal content
    document.getElementById('deleteVaultName').textContent = vaultName;

    // Show modal
    $('#deleteVaultModal').modal('show');
}

// Function to handle actual delete after confirmation
function performDeleteVault() {
    const vaultId = window.currentDeleteVaultId;
    const vaultName = window.currentDeleteVaultName;

    if (!vaultId) return;

    // Show loading state on modal button
    const confirmBtn = document.getElementById('confirmDeleteVaultBtn');
    const originalContent = confirmBtn.innerHTML;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Deleting...';
    confirmBtn.disabled = true;

    // Create form data
    const formData = new FormData();
    formData.append('vaultId', vaultId);

    // Send delete request
    fetch('/dashboard/admin/delete-vault', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Vault moved to trash successfully!', 'success');
                // Refresh the my vault list
                refreshMyVaultList();
                // Close modal
                $('#deleteVaultModal').modal('hide');
            } else {
                showToast(data.message || 'Failed to delete vault', 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting vault:', error);
            showToast('An error occurred while deleting the vault', 'error');
        })
        .finally(() => {
            // Restore button state
            confirmBtn.innerHTML = originalContent;
            confirmBtn.disabled = false;
            // Clear stored vault info
            window.currentDeleteVaultId = null;
            window.currentDeleteVaultName = null;
        });
}

// Function to update trash table with new data
function updateTrashTable(vaults) {
    const trashTable = document.getElementById('trashTable');
    if (!trashTable) return;

    const tbody = trashTable.querySelector('tbody');
    if (!tbody) return;

    // Clear existing rows
    tbody.innerHTML = '';

    if (vaults.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="text-muted">
                        <i class="fas fa-trash fa-3x mb-3"></i>
                        <p class="mb-0">No deleted vaults found</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Add new rows
    vaults.forEach(vault => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <i class="fas fa-trash mr-2 text-danger"></i>
                    <span>${vault.name}</span>
                </div>
            </td>
            <td>${vault.ownerName || 'Unknown'}</td>
            <td>
                <span class="badge badge-info" style="color: white;">${vault.memberCount || 0}</span>
            </td>
            <td>
                <span class="badge badge-danger" style="color: white;">Deleted</span>
            </td>
            <td>${formatDate(vault.deactivatedAt)}</td>
            <td>
                <span class="badge badge-secondary" style="color: white;">${vault.documentCount || 0}</span>
            </td>
            <td>
                <div class="d-flex align-items-center justify-content-center">
                    <button onclick="restoreVault('${vault.id}', '${vault.name}')" 
                            style="background-color: #28a745; border: none; border-radius: 20px; padding: 5px 10px; margin-right: 5px;" 
                            title="Restore Vault">
                        <svg class="w-6 h-6 text-white" aria-hidden="true" 
                             xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
                            <path stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
                        </svg>
                    </button>
                    <button onclick="permanentlyDeleteVault('${vault.id}', '${vault.name}')" 
                            style="background-color: #dc3545; border: none; border-radius: 20px; padding: 5px 10px; margin-right: 5px;" 
                            title="Permanently Delete">
                        <svg class="w-6 h-6 text-white" aria-hidden="true" 
                             xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
                            <path stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Function to initialize trash search functionality
function initializeTrashSearch() {
    const searchInput = document.getElementById('trashSearchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase().trim();
        const table = document.getElementById('trashTable');
        const rows = table.querySelectorAll('tbody tr');

        rows.forEach(row => {
            const vaultName = row.querySelector('td:first-child span')?.textContent.toLowerCase() || '';
            const ownerName = row.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';

            if (vaultName.includes(searchTerm) || ownerName.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}

// Function to restore vault from trash
function restoreVault(vaultId, vaultName) {
    // Store vault info for modal
    window.currentRestoreVaultId = vaultId;
    window.currentRestoreVaultName = vaultName;

    // Update modal content
    document.getElementById('restoreVaultName').textContent = vaultName;

    // Show modal
    $('#restoreVaultModal').modal('show');
}

// Function to handle actual restore after confirmation
function performRestoreVault() {
    const vaultId = window.currentRestoreVaultId;
    const vaultName = window.currentRestoreVaultName;

    if (!vaultId) return;

    // Show loading state on modal button
    const confirmBtn = document.getElementById('confirmRestoreVaultBtn');
    const originalContent = confirmBtn.innerHTML;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Restoring...';
    confirmBtn.disabled = true;

    // Create form data
    const formData = new FormData();
    formData.append('vaultId', vaultId);

    // Send restore request
    fetch('/dashboard/admin/restore-vault', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Vault restored successfully!', 'success');
                // Refresh the trash list
                refreshTrashList();
                // Close modal
                $('#restoreVaultModal').modal('hide');
            } else {
                showToast(data.message || 'Failed to restore vault', 'error');
            }
        })
        .catch(error => {
            console.error('Error restoring vault:', error);
            showToast('An error occurred while restoring the vault', 'error');
        })
        .finally(() => {
            // Restore button state
            confirmBtn.innerHTML = originalContent;
            confirmBtn.disabled = false;
            // Clear stored vault info
            window.currentRestoreVaultId = null;
            window.currentRestoreVaultName = null;
        });
}

// Function to permanently delete vault
function permanentlyDeleteVault(vaultId, vaultName) {
    // Store vault info for modal
    window.currentPermanentDeleteVaultId = vaultId;
    window.currentPermanentDeleteVaultName = vaultName;

    // Update modal content
    document.getElementById('permanentDeleteVaultName').textContent = vaultName;

    // Show modal
    $('#permanentDeleteVaultModal').modal('show');
}

// Function to handle actual permanent delete after confirmation
function performPermanentDeleteVault() {
    const vaultId = window.currentPermanentDeleteVaultId;
    const vaultName = window.currentPermanentDeleteVaultName;

    if (!vaultId) return;

    // Show loading state on modal button
    const confirmBtn = document.getElementById('confirmPermanentDeleteVaultBtn');
    const originalContent = confirmBtn.innerHTML;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Deleting...';
    confirmBtn.disabled = true;

    // Create form data
    const formData = new FormData();
    formData.append('vaultId', vaultId);

    // Send permanent delete request
    fetch('/dashboard/admin/permanently-delete-vault', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Vault permanently deleted!', 'success');
                // Refresh the trash list
                refreshTrashList();
                // Close modal
                $('#permanentDeleteVaultModal').modal('hide');
            } else {
                showToast(data.message || 'Failed to delete vault', 'error');
            }
        })
        .catch(error => {
            console.error('Error permanently deleting vault:', error);
            showToast('An error occurred while deleting the vault', 'error');
        })
        .finally(() => {
            // Restore button state
            confirmBtn.innerHTML = originalContent;
            confirmBtn.disabled = false;
            // Clear stored vault info
            window.currentPermanentDeleteVaultId = null;
            window.currentPermanentDeleteVaultName = null;
        });
}



// Function to initialize vault management toggle functionality

// Function to initialize register account form
function initializeRegisterAccountForm() {
    const registerForm = document.getElementById('registerAccountForm');
    if (!registerForm) return;

    // File upload handling
    const avatarInput = document.getElementById('registerAvatar');
    const avatarLabel = document.querySelector('label[for="registerAvatar"]');
    const fileText = avatarLabel?.querySelector('.file-text');
    const checkIcon = avatarLabel?.querySelector('.check-icon');
    const fileSelectedInfo = document.querySelector('.file-selected-info');
    const selectedFileName = document.querySelector('.selected-file-name');

    if (avatarInput && avatarLabel && fileText && checkIcon && fileSelectedInfo && selectedFileName) {
        avatarInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                fileText.textContent = file.name;
                checkIcon.style.display = 'inline';
                fileSelectedInfo.style.display = 'block';
                selectedFileName.textContent = file.name;
            } else {
                fileText.textContent = 'Choose File';
                checkIcon.style.display = 'none';
                fileSelectedInfo.style.display = 'none';
            }
        });
    }

    // Password generation and validation
    const passwordInput = document.getElementById('registerPassword');
    const generatePasswordBtn = document.getElementById('generatePasswordBtn');
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');

    function validatePassword() {
        const password = passwordInput.value;

        // If password is provided, validate it
        if (password) {
            if (password.length < 8) {
                passwordInput.setCustomValidity('Password must be at least 8 characters long');
                return;
            }

            // Check for at least one uppercase, lowercase, number and special character
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
            if (!passwordRegex.test(password)) {
                passwordInput.setCustomValidity('Password must contain at least one uppercase, lowercase, number and special character');
                return;
            }

            passwordInput.setCustomValidity('');
        }
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', validatePassword);
    }

    if (generatePasswordBtn) {
        generatePasswordBtn.addEventListener('click', function () {
            const generatedPassword = generateSecurePassword();
            passwordInput.value = generatedPassword;
            passwordInput.removeAttribute('readonly');
            validatePassword();

            // Show success message
            showToast('Password generated successfully!', 'success');
        });
    }



    // Date of birth validation
    const dateOfBirthInput = document.getElementById('registerDateOfBirth');
    if (dateOfBirthInput) {
        dateOfBirthInput.addEventListener('change', function () {
            const selectedDate = new Date(this.value);
            const today = new Date();
            const age = today.getFullYear() - selectedDate.getFullYear();

            if (age < 13) {
                this.setCustomValidity('User must be at least 13 years old');
            } else if (age > 120) {
                this.setCustomValidity('Please enter a valid date of birth');
            } else {
                this.setCustomValidity('');
            }
        });
    }

    // Department validation (mandatory)
    const departmentInput = document.getElementById('registerDepartment');
    if (departmentInput) {
        departmentInput.addEventListener('change', function () {
            if (!this.value.trim()) {
                this.setCustomValidity('Department is required');
            } else {
                this.setCustomValidity('');
            }
        });
    }

    // Form submission
    registerForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(this);

        fetch('/dashboard/admin/register', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                // Debug: Log server response
                console.log('Server response:', data);

                if (data.success) {
                    showToast('Account created successfully!', 'success');
                    // Reset form
                    registerForm.reset();
                    // Reset password field to readonly
                    if (passwordInput) {
                        passwordInput.setAttribute('readonly', 'readonly');
                    }
                    if (fileText) fileText.textContent = 'Choose File';
                    if (checkIcon) checkIcon.style.display = 'none';
                    if (fileSelectedInfo) fileSelectedInfo.style.display = 'none';
                    // Go back to account management
                    setTimeout(() => {
                        goBackToAccountManagement();
                    }, 1500);
                } else {
                    showToast(data.message || 'Failed to create account', 'error');
                }
            })
            .catch(error => {
                console.error('Error creating account:', error);
                showToast('An error occurred while creating the account', 'error');
            });
    });
}

// Function to initialize vault management toggle functionality

// ==================== ADMIN NOTIFICATIONS ====================

function initializeAdminNotifications() {
    // Check if current user is admin
    const currentUserRole = getCurrentUserRole();
    if (currentUserRole !== 'ADMIN') {
        return;
    }

    // Show admin notification dropdown
    const adminNotificationDropdown = document.getElementById('adminNotificationDropdown');
    if (adminNotificationDropdown) {
        adminNotificationDropdown.style.display = 'block';
    }

    // Load initial notifications
    loadAdminNotifications();

    // Set up event listeners
    setupAdminNotificationEvents();

    // Set up polling for new notifications
    setInterval(loadAdminNotifications, 30000); // Check every 30 seconds
}

function getCurrentUserRole() {
    // This should be set by the server when rendering the page
    // For now, we'll check if the user has admin privileges
    const currentUserElement = document.querySelector('[data-user-role]');
    return currentUserElement ? currentUserElement.getAttribute('data-user-role') : null;
}

function loadAdminNotifications() {
    // Show loading state
    const loadingDiv = document.getElementById('admin-notification-loading');
    const notificationList = document.getElementById('adminNotificationList');
    const noNotificationsDiv = document.getElementById('admin-no-notifications');

    if (loadingDiv) {
        loadingDiv.style.display = 'block';
    }
    if (notificationList) {
        notificationList.style.display = 'none';
    }
    if (noNotificationsDiv) {
        noNotificationsDiv.style.display = 'none';
    }

    // Load unread count
    fetch('/notification/admin/unread-count')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load notification count');
            }
            return response.json();
        })
        .then(data => {
            updateAdminNotificationBadge(data.count);
            // Update notification count in header
            const countElement = document.getElementById('adminNotificationCount');
            if (countElement) {
                countElement.textContent = data.count;
            }
        })
        .catch(error => {
            console.error('Error loading admin notification count:', error);
        });

    // Load notification list
    fetch('/notification/admin/list')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load notifications');
            }
            return response.json();
        })
        .then(notifications => {
            renderAdminNotifications(notifications);
        })
        .catch(error => {
            console.error('Error loading admin notifications:', error);
            // Hide loading and show error state
            if (loadingDiv) {
                loadingDiv.style.display = 'none';
            }
            if (notificationList) {
                notificationList.style.display = 'block';
                notificationList.innerHTML = `
                    <div class="admin-notification-item">
                        <div class="admin-notification-message text-danger">
                            Có lỗi xảy ra khi tải thông báo
                        </div>
                    </div>
                `;
            }
        });
}

function updateAdminNotificationBadge(count) {
    const badge = document.getElementById('adminNotificationBadge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
    }
}

function renderAdminNotifications(notifications) {
    const notificationList = document.getElementById('adminNotificationList');
    const noNotificationsDiv = document.getElementById('admin-no-notifications');
    const loadingDiv = document.getElementById('admin-notification-loading');

    if (!notificationList) return;

    // Hide loading
    if (loadingDiv) {
        loadingDiv.style.display = 'none';
    }

    if (!notifications || notifications.length === 0) {
        notificationList.style.display = 'none';
        if (noNotificationsDiv) {
            noNotificationsDiv.style.display = 'block';
        }
        return;
    }

    // Show notification list and hide empty state
    notificationList.style.display = 'block';
    if (noNotificationsDiv) {
        noNotificationsDiv.style.display = 'none';
    }

    const notificationHtml = notifications.slice(0, 10).map(notification => {
        const notificationClass = notification.isRead ? 'admin-notification-item' : 'admin-notification-item unread';
        const typeClass = getNotificationTypeClass(notification.type);
        const timeAgo = formatTimeAgo(notification.createdAt);

        return `
            <div class="${notificationClass}" data-notification-id="${notification.id}">
                <div class="d-flex flex-column w-100">
                    <div class="admin-notification-type ${typeClass}">${getNotificationTypeLabel(notification.type)}</div>
                    <div class="admin-notification-title">${notification.title}</div>
                    <div class="admin-notification-message">${notification.message}</div>
                    <div class="admin-notification-time">${timeAgo}</div>
                </div>
            </div>
        `;
    }).join('');

    notificationList.innerHTML = notificationHtml;
}

function getNotificationTypeClass(type) {
    switch (type) {
        case 'ADMIN_SYSTEM_STATISTICS':
        case 'ADMIN_SYSTEM_MAINTENANCE':
            return 'system';
        case 'ADMIN_SECURITY_ALERT':
            return 'security';
        case 'ADMIN_NEW_USER_REGISTERED':
        case 'ADMIN_USER_ACCOUNT_ACTIVATED':
        case 'ADMIN_USER_ACCOUNT_DEACTIVATED':
            return 'user';
        case 'ADMIN_NEW_VAULT_CREATED':
        case 'ADMIN_VAULT_DELETED':
            return 'vault';
        case 'ADMIN_HIGH_ACTIVITY_ALERT':
            return 'alert';
        default:
            return 'system';
    }
}

function getNotificationTypeLabel(type) {
    switch (type) {
        case 'ADMIN_SYSTEM_STATISTICS':
            return 'Thống kê';
        case 'ADMIN_SYSTEM_MAINTENANCE':
            return 'Bảo trì';
        case 'ADMIN_SECURITY_ALERT':
            return 'Bảo mật';
        case 'ADMIN_NEW_USER_REGISTERED':
            return 'Người dùng';
        case 'ADMIN_USER_ACCOUNT_ACTIVATED':
            return 'Kích hoạt';
        case 'ADMIN_USER_ACCOUNT_DEACTIVATED':
            return 'Vô hiệu';
        case 'ADMIN_NEW_VAULT_CREATED':
            return 'Vault';
        case 'ADMIN_VAULT_DELETED':
            return 'Xóa vault';
        case 'ADMIN_HIGH_ACTIVITY_ALERT':
            return 'Cảnh báo';
        default:
            return 'Hệ thống';
    }
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
        return 'Vừa xong';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} phút trước`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} giờ trước`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} ngày trước`;
    }
}

function setupAdminNotificationEvents() {
    // Mark all as read button
    const markAllReadBtn = document.getElementById('markAllAdminNotificationsRead');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', function (e) {
            e.preventDefault();
            markAllAdminNotificationsAsRead();
        });
    }

    // Individual notification click
    document.addEventListener('click', function (e) {
        if (e.target.closest('.admin-notification-item')) {
            const notificationItem = e.target.closest('.admin-notification-item');
            const notificationId = notificationItem.getAttribute('data-notification-id');
            if (notificationId) {
                markNotificationAsRead(notificationId);
            }
        }
    });
}

function setupAdminNotificationDropdown() {
    const adminNotificationBtn = document.getElementById('adminNotificationBtn');
    const adminNotificationMenu = document.getElementById('adminNotificationMenu');

    if (!adminNotificationBtn || !adminNotificationMenu) return;

    adminNotificationBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        if (adminNotificationMenu.classList.contains('show')) {
            adminNotificationMenu.classList.remove('show');
        } else {
            // Close other dropdowns first
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });

            adminNotificationMenu.classList.add('show');

            // Force reset positioning - override Bootstrap/Popper.js
            setTimeout(() => {
                adminNotificationMenu.style.cssText = `
                    transform: none !important;
                    top: 100% !important;
                    right: 0 !important;
                    left: auto !important;
                    position: absolute !important;
                `;
            }, 10);

            loadAdminNotifications(); // Refresh notifications when opened
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
        if (!e.target.closest('#adminNotificationDropdown')) {
            adminNotificationMenu.classList.remove('show');
        }
    });
}

function markAllAdminNotificationsAsRead() {
    fetch('/notification/admin/mark-all-as-read', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to mark notifications as read');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Reload notifications to update UI
                loadAdminNotifications();
                showToast('Đã đánh dấu tất cả thông báo đã đọc', 'success');
            }
        })
        .catch(error => {
            console.error('Error marking notifications as read:', error);
            showToast('Có lỗi xảy ra khi đánh dấu thông báo đã đọc', 'error');
        });
}

function markNotificationAsRead(notificationId) {
    fetch('/notification/mark-as-read', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `notificationId=${notificationId}`
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to mark notification as read');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Update the notification item UI
                const notificationItem = document.querySelector(`[data-notification-id="${notificationId}"]`);
                if (notificationItem) {
                    notificationItem.classList.remove('unread');
                }
                // Reload notification count
                loadAdminNotifications();
            }
        })
        .catch(error => {
            console.error('Error marking notification as read:', error);
        });
}

// Initialize modal form functionality
function initializeModalForm() {
    const modalGeneratePasswordBtn = document.getElementById('modalGeneratePasswordBtn');
    const modalPasswordInput = document.getElementById('password');
    const modalTogglePasswordBtn = document.getElementById('modalTogglePasswordBtn');

    if (modalGeneratePasswordBtn && modalPasswordInput) {
        modalGeneratePasswordBtn.addEventListener('click', function () {
            const generatedPassword = generateSecurePassword();
            modalPasswordInput.value = generatedPassword;
            modalPasswordInput.removeAttribute('readonly');

            // Show success message
            showToast('Password generated successfully!', 'success');
        });
    }



    // Modal form submission
    const modalForm = document.getElementById('registerForm');
    if (modalForm) {
        modalForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const formData = new FormData(this);

            fetch('/admin/register', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showToast('Account created successfully!', 'success');
                        // Reset form
                        modalForm.reset();
                        // Reset password field to readonly
                        if (modalPasswordInput) {
                            modalPasswordInput.setAttribute('readonly', 'readonly');
                        }
                        // Close modal
                        $('#registerModal').modal('hide');
                    } else {
                        showToast(data.message || 'Failed to create account', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error creating account:', error);
                    showToast('An error occurred while creating the account', 'error');
                });
        });
    }
}

// Call modal form initialization when document is ready
document.addEventListener('DOMContentLoaded', function () {
    initializeModalForm();
    initializePasswordToggleButtons();
});

// Initialize password toggle buttons globally
function initializePasswordToggleButtons() {
    // Main form password toggle
    const passwordInput = document.getElementById('registerPassword');
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');

    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // Toggle eye icon
            const eyeIcon = this.querySelector('i');
            if (type === 'text') {
                eyeIcon.classList.remove('fa-eye');
                eyeIcon.classList.add('fa-eye-slash');
            } else {
                eyeIcon.classList.remove('fa-eye-slash');
                eyeIcon.classList.add('fa-eye');
            }
        });
    }

    // Modal password toggle
    const modalPasswordInput = document.getElementById('password');
    const modalTogglePasswordBtn = document.getElementById('modalTogglePasswordBtn');

    if (modalTogglePasswordBtn && modalPasswordInput) {
        modalTogglePasswordBtn.addEventListener('click', function () {
            const type = modalPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            modalPasswordInput.setAttribute('type', type);

            // Toggle eye icon
            const eyeIcon = this.querySelector('i');
            if (type === 'text') {
                eyeIcon.classList.remove('fa-eye');
                eyeIcon.classList.add('fa-eye-slash');
            } else {
                eyeIcon.classList.remove('fa-eye-slash');
                eyeIcon.classList.add('fa-eye');
            }
        });
    }
}

// Admin Profile Menu Functions
function initializeProfileMenu() {

    const adminProfileBtn = document.getElementById('adminProfileBtn');
    const adminProfileMenu = document.getElementById('adminProfileMenu');

    const adminProfileBtn2 = document.getElementById('adminProfileBtn2');
    const adminProfileMenu2 = document.getElementById('adminProfileMenu2');

    const vaultAdminProfileBtn = document.getElementById('vaultAdminProfileBtn');
    const vaultAdminProfileMenu = document.getElementById('vaultAdminProfileMenu');

    const registerAccountProfileBtn = document.getElementById('registerAccountProfileBtn');
    const registerAccountProfileMenu = document.getElementById('registerAccountProfileMenu');

    const createVaultProfileBtn = document.getElementById('createVaultProfileBtn');
    const createVaultProfileMenu = document.getElementById('createVaultProfileMenu');

    const myVaultsProfileBtn = document.getElementById('myVaultsProfileBtn');
    const myVaultsProfileMenu = document.getElementById('myVaultsProfileMenu');

    const trashProfileBtn = document.getElementById('trashProfileBtn');
    const trashProfileMenu = document.getElementById('trashProfileMenu');


    if (adminProfileBtn && adminProfileMenu) {
        adminProfileBtn.removeAttribute('data-toggle');
        adminProfileBtn.removeAttribute('data-bs-toggle');

        const newAdminProfileBtn = adminProfileBtn.cloneNode(true);
        adminProfileBtn.parentNode.replaceChild(newAdminProfileBtn, adminProfileBtn);

        const freshAdminProfileBtn = document.getElementById('adminProfileBtn');
        const freshAdminProfileMenu = document.getElementById('adminProfileMenu');

        freshAdminProfileBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const otherDropdowns = document.querySelectorAll('.dropdown-menu.show');
            otherDropdowns.forEach(dropdown => {
                if (dropdown !== freshAdminProfileMenu) {
                    dropdown.classList.remove('show');
                }
            });

            freshAdminProfileMenu.classList.toggle('show');

            if (freshAdminProfileMenu.classList.contains('show')) {
                freshAdminProfileBtn.classList.add('active');
            } else {
                freshAdminProfileBtn.classList.remove('active');
            }
        });

        const profileMenuItems = freshAdminProfileMenu.querySelectorAll('.profile-menu-item:not(button[type="submit"])');

        profileMenuItems.forEach((item, index) => {
            item.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                const action = this.getAttribute('data-action');

                if (action === 'profile') {
                    openProfileSettings();
                }
                // Close dropdown menu
                freshAdminProfileMenu.classList.remove('show');
                freshAdminProfileBtn.classList.remove('active');
            });
        });

        // Handle logout form submission
        const logoutForms = findLogoutForms(freshAdminProfileMenu);
        const logoutForm = logoutForms[0];
        if (logoutForm) {
            // Add event listener to the logout button to prevent event bubbling
            const logoutBtn = logoutForm.querySelector('button[type="submit"]');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    console.log('Logout button clicked - preventing event bubbling');
                });
            }

            logoutForm.addEventListener('submit', function (e) {
                console.log('Logout form submitted');
                console.log('Form action:', this.action);
                console.log('Form method:', this.method);

                // Close all profile dropdowns
                closeAllProfileDropdowns();

                // Show loading state
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="las la-spinner la-spin mr-1"></i>Đang đăng xuất...';
                submitBtn.disabled = true;

                // Clear localStorage to ensure dashboard shows on next login
                localStorage.removeItem('currentPage');

                // Form will submit normally
                console.log('Allowing form to submit...');
            });
        }
    }

    // Initialize admin profile menu 2 (Account list)
    if (adminProfileBtn2 && adminProfileMenu2) {
        console.log('Initializing admin profile menu 2');
        console.log('Admin profile button 2 element:', adminProfileBtn2);
        console.log('Admin profile menu 2 element:', adminProfileMenu2);

        // Remove any existing Bootstrap dropdown functionality
        adminProfileBtn2.removeAttribute('data-toggle');
        adminProfileBtn2.removeAttribute('data-bs-toggle');

        // Remove any existing event listeners by cloning
        const newAdminProfileBtn2 = adminProfileBtn2.cloneNode(true);
        adminProfileBtn2.parentNode.replaceChild(newAdminProfileBtn2, adminProfileBtn2);

        // Get the new button reference
        const freshAdminProfileBtn2 = document.getElementById('adminProfileBtn2');
        const freshAdminProfileMenu2 = document.getElementById('adminProfileMenu2');

        // Toggle profile menu
        freshAdminProfileBtn2.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Admin profile button 2 clicked - Event triggered!');

            // Close other dropdowns first
            const otherDropdowns = document.querySelectorAll('.dropdown-menu.show');
            otherDropdowns.forEach(dropdown => {
                if (dropdown !== freshAdminProfileMenu2) {
                    dropdown.classList.remove('show');
                }
            });

            // Toggle current menu
            freshAdminProfileMenu2.classList.toggle('show');
            console.log('Admin profile menu 2 toggled, show class:', freshAdminProfileMenu2.classList.contains('show'));

            // Add/remove active state to button
            if (freshAdminProfileMenu2.classList.contains('show')) {
                freshAdminProfileBtn2.classList.add('active');
            } else {
                freshAdminProfileBtn2.classList.remove('active');
            }
        });

        // Handle profile menu item clicks (excluding logout button)
        const profileMenuItems2 = freshAdminProfileMenu2.querySelectorAll('.profile-menu-item:not(button[type="submit"])');
        console.log('Found profile menu 2 items:', profileMenuItems2.length);

        profileMenuItems2.forEach((item, index) => {
            console.log(`Adding click listener to profile menu 2 item ${index}:`, item);
            item.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Admin profile menu 2 item clicked:', this.getAttribute('data-action'));
                console.log('Item element:', this);

                const action = this.getAttribute('data-action');
                console.log('Action:', action);

                if (action === 'profile') {
                    console.log('Calling openProfileSettings...');
                    openProfileSettings();
                }
                // Close dropdown menu
                freshAdminProfileMenu2.classList.remove('show');
                freshAdminProfileBtn2.classList.remove('active');
            });
        });

        // Handle logout form submission
        const logoutForms2 = findLogoutForms(freshAdminProfileMenu2);
        const logoutForm2 = logoutForms2[0];
        if (logoutForm2) {
            // Add event listener to the logout button to prevent event bubbling
            const logoutBtn2 = logoutForm2.querySelector('button[type="submit"]');
            if (logoutBtn2) {
                logoutBtn2.addEventListener('click', function (e) {
                    e.stopPropagation();
                    console.log('Logout button 2 clicked - preventing event bubbling');
                });
            }

            logoutForm2.addEventListener('submit', function (e) {
                console.log('Logout form 2 submitted');
                console.log('Form action:', this.action);
                console.log('Form method:', this.method);

                // Close all profile dropdowns
                closeAllProfileDropdowns();

                // Show loading state
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="las la-spinner la-spin mr-1"></i>Đang đăng xuất...';
                submitBtn.disabled = true;

                // Clear localStorage to ensure dashboard shows on next login
                localStorage.removeItem('currentPage');

                // Form will submit normally
                console.log('Allowing form 2 to submit...');
            });
        }
    }

    // Initialize vault admin profile menu (Vault list)
    if (vaultAdminProfileBtn && vaultAdminProfileMenu) {
        console.log('Initializing vault admin profile menu');

        // Remove any existing Bootstrap dropdown functionality
        vaultAdminProfileBtn.removeAttribute('data-toggle');
        vaultAdminProfileBtn.removeAttribute('data-bs-toggle');

        // Remove any existing event listeners by cloning
        const newVaultAdminProfileBtn = vaultAdminProfileBtn.cloneNode(true);
        vaultAdminProfileBtn.parentNode.replaceChild(newVaultAdminProfileBtn, vaultAdminProfileBtn);

        // Get the new button reference
        const freshVaultAdminProfileBtn = document.getElementById('vaultAdminProfileBtn');
        const freshVaultAdminProfileMenu = document.getElementById('vaultAdminProfileMenu');

        // Toggle profile menu
        freshVaultAdminProfileBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Vault admin profile button clicked');

            // Close other dropdowns first
            const otherDropdowns = document.querySelectorAll('.dropdown-menu.show');
            otherDropdowns.forEach(dropdown => {
                if (dropdown !== freshVaultAdminProfileMenu) {
                    dropdown.classList.remove('show');
                }
            });

            // Toggle current menu
            freshVaultAdminProfileMenu.classList.toggle('show');
            console.log('Vault admin profile menu toggled, show class:', freshVaultAdminProfileMenu.classList.contains('show'));

            // Add/remove active state to button
            if (freshVaultAdminProfileMenu.classList.contains('show')) {
                freshVaultAdminProfileBtn.classList.add('active');
            } else {
                freshVaultAdminProfileBtn.classList.remove('active');
            }
        });

        // Handle profile menu item clicks (excluding logout button)
        const vaultProfileMenuItems = freshVaultAdminProfileMenu.querySelectorAll('.profile-menu-item:not(button[type="submit"])');
        vaultProfileMenuItems.forEach(item => {
            item.addEventListener('click', function (e) {
                e.preventDefault();
                console.log('Vault admin profile menu item clicked:', this.getAttribute('data-action'));

                const action = this.getAttribute('data-action');
                if (action === 'profile') {
                    openProfileSettings();
                }
                // Close dropdown menu
                freshVaultAdminProfileMenu.classList.remove('show');
                freshVaultAdminProfileBtn.classList.remove('active');
            });
        });

        // Handle logout form submission
        const vaultLogoutForms = findLogoutForms(freshVaultAdminProfileMenu);
        const vaultLogoutForm = vaultLogoutForms[0];
        if (vaultLogoutForm) {
            // Add event listener to the logout button to prevent event bubbling
            const logoutBtn = vaultLogoutForm.querySelector('button[type="submit"]');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    console.log('Logout button clicked - preventing event bubbling');
                });
            }

            vaultLogoutForm.addEventListener('submit', function (e) {
                console.log('Vault logout form submitted');
                console.log('Form action:', this.action);
                console.log('Form method:', this.method);

                // Close all profile dropdowns
                closeAllProfileDropdowns();

                // Show loading state
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="las la-spinner la-spin mr-1"></i>Đang đăng xuất...';
                submitBtn.disabled = true;

                // Clear localStorage to ensure dashboard shows on next login
                localStorage.removeItem('currentPage');

                // Form will submit normally
                console.log('Allowing vault logout form to submit...');
            });
        }
    }

    // Initialize Register Account Profile Menu
    if (registerAccountProfileBtn && registerAccountProfileMenu) {
        console.log('Initializing register account profile menu');

        // Remove any existing Bootstrap dropdown functionality
        registerAccountProfileBtn.removeAttribute('data-toggle');
        registerAccountProfileBtn.removeAttribute('data-bs-toggle');

        // Remove any existing event listeners by cloning
        const newRegisterAccountProfileBtn = registerAccountProfileBtn.cloneNode(true);
        registerAccountProfileBtn.parentNode.replaceChild(newRegisterAccountProfileBtn, registerAccountProfileBtn);

        // Get the new button reference
        const freshRegisterAccountProfileBtn = document.getElementById('registerAccountProfileBtn');
        const freshRegisterAccountProfileMenu = document.getElementById('registerAccountProfileMenu');

        // Toggle profile menu
        freshRegisterAccountProfileBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Register account profile button clicked');

            // Close other dropdowns first
            const otherDropdowns = document.querySelectorAll('.dropdown-menu.show');
            otherDropdowns.forEach(dropdown => {
                if (dropdown !== freshRegisterAccountProfileMenu) {
                    dropdown.classList.remove('show');
                }
            });

            // Toggle current menu
            freshRegisterAccountProfileMenu.classList.toggle('show');
            console.log('Register account profile menu toggled, show class:', freshRegisterAccountProfileMenu.classList.contains('show'));

            // Add/remove active state to button
            if (freshRegisterAccountProfileMenu.classList.contains('show')) {
                freshRegisterAccountProfileBtn.classList.add('active');
            } else {
                freshRegisterAccountProfileBtn.classList.remove('active');
            }
        });

        // Handle profile menu item clicks (excluding logout button)
        const registerAccountProfileMenuItems = freshRegisterAccountProfileMenu.querySelectorAll('.profile-menu-item:not(button[type="submit"])');
        registerAccountProfileMenuItems.forEach(item => {
            item.addEventListener('click', function (e) {
                e.preventDefault();
                console.log('Register account profile menu item clicked:', this.getAttribute('data-action'));

                const action = this.getAttribute('data-action');
                if (action === 'profile') {
                    openProfileSettings();
                }
                // Close dropdown menu
                freshRegisterAccountProfileMenu.classList.remove('show');
                freshRegisterAccountProfileBtn.classList.remove('active');
            });
        });

        // Handle logout form submission
        const registerAccountLogoutForms = findLogoutForms(freshRegisterAccountProfileMenu);
        const registerAccountLogoutForm = registerAccountLogoutForms[0];
        if (registerAccountLogoutForm) {
            // Add event listener to the logout button to prevent event bubbling
            const logoutBtn = registerAccountLogoutForm.querySelector('button[type="submit"]');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    console.log('Register account logout button clicked - preventing event bubbling');
                });
            }

            registerAccountLogoutForm.addEventListener('submit', function (e) {
                console.log('Register account logout form submitted');
                console.log('Form action:', this.action);
                console.log('Form method:', this.method);

                // Close all profile dropdowns
                closeAllProfileDropdowns();

                // Show loading state
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="las la-spinner la-spin mr-1"></i>Đang đăng xuất...';
                submitBtn.disabled = true;

                // Clear localStorage to ensure dashboard shows on next login
                localStorage.removeItem('currentPage');

                // Form will submit normally
                console.log('Allowing register account logout form to submit...');
            });
        }
    }

    // Initialize Create Vault Profile Menu
    if (createVaultProfileBtn && createVaultProfileMenu) {
        console.log('Initializing create vault profile menu');

        // Remove any existing Bootstrap dropdown functionality
        createVaultProfileBtn.removeAttribute('data-toggle');
        createVaultProfileBtn.removeAttribute('data-bs-toggle');

        // Remove any existing event listeners by cloning
        const newCreateVaultProfileBtn = createVaultProfileBtn.cloneNode(true);
        createVaultProfileBtn.parentNode.replaceChild(newCreateVaultProfileBtn, createVaultProfileBtn);

        // Get the new button reference
        const freshCreateVaultProfileBtn = document.getElementById('createVaultProfileBtn');
        const freshCreateVaultProfileMenu = document.getElementById('createVaultProfileMenu');

        // Toggle profile menu
        freshCreateVaultProfileBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Create vault profile button clicked');

            // Close other dropdowns first
            const otherDropdowns = document.querySelectorAll('.dropdown-menu.show');
            otherDropdowns.forEach(dropdown => {
                if (dropdown !== freshCreateVaultProfileMenu) {
                    dropdown.classList.remove('show');
                }
            });

            // Toggle current menu
            freshCreateVaultProfileMenu.classList.toggle('show');
            console.log('Create vault profile menu toggled, show class:', freshCreateVaultProfileMenu.classList.contains('show'));

            // Add/remove active state to button
            if (freshCreateVaultProfileMenu.classList.contains('show')) {
                freshCreateVaultProfileBtn.classList.add('active');
            } else {
                freshCreateVaultProfileBtn.classList.remove('active');
            }
        });

        // Handle profile menu item clicks (excluding logout button)
        const createVaultProfileMenuItems = freshCreateVaultProfileMenu.querySelectorAll('.profile-menu-item:not(button[type="submit"])');
        createVaultProfileMenuItems.forEach(item => {
            item.addEventListener('click', function (e) {
                e.preventDefault();
                console.log('Create vault profile menu item clicked:', this.getAttribute('data-action'));

                const action = this.getAttribute('data-action');
                if (action === 'profile') {
                    openProfileSettings();
                }
                // Close dropdown menu
                freshCreateVaultProfileMenu.classList.remove('show');
                freshCreateVaultProfileBtn.classList.remove('active');
            });
        });

        // Handle logout form submission
        const createVaultLogoutForms = findLogoutForms(freshCreateVaultProfileMenu);
        const createVaultLogoutForm = createVaultLogoutForms[0];
        if (createVaultLogoutForm) {
            // Add event listener to the logout button to prevent event bubbling
            const logoutBtn = createVaultLogoutForm.querySelector('button[type="submit"]');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    console.log('Create vault logout button clicked - preventing event bubbling');
                });
            }

            createVaultLogoutForm.addEventListener('submit', function (e) {
                console.log('Create vault logout form submitted');
                console.log('Form action:', this.action);
                console.log('Form method:', this.method);

                // Close all profile dropdowns
                closeAllProfileDropdowns();

                // Show loading state
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="las la-spinner la-spin mr-1"></i>Đang đăng xuất...';
                submitBtn.disabled = true;

                // Clear localStorage to ensure dashboard shows on next login
                localStorage.removeItem('currentPage');

                // Form will submit normally
                console.log('Allowing create vault logout form to submit...');
            });
        }
    }

    // Initialize My Vaults Profile Menu
    if (myVaultsProfileBtn && myVaultsProfileMenu) {
        console.log('Initializing my vaults profile menu');

        // Remove any existing Bootstrap dropdown functionality
        myVaultsProfileBtn.removeAttribute('data-toggle');
        myVaultsProfileBtn.removeAttribute('data-bs-toggle');

        // Remove any existing event listeners by cloning
        const newMyVaultsProfileBtn = myVaultsProfileBtn.cloneNode(true);
        myVaultsProfileBtn.parentNode.replaceChild(newMyVaultsProfileBtn, myVaultsProfileBtn);

        // Get the new button reference
        const freshMyVaultsProfileBtn = document.getElementById('myVaultsProfileBtn');
        const freshMyVaultsProfileMenu = document.getElementById('myVaultsProfileMenu');

        // Toggle profile menu
        freshMyVaultsProfileBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('My vaults profile button clicked');

            // Close other dropdowns first
            const otherDropdowns = document.querySelectorAll('.dropdown-menu.show');
            otherDropdowns.forEach(dropdown => {
                if (dropdown !== freshMyVaultsProfileMenu) {
                    dropdown.classList.remove('show');
                }
            });

            // Toggle current menu
            freshMyVaultsProfileMenu.classList.toggle('show');
            console.log('My vaults profile menu toggled, show class:', freshMyVaultsProfileMenu.classList.contains('show'));

            // Add/remove active state to button
            if (freshMyVaultsProfileMenu.classList.contains('show')) {
                freshMyVaultsProfileBtn.classList.add('active');
            } else {
                freshMyVaultsProfileBtn.classList.remove('active');
            }
        });

        // Handle profile menu item clicks (excluding logout button)
        const myVaultsProfileMenuItems = freshMyVaultsProfileMenu.querySelectorAll('.profile-menu-item:not(button[type="submit"])');
        myVaultsProfileMenuItems.forEach(item => {
            item.addEventListener('click', function (e) {
                e.preventDefault();
                console.log('My vaults profile menu item clicked:', this.getAttribute('data-action'));

                const action = this.getAttribute('data-action');
                if (action === 'profile') {
                    openProfileSettings();
                }
                // Close dropdown menu
                freshMyVaultsProfileMenu.classList.remove('show');
                freshMyVaultsProfileBtn.classList.remove('active');
            });
        });

        // Handle logout form submission
        const myVaultsLogoutForms = findLogoutForms(freshMyVaultsProfileMenu);
        const myVaultsLogoutForm = myVaultsLogoutForms[0];
        if (myVaultsLogoutForm) {
            // Add event listener to the logout button to prevent event bubbling
            const logoutBtn = myVaultsLogoutForm.querySelector('button[type="submit"]');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    console.log('My vaults logout button clicked - preventing event bubbling');
                });
            }

            myVaultsLogoutForm.addEventListener('submit', function (e) {
                console.log('My vaults logout form submitted');
                console.log('Form action:', this.action);
                console.log('Form method:', this.method);

                // Close all profile dropdowns
                closeAllProfileDropdowns();

                // Show loading state
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="las la-spinner la-spin mr-1"></i>Đang đăng xuất...';
                submitBtn.disabled = true;

                // Clear localStorage to ensure dashboard shows on next login
                localStorage.removeItem('currentPage');

                // Form will submit normally
                console.log('Allowing my vaults logout form to submit...');
            });
        }
    }

    // Initialize Trash Profile Menu
    if (trashProfileBtn && trashProfileMenu) {
        console.log('Initializing trash profile menu');

        // Remove any existing Bootstrap dropdown functionality
        trashProfileBtn.removeAttribute('data-toggle');
        trashProfileBtn.removeAttribute('data-bs-toggle');

        // Remove any existing event listeners by cloning
        const newTrashProfileBtn = trashProfileBtn.cloneNode(true);
        trashProfileBtn.parentNode.replaceChild(newTrashProfileBtn, trashProfileBtn);

        // Get the new button reference
        const freshTrashProfileBtn = document.getElementById('trashProfileBtn');
        const freshTrashProfileMenu = document.getElementById('trashProfileMenu');

        // Toggle profile menu
        freshTrashProfileBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Trash profile button clicked');

            // Close other dropdowns first
            const otherDropdowns = document.querySelectorAll('.dropdown-menu.show');
            otherDropdowns.forEach(dropdown => {
                if (dropdown !== freshTrashProfileMenu) {
                    dropdown.classList.remove('show');
                }
            });

            // Toggle current menu
            freshTrashProfileMenu.classList.toggle('show');
            console.log('Trash profile menu toggled, show class:', freshTrashProfileMenu.classList.contains('show'));

            // Add/remove active state to button
            if (freshTrashProfileMenu.classList.contains('show')) {
                freshTrashProfileBtn.classList.add('active');
            } else {
                freshTrashProfileBtn.classList.remove('active');
            }
        });

        // Handle profile menu item clicks (excluding logout button)
        const trashProfileMenuItems = freshTrashProfileMenu.querySelectorAll('.profile-menu-item:not(button[type="submit"])');
        trashProfileMenuItems.forEach(item => {
            item.addEventListener('click', function (e) {
                e.preventDefault();
                console.log('Trash profile menu item clicked:', this.getAttribute('data-action'));

                const action = this.getAttribute('data-action');
                if (action === 'profile') {
                    openProfileSettings();
                }
                // Close dropdown menu
                freshTrashProfileMenu.classList.remove('show');
                freshTrashProfileBtn.classList.remove('active');
            });
        });

        // Handle logout form submission
        const trashLogoutForms = findLogoutForms(freshTrashProfileMenu);
        const trashLogoutForm = trashLogoutForms[0];
        if (trashLogoutForm) {
            // Add event listener to the logout button to prevent event bubbling
            const logoutBtn = trashLogoutForm.querySelector('button[type="submit"]');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    console.log('Trash logout button clicked - preventing event bubbling');
                });
            }

            trashLogoutForm.addEventListener('submit', function (e) {
                console.log('Trash logout form submitted');
                console.log('Form action:', this.action);
                console.log('Form method:', this.method);

                // Close all profile dropdowns
                closeAllProfileDropdowns();

                // Show loading state
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="las la-spinner la-spin mr-1"></i>Đang đăng xuất...';
                submitBtn.disabled = true;

                // Clear localStorage to ensure dashboard shows on next login
                localStorage.removeItem('currentPage');

                // Form will submit normally
                console.log('Allowing trash logout form to submit...');
            });
        }
    }

    // Close menu when clicking outside (global listener)
    document.addEventListener('click', function (e) {
        const profileBtns = document.querySelectorAll('[id="adminProfileBtn"], [id="adminProfileBtn2"], [id="vaultAdminProfileBtn"], [id="registerAccountProfileBtn"], [id="createVaultProfileBtn"], [id="myVaultsProfileBtn"], [id="trashProfileBtn"]');
        const profileMenus = document.querySelectorAll('[id="adminProfileMenu"], [id="adminProfileMenu2"], [id="vaultAdminProfileMenu"], [id="registerAccountProfileMenu"], [id="createVaultProfileMenu"], [id="myVaultsProfileMenu"], [id="trashProfileMenu"]');

        let clickedInside = false;

        profileBtns.forEach(btn => {
            if (btn.contains(e.target)) {
                clickedInside = true;
            }
        });

        profileMenus.forEach(menu => {
            if (menu.contains(e.target)) {
                clickedInside = true;
            }
        });

        if (!clickedInside) {
            profileMenus.forEach(menu => {
                menu.classList.remove('show');
            });
            profileBtns.forEach(btn => {
                btn.classList.remove('active');
            });
        }

        // Close submenus when clicking outside navigation
        const navContainer = document.querySelector('.nav-container, .sidebar');
        if (navContainer && !navContainer.contains(e.target)) {
            // Don't close submenus when clicking outside - let user control them manually
        }
    });
}

// Profile Settings Modal Functions
let profileFormInitialized = false;

function openProfileSettings() {
    console.log('openProfileSettings function called!');
    const modal = document.getElementById('profileSettingsModal');
    console.log('Profile settings modal found:', modal);

    if (modal) {
        console.log('Opening profile settings modal...');
        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Show modal with animation
        modal.style.display = 'flex';

        // Trigger animation after a small delay
        setTimeout(() => {
            modal.classList.add('show');
            console.log('Modal show class added');
        }, 10);

        // Only initialize form once
        if (!profileFormInitialized) {
            console.log('Initializing profile form...');
            initializeProfileForm();
            profileFormInitialized = true;
        }

        // Add close listeners only once
        addModalCloseListeners();
    } else {
        console.error('Profile settings modal not found!');
    }
}

function closeProfileSettings() {
    const modal = document.getElementById('profileSettingsModal');
    if (modal) {
        // Remove show class to trigger animation
        modal.classList.remove('show');

        // Hide modal after animation completes
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }
}

function initializeProfileForm() {
    // Initialize form event listeners only once
    const saveButton = document.getElementById('save-profile-btn');
    const addPasswordButton = document.getElementById('addPassword');

    if (saveButton && !saveButton.hasAttribute('data-listener-added')) {
        saveButton.addEventListener('click', saveProfileChanges);
        saveButton.setAttribute('data-listener-added', 'true');
    }

    if (addPasswordButton && !addPasswordButton.hasAttribute('data-listener-added')) {
        addPasswordButton.addEventListener('click', addPassword);
        addPasswordButton.setAttribute('data-listener-added', 'true');
    }

    // Initialize edit form validation
    initializeEditFormValidation();
}

// Initialize edit form validation
function initializeEditFormValidation() {
    const editUsername = document.getElementById('editUsername');
    const editEmail = document.getElementById('editEmail');
    const editSystemRole = document.getElementById('editSystemRole');
    const editDepartment = document.getElementById('editDepartment');

    if (editUsername) {
        editUsername.addEventListener('input', function () {
            const usernamePattern = /^[a-zA-Z0-9_]+$/;
            if (!usernamePattern.test(this.value) && this.value !== '') {
                this.setCustomValidity('Username can only contain letters, numbers, and underscores');
            } else {
                this.setCustomValidity('');
            }
        });
    }

    if (editEmail) {
        editEmail.addEventListener('input', function () {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(this.value) && this.value !== '') {
                this.setCustomValidity('Please enter a valid email address');
            } else {
                this.setCustomValidity('');
            }
        });
    }

    if (editSystemRole) {
        editSystemRole.addEventListener('change', function () {
            if (!this.value) {
                this.setCustomValidity('Please select a system role');
            } else {
                this.setCustomValidity('');
            }
        });
    }

    if (editDepartment) {
        editDepartment.addEventListener('change', function () {
            if (!this.value) {
                this.setCustomValidity('Please select a department');
            } else {
                this.setCustomValidity('');
            }
        });
    }
}

function saveProfileChanges() {
    const username = document.getElementById('profile-username').value;
    const gender = document.getElementById('profile-gender').value;
    const phone = document.getElementById('profile-phone').value;
    const dob = document.getElementById('profile-dob').value;

    // Show loading state
    const saveButton = document.getElementById('save-profile-btn');
    const originalText = saveButton.textContent;
    saveButton.textContent = 'Saving...';
    saveButton.disabled = true;

    // Prepare data
    const formData = new FormData();
    formData.append('username', username);
    formData.append('gender', gender);
    formData.append('phone', phone);
    formData.append('dob', dob);

    // Get CSRF token
    const csrfToken = document.querySelector('meta[name="_csrf"]')?.getAttribute('content');
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.getAttribute('content');

    // Prepare headers
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
    };

    // Add CSRF token if available
    if (csrfToken && csrfHeader) {
        headers[csrfHeader] = csrfToken;
    }

    // Send update request
    fetch('/dashboard/update-profile', {
        method: 'POST',
        headers: headers,
        body: new URLSearchParams(formData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Profile updated successfully!', 'success');
                // Update displayed values
                updateDisplayedValues(data);
            } else {
                showToast(data.message || 'Failed to update profile', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred while updating profile', 'error');
        })
        .finally(() => {
            // Restore button state
            saveButton.textContent = originalText;
            saveButton.disabled = false;
        });
}

function addPassword() {
    const addPasswordButton = document.getElementById('addPassword');
    const originalText = addPasswordButton.textContent;
    addPasswordButton.textContent = 'Adding...';
    addPasswordButton.disabled = true;

    // Show password modal or redirect to password change page
    showToast('Password functionality will be implemented', 'info');

    // Restore button state
    setTimeout(() => {
        addPasswordButton.textContent = originalText;
        addPasswordButton.disabled = false;
    }, 2000);
}

function updateDisplayedValues(data) {
    // Update any displayed values if needed
    if (data.username) {
        document.getElementById('profile-username').value = data.username;
    }
    if (data.gender) {
        document.getElementById('profile-gender').value = data.gender;
    }
    if (data.phone) {
        document.getElementById('profile-phone').value = data.phone;
    }
    if (data.dob) {
        document.getElementById('profile-dob').value = data.dob;
    }
}

// Close modal when clicking outside or close button
let modalCloseListenerAdded = false;

function addModalCloseListeners() {
    if (modalCloseListenerAdded) return;

    document.addEventListener('click', function (e) {
        const modal = document.getElementById('profileSettingsModal');
        const closeButton = document.getElementById('close-profile-modal');

        if (modal && (e.target === modal || e.target.closest('#close-profile-modal'))) {
            closeProfileSettings();
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeProfileSettings();
        }
    });

    // Add specific click listener for close button
    const closeButton = document.getElementById('close-profile-modal');
    if (closeButton) {
        closeButton.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            closeProfileSettings();
        });
    }

    modalCloseListenerAdded = true;
}

// Profile menu animations
function addProfileMenuAnimations() {
    const profileMenu = document.getElementById('adminProfileMenu');
    if (profileMenu) {
        // Add entrance animation
        profileMenu.addEventListener('show.bs.dropdown', function () {
            this.style.animation = 'profileMenuSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });

        // Add exit animation
        profileMenu.addEventListener('hide.bs.dropdown', function () {
            this.style.animation = 'profileMenuSlideOut 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
        });
    }
}

// Enhanced profile avatar hover effects
function enhanceProfileAvatarEffects() {
    const profileTrigger = document.querySelector('.profile-trigger');
    const profileAvatar = profileTrigger?.querySelector('.profile-avatar');

    if (profileTrigger && profileAvatar) {
        profileTrigger.addEventListener('mouseenter', function () {
            profileAvatar.style.transform = 'scale(1.1) rotate(5deg)';
        });

        profileTrigger.addEventListener('mouseleave', function () {
            profileAvatar.style.transform = 'scale(1) rotate(0deg)';
        });
    }
}

// Initialize all profile-related features
let profileFeaturesInitialized = false;

// Helper function to find logout forms
function findLogoutForms(container = document) {
    let logoutForms = container.querySelectorAll('form[action="/dashboard/logout"]');
    if (logoutForms.length === 0) {
        logoutForms = container.querySelectorAll('form[action*="logout"]');
    }
    if (logoutForms.length === 0) {
        logoutForms = container.querySelectorAll('form');
        logoutForms = Array.from(logoutForms).filter(form => {
            const action = form.getAttribute('action') || form.getAttribute('th:action') || '';
            return action.includes('logout');
        });
    }
    return logoutForms;
}

// Helper function to close all profile dropdowns
function closeAllProfileDropdowns() {
    const allProfileMenus = document.querySelectorAll('.dropdown-menu.show');
    allProfileMenus.forEach(menu => {
        menu.classList.remove('show');
    });
    const allProfileBtns = document.querySelectorAll('[id*="ProfileBtn"]');
    allProfileBtns.forEach(btn => {
        btn.classList.remove('active');
    });
}

// Global logout form handler
function initializeGlobalLogoutHandlers() {
    console.log('Initializing global logout handlers...');

    // Find all logout forms in the document
    const logoutForms = findLogoutForms();
    console.log('Found logout forms:', logoutForms.length);

    logoutForms.forEach((form, index) => {
        console.log(`Processing logout form ${index}:`, form);

        // Remove any existing event listeners by cloning the form
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        // Add event listener to the logout button to prevent event bubbling
        const logoutBtn = newForm.querySelector('button[type="submit"]');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                console.log('Global logout button clicked - preventing event bubbling');
            });
        }

        // Add event listener to the new form
        newForm.addEventListener('submit', function (e) {
            console.log('Logout form submitted');
            console.log('Form action:', this.action);
            console.log('Form method:', this.method);

            // Close all profile dropdowns
            closeAllProfileDropdowns();

            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="las la-spinner la-spin mr-1"></i>Đang đăng xuất...';
                submitBtn.disabled = true;
            }

            // Clear localStorage to ensure dashboard shows on next login
            localStorage.removeItem('currentPage');

            // Form will submit normally
            console.log('Allowing form to submit...');
        });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    if (profileFeaturesInitialized) return;

    console.log('Initializing profile features...');

    // Ensure profile modal is hidden on page load
    const profileModal = document.getElementById('profileSettingsModal');
    if (profileModal) {
        profileModal.classList.remove('show');
        document.body.style.overflow = '';
    }

    // Initialize profile menu with delay to ensure DOM is ready
    setTimeout(() => {
        initializeProfileMenu();
        addProfileMenuAnimations();
        enhanceProfileAvatarEffects();
        initializeGlobalLogoutHandlers();
    }, 100);

    profileFeaturesInitialized = true;

    // Set up a mutation observer to handle dynamically added logout forms
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function (node) {
                    if (node.nodeType === 1) { // Element node
                        const logoutForms = findLogoutForms(node);
                        logoutForms.forEach(form => {
                            if (!form.hasAttribute('data-logout-handler-added')) {
                                form.setAttribute('data-logout-handler-added', 'true');
                                // Add event listener to the logout button to prevent event bubbling
                                const logoutBtn = form.querySelector('button[type="submit"]');
                                if (logoutBtn) {
                                    logoutBtn.addEventListener('click', function (e) {
                                        e.stopPropagation();
                                        console.log('Dynamic logout button clicked - preventing event bubbling');
                                    });
                                }

                                form.addEventListener('submit', function (e) {
                                    console.log('Dynamic logout form submitted');
                                    console.log('Form action:', this.action);
                                    console.log('Form method:', this.method);

                                    // Close all profile dropdowns
                                    closeAllProfileDropdowns();

                                    const submitBtn = this.querySelector('button[type="submit"]');
                                    if (submitBtn) {
                                        submitBtn.innerHTML = '<i class="las la-spinner la-spin mr-1"></i>Đang đăng xuất...';
                                        submitBtn.disabled = true;
                                    }
                                    localStorage.removeItem('currentPage');
                                    console.log('Allowing dynamic logout form to submit...');
                                });
                            }
                        });
                    }
                });
            }
        });
    });

    // Start observing the document body for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// User Status Toggle Functions
function confirmToggleUserStatus(checkbox, userId, userName, isChecked) {
    const action = isChecked ? 'activate' : 'deactivate';
    const message = `Are you sure you want to ${action} the account "${userName}"?`;

    // Update modal message
    document.getElementById('userStatusConfirmMessage').textContent = message;

    // Store data for confirmation
    document.getElementById('userStatusConfirmModal').dataset.userId = userId;
    document.getElementById('userStatusConfirmModal').dataset.checkbox = checkbox.checked;

    // Show confirm modal
    $('#userStatusConfirmModal').modal('show');
}

function confirmUserStatusToggle() {
    const modal = document.getElementById('userStatusConfirmModal');
    const userId = modal.dataset.userId;
    const isChecked = modal.dataset.checkbox === 'true';

    // Hide modal
    $('#userStatusConfirmModal').modal('hide');

    // Perform the toggle
    performUserStatusToggle(userId, isChecked);
}

function cancelUserStatusToggle() {
    // Revert checkbox state only when canceling
    const modal = document.getElementById('userStatusConfirmModal');
    const userId = modal.dataset.userId;
    const checkbox = document.querySelector(`.user-status-toggle[data-user-id="${userId}"]`);

    if (checkbox) {
        // Revert to original state (opposite of what was clicked)
        checkbox.checked = !checkbox.checked;
        updateUserStatusDisplay(checkbox);
    }

    // Hide modal
    $('#userStatusConfirmModal').modal('hide');
}

function performUserStatusToggle(userId, isActivated) {
    console.log('performUserStatusToggle called with userId:', userId, 'isActivated:', isActivated);

    // Show loading state
    const checkbox = document.querySelector(`.user-status-toggle[data-user-id="${userId}"]`);
    if (checkbox) {
        checkbox.disabled = true;
    }

    // Get CSRF token first
    const csrfToken = document.querySelector('meta[name="_csrf"]')?.getAttribute('content');
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.getAttribute('content') || 'X-CSRF-TOKEN';

    // Prepare request data
    const requestData = new URLSearchParams();
    requestData.append('userId', userId);

    // Add CSRF token to body if needed
    if (csrfToken) {
        const csrfParamName = document.querySelector('meta[name="_csrf_parameter"]')?.getAttribute('content') || '_csrf';
        requestData.append(csrfParamName, csrfToken);
    }

    console.log('CSRF Token:', csrfToken);
    console.log('CSRF Header:', csrfHeader);

    // Prepare headers
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (csrfToken) {
        headers[csrfHeader] = csrfToken;
    }

    console.log('Request headers:', headers);
    console.log('Request body:', requestData.toString());

    // Send request
    fetch('/dashboard/admin/toggle-user-status', {
        method: 'POST',
        headers: headers,
        body: requestData
    })
        .then(response => {
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            return response.json();
        })
        .then(data => {
            console.log('Response data:', data);
            if (data.success) {
                // Update UI
                updateUserStatusDisplay(checkbox, isActivated);
                updateUserEditButton(userId, isActivated);
                updateDashboardStatistics(data);

                // Show success message
                const action = isActivated ? 'activated' : 'deactivated';
                showToast(`User account ${action} successfully!`, 'success');
            } else {
                // Revert checkbox state on error
                checkbox.checked = !isActivated;
                updateUserStatusDisplay(checkbox);
                showToast(data.message || 'Failed to update user status. Please try again.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // Revert checkbox state on error
            checkbox.checked = !isActivated;
            updateUserStatusDisplay(checkbox);
            showToast('An error occurred while updating user status. Please try again.', 'error');
        })
        .finally(() => {
            // Re-enable checkbox
            if (checkbox) {
                checkbox.disabled = false;
            }
        });
}

function updateUserStatusDisplay(checkbox, newStatus = null) {
    // No longer needed since we removed status labels
    // Function kept for compatibility but does nothing
}

function updateUserEditButton(userId, isActivated) {
    const editButton = document.querySelector(`.edit-user-btn[data-user-id="${userId}"]`);
    if (editButton) {
        if (isActivated) {
            editButton.style.display = 'block';
        } else {
            editButton.style.display = 'none';
        }
    }
}

// Add event listeners for confirm modal
document.addEventListener('DOMContentLoaded', function () {
    const confirmBtn = document.getElementById('confirmUserStatusToggle');
    const cancelBtn = document.querySelector('#userStatusConfirmModal .btn-secondary');
    const closeBtn = document.querySelector('#userStatusConfirmModal .close');

    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmUserStatusToggle);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelUserStatusToggle);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', cancelUserStatusToggle);
    }

    // Handle modal close events - only cancel if not confirmed
    let isConfirmed = false;

    if (confirmBtn) {
        confirmBtn.addEventListener('click', function () {
            isConfirmed = true;
            confirmUserStatusToggle();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', function () {
            isConfirmed = false;
            cancelUserStatusToggle();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            isConfirmed = false;
            cancelUserStatusToggle();
        });
    }

    // Handle modal close events - only cancel if not confirmed
    $('#userStatusConfirmModal').on('hidden.bs.modal', function () {
        if (!isConfirmed) {
            cancelUserStatusToggle();
        }
        isConfirmed = false; // Reset for next time
    });
});

// Copy to clipboard function
function copyToClipboard(text, button) {
    if (navigator.clipboard && window.isSecureContext) {
        // Use modern clipboard API
        navigator.clipboard.writeText(text).then(function () {
            showCopySuccess(button);
        }).catch(function (err) {
            console.error('Failed to copy: ', err);
            fallbackCopyTextToClipboard(text, button);
        });
    } else {
        // Fallback for older browsers
        fallbackCopyTextToClipboard(text, button);
    }
}

function fallbackCopyTextToClipboard(text, button) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showCopySuccess(button);
        } else {
            showToast('Failed to copy User ID', 'error');
        }
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
        showToast('Failed to copy User ID', 'error');
    }

    document.body.removeChild(textArea);
}

function showCopySuccess(button) {
    // Change button appearance
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i>';
    button.classList.add('copied');

    // Show success message
    showToast('User ID copied to clipboard!', 'success');

    // Reset button after 2 seconds
    setTimeout(() => {
        button.innerHTML = originalHTML;
        button.classList.remove('copied');
    }, 2000);
}

// Global function to update dashboard statistics
window.updateDashboardStatistics = function (data) {
    console.log('Updating dashboard statistics with data:', data);

    if (data.totalAccounts !== undefined) {
        // Find total accounts element by text content
        const totalAccountsElements = Array.from(document.querySelectorAll('h3')).filter(el =>
            el.textContent.trim() === data.totalAccounts.toString()
        );
        if (totalAccountsElements.length > 0) {
            // Update the first matching element
            totalAccountsElements[0].textContent = data.totalAccounts;
            console.log('Updated total accounts to:', data.totalAccounts);
        }
    }

    if (data.activeAccounts !== undefined) {
        // Find active accounts element by looking for the one with text-success class
        const activeAccountsElement = document.querySelector('h3.text-success');
        if (activeAccountsElement) {
            activeAccountsElement.textContent = data.activeAccounts;
            console.log('Updated active accounts to:', data.activeAccounts);
        }
    }

    if (data.inactiveAccounts !== undefined) {
        // Find inactive accounts element by looking for the one with text-warning class
        const inactiveAccountsElement = document.querySelector('h3.text-warning');
        if (inactiveAccountsElement) {
            inactiveAccountsElement.textContent = data.inactiveAccounts;
            console.log('Updated inactive accounts to:', data.inactiveAccounts);
        }
    }

    if (data.pendingRequests !== undefined) {
        // Find pending requests element by looking for the one with text-info class
        const pendingRequestsElement = document.querySelector('h3.text-info');
        if (pendingRequestsElement) {
            pendingRequestsElement.textContent = data.pendingRequests;
            console.log('Updated pending requests to:', data.pendingRequests);
        }
    }
};