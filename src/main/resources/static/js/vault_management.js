document.addEventListener("DOMContentLoaded", function () {
    const avatarFileInput = document.getElementById('avatar-file-input');
    const avatarForm = document.getElementById('avatar-upload-form');
    const profileAvatarImg = document.getElementById('profile-avatar-img');
    if (avatarFileInput && avatarForm && profileAvatarImg) {
        avatarFileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const maxSize = 10 * 1024 * 1024;
                if (file.size > maxSize) {
                    showToast('File size must be less than 10MB', 'error');
                    avatarFileInput.value = '';
                    return;
                }
                const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
                if (!allowedTypes.includes(file.type)) {
                    showToast('Only PNG, JPG, JPEG and GIF files are allowed', 'error');
                    avatarFileInput.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = function (e) {
                    profileAvatarImg.src = e.target.result;
                };
                reader.readAsDataURL(file);
                showToast('Uploading avatar...', 'info');
                uploadAvatarAjax(file);
            }
        });
    }

    function uploadAvatarAjax(file) {
        const formData = new FormData();
        formData.append('avatar', file);
        fetch('/vault-management/upload-avatar', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin',
            headers: {
                'Accept': 'application/json'
            }
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Upload failed');
                }
            })
            .then(data => {
                if (data.success) {
                    showToast(data.message, 'success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    throw new Error(data.message);
                }
            })
            .catch(error => {
                console.error('Upload error:', error);
                showToast('Failed to update avatar. Please try again.', 'error');
                avatarFileInput.value = '';
            });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const memberSearchInput = document.getElementById('searchInput');
    const searchButton = document.querySelector('.search-box .search-btn');
    const clearButton = document.getElementById('clearSearchBtn');
    if (memberSearchInput) {
        console.log('Member search functionality initialized');
        let searchTimeout;
        memberSearchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            const searchTerm = this.value.trim();
            if (clearButton) {
                clearButton.style.display = searchTerm.length > 0 ? 'flex' : 'none';
            }
            searchTimeout = setTimeout(() => {
                console.log('Searching members for:', searchTerm);
                filterMembers(searchTerm.toLowerCase());
            }, 300);
        });
        if (searchButton) {
            searchButton.addEventListener('click', function (e) {
                e.preventDefault();
                const searchTerm = memberSearchInput.value.trim();
                console.log('Searching members for:', searchTerm);
                filterMembers(searchTerm.toLowerCase());
            });
        }
        if (clearButton) {
            clearButton.addEventListener('click', function (e) {
                e.preventDefault();
                memberSearchInput.value = '';
                this.style.display = 'none';
                memberSearchInput.focus();
                filterMembers('');
                clearAllHighlights();
            });
        }

        memberSearchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const searchTerm = this.value.trim();
                console.log('Searching members for:', searchTerm);
                filterMembers(searchTerm.toLowerCase());
            }
            if (e.key === 'Escape') {
                this.value = '';
                if (clearButton) {
                    clearButton.style.display = 'none';
                }
                filterMembers('');
                clearAllHighlights();
            }
        });
    }
});

function filterMembers(searchTerm) {
    const memberRows = document.querySelectorAll('.member-table tbody tr');
    let visibleCount = 0;

    console.log('Filtering with search:', searchTerm);

    memberRows.forEach((row, index) => {
        const fullNameCell = row.cells[0];
        const usernameCell = row.cells[1];
        const emailCell = row.cells[2];

        if (!fullNameCell || !usernameCell || !emailCell) {
            return;
        }
        const fullNameElement = fullNameCell.querySelector('.name');
        const fullNameText = fullNameElement ?
            fullNameElement.textContent.toLowerCase().trim() :
            fullNameCell.textContent.toLowerCase().trim();
        const username = usernameCell.textContent.toLowerCase().trim();
        const email = emailCell.textContent.toLowerCase().trim();
        const matchesSearch = searchTerm === '' ||
            fullNameText.includes(searchTerm) ||
            username.includes(searchTerm) ||
            email.includes(searchTerm);
        if (searchTerm && matchesSearch) {
            highlightText(fullNameElement || fullNameCell, searchTerm);
            highlightText(usernameCell, searchTerm);
            highlightText(emailCell, searchTerm);
        } else {
            removeHighlight(fullNameElement || fullNameCell);
            removeHighlight(usernameCell);
            removeHighlight(emailCell);
        }

        if (matchesSearch) {
            row.style.display = '';
            row.classList.remove('hidden');
            row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
            visibleCount++;
        } else {
            row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            row.style.opacity = '0';
            row.style.transform = 'translateY(-10px)';

            setTimeout(() => {
                if (!matchesSearch) {
                    row.style.display = 'none';
                }
            }, 300);
        }
    });

    updateMemberCount(visibleCount, memberRows.length);
    setTimeout(() => {
        updateMemberEmptyState(visibleCount, searchTerm);
    }, 350);
}

function highlightText(element, searchTerm) {
    if (!element || !searchTerm) return;
    if (!element.dataset.originalText) {
        element.dataset.originalText = element.textContent;
    }
    const originalText = element.dataset.originalText;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const highlightedText = originalText.replace(regex, '<mark style="background-color: #fff3cd; padding: 1px 2px; border-radius: 2px;">$1</mark>');
    element.innerHTML = highlightedText;
}

function removeHighlight(element) {
    if (!element) return;
    if (element.dataset.originalText) {
        element.textContent = element.dataset.originalText;
    }
}

function clearAllHighlights() {
    const memberRows = document.querySelectorAll('.member-table tbody tr');
    memberRows.forEach(row => {
        const fullNameCell = row.cells[0];
        const usernameCell = row.cells[1];
        const emailCell = row.cells[2];
        if (fullNameCell) {
            const nameElement = fullNameCell.querySelector('.name');
            removeHighlight(nameElement || fullNameCell);
        }
        if (usernameCell) removeHighlight(usernameCell);
        if (emailCell) removeHighlight(emailCell);
    });
}

function updateMemberCount(visibleCount, totalCount) {
    const visibleCountElement = document.getElementById('visibleCount');
    const totalCountElement = document.getElementById('totalCount');
    if (visibleCountElement) {
        visibleCountElement.textContent = visibleCount;
    }
    if (totalCountElement) {
        totalCountElement.textContent = totalCount;
    }
}

