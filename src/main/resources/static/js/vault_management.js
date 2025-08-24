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
    const cancelAddVaultBtn = document.getElementById('cancel-add-vault');
    const backToListBtn = document.getElementById('back-to-list-btn');

    if (addVaultBtn) {
        addVaultBtn.addEventListener('click', function () {
            // Clear any existing form data when starting fresh
            clearFormData();

            // Reset form
            const addVaultForm = document.getElementById('add-vault-form');
            if (addVaultForm) {
                addVaultForm.reset();

                // Reset photo preview
                const photoPreview = document.getElementById('photoPreview');
                if (photoPreview) {
                    photoPreview.src = '/images/vault/vault_df.webp';
                }
            }

            showAddVaultForm();
        });
    }
    if (cancelAddVaultBtn) {
        cancelAddVaultBtn.addEventListener('click', function () {
            // Clear saved form data
            clearFormData();

            // Reset form
            const addVaultForm = document.getElementById('add-vault-form');
            if (addVaultForm) {
                addVaultForm.reset();

                // Reset photo preview
                const photoPreview = document.getElementById('photoPreview');
                if (photoPreview) {
                    photoPreview.src = '/images/vault/vault_df.webp';
                }
            }

            hideAddVaultForm();
        });
    }
    if (backToListBtn) {
        backToListBtn.addEventListener('click', function () {
            // Clear saved form data
            clearFormData();

            // Reset form
            const addVaultForm = document.getElementById('add-vault-form');
            if (addVaultForm) {
                addVaultForm.reset();

                // Reset photo preview
                const photoPreview = document.getElementById('photoPreview');
                if (photoPreview) {
                    photoPreview.src = '/images/vault/vault_df.webp';
                }
            }

            hideAddVaultForm();
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

            // Check if user is already a member
            const isAlreadyMember = this.getAttribute("data-is-member") === "true";
            if (isAlreadyMember) {
                showToast('User is already a member of this vault', 'warning');
                return;
            }

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

            // Check if selected user is already a member
            const selectedSuggestion = document.querySelector('.suggestion-item[data-user-id="' + userId + '"]');
            if (selectedSuggestion && selectedSuggestion.getAttribute('data-is-member') === 'true') {
                showFieldError('searchUserInput', 'This user is already a member of this vault');
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
        this.initPagination();
        this.loadSearchTermFromInput();
        this.updateCurrentState();

        // Wait for loader to finish before showing pagination
        const checkLoaderInterval = setInterval(() => {
            const loader = document.getElementById('loader');
            const mainContent = document.getElementById('main-content');

            if (loader && mainContent && loader.style.display === 'none' && mainContent.style.display === 'flex') {
                clearInterval(checkLoaderInterval);

                // Hide pagination if form is showing
                const shouldShowAddVaultForm = sessionStorage.getItem('showAddVaultForm') === 'true';
                if (shouldShowAddVaultForm) {
                    const paginationContainer = document.getElementById('vault-pagination');
                    if (paginationContainer) {
                        paginationContainer.style.display = 'none';
                    }
                    return;
                }

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
            } else {
                // If loader is still showing, hide pagination
                const paginationContainer = document.getElementById('vault-pagination');
                if (paginationContainer) {
                    paginationContainer.style.display = 'none';
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
        // Don't create pagination if form is showing
        const shouldShowAddVaultForm = sessionStorage.getItem('showAddVaultForm') === 'true';
        if (!shouldShowAddVaultForm) {
            this.createPaginationContainer();
            this.updatePaginationDisplay();
        }
    },

    // Create pagination container
    createPaginationContainer() {
        // Check if pagination already exists
        if (document.getElementById('vault-pagination')) return;

        // Check if loader is currently showing
        const loader = document.getElementById('loader');
        const mainContent = document.getElementById('main-content');
        const isLoaderShowing = loader && loader.style.display === 'flex';
        const isMainContentHidden = mainContent && mainContent.style.display === 'none';

        // Don't create pagination if loader is showing or main content is hidden
        if (isLoaderShowing || isMainContentHidden) {
            return;
        }

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

        // Debounce search
        this.searchTimeout = setTimeout(() => {
            this.performSearch();
        }, 300);
    },

    // Update clear button visibility
    updateClearButtonVisibility(searchTerm) {
        const clearButton = document.getElementById('clear-search-btn');
        if (clearButton) {
            clearButton.classList.toggle('show', searchTerm.length > 0);
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

        // Show loading spinner
        const vaultLoading = document.getElementById('vault-loading');
        if (vaultLoading) {
            vaultLoading.style.display = 'flex';
        }

        // Hide all vaults first
        vaultCards.forEach((card, index) => {
            card.style.display = 'none';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95) translateY(-5px)';
        });

        // Show vaults for current page after a short delay
        setTimeout(() => {
            // Hide loading spinner
            if (vaultLoading) {
                vaultLoading.style.display = 'none';
            }

            // Show all vaults at once
            this.visibleVaults.slice(startIndex, endIndex).forEach((card) => {
                card.style.display = 'block';
                card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                card.style.opacity = '1';
                card.style.transform = 'scale(1) translateY(0)';
            });
        }, 500); // 500ms delay to show loading spinner
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

        // Check if add vault form is currently showing
        const isAddVaultFormShowing = sessionStorage.getItem('showAddVaultForm') === 'true';

        // Don't show pagination if loader is showing, main content is hidden, or add vault form is showing
        if (isLoaderShowing || isMainContentHidden || isAddVaultFormShowing) {
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

        // Hide pagination info if only 1 page
        const paginationInfo = document.querySelector('.pagination-info');
        if (paginationInfo) {
            if (this.totalPages <= 1) {
                paginationInfo.style.display = 'none';
            } else {
                paginationInfo.style.display = 'block';
            }
        }

        // Update pagination buttons
        const prevBtn = document.getElementById('pagination-prev');
        const nextBtn = document.getElementById('pagination-next');
        const paginationControls = document.querySelector('.pagination-controls');

        if (paginationControls) {
            if (this.totalPages <= 1) {
                paginationControls.style.display = 'none';
            } else {
                paginationControls.style.display = 'flex';
            }
        }

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

        // Show pagination only if there are multiple pages (more than 1 page)
        // Only show if not in initial delay period and add vault form is not showing
        if (this.totalPages > 1 && !this.isInInitialDelay && !isAddVaultFormShowing) {
            paginationContainer.style.display = 'flex';
        } else {
            paginationContainer.style.display = 'none';
        }

        console.log(`Pagination display: ${paginationContainer.style.display}, Visible vaults: ${this.visibleVaults.length}, In delay: ${this.isInInitialDelay}, Form showing: ${isAddVaultFormShowing}`);
    },

    // Update page numbers
    updatePageNumbers() {
        const numbersContainer = document.getElementById('pagination-numbers');
        if (!numbersContainer) return;

        numbersContainer.innerHTML = '';

        // Don't show pagination numbers if only 1 page or less
        if (this.totalPages <= 1) {
            return;
        }

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

    // Force hide pagination if form is showing on page load
    const shouldShowAddVaultForm = sessionStorage.getItem('showAddVaultForm') === 'true';
    if (shouldShowAddVaultForm) {
        setTimeout(() => {
            const pagination = document.getElementById('vault-pagination');
            if (pagination) {
                pagination.style.display = 'none';
            }
        }, 300);
    }

    // Check and hide pagination if loader is showing
    checkAndHidePaginationForLoader();
});

// Function to check and hide pagination when loader is showing
function checkAndHidePaginationForLoader() {
    const loader = document.getElementById('loader');
    const mainContent = document.getElementById('main-content');
    const pagination = document.getElementById('vault-pagination');

    if (loader && mainContent && pagination) {
        const isLoaderShowing = loader.style.display === 'flex';
        const isMainContentHidden = mainContent.style.display === 'none';

        if (isLoaderShowing || isMainContentHidden) {
            pagination.style.display = 'none';
        }
    }
}

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
            // Clear form state when navigating
            clearFormData();
            sessionStorage.removeItem('showAddVaultForm');
            hideAddVaultForm();
            // Ensure elements are shown
            showVaultListElements();
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
            // Clear form state when navigating
            clearFormData();
            sessionStorage.removeItem('showAddVaultForm');
            hideAddVaultForm();
            // Ensure elements are shown
            showVaultListElements();
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

            // Clear form state when filtering
            clearFormData();
            sessionStorage.removeItem('showAddVaultForm');
            hideAddVaultForm();
            // Ensure elements are shown
            showVaultListElements();

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












// ---------------------------------Photo Preview Function-------------------------------------

function previewVaultPhoto(input) {
    const file = input.files[0];
    const preview = document.getElementById('photoPreview');

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function removeVaultPhoto() {
    const input = document.getElementById('vaultPhoto');
    const preview = document.getElementById('photoPreview');

    if (input) {
        input.value = '';
    }
    if (preview) {
        preview.src = '/images/vault/vault_df.webp';
    }
}

// ---------------------------------AJAX Vault Creation-------------------------------------

// This function is now handled by initializeAddVaultForm()

function saveFormData(form) {
    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
        if (key !== 'photo') { // Don't save file input
            data[key] = value;
        }
    }

    sessionStorage.setItem('addVaultFormData', JSON.stringify(data));
}

function restoreFormData(form) {
    const savedData = sessionStorage.getItem('addVaultFormData');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            Object.keys(data).forEach(key => {
                const field = form.querySelector(`[name="${key}"]`);
                if (field && field.type !== 'file') {
                    field.value = data[key];
                }
            });
        } catch (e) {
            console.error('Error restoring form data:', e);
        }
    }
}

function clearFormData() {
    sessionStorage.removeItem('addVaultFormData');
}

function handleAddVaultAjax(form) {
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = `
        <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-dasharray="31.416" stroke-dashoffset="31.416">
                <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
            </svg>
        <span>Creating...</span>
    `;
    submitBtn.disabled = true;

    // Clear previous errors
    clearFormErrors(form);

    const formData = new FormData(form);

    fetch('/vault-management/add-vault-ajax', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
        .then(response => {
            // Always try to parse JSON response first
            return response.json().then(data => {
                console.log('Raw response data:', data);
                if (!response.ok) {
                    // If response is not ok, throw the parsed data
                    throw new Error(JSON.stringify(data));
                }
                return data;
            });
        })
        .then(data => {
            console.log('Processing response data:', data);
            if (data.success) {
                // Show success message
                showToast(data.message, 'success');

                // Reset form
                form.reset();

                // Clear saved form data
                clearFormData();

                // Reset photo preview
                const photoPreview = document.getElementById('photoPreview');
                if (photoPreview) {
                    photoPreview.src = '/images/vault/vault_df.webp';
                }

                // Switch back to vault list view with smooth transition
                const vaultListContent = document.getElementById('vault-list-content');
                const addVaultFormContent = document.getElementById('add-vault-form-content');

                if (vaultListContent && addVaultFormContent) {
                    // Add transition classes
                    addVaultFormContent.style.opacity = '0';
                    addVaultFormContent.style.transform = 'translateY(10px)';

                    setTimeout(() => {
                        hideAddVaultForm();

                        // Trigger reflow
                        vaultListContent.offsetHeight;

                        vaultListContent.style.opacity = '1';
                        vaultListContent.style.transform = 'translateY(0)';

                        // Ensure elements are shown
                        showVaultListElements();

                        // Clear form state
                        sessionStorage.removeItem('showAddVaultForm');
                        sessionStorage.removeItem('addVaultFormData');

                        // Show loading spinner and refresh vault list via AJAX
                        refreshVaultListAfterCreation();
                    }, 300);
                }
            } else {
                console.log('Response indicates failure:', data);
                console.log('Errors in response:', data.errors);

                // Display field errors if any
                if (data.errors && Object.keys(data.errors).length > 0) {
                    console.log('Displaying field errors:', data.errors);
                    displayFormErrors(form, data.errors);
                    // Don't show toast for field errors
                } else {
                    // Show error message only if no field errors
                    showToast(data.message, 'error');
                }

                // Keep user on the form and ensure form state is saved
                sessionStorage.setItem('showAddVaultForm', 'true');
            }
        })
        .catch(error => {
            console.error('Error:', error);

            // Try to parse error data for validation errors
            try {
                const errorData = JSON.parse(error.message);
                console.log('Parsed error data:', errorData);

                if (errorData.errors && Object.keys(errorData.errors).length > 0) {
                    // Display field-specific errors
                    displayFormErrors(form, errorData.errors);
                    // Don't show toast for field errors, let the field errors speak for themselves
                } else if (errorData.message) {
                    // Show specific error message
                    showToast(errorData.message, 'error');
                } else {
                    showToast('An error occurred while creating the vault. Please try again.', 'error');
                }
            } catch (parseError) {
                console.error('Failed to parse error:', parseError);
                showToast('An error occurred while creating the vault. Please try again.', 'error');
            }

            // Keep user on the form and ensure form state is saved
            sessionStorage.setItem('showAddVaultForm', 'true');
        })
        .finally(() => {
            // Restore button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
}

function clearFormErrors(form) {
    // Remove error styling from inputs
    form.querySelectorAll('.input-error').forEach(input => {
        input.classList.remove('input-error');
    });

    // Remove error messages
    form.querySelectorAll('.text-danger').forEach(error => {
        error.textContent = '';
        error.style.display = 'none';
    });
}

function displayFormErrors(form, errors) {
    console.log('Displaying form errors:', errors);

    Object.keys(errors).forEach(fieldName => {
        console.log('Processing error for field:', fieldName);

        // Try different selectors to find the field
        let field = form.querySelector(`[name="${fieldName}"]`);
        if (!field) {
            field = form.querySelector(`#${fieldName}`);
        }
        if (!field) {
            field = form.querySelector(`[id*="${fieldName}"]`);
        }
        if (!field) {
            // Try to find by common field names
            if (fieldName === 'name') {
                field = form.querySelector('#vaultName');
            }
        }

        if (field) {
            console.log('Found field:', field);

            // Add error styling
            field.classList.add('input-error');

            // Find existing error element in the form group
            const formGroup = field.closest('.form-group');
            let errorElement = null;

            if (formGroup) {
                errorElement = formGroup.querySelector('.text-danger');
            }

            if (!errorElement) {
                // Create new error element
                errorElement = document.createElement('div');
                errorElement.className = 'text-danger';
                errorElement.style.cssText = 'margin-bottom: -15px; margin-top: 0px;';

                // Insert after the input wrapper
                const inputWrapper = field.closest('.input-vaultname-wrapper');
                if (inputWrapper) {
                    inputWrapper.appendChild(errorElement);
                } else {
                    field.parentNode.appendChild(errorElement);
                }
            }

            // Display error message
            errorElement.textContent = errors[fieldName];
            errorElement.style.display = 'block';

            console.log('Error displayed for field:', fieldName, 'Message:', errors[fieldName]);
        } else {
            console.log('Field not found:', fieldName);
        }
    });
}












// ---------------------------------Form State Management-------------------------------------

document.addEventListener('DOMContentLoaded', function () {
    // Check if we should show the add vault form based on sessionStorage
    const shouldShowAddVaultForm = sessionStorage.getItem('showAddVaultForm') === 'true';

    if (shouldShowAddVaultForm) {
        // Delay a bit to ensure DOM is fully loaded
        setTimeout(() => {
            showAddVaultFormOnLoad();
        }, 100);
    } else {
        // If form is not showing, ensure elements are visible
        setTimeout(() => {
            showVaultListElements();
        }, 100);
    }

    // Initialize form event listeners
    initializeAddVaultForm();

    // Force hide pagination if form is showing on page load
    if (shouldShowAddVaultForm) {
        setTimeout(() => {
            const pagination = document.getElementById('vault-pagination');
            if (pagination) {
                pagination.style.display = 'none';
            }
        }, 200);
    }
});

function showAddVaultForm() {
    const vaultListContent = document.getElementById('vault-list-content');
    const addVaultFormContent = document.getElementById('add-vault-form-content');

    if (vaultListContent && addVaultFormContent) {
        vaultListContent.classList.add('hidden');
        addVaultFormContent.classList.remove('hidden');

        // Hide elements when showing form
        hideVaultListElements();

        // Save state to sessionStorage
        sessionStorage.setItem('showAddVaultForm', 'true');
    }
}

function showAddVaultFormOnLoad() {
    const vaultListContent = document.getElementById('vault-list-content');
    const addVaultFormContent = document.getElementById('add-vault-form-content');

    if (vaultListContent && addVaultFormContent) {
        vaultListContent.classList.add('hidden');
        addVaultFormContent.classList.remove('hidden');

        // Hide elements immediately when loading from sessionStorage
        hideVaultListElementsImmediately();

        // Force hide pagination immediately
        const pagination = document.getElementById('vault-pagination');
        if (pagination) {
            pagination.style.display = 'none';
        }

        // Save state to sessionStorage
        sessionStorage.setItem('showAddVaultForm', 'true');
    }
}

function hideVaultListElementsImmediately() {
    // Hide pagination immediately
    const pagination = document.getElementById('vault-pagination');
    if (pagination) {
        pagination.style.display = 'none';
    }

    // Hide filter tabs immediately
    const filterTabs = document.querySelector('.navbar-filter-tabs');
    if (filterTabs) {
        filterTabs.style.display = 'none';
    }

    // Hide search input immediately
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
        searchContainer.style.display = 'none';
    }
}

function hideAddVaultForm() {
    const vaultListContent = document.getElementById('vault-list-content');
    const addVaultFormContent = document.getElementById('add-vault-form-content');

    if (vaultListContent && addVaultFormContent) {
        addVaultFormContent.classList.add('hidden');
        vaultListContent.classList.remove('hidden');

        // Show elements when hiding form
        showVaultListElements();

        // Clear state from sessionStorage
        sessionStorage.removeItem('showAddVaultForm');
    }
}

function hideVaultListElements() {
    // Hide pagination with smooth transition
    const pagination = document.getElementById('vault-pagination');
    if (pagination) {
        pagination.style.opacity = '0';
        pagination.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            pagination.style.display = 'none';
        }, 300);
    }

    // Hide filter tabs with smooth transition
    const filterTabs = document.querySelector('.navbar-filter-tabs');
    if (filterTabs) {
        filterTabs.style.opacity = '0';
        filterTabs.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            filterTabs.style.display = 'none';
        }, 300);
    }

    // Hide search input with smooth transition
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
        searchContainer.style.opacity = '0';
        searchContainer.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            searchContainer.style.display = 'none';
        }, 300);
    }
}