function updateMemberEmptyState(visibleCount, searchTerm) {
    let emptyStateElement = document.getElementById('member-empty-state');
    if (!emptyStateElement) {
        emptyStateElement = document.createElement('div');
        emptyStateElement.id = 'member-empty-state';
        emptyStateElement.className = 'member-empty-state';
        emptyStateElement.style.cssText = `
            text-align: center;
            padding: 40px 20px;
            color: #6b7280;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        `;
        emptyStateElement.innerHTML = `
            <div class="empty-state-content" style="max-width: 300px; margin: 0 auto;">
                <h3 class="empty-state-title" style="margin: 0 0 8px; font-size: 18px; font-weight: 500; color: #374151;">No members found</h3>
                <p class="empty-state-text" style="margin: 0; font-size: 14px; color: #6b7280;">Try adjusting your search criteria</p>
            </div>
        `;
        const memberTable = document.querySelector('.member-table');
        if (memberTable && memberTable.parentNode) {
            memberTable.parentNode.insertBefore(emptyStateElement, memberTable.nextSibling);
        }
    }

    if (visibleCount === 0 && searchTerm) {
        const titleElement = emptyStateElement.querySelector('.empty-state-title');
        const textElement = emptyStateElement.querySelector('.empty-state-text');
        if (titleElement) titleElement.textContent = 'No members found';
        if (textElement) textElement.textContent = `No results for "${searchTerm}". Try a different search term.`;
        emptyStateElement.style.display = 'block';
        emptyStateElement.style.opacity = '0';
        emptyStateElement.style.transform = 'translateY(10px)';
        setTimeout(() => {
            emptyStateElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            emptyStateElement.style.opacity = '1';
            emptyStateElement.style.transform = 'translateY(0)';
        }, 10);
    } else {
        emptyStateElement.style.display = 'none';
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const toggle = document.getElementById('user-dropdown-toggle');
    const dropdown = document.getElementById('user-dropdown');
    if (toggle && dropdown) {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = dropdown.classList.contains('visible');
            if (!isVisible) {
                dropdown.classList.add('showing');
                requestAnimationFrame(() => {
                    dropdown.classList.add('visible');
                });
            } else {
                dropdown.classList.remove('visible');
                setTimeout(() => {
                    dropdown.classList.remove('showing');
                }, 300);
            }
        });

        window.addEventListener('click', (e) => {
            if (!toggle.contains(e.target)) {
                dropdown.classList.remove('visible');
                setTimeout(() => {
                    dropdown.classList.remove('showing');
                }, 300);
            }
        });
    }
});


document.addEventListener("DOMContentLoaded", function () {
    const toggleBtn = document.querySelector(".sidebar-toggle");
    const sidebar = document.querySelector(".sidebar");
    const iconCollapse = document.getElementById("icon-collapse");
    const iconExpand = document.getElementById("icon-expand");

    toggleBtn.addEventListener("click", function () {
        sidebar.classList.toggle("collapsed");
        const collapsed = sidebar.classList.contains("collapsed");
        iconCollapse.classList.toggle("hidden", collapsed);
        iconExpand.classList.toggle("hidden", !collapsed);
        toggleBtn.setAttribute('data-tooltip', collapsed ? 'Expand' : 'Collapse');
    });
});


document.addEventListener('DOMContentLoaded', function () {
    const addVaultBtn = document.querySelector('.add-vault-btn');
    const vaultListContent = document.getElementById('vault-list-content');
    const addVaultFormContent = document.getElementById('add-vault-form-content');
    const cancelAddVaultBtn = document.getElementById('cancel-add-vault');
    const backToListBtn = document.getElementById('back-to-list-btn');

    if (addVaultBtn) {
        addVaultBtn.addEventListener('click', function () {
            vaultListContent.classList.add('hidden');
            addVaultFormContent.classList.remove('hidden');
        });
    }
    if (cancelAddVaultBtn) {
        cancelAddVaultBtn.addEventListener('click', function () {
            addVaultFormContent.classList.add('hidden');
            vaultListContent.classList.remove('hidden');
        });
    }
    if (backToListBtn) {
        backToListBtn.addEventListener('click', function () {
            addVaultFormContent.classList.add('hidden');
            vaultListContent.classList.remove('hidden');
        });
    }
});


document.addEventListener("DOMContentLoaded", function () {
    const addVaultBtn = document.querySelector('.add-vault-btn');
    const addVaultForm = document.getElementById('add-vault-form');
    if (addVaultBtn && addVaultForm) {
        addVaultBtn.addEventListener('click', function (e) {
            addVaultForm.reset();

        });
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const addVaultBtn = document.querySelector('.add-vault-btn');
    const addVaultForm = document.getElementById('add-vault-form');
    if (addVaultBtn && addVaultForm) {
        addVaultBtn.addEventListener('click', function () {
            addVaultForm.reset();
            addVaultForm.querySelectorAll('.text-danger, .error-msg, .alert-danger').forEach(function (el) {
                el.textContent = '';
                el.style.display = 'none';
            });
        });
    }
});


document.querySelectorAll('#profile-modal .sidebar-link').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelectorAll('#profile-modal .sidebar-link').forEach(l => l.classList.remove('sidebar-link-active'));
        this.classList.add('sidebar-link-active');
        document.querySelectorAll('#profile-modal .tab-content').forEach(tab => tab.classList.remove('active'));
        const tabName = this.getAttribute('data-tab');
        document.querySelector(`#profile-modal #tab-${tabName}`).classList.add('active');
    });
});

document.querySelector('#profile-modal #tab-profile').classList.add('active');
function openModal() {
    const modal = document.getElementById("profile-modal");
    modal.classList.remove("hidden");
    setTimeout(() => modal.classList.add("show"), 10);
}

document.addEventListener("DOMContentLoaded", function () {
    const btn = document.getElementById("open-another-modal");
    if (btn) {
        btn.addEventListener("click", openModal);
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("profile-modal");
    const closeButton = document.getElementById("close-profile-modal");
    const modalContent = modal.querySelector(".modal-content");

    closeButton.addEventListener("click", function () {
        modal.classList.remove("show");
        setTimeout(() => modal.classList.add("hidden"), 300);
    });

    modal.addEventListener("click", function (event) {
        if (!modalContent.contains(event.target)) {
            modal.classList.remove("show");
            setTimeout(() => modal.classList.add("hidden"), 300);
        }
    });
});


document.addEventListener("DOMContentLoaded", function () {
    function openModal(modal) {
        modal.classList.remove("hidden");
        setTimeout(() => modal.classList.add("show"), 10);
    }

    function closeModal(modal) {
        modal.classList.remove("show");
        setTimeout(() => modal.classList.add("hidden"), 300);
    }

    const modalsConfig = [
        {
            btnId: "addPassword",
            modalId: "addPasswordModal",
            contentClass: "modal-add-password-content",
            closeSelector: "[role='button'][tabindex='0']"
        },
        {
            btnId: "changePassword",
            modalId: "changePasswordModal",
            contentClass: "modal-add-password-content",
            closeSelector: "[role='button'][tabindex='0']"
        },
        {
            btnId: "deleteAccount",
            modalId: "deleteAccountModal",
            contentClass: "delete-account-content",
            closeSelector: ".button-cancel"
        },
        {
            btnId: "addMember",
            modalId: "addUserModal",
            contentClass: "modal-add-user-content",
            closeSelector: ".cancel-btn"
        },
        {
            btnId: "deleteVaultBtn",
            modalId: "deleteVaultModal",
            contentClass: "delete-vault-content",
            closeSelector: ".button-cancel"
        },
        {
            btnId: "leaveVaultBtn",
            modalId: "leaveVaultModal",
            contentClass: "leave-vault-content",
            closeSelector: ".button-cancel"
        }
    ];

    modalsConfig.forEach(({ btnId, modalId, contentClass, closeSelector }) => {
        const btn = document.getElementById(btnId);
        const modal = document.getElementById(modalId);
        if (btn && modal) {
            btn.addEventListener("click", () => openModal(modal));
            const content = modal.querySelector(`.${contentClass}`);
            if (content) {
                modal.addEventListener("click", (e) => {
                    if (!content.contains(e.target)) closeModal(modal);
                });
            }
            if (closeSelector) {
                const closeBtn = modal.querySelector(closeSelector);
                if (closeBtn) {
                    closeBtn.addEventListener("click", () => closeModal(modal));
                }
            }
        }
    });
});

function showToast(message, type = 'success') {
    const toast = document.getElementById("toast-notification");
    const toastMsg = document.getElementById("toast-message");
    const toastIcon = document.getElementById("toast-icon");
    if (!toast || !toastMsg) return;
    toastMsg.textContent = message;
    toast.className = "toast-notification";
    if (type === 'error') {
        toast.classList.add('error');
        if (toastIcon) {
            toastIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />';
        }
    } else {
        if (toastIcon) {
            toastIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />';
        }
    }
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

function attachOutsideClickToLocalModal() {
    const modal = document.getElementById("local-send-verification-code-modal");
    if (!modal) return;
    const content = modal.querySelector(".modal-send-verification-code-content");
    modal.addEventListener("click", function (e) {
        if (!content.contains(e.target)) {
            modal.classList.remove("show");
            setTimeout(() => modal.classList.add("hidden"), 300);
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    function handleAjaxForm(formId, url) {
        const form = document.getElementById(formId);
        if (!form) return;
        const clone = form.cloneNode(true);
        form.parentNode.replaceChild(clone, form);

        clone.addEventListener("submit", function (event) {
            event.preventDefault();
            const formData = new FormData(clone);

            fetch(url, {
                method: "POST",
                body: formData
            })
                .then(response => {
                    if (!response.ok) throw new Error("Network response was not ok");
                    return response.text();
                })
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, "text/html");
                    const newModal = doc.querySelector("#sendVerificationCodeModal");
                    if (newModal) {
                        const oldModal = document.querySelector("#sendVerificationCodeModal");
                        oldModal.replaceWith(newModal);
                        newModal.classList.remove("hidden");
                        newModal.classList.add("show");

                        handleAjaxForm("current-email-form", "/auth/send-code-gg-account");
                        handleAjaxForm("confirm-form", "/auth/verify-email");
                        handleAjaxForm("new-email-form", "/auth/send-code-new-mail");
                        handleAjaxForm("password-form", "/auth/check-password");
                        handleAjaxForm("email-form", "/auth/send-code");
                        handleVerifyForm();
                        attachOutsideClickToLocalModal();
                    }
                })
                .catch(error => {
                    console.error("Error during AJAX form submission:", error);
                });
        });
    }


    function handleVerifyForm() {
        const form = document.getElementById("verify-form") || document.getElementById("confirm-new-form");
        if (!form) return;

        const clone = form.cloneNode(true);
        form.parentNode.replaceChild(clone, form);

        clone.addEventListener("submit", function (event) {
            event.preventDefault();
            const formData = new FormData(clone);

            fetch("/auth/confirm", {
                method: "POST",
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const modal = document.getElementById("sendVerificationCodeModal");
                        if (modal) {
                            modal.classList.add("hidden");
                            modal.classList.remove("show");
                        }
                        const emailField = document.querySelector(".account-security-field .value-field");
                        if (emailField && formData.get("newEmail")) {
                            emailField.textContent = formData.get("newEmail");
                        }
                        showToast("Email changed successfully!", 'success');
                    } else {
                        let errorDiv = clone.querySelector(".error-message");
                        if (!errorDiv) {
                            errorDiv = document.createElement("div");
                            errorDiv.className = "error-message";
                            errorDiv.style = "font-size: 12px; color:red";
                            clone.querySelector(".input-container").after(errorDiv);
                        }
                        errorDiv.textContent = data.error || "Invalid verification code";
                    }
                })
                .catch(error => {
                    console.error("Error during AJAX form submission:", error);
                });
        });
    }


    handleAjaxForm("current-email-form", "/auth/send-code-gg-account");
    handleAjaxForm("confirm-form", "/auth/verify-email");
    handleAjaxForm("new-email-form", "/auth/send-code-new-mail");
    handleAjaxForm("password-form", "/auth/check-password");
    handleAjaxForm("email-form", "/auth/send-code");
    handleVerifyForm();
});

document.addEventListener("DOMContentLoaded", function () {
    handlePasswordForm("change-password-form", "changePasswordModal", "/auth/change-password", "Đổi mật khẩu thành công!");
    handlePasswordForm("add-password-form", "addPasswordModal", "/auth/add-password", "Đặt mật khẩu thành công!");
});

function handlePasswordForm(formId, modalId, url, successMessage) {
    const form = document.getElementById(formId);
    if (!form) return;

    const clone = form.cloneNode(true);
    form.parentNode.replaceChild(clone, form);

    clone.addEventListener("submit", function (e) {
        e.preventDefault();
        const formData = new FormData(clone);

        fetch(url, {
            method: "POST",
            body: formData,
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        })
            .then(response => response.json().catch(() => null))
            .then(data => {
                if (data && data.success) {
                    const modal = document.getElementById(modalId);
                    if (modal) {
                        modal.classList.remove("show");
                        setTimeout(() => modal.classList.add("hidden"), 300);
                    }
                    showToast(successMessage, 'success');
                } else if (data && data.error) {
                    let errorDiv = clone.querySelector(".error-msg");
                    if (!errorDiv) {
                        errorDiv = document.createElement("div");
                        errorDiv.className = "error-msg";
                        errorDiv.style = "font-size: 12px; color:red";
                        const inputWrapper = clone.querySelector(".input-wrapper");
                        if (inputWrapper) inputWrapper.after(errorDiv);
                    }
                    errorDiv.textContent = data.error;
                } else if (data && data.text) {
                    clone.outerHTML = data.text;
                }
            })
            .catch(() => {
                showToast("Có lỗi xảy ra. Vui lòng thử lại!", 'error');
            });
    });
}

// ---------------------------------Delete vault-------------------------------------

window.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('vaultNameInput');
    const confirmName = document.getElementById('vaultNameToConfirm').textContent.trim();
    const deleteBtn = document.getElementById('deleteVaultConfirmBtn');
    deleteBtn.disabled = true;
    deleteBtn.classList.add('disabled-btn');

    input.addEventListener('input', () => {
        const value = input.value.trim();
        const match = value === confirmName;

        deleteBtn.disabled = !match;
        deleteBtn.classList.toggle('disabled-btn', !match);
    });
});

// ---------------------------------Manage vault member-------------------------------------