function showVaultListElements() {
    // Show pagination with smooth transition
    const pagination = document.getElementById('vault-pagination');
    if (pagination) {
        pagination.style.display = 'flex';
        // Trigger reflow
        pagination.offsetHeight;
        pagination.style.opacity = '1';
        pagination.style.transform = 'translateY(0)';
    }

    // Show filter tabs with smooth transition
    const filterTabs = document.querySelector('.navbar-filter-tabs');
    if (filterTabs) {
        filterTabs.style.display = 'flex';
        // Trigger reflow
        filterTabs.offsetHeight;
        filterTabs.style.opacity = '1';
        filterTabs.style.transform = 'translateY(0)';
    }

    // Show search input with smooth transition
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
        searchContainer.style.display = 'flex';
        // Trigger reflow
        searchContainer.offsetHeight;
        searchContainer.style.opacity = '1';
        searchContainer.style.transform = 'translateY(0)';
    }
}

function initializeAddVaultForm() {
    const addVaultForm = document.getElementById('add-vault-form');
    if (addVaultForm) {
        addVaultForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleAddVaultAjax(this);
        });

        // Save form data to sessionStorage when user types
        const formInputs = addVaultForm.querySelectorAll('input, textarea');
        formInputs.forEach(input => {
            input.addEventListener('input', function () {
                saveFormData(addVaultForm);
            });
        });

        // Restore form data if exists
        restoreFormData(addVaultForm);
    }
}