document.addEventListener('DOMContentLoaded', function () {
    const customSelect = document.getElementById('customSelect');
    const customOptions = document.getElementById('customOptions');
    const selectedSpan = customSelect.querySelector('.selected');
    const selectedInput = document.getElementById('selectedRole');
    const options = customOptions.querySelectorAll('.option');

    customSelect.addEventListener('click', () => {
        customOptions.classList.toggle('hidden');
    });

    options.forEach(option => {
        option.addEventListener('click', () => {
            const value = option.getAttribute('data-value');
            const text = option.textContent.trim();
            console.log('Role selected:', { value, text });

            selectedSpan.textContent = text;
            selectedInput.value = value;
            customOptions.classList.add('hidden');

            clearFieldErrors();
        });
    });

    document.addEventListener('click', function (e) {
        if (!customSelect.contains(e.target) && !customOptions.contains(e.target)) {
            customOptions.classList.add('hidden');
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const userSuggestions = document.getElementById("userSuggestions");
    const searchInput = document.getElementById("searchUserInput");

    if (searchInput && userSuggestions) {
        searchInput.addEventListener("input", function () {
            const keyword = this.value.trim();
            if (keyword.length === 0) {
                userSuggestions.innerHTML = "";
                userSuggestions.classList.add("hidden");
                return;
            }
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/vault-management/search-user", true);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.onload = function () {
                if (xhr.status === 200) {
                    userSuggestions.innerHTML = xhr.responseText;
                    if (xhr.responseText.trim()) {
                        userSuggestions.classList.remove("hidden");

                        attachSuggestionClickEvents();
                    } else {
                        userSuggestions.classList.add("hidden");
                    }
                }
            };

            // Get vaultId from the hidden input in the form
            const vaultIdInput = document.querySelector('input[name="vaultId"]');
            const vaultId = vaultIdInput ? vaultIdInput.value : '';

            const formData = "keyword=" + encodeURIComponent(keyword);
            const dataWithVaultId = vaultId ? formData + "&vaultId=" + encodeURIComponent(vaultId) : formData;

            xhr.send(dataWithVaultId);
        });

        document.addEventListener("click", function (e) {
            if (!e.target.closest("#searchUserInput") && !e.target.closest("#userSuggestions")) {
                userSuggestions.innerHTML = "";
                userSuggestions.classList.add("hidden");
            }
        });
    }
});

function attachSuggestionClickEvents() {
    document.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const userId = this.getAttribute("data-user-id");
            const username = this.getAttribute("data-username");

            if (userId && username) {
                document.getElementById('hiddenUserId').value = userId;
                document.getElementById('searchUserInput').value = username;
                document.getElementById('userSuggestions').innerHTML = "";
                document.getElementById('userSuggestions').classList.add("hidden");
                clearFieldErrors();
            } else {
                console.error('Missing data attributes on suggestion item:', this);
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    attachSuggestionClickEvents();
});



document.addEventListener('DOMContentLoaded', function () {
    const addMemberForm = document.querySelector('form[th\\:action*="add-member"]');
    if (addMemberForm) {

        addMemberForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const userId = document.getElementById('hiddenUserId').value;
            const role = document.getElementById('selectedRole').value;
            const searchInput = document.getElementById('searchUserInput').value;
            clearFieldErrors();

            let hasErrors = false;

            if (!userId || userId.trim() === '') {
                showFieldError('searchUserInput', 'Please select a user from the suggestions');
                hasErrors = true;
            }

            if (!role || role.trim() === '') {
                showFieldError('customSelect', 'Please select a role');
                hasErrors = true;
            }

            if (hasErrors) {
                return false;
            }
            if (typeof showLoader === 'function') {
                showLoader();
            } else {
                const loader = document.getElementById('loader');
                const mainContent = document.getElementById('main-content');
                if (loader && mainContent) {
                    loader.style.display = 'flex';
                    mainContent.style.display = 'none';
                }
            }
            this.submit();
        });
    } else {
        console.log('Add member form not found');
    }
});

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.add('error');
        let errorDiv = field.parentNode.querySelector('.field-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            field.parentNode.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
    }
}

function clearFieldErrors() {
    document.querySelectorAll('.error').forEach(field => {
        field.classList.remove('error');
    });

    document.querySelectorAll('.field-error').forEach(error => {
        error.remove();
    });
}

let currentUserIdToDelete = null;
let currentVaultId = null;
function showDeleteConfirm(button) {
    const userId = button.getAttribute('data-user-id');
    const userName = button.getAttribute('data-user-name');
    const urlParams = new URLSearchParams(window.location.search);
    currentVaultId = urlParams.get('id');
    currentUserIdToDelete = userId;

    document.getElementById('memberNameToDelete').textContent = userName;
    const popup = document.getElementById('deleteConfirmPopup');
    popup.setAttribute('data-user-id', userId);
    popup.setAttribute('data-vault-id', currentVaultId);
    popup.style.display = 'block';

    setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
    }, 100);
}


function hideDeleteConfirm() {
    const popup = document.getElementById('deleteConfirmPopup');
    popup.style.display = 'none';
    document.removeEventListener('click', handleOutsideClick);
}

function handleOutsideClick(event) {
    const popup = document.getElementById('deleteConfirmPopup');
    const deleteBtn = event.target.closest('.delete-member-btn');

    if (!popup.contains(event.target) && !deleteBtn) {
        hideDeleteConfirm();
    }
}

function confirmDelete() {
    const popup = document.getElementById('deleteConfirmPopup');
    const userId = popup.getAttribute('data-user-id');
    const vaultId = popup.getAttribute('data-vault-id');

    if (!vaultId || !userId) {
        alert('Không tìm thấy thông tin vault hoặc user. Vui lòng thử lại!');
        return;
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/vault-management/edit-vault/remove-member';

    const userIdInput = document.createElement('input');
    userIdInput.type = 'hidden';
    userIdInput.name = 'userId';
    userIdInput.value = userId;

    const vaultIdInput = document.createElement('input');
    vaultIdInput.type = 'hidden';
    vaultIdInput.name = 'vaultId';
    vaultIdInput.value = vaultId;

    form.appendChild(userIdInput);
    form.appendChild(vaultIdInput);
    document.body.appendChild(form);
    form.submit();
}

document.addEventListener('DOMContentLoaded', function () {
    initializeRoleDropdowns();

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.role-dropdown')) {
            closeAllRoleDropdowns();
        }
    });
});

function initializeRoleDropdowns() {
    const roleDropdowns = document.querySelectorAll('.role-dropdown');

    roleDropdowns.forEach(dropdown => {
        const dropdownMenu = dropdown.querySelector('.role-dropdown-menu');
        const roleOptions = dropdown.querySelectorAll('.role-option');

        dropdown.addEventListener('click', function (e) {
            e.stopPropagation();
            toggleRoleDropdown(this);
        });

        roleOptions.forEach(option => {
            option.addEventListener('click', function (e) {
                e.stopPropagation();
                const selectedRole = this.getAttribute('data-role');
                const userId = dropdown.getAttribute('data-user-id');
                const currentRole = dropdown.getAttribute('data-current-role');

                if (selectedRole === currentRole) {
                    closeAllRoleDropdowns();
                    return;
                }

                // Prevent updating member to VAULT_OWNER role
                if (selectedRole === 'VAULT_OWNER') {
                    showToast('Cannot update member to vault owner role', 'error');
                    closeAllRoleDropdowns();
                    return;
                }

                const roleDisplay = dropdown.querySelector('.role-display');
                roleDisplay.textContent = selectedRole;

                roleOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');

                dropdown.setAttribute('data-current-role', selectedRole);

                closeAllRoleDropdowns();

                updateMemberRole(userId, selectedRole);
            });
        });
    });
}

function toggleRoleDropdown(dropdown) {
    const isActive = dropdown.classList.contains('active');

    closeAllRoleDropdowns();

    if (!isActive) {
        dropdown.classList.add('active');
    }
}

function closeAllRoleDropdowns() {
    const activeDropdowns = document.querySelectorAll('.role-dropdown.active');
    activeDropdowns.forEach(dropdown => {
        dropdown.classList.remove('active');
    });
}

function updateMemberRole(userId, newRole) {
    const urlParams = new URLSearchParams(window.location.search);
    const vaultId = urlParams.get('id');

    if (!vaultId) {
        console.error('Vault ID not found');
        return;
    }

    const formData = new FormData();
    formData.append('vaultId', vaultId);
    formData.append('userId', userId);
    formData.append('newRole', newRole);

    fetch('/vault-management/edit-vault/update-member-role', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (response.ok) {
                showToast('Member role updated successfully!', 'success');
            } else {
                throw new Error('Failed to update role');
            }
        })
        .catch(error => {
            console.error('Error updating role:', error);
            showToast('Failed to update member role', 'error');

            const dropdown = document.querySelector(`[data-user-id="${userId}"]`);
            if (dropdown) {
                const roleDisplay = dropdown.querySelector('.role-display');
                const originalRole = dropdown.getAttribute('data-current-role');
                roleDisplay.textContent = originalRole;

                const roleOptions = dropdown.querySelectorAll('.role-option');
                roleOptions.forEach(option => {
                    if (option.getAttribute('data-role') === originalRole) {
                        option.classList.add('selected');
                    } else {
                        option.classList.remove('selected');
                    }
                });
            }
        });
}

// ---------------------------------Delete Account Functionality-------------------------------------

document.addEventListener('DOMContentLoaded', function () {
    const deleteAccountEmailInput = document.getElementById('delete-account-email-input');
    const deleteAccountConfirmBtn = document.getElementById('delete-account-confirm-btn');

    if (deleteAccountEmailInput && deleteAccountConfirmBtn) {

        deleteAccountConfirmBtn.disabled = true;
        deleteAccountConfirmBtn.classList.add('disabled');

        const userEmail = deleteAccountEmailInput.getAttribute('placeholder');

        deleteAccountEmailInput.addEventListener('input', function () {
            const enteredEmail = this.value.trim();
            const isValid = enteredEmail === userEmail;

            deleteAccountConfirmBtn.disabled = !isValid;
            if (isValid) {
                deleteAccountConfirmBtn.classList.remove('disabled');
            } else {
                deleteAccountConfirmBtn.classList.add('disabled');
            }

            console.log('Email validation:', {
                entered: enteredEmail,
                expected: userEmail,
                valid: isValid
            });
        });

        deleteAccountConfirmBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (this.disabled) {
                showToast('Please enter your email to confirm deletion', 'error');
                return;
            }

            const enteredEmail = deleteAccountEmailInput.value.trim();
            if (enteredEmail !== userEmail) {
                showToast('Email does not match your account email', 'error');
                return;
            }

            showToast('Processing account deletion...', 'info');
            deleteUserAccount(enteredEmail);
        });
    }
});

function deleteUserAccount(email) {
    const formData = new FormData();
    formData.append('email', email);


    fetch('/vault-management/delete-account', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Failed to delete account');
            }
        })
        .then(data => {
            if (data.success) {
                showToast('Account deleted successfully. Logging out...', 'success');

                const modal = document.getElementById('deleteAccountModal');
                if (modal) {
                    modal.classList.remove('show');
                    setTimeout(() => modal.classList.add('hidden'), 300);
                }

                clearAllCookiesAndSession();

                const redirectUrl = data.redirectUrl || '/vault-management/delete-account-logout';
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 1500);
            } else {
                throw new Error(data.error || 'Failed to delete account');
            }
        })
        .catch(error => {
            console.error('Delete account error:', error);
            showToast('Failed to delete account: ' + error.message, 'error');
        });
}

function clearAllCookiesAndSession() {
    document.cookie.split(";").forEach(function (c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    const authCookies = ['JWT', 'jwt', 'JSESSIONID', 'auth-token', 'authToken', 'remember-me'];
    authCookies.forEach(cookieName => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
    });
    if (typeof (Storage) !== "undefined") {
        sessionStorage.clear();
        localStorage.clear();
    }
    const authKeys = ['authToken', 'jwt', 'token', 'accessToken', 'refreshToken', 'user', 'userDetails'];
    authKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });

    console.log('All cookies and session data cleared, including JWT tokens');
}

// ---------------------------------End Delete Account Functionality-------------------------------------

// ---------------------------------Vault Search and Filter Management-------------------------------------