function refreshVaultListAfterCreation() {
    // Show loading spinner
    const vaultLoading = document.getElementById('vault-loading');
    if (vaultLoading) {
        vaultLoading.style.display = 'flex';
    }

    // Fetch the newly created vault data
    fetch('/vault-management/get-latest-vault', {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Add the new vault to the existing list
                addNewVaultToExistingList(data.vault);

                // Re-initialize VaultManager to update pagination and filters
                if (typeof VaultManager !== 'undefined') {
                    VaultManager.performSearch();
                }
            } else {
                throw new Error(data.message || 'Failed to get new vault data');
            }
        })
        .catch(error => {
            console.error('Error getting new vault data:', error);
            showToast('Failed to update vault list. Please refresh the page manually.', 'error');
        })
        .finally(() => {
            // Hide loading spinner
            if (vaultLoading) {
                vaultLoading.style.display = 'none';
            }
        });
}

function addNewVaultToExistingList(vaultData) {
    const vaultListContainer = document.querySelector('.content-card-list');
    if (!vaultListContainer) return;

    // Create new vault card
    const newVaultCard = createVaultCardFromData(vaultData);

    // Add the new card to the container
    vaultListContainer.appendChild(newVaultCard);

    // Add event listeners to the new card
    addEventListenersToVaultCard(newVaultCard);

    // Show success message
    showToast('Vault created successfully!', 'success');
}