// Global state for search and filter
const VaultManager = {
    currentTab: 'my-vaults', // 'my-vaults' or 'trash'
    currentFilter: 'all', // 'all', 'active', 'inactive', 'deleted'
    searchTerm: '',
    searchTimeout: null,
    currentPage: 1, // Current page number
    itemsPerPage: 12, // Number of vaults per page
    totalPages: 1, // Total number of pages
    visibleVaults: [], // Array of vaults that match current filter/search
    isInInitialDelay: true, // Track if we're in the initial 3-second delay period

    // Initialize search functionality
    init() {
        this.initSearchInput();
        this.initClearButton();
        this.initEscapeKey();
        this.initClickOutside();
        this.initPagination();
        this.loadSearchTermFromInput();
        this.updateCurrentState();

        // Wait for loader to finish before showing pagination
        const checkLoaderInterval = setInterval(() => {
            const loader = document.getElementById('loader');
            const mainContent = document.getElementById('main-content');

            if (loader && mainContent && loader.style.display === 'none' && mainContent.style.display === 'flex') {
                clearInterval(checkLoaderInterval);
                // Perform initial search to set up pagination
                this.performSearch();

                // Hide pagination for 1 second after page load
                const paginationContainer = document.getElementById('vault-pagination');
                if (paginationContainer) {
                    paginationContainer.style.display = 'none';
                    setTimeout(() => {
                        this.isInInitialDelay = false;
                        this.updatePaginationDisplay();
                    }, 1000);
                }
            }
        }, 100);
    },

    // Initialize search input
    initSearchInput() {
        const searchInput = document.getElementById('vault-search-input');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });
    },

    // Initialize clear button
    initClearButton() {
        const clearButton = document.getElementById('clear-search-btn');
        if (!clearButton) return;

        clearButton.addEventListener('click', () => {
            this.clearSearch();
        });
    },

    // Initialize escape key
    initEscapeKey() {
        const searchInput = document.getElementById('vault-search-input');
        if (!searchInput) return;

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearSearch();
            }
        });
    },

    // Initialize click outside to close dropdown
    initClickOutside() {
        document.addEventListener('click', (e) => {
            const searchContainer = document.querySelector('.search-container');
            const dropdown = document.getElementById('search-results-dropdown');

            if (dropdown && dropdown.classList.contains('show') &&
                !searchContainer.contains(e.target)) {
                this.hideSearchDropdown();
            }
        });
    },

    // Load search term from input when page loads
    loadSearchTermFromInput() {
        const searchInput = document.getElementById('vault-search-input');
        if (searchInput) {
            const searchTerm = searchInput.value.trim();
            this.searchTerm = searchTerm;
            this.updateClearButtonVisibility(searchTerm);
        }
    },

    // Initialize pagination
    initPagination() {
        this.createPaginationContainer();
        this.updatePaginationDisplay();
    },

    // Create pagination container
    createPaginationContainer() {
        // Check if pagination already exists
        if (document.getElementById('vault-pagination')) return;

        const paginationContainer = document.createElement('div');
        paginationContainer.id = 'vault-pagination';
        paginationContainer.className = 'vault-pagination';
        paginationContainer.innerHTML = `
            <div class="pagination-info">
                <span class="pagination-text">Showing <span id="pagination-start">1</span> to <span id="pagination-end">12</span> of <span id="pagination-total">0</span> vaults</span>
            </div>
            <div class="pagination-controls">
                <button id="pagination-prev" class="pagination-btn" disabled>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 18l-6-6 6-6"/>
                    </svg>
                    Previous
                </button>
                <div id="pagination-numbers" class="pagination-numbers"></div>
                <button id="pagination-next" class="pagination-btn">
                    Next
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 18l6-6-6-6"/>
                    </svg>
                </button>
            </div>
        `;

        // Append to body for fixed positioning
        document.body.appendChild(paginationContainer);

        // Add event listeners
        this.addPaginationEventListeners();
    },

    // Add pagination event listeners
    addPaginationEventListeners() {
        const prevBtn = document.getElementById('pagination-prev');
        const nextBtn = document.getElementById('pagination-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.goToPage(this.currentPage - 1);
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentPage < this.totalPages) {
                    this.goToPage(this.currentPage + 1);
                }
            });
        }
    },

    // Go to specific page
    goToPage(pageNumber) {
        if (pageNumber < 1 || pageNumber > this.totalPages) return;

        this.currentPage = pageNumber;
        this.displayCurrentPage();
        this.updatePaginationDisplay();
    },

    // Handle search input changes
    handleSearchInput(value) {
        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        const searchTerm = value.trim();
        this.searchTerm = searchTerm;

        // Update clear button visibility
        this.updateClearButtonVisibility(searchTerm);

        // Show/hide search dropdown
        this.toggleSearchDropdown(searchTerm);

        // Debounce search
        this.searchTimeout = setTimeout(() => {
            this.performSearch();
            this.updateSearchDropdown(searchTerm);
        }, 300);
    },

    // Update clear button visibility
    updateClearButtonVisibility(searchTerm) {
        const clearButton = document.getElementById('clear-search-btn');
        if (clearButton) {
            clearButton.classList.toggle('show', searchTerm.length > 0);
        }
    },

    // Toggle search dropdown visibility
    toggleSearchDropdown(searchTerm) {
        const dropdown = document.getElementById('search-results-dropdown');
        if (dropdown) {
            if (searchTerm.length > 0) {
                dropdown.classList.add('show');
            } else {
                dropdown.classList.remove('show');
            }
        }
    },

    // Update search dropdown with results
    updateSearchDropdown(searchTerm) {
        if (!searchTerm) {
            this.hideSearchDropdown();
            return;
        }

        const dropdown = document.getElementById('search-results-dropdown');
        const content = document.getElementById('search-results-content');

        if (!dropdown || !content) return;

        // Show loading state
        content.innerHTML = '<div class="search-loading">Searching...</div>';

        // Get all vault cards
        const vaultCards = document.querySelectorAll('.card-vault');
        const results = [];

        vaultCards.forEach(card => {
            const vaultName = card.querySelector('.vault-name')?.textContent || '';
            const vaultOwner = card.querySelector('.vault-owner')?.textContent || '';
            const vaultStatus = card.querySelector('.vault-info span:last-child')?.textContent || '';
            const vaultId = card.getAttribute('data-vault-id') || '';
            const vaultIcon = card.querySelector('.vault-picture img')?.alt || 'V';

            // Check if vault matches search term
            if (vaultName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                vaultOwner.toLowerCase().includes(searchTerm.toLowerCase())) {
                results.push({
                    id: vaultId,
                    name: vaultName,
                    description: vaultOwner,
                    status: vaultStatus,
                    icon: vaultName.charAt(0).toUpperCase()
                });
            }
        });

        // Limit results to 5 items
        const limitedResults = results.slice(0, 5);

        // Update dropdown content
        if (limitedResults.length > 0) {
            content.innerHTML = limitedResults.map(vault => {
                const statusClass = vault.status.toLowerCase();
                return `
                <div class="search-result-item" onclick="VaultManager.selectSearchResult('${vault.id}')">
                    <div class="vault-icon">${vault.icon}</div>
                    <div class="vault-info">
                        <div class="vault-name">${this.highlightSearchTerm(vault.name, searchTerm)}</div>
                        <div class="vault-description">${vault.description}</div>
                    </div>
                    <div class="vault-status ${statusClass}">${vault.status}</div>
                </div>
            `;
            }).join('');
        } else {
            content.innerHTML = '<div class="search-no-results">No vaults found</div>';
        }
    },

    // Highlight search term in text
    highlightSearchTerm(text, searchTerm) {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    },

    // Select search result
    selectSearchResult(vaultId) {
        // Navigate to vault detail page
        window.location.href = `/vault-detail?id=${vaultId}`;
    },

    // Hide search dropdown
    hideSearchDropdown() {
        const dropdown = document.getElementById('search-results-dropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    },

    // Clear search
    clearSearch() {
        const searchInput = document.getElementById('vault-search-input');
        const clearButton = document.getElementById('clear-search-btn');

        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }

        if (clearButton) {
            clearButton.classList.remove('show');
        }

        this.searchTerm = '';
        this.currentPage = 1; // Reset to first page
        this.clearAllHighlights();
        this.hideSearchDropdown();
        this.applyCurrentFilter();
    },

    // Clear all search highlights (no longer needed)
    clearAllHighlights() {
        // Highlight functionality removed
    },

    // Perform search with current state
    performSearch() {
        this.updateCurrentState();

        if (this.searchTerm === '') {
            // No search term, just apply current filter
            this.applyCurrentFilter();
        } else {
            // Apply search with current filter
            this.applySearchWithFilter();
        }
    },

    // Update current state (tab and filter)
    updateCurrentState() {
        const myVaultsLink = document.getElementById('my-vaults-link');
        const trashLink = document.getElementById('trash-link');
        const activeFilterLink = document.querySelector('.navbar-filter-link.navbar-filter-active');

        // Determine current tab
        if (trashLink && trashLink.classList.contains('sidebar-link-active')) {
            this.currentTab = 'trash';
            this.currentFilter = 'deleted';
        } else if (myVaultsLink && myVaultsLink.classList.contains('sidebar-link-active')) {
            this.currentTab = 'my-vaults';
            this.currentFilter = activeFilterLink ? activeFilterLink.getAttribute('data-filter') : 'all';
        }
    },

    // Apply current filter without search
    applyCurrentFilter() {
        this.filterVaults(this.currentFilter, '');
    },

    // Apply search with current filter
    applySearchWithFilter() {
        this.filterVaults(this.currentFilter, this.searchTerm);
    },

    // Main filtering function
    filterVaults(filter, searchTerm) {
        const vaultCards = document.querySelectorAll('.card-vault');
        this.visibleVaults = [];

        console.log(`Filtering vaults - Filter: ${filter}, Search: "${searchTerm}", Tab: ${this.currentTab}`);

        // First pass: collect all matching vaults
        vaultCards.forEach((card) => {
            const vaultNameElement = card.querySelector('.vault-name');
            const vaultName = vaultNameElement ? vaultNameElement.textContent.toLowerCase() : '';
            const cardStatus = card.getAttribute('data-status');

            // Check if card matches filter
            const matchesFilter = this.matchesFilter(cardStatus, filter);

            // Check if card matches search
            const matchesSearch = searchTerm === '' || vaultName.includes(searchTerm.toLowerCase());

            // Determine if card should be shown
            const shouldShow = matchesFilter && matchesSearch;

            if (shouldShow) {
                this.visibleVaults.push(card);
            }
        });

        // Calculate pagination
        this.totalPages = Math.ceil(this.visibleVaults.length / this.itemsPerPage);
        if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages || 1;
        }

        // Display current page
        this.displayCurrentPage();

        // Update pagination display
        this.updatePaginationDisplay();

        // Update empty state
        this.updateEmptyState(this.visibleVaults.length, searchTerm, filter);
    },

    // Check if card status matches filter
    matchesFilter(cardStatus, filter) {
        switch (filter) {
            case 'all':
                return cardStatus === 'active' || cardStatus === 'inactive';
            case 'active':
                return cardStatus === 'active';
            case 'inactive':
                return cardStatus === 'inactive';
            case 'deleted':
                return cardStatus === 'deleted';
            default:
                return true;
        }
    },

    // Display current page
    displayCurrentPage() {
        const vaultCards = document.querySelectorAll('.card-vault');
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;

        // Hide all vaults first
        vaultCards.forEach((card, index) => {
            card.style.display = 'none';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95) translateY(-5px)';
        });

        // Show vaults for current page with animation
        this.visibleVaults.slice(startIndex, endIndex).forEach((card, index) => {
            setTimeout(() => {
                card.style.display = 'block';
                card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                card.style.opacity = '1';
                card.style.transform = 'scale(1) translateY(0)';
            }, index * 50);
        });
    },

    // Update pagination display
    updatePaginationDisplay() {
        const paginationContainer = document.getElementById('vault-pagination');
        if (!paginationContainer) {
            console.log('Pagination container not found, creating...');
            this.createPaginationContainer();
            return;
        }

        // Check if loader is currently showing
        const loader = document.getElementById('loader');
        const mainContent = document.getElementById('main-content');
        const isLoaderShowing = loader && loader.style.display === 'flex';
        const isMainContentHidden = mainContent && mainContent.style.display === 'none';

        // Don't show pagination if loader is showing or main content is hidden
        if (isLoaderShowing || isMainContentHidden) {
            paginationContainer.style.display = 'none';
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endIndex = Math.min(this.currentPage * this.itemsPerPage, this.visibleVaults.length);
        const totalVaults = this.visibleVaults.length;

        console.log(`Updating pagination - Total: ${totalVaults}, Pages: ${this.totalPages}, Current: ${this.currentPage}, Start: ${startIndex}, End: ${endIndex}`);

        // Update pagination info
        const startElement = document.getElementById('pagination-start');
        const endElement = document.getElementById('pagination-end');
        const totalElement = document.getElementById('pagination-total');

        if (startElement) startElement.textContent = totalVaults > 0 ? startIndex : 0;
        if (endElement) endElement.textContent = endIndex;
        if (totalElement) totalElement.textContent = totalVaults;

        // Update pagination buttons
        const prevBtn = document.getElementById('pagination-prev');
        const nextBtn = document.getElementById('pagination-next');

        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
            prevBtn.classList.toggle('disabled', this.currentPage <= 1);
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= this.totalPages;
            nextBtn.classList.toggle('disabled', this.currentPage >= this.totalPages);
        }

        // Update page numbers
        this.updatePageNumbers();

        // Show pagination if there are vaults to display (even if only 1 page)
        // Only show if not in initial delay period
        if (this.visibleVaults.length > 0 && !this.isInInitialDelay) {
            paginationContainer.style.display = 'flex';
        } else {
            paginationContainer.style.display = 'none';
        }

        console.log(`Pagination display: ${paginationContainer.style.display}, Visible vaults: ${this.visibleVaults.length}, In delay: ${this.isInInitialDelay}`);
    },

    // Update page numbers
    updatePageNumbers() {
        const numbersContainer = document.getElementById('pagination-numbers');
        if (!numbersContainer) return;

        numbersContainer.innerHTML = '';

        if (this.totalPages <= 1) return;

        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Add first page and ellipsis if needed
        if (startPage > 1) {
            this.addPageNumber(numbersContainer, 1);
            if (startPage > 2) {
                this.addEllipsis(numbersContainer);
            }
        }

        // Add visible page numbers
        for (let i = startPage; i <= endPage; i++) {
            this.addPageNumber(numbersContainer, i);
        }

        // Add last page and ellipsis if needed
        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                this.addEllipsis(numbersContainer);
            }
            this.addPageNumber(numbersContainer, this.totalPages);
        }
    },

    // Add page number button
    addPageNumber(container, pageNumber) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'pagination-number';
        pageBtn.textContent = pageNumber;

        if (pageNumber === this.currentPage) {
            pageBtn.classList.add('active');
        }

        pageBtn.addEventListener('click', () => {
            this.goToPage(pageNumber);
        });

        container.appendChild(pageBtn);
    },

    // Add ellipsis
    addEllipsis(container) {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'pagination-ellipsis';
        ellipsis.textContent = '...';
        container.appendChild(ellipsis);
    },



    // Update empty state display
    updateEmptyState(visibleCount, searchTerm, filter) {
        const originalEmptyState = document.getElementById('original-empty-state');
        const filterEmptyBox = document.getElementById('filter-empty-state');
        const trashEmptyState = document.getElementById('trash-empty-state');

        // Hide all empty states first
        if (originalEmptyState) originalEmptyState.style.display = 'none';
        if (filterEmptyBox) filterEmptyBox.style.display = 'none';
        if (trashEmptyState) trashEmptyState.style.display = 'none';

        // Show appropriate empty state
        if (visibleCount === 0) {
            if (searchTerm) {
                // Search with no results
                if (filterEmptyBox) {
                    const emptyText = filterEmptyBox.querySelector('.empty-vault-text');
                    if (emptyText) {
                        emptyText.textContent = `No vaults found for "${searchTerm}"`;
                    }
                    filterEmptyBox.style.display = 'block';
                }
            } else {
                // No search, just filter with no results
                if (filter === 'deleted') {
                    // Trash tab
                    if (trashEmptyState) {
                        trashEmptyState.style.display = 'block';
                    }
                } else {
                    // My Vaults tab
                    if (originalEmptyState) {
                        originalEmptyState.style.display = 'block';
                    }
                }
            }
        }
    },

    // Public method to reset to current filter (for external use)
    resetToCurrentFilter() {
        this.updateCurrentState();
        this.performSearch();
    },

    // Public method to apply filter (for external use)
    applyFilter(filter) {
        this.currentFilter = filter;
        this.performSearch();
    }
};