function addEventListenersToVaultCard(vaultCard) {
    // Add meatball menu functionality
    const meatballMenuBtn = vaultCard.querySelector('.meatball-menu-btn');
    if (meatballMenuBtn) {
        meatballMenuBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            const vaultId = this.getAttribute('data-vault-id');
            toggleVaultMenu(vaultId);
        });
    }

    // Add delete item functionality
    const deleteItem = vaultCard.querySelector('.delete-item');
    if (deleteItem) {
        deleteItem.addEventListener('click', function (e) {
            e.stopPropagation();
            const vaultId = this.getAttribute('data-vault-id');
            const vaultName = this.getAttribute('data-vault-name');
            showDeleteNowConfirm(vaultId, vaultName);
        });
    }
}

function createVaultCardFromData(vaultData) {
    const card = document.createElement('div');
    card.className = 'card-vault';
    card.setAttribute('data-status', vaultData.isActivated ? 'active' : 'inactive');
    card.setAttribute('data-vault-id', vaultData.id);

    // Determine status class
    if (!vaultData.isActivated) {
        card.classList.add('vault-inactive');
    }

    // Create card HTML using the exact same structure as existing cards
    card.innerHTML = `
        ${!vaultData.isActivated ? '<div class="inactive-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.3); z-index: 10; border-radius: 8px; pointer-events: none;"></div>' : ''}
        
        <div class="card-vault-header" style="display: flex; align-items: center; gap: 12px; position: relative; z-index: 2;">
            <div class="vault-picture">
                <img src="${vaultData.photoUrl || '/images/vault/vault_df.webp'}" alt="vault picture" style="object-fit: cover; width: 100%; height: 100%;">
            </div>
            <div class="vault-header-info" style="flex: 1; min-width: 0;">
                <a class="vault-name" href="/vault-detail?id=${vaultData.id}&assistant=true" style="text-decoration: none;">${vaultData.name}</a>
                <div class="vault-owner" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${vaultData.ownerEmail}">
                    Vault owner: <span style="white-space: nowrap;">${vaultData.ownerEmail}</span>
                </div>
            </div>

            ${vaultData.isActivated ? `
                <a type="submit" class="edit-vault-btn" href="/vault-management/edit-vault/general?id=${vaultData.id}" style="background: none; border: none; padding: 0; margin: 0; cursor: pointer; position: relative; z-index: 3;">
                    <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
                        <path stroke="#555555" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z" />
                    </svg>
                </a>
            ` : `
                <div class="vault-actions-menu" style="position: relative; z-index: 3;">
                    <button class="meatball-menu-btn" data-vault-id="${vaultData.id}" style="background: none; border: none; padding: 4px; cursor: pointer; border-radius: 4px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="5" r="2" fill="#555555" />
                            <circle cx="12" cy="12" r="2" fill="#555555" />
                            <circle cx="12" cy="19" r="2" fill="#555555" />
                        </svg>
                    </button>
                    <div id="vault-menu-${vaultData.id}" class="vault-menu-dropdown" style="display: none; position: absolute; top: 100%; right: 0; background: white; border: 1px solid #e1e5e9; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); min-width: 150px; z-index: 1000;">
                        <button class="vault-menu-item delete-item" data-vault-id="${vaultData.id}" data-vault-name="${vaultData.name}" style="width: 100%; padding: 12px 16px; border: none; background: none; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 8px; color: #dc3545; font-size: 14px; border-radius: 6px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>
            `}
        </div>
        <div class="card-divider"></div>
        <div class="card-vault-body">
            <div class="vault-info">
                <img src="/images/icon/Chart_pin_light.svg" alt="icon status">
                <span>Status:</span>
                <span class="${vaultData.isActivated ? 'status-active' : 'status-inactive'}">${vaultData.isActivated ? 'Active' : 'Inactive'}</span>
            </div>
            <div class="vault-info">
                <img src="/images/icon/Group_duotone_line.svg" alt="icon members">
                <span>Total members:</span>
                <span class="number-in-card">${vaultData.memberCount || 0}</span>
            </div>
            <div class="vault-info">
                <img src="/images/icon/Chemistry _light.svg" alt="icon knowledge">
                <span>Total knowledge articles:</span>
                <span class="number-in-card">${vaultData.documentCount || 0}</span>
            </div>
        </div>
        <div class="card-divider"></div>
        <div class="create-date">
            <img src="/images/icon/Time_duotone_line.svg" alt="icon knowledge">
            <span>Created on</span>
            <span>${formatDate(vaultData.createdAt)}</span>
        </div>
    `;

    return card;
}

function formatDate(dateString) {
    if (!dateString) return '--';

    try {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const year = date.getFullYear().toString().slice(-2);
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = (hours % 12 || 12).toString().padStart(2, '0');

        return `${day}/${month}/${year} ${displayHours}:${minutes} ${ampm}`;
    } catch (e) {
        return '--';
    }
}

// Function removed since we're using page reload instead of AJAX update

// Functions removed since we're using page reload instead of AJAX update