// Initialize vault manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    VaultManager.init();
});

document.addEventListener('DOMContentLoaded', function () {
    const saveProfileBtn = document.getElementById('save-profile-btn');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', function () {
            const name = document.getElementById('profile-username').value;
            const gender = document.getElementById('profile-gender').value;
            const phoneNumber = document.getElementById('profile-phone').value;
            const dateOfBirth = document.getElementById('profile-dob').value;

            const formData = new FormData();
            formData.append('name', name);
            formData.append('gender', gender);
            formData.append('phoneNumber', phoneNumber);
            formData.append('dateOfBirth', dateOfBirth);

            fetch('/auth/update-profile', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showToast(data.message || 'Profile updated successfully', 'success');
                    } else {
                        showToast(data.error || 'Failed to update profile', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showToast('An error occurred while updating profile', 'error');
                });
        });
    }
});

// ---------------------------------Sidebar Navigation Functionality-------------------------------------

// Initialize sidebar navigation
document.addEventListener('DOMContentLoaded', function () {
    const myVaultsLink = document.getElementById('my-vaults-link');
    const trashLink = document.getElementById('trash-link');

    if (myVaultsLink && trashLink) {
        myVaultsLink.addEventListener('click', function (e) {
            e.preventDefault();
            updateSidebarActiveState('my-vaults');
            // Keep search term, reset to default filter for my-vaults tab
            VaultManager.currentTab = 'my-vaults';
            VaultManager.currentPage = 1; // Reset to first page
            VaultManager.isInInitialDelay = false; // End delay when user interacts
            const activeFilterLink = document.querySelector('.navbar-filter-link.navbar-filter-active');
            VaultManager.currentFilter = activeFilterLink ? activeFilterLink.getAttribute('data-filter') : 'all';
            VaultManager.performSearch();
        });

        trashLink.addEventListener('click', function (e) {
            e.preventDefault();
            updateSidebarActiveState('trash');
            // Keep search term, just update tab and filter
            VaultManager.currentTab = 'trash';
            VaultManager.currentPage = 1; // Reset to first page
            VaultManager.isInInitialDelay = false; // End delay when user interacts
            VaultManager.currentFilter = 'deleted';
            VaultManager.performSearch();
        });
        // Initialize with default filter (don't clear search if exists)
        VaultManager.updateCurrentState();
        VaultManager.performSearch();
    }
});

function updateSidebarActiveState(activeTab) {
    const myVaultsLink = document.getElementById('my-vaults-link');
    const trashLink = document.getElementById('trash-link');
    if (myVaultsLink) myVaultsLink.classList.remove('sidebar-link-active');
    if (trashLink) trashLink.classList.remove('sidebar-link-active');
    if (activeTab === 'my-vaults' && myVaultsLink) {
        myVaultsLink.classList.add('sidebar-link-active');
    } else if (activeTab === 'trash' && trashLink) {
        trashLink.classList.add('sidebar-link-active');
    }
}



// ---------------------------------Vault Meatball Menu and Confirm Modals-------------------------------------

let currentVaultIdToRestore = null;
let currentVaultIdToDelete = null;

document.addEventListener('DOMContentLoaded', function () {
    // Initialize filter functionality
    initializeFilterTabs();

    document.addEventListener('click', function (event) {
        // Check if clicked on inactive vault
        const vaultCard = event.target.closest('.card-vault');
        if (vaultCard && vaultCard.classList.contains('vault-inactive')) {
            // Prevent interaction with inactive vaults
            event.preventDefault();
            event.stopPropagation();
            showToast('This vault is inactive and cannot be accessed', 'warning');
            return;
        }

        if (event.target.closest('.meatball-menu-btn')) {
            const button = event.target.closest('.meatball-menu-btn');
            const vaultCard = button.closest('.card-vault');

            // Allow meatball menu for trash vaults (deleted vaults)
            if (vaultCard && vaultCard.classList.contains('trash-vault')) {
                const vaultId = button.getAttribute('data-vault-id');
                toggleVaultMenu(vaultId);
                return;
            }

            // Prevent meatball menu for inactive vaults
            if (vaultCard && vaultCard.classList.contains('vault-inactive')) {
                event.preventDefault();
                event.stopPropagation();
                showToast('This vault is inactive and cannot be modified', 'warning');
                return;
            }

            // Prevent meatball menu for active vaults (they should only have edit button)
            if (vaultCard && !vaultCard.classList.contains('vault-inactive')) {
                event.preventDefault();
                event.stopPropagation();
                showToast('Active vaults can only be edited, not deleted', 'info');
                return;
            }

            const vaultId = button.getAttribute('data-vault-id');
            toggleVaultMenu(vaultId);
        }

        if (event.target.closest('.restore-item')) {
            const button = event.target.closest('.restore-item');
            const vaultId = button.getAttribute('data-vault-id');
            const vaultName = button.getAttribute('data-vault-name');
            showRestoreConfirm(vaultId, vaultName);
        }

        if (event.target.closest('.delete-item')) {
            const button = event.target.closest('.delete-item');
            const vaultId = button.getAttribute('data-vault-id');
            const vaultName = button.getAttribute('data-vault-name');
            showDeleteNowConfirm(vaultId, vaultName);
        }
    });
});

function initializeFilterTabs() {
    const filterLinks = document.querySelectorAll('.navbar-filter-link');

    filterLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            // Remove active class from all filter links
            filterLinks.forEach(l => l.classList.remove('navbar-filter-active'));

            // Add active class to clicked link
            this.classList.add('navbar-filter-active');

            // Get filter value and apply using VaultManager (keep search term)
            const filterValue = this.getAttribute('data-filter');
            VaultManager.currentFilter = filterValue;
            VaultManager.currentPage = 1; // Reset to first page
            VaultManager.isInInitialDelay = false; // End delay when user interacts
            VaultManager.performSearch();
        });
    });

    // Apply default filter on page load (keep search term if exists)
    const activeFilterLink = document.querySelector('.navbar-filter-link.navbar-filter-active');
    if (activeFilterLink) {
        const defaultFilter = activeFilterLink.getAttribute('data-filter');
        console.log('Initializing with default filter:', defaultFilter);
        VaultManager.currentFilter = defaultFilter;
        VaultManager.currentPage = 1; // Reset to first page
        VaultManager.performSearch();
    }
}



function toggleVaultMenu(vaultId) {
    // Close all other menus first
    document.querySelectorAll('.vault-menu-dropdown').forEach(menu => {
        if (menu.id !== `vault-menu-${vaultId}` && menu.id !== `trash-menu-${vaultId}`) {
            menu.style.display = 'none';
        }
    });

    // Try to find regular vault menu
    let menu = document.getElementById(`vault-menu-${vaultId}`);

    // If not found, try to find trash menu
    if (!menu) {
        menu = document.getElementById(`trash-menu-${vaultId}`);
    }

    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

document.addEventListener('click', function (event) {
    if (!event.target.closest('.vault-actions-menu')) {
        document.querySelectorAll('.vault-menu-dropdown').forEach(menu => {
            menu.style.display = 'none';
        });
    }
});

function showRestoreConfirm(vaultId, vaultName) {
    currentVaultIdToRestore = vaultId;
    document.getElementById('restoreVaultName').textContent = vaultName;
    document.getElementById('restoreVaultModal').style.display = 'block';
    const menu = document.getElementById(`vault-menu-${vaultId}`);
    if (menu) {
        menu.style.display = 'none';
    }
}

function hideRestoreConfirm() {
    document.getElementById('restoreVaultModal').style.display = 'none';
    currentVaultIdToRestore = null;
}

function confirmRestore() {
    if (currentVaultIdToRestore) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/vault-management/restore-vault';

        const vaultIdInput = document.createElement('input');
        vaultIdInput.type = 'hidden';
        vaultIdInput.name = 'vaultId';
        vaultIdInput.value = currentVaultIdToRestore;
        form.appendChild(vaultIdInput);

        const csrfToken = document.querySelector('meta[name="_csrf"]');
        const csrfHeader = document.querySelector('meta[name="_csrf_header"]');
        if (csrfToken && csrfHeader) {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_csrf';
            csrfInput.value = csrfToken.getAttribute('content');
            form.appendChild(csrfInput);
        }

        document.body.appendChild(form);
        form.submit();
    }
    hideRestoreConfirm();
}

function showDeleteNowConfirm(vaultId, vaultName) {
    currentVaultIdToDelete = vaultId;
    document.getElementById('deleteNowVaultName').textContent = vaultName;
    document.getElementById('deleteNowVaultModal').style.display = 'block';

    const menu = document.getElementById(`vault-menu-${vaultId}`);
    if (menu) {
        menu.style.display = 'none';
    }
}

function hideDeleteNowConfirm() {
    document.getElementById('deleteNowVaultModal').style.display = 'none';
    currentVaultIdToDelete = null;
}

function confirmDeleteNow() {
    if (currentVaultIdToDelete) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/vault-management/delete-vault-permanently';

        const vaultIdInput = document.createElement('input');
        vaultIdInput.type = 'hidden';
        vaultIdInput.name = 'vaultId';
        vaultIdInput.value = currentVaultIdToDelete;
        form.appendChild(vaultIdInput);

        const csrfToken = document.querySelector('meta[name="_csrf"]');
        const csrfHeader = document.querySelector('meta[name="_csrf_header"]');
        if (csrfToken && csrfHeader) {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_csrf';
            csrfInput.value = csrfToken.getAttribute('content');
            form.appendChild(csrfInput);
        }

        document.body.appendChild(form);
        form.submit();
    }
    hideDeleteNowConfirm();
}

document.addEventListener('click', function (event) {
    const restoreModal = document.getElementById('restoreVaultModal');
    const deleteModal = document.getElementById('deleteNowVaultModal');
    if (event.target === restoreModal) {
        hideRestoreConfirm();
    }
    if (event.target === deleteModal) {
        hideDeleteNowConfirm();
    }
});











