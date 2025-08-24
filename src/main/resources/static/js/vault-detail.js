let currentFolderId = null;
let currentFolderWrapper = null;

function initializeDropdownMenus() {
    const dropdownIcons = document.querySelectorAll('.your-knowledge-dropdown-icon');
    dropdownIcons.forEach((icon, index) => {
        const newIcon = icon.cloneNode(true);
        icon.parentNode.replaceChild(newIcon, icon);
        newIcon.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const wrapper = newIcon.closest('.your-knowledge-wrapper');
            if (!wrapper) {
                return;
            }
            const menu = wrapper.querySelector('.knowledge-menu');
            if (!menu) {
                return;
            }
            document.querySelectorAll('.knowledge-menu').forEach(m => {
                if (m !== menu) m.style.display = 'none';
            });
            if (getComputedStyle(menu).display === 'block') {
                menu.style.display = 'none';
            } else {
                menu.style.display = 'block';
                menu.style.visibility = 'visible';
                menu.style.opacity = '1';
            }
        });
    });

    setupDeleteKnowledgeListeners();
}

function showToast(message, type = 'success') {
    const toast = document.getElementById("toast-notification");
    const toastMsg = document.getElementById("toast-message");
    if (!toast || !toastMsg) return;
    toast.innerHTML = '';
    const toastContent = document.createElement('div');
    toastContent.className = 'toast-content';
    let iconSvg;
    if (type === 'error') {
        iconSvg = `<svg class="toast-icon error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>`;
    } else {
        iconSvg = `<svg class="toast-icon success-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>`;
    }
    const messageSpan = document.createElement('span');
    messageSpan.id = 'toast-message';
    messageSpan.textContent = message;
    toastContent.innerHTML = iconSvg;
    toastContent.appendChild(messageSpan);
    toast.appendChild(toastContent);
    toast.className = "toast-notification";
    if (type === 'error') {
        toast.classList.add('error');
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

function showDeleteModal(folderId, wrapper, folderName) {
    currentFolderId = folderId;
    currentFolderWrapper = wrapper;
    const folderNameElement = document.getElementById('folderNameToDelete');
    if (folderNameElement) {
        folderNameElement.textContent = folderName || 'Folder';
    } else {
        return;
    }
    const popup = document.getElementById('deleteFolderPopup');
    if (popup) {
        popup.style.display = 'flex';
        setTimeout(() => {
            popup.classList.add('show');
        }, 10);
        setTimeout(() => {
            document.addEventListener('click', closePopupOnClickOutside);
        }, 100);
    } else {
        showToast('Popup not found. Please try again.', 'error');
    }
}

function hideDeleteModal() {
    const popup = document.getElementById('deleteFolderPopup');
    if (popup) {
        popup.classList.remove('show');

        setTimeout(() => {
            popup.style.display = 'none';
        }, 300);
    }
    currentFolderId = null;
    currentFolderWrapper = null;
    document.removeEventListener('click', closePopupOnClickOutside);
}

function closePopupOnClickOutside(event) {
    const popup = document.getElementById('deleteFolderPopup');
    if (popup && !popup.contains(event.target) && !event.target.closest('.delete-folder')) {
        hideDeleteModal();
    }
}

function confirmDeleteFolder() {
    if (!currentFolderId) {
        showToast('Không tìm thấy ID folder', 'error');
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const vaultId = urlParams.get('id');

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/vault-detail/delete-folder';

    const folderIdInput = document.createElement('input');
    folderIdInput.type = 'hidden';
    folderIdInput.name = 'folderId';
    folderIdInput.value = currentFolderId;

    const vaultIdInput = document.createElement('input');
    vaultIdInput.type = 'hidden';
    vaultIdInput.name = 'vaultId';
    vaultIdInput.value = vaultId;

    form.appendChild(folderIdInput);
    form.appendChild(vaultIdInput);
    document.body.appendChild(form);
    form.submit();
}

document.addEventListener('DOMContentLoaded', function () {
    const instructorInput = document.getElementById('sessionInstructor');
    let instructorIdInput = document.getElementById('sessionInstructorId');
    if (!instructorIdInput && instructorInput) {
        instructorIdInput = document.createElement('input');
        instructorIdInput.type = 'hidden';
        instructorIdInput.id = 'sessionInstructorId';
        instructorIdInput.name = 'sessionInstructorId';
        instructorInput.parentNode.appendChild(instructorIdInput);
    } else {
        console.log('sessionInstructorId input found:', instructorIdInput);
    }
    const urlParams = new URLSearchParams(window.location.search);
    const vaultId = urlParams.get('id');
    const toast = document.getElementById('toast-notification');
    if (toast && (toast.style.display === 'flex' || toast.style.display === '')) {
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.style.display = 'none';
            }, 300);
        }, 3000);
    }

    const errorUrlParams = new URLSearchParams(window.location.search);
    const hasError = errorUrlParams.get('error') === 'true';
    const errorMessage = errorUrlParams.get('message');
    const errorType = errorUrlParams.get('type');

    if (hasError && errorMessage) {
        showToast(errorMessage, errorType || 'error');
        const lastOperation = sessionStorage.getItem('lastOperation');
        const lastInputValue = sessionStorage.getItem('lastInputValue');
        const lastFolderId = sessionStorage.getItem('lastFolderId');
        const lastType = sessionStorage.getItem('lastType');

        if (lastOperation && lastInputValue) {
            if (lastOperation === 'rename' && lastFolderId) {
                restoreRenameInput(lastFolderId, lastInputValue, lastType);
            } else if (lastOperation === 'subfolder' && lastFolderId) {
                restoreSubfolderInput(lastFolderId, lastInputValue, lastType);
            } else if (lastOperation === 'newfolder') {
                restoreNewFolderInput(lastInputValue, lastType);
            }
        }
        sessionStorage.removeItem('lastOperation');
        sessionStorage.removeItem('lastInputValue');
        sessionStorage.removeItem('lastFolderId');
        sessionStorage.removeItem('lastType');
    }

    document.addEventListener('click', function (event) {
        const popup = document.getElementById('deleteFolderPopup');
        if (popup && popup.style.display === 'block' && !popup.contains(event.target) && !event.target.closest('.delete-folder')) {
            hideDeleteModal();
        }
    });

    const yournoteList = document.getElementById('yournote');
    const addFolderIcon = document.getElementById('add-private-folder-icon');
    if (addFolderIcon && yournoteList) {
        addFolderIcon.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            showNewFolderInput();
        });
    }
    const publicNoteList = document.getElementById('notebooks');
    const addPublicFolderIcon = document.getElementById('add-public-folder-icon');
    if (addPublicFolderIcon && publicNoteList) {
        addPublicFolderIcon.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            showNewFolderInput('public');
        });
    }

    function showNewFolderInput(type = 'personal') {
        const list = type === 'public' ? document.getElementById('notebooks') : document.getElementById('yournote');
        if (list) {
            list.classList.add('show');
        }
        const newFolderItem = document.createElement('li');
        newFolderItem.style.paddingLeft = '17px';
        newFolderItem.className = 'new-folder-item active';
        newFolderItem.setAttribute('data-type', type);
        const wrapper = document.createElement('div');
        wrapper.className = 'your-knowledge-wrapper';
        wrapper.style.position = 'relative';
        wrapper.setAttribute('data-type', type);

        const link = document.createElement('a');
        link.style.padding = '10px 10px';
        link.className = 'collapsed  d-flex align-items-center justify-content-between';
        link.style.gap = '8px';
        link.style.textDecoration = 'none';
        link.style.color = 'inherit';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'd-flex align-items-center flex-grow-1';
        contentDiv.style.position = 'relative';
        contentDiv.style.zIndex = '5';

        const icon = document.createElement('i');
        icon.style.marginRight = '5px';
        icon.style.marginTop = '-1px';
        icon.innerHTML = `
            <svg width="20" class="" id="iq-main-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
        `;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'new-folder-input';
        input.placeholder = 'Enter folder name...';
        input.style.border = 'none';
        input.style.outline = 'none';
        input.style.background = 'transparent';
        input.style.color = 'inherit';
        input.style.fontSize = 'inherit';
        input.style.fontFamily = 'inherit';
        input.style.width = '100%';
        input.style.padding = '0';
        input.style.margin = '0';
        input.style.position = 'relative';
        input.style.zIndex = '10';

        contentDiv.appendChild(icon);
        contentDiv.appendChild(input);
        link.appendChild(contentDiv);
        wrapper.appendChild(link);
        newFolderItem.appendChild(wrapper);

        contentDiv.addEventListener('click', function (e) {
            e.stopPropagation();
            input.focus();
        });

        link.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            input.focus();
        });

        list.insertBefore(newFolderItem, list.firstChild);

        newFolderItem.addEventListener('click', function (e) {
            if (e.target !== input) {
                e.preventDefault();
                e.stopPropagation();
                input.focus();
            }
        });

        input.focus();
        input.style.pointerEvents = 'auto';
        input.style.cursor = 'text';
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                input.dataset.enterPressed = 'true';
                createFolder(input.value.trim(), type);
            } else if (e.key === 'Escape') {
                removeNewFolderInput();
            }
        });
        input.addEventListener('blur', function () {
            setTimeout(() => {
                removeNewFolderInput();
            }, 100);
        });

        function removeNewFolderInput() {
            if (newFolderItem.parentNode) {
                newFolderItem.parentNode.removeChild(newFolderItem);
            }
        }

        let isCreatingFolder = false;

        function createFolder(folderName, type) {
            if (!folderName || isCreatingFolder) {
                removeNewFolderInput();
                return;
            }
            isCreatingFolder = true;
            sessionStorage.setItem('lastOperation', 'newfolder');
            sessionStorage.setItem('lastInputValue', folderName);
            sessionStorage.setItem('lastType', type);

            const form = document.createElement('form');
            form.method = 'POST';
            form.action = type === 'public' ? '/vault-detail/create-public-folder' : '/vault-detail/create-folder';

            const folderNameInput = document.createElement('input');
            folderNameInput.type = 'hidden';
            folderNameInput.name = 'folderName';
            folderNameInput.value = folderName;

            const vaultIdInput = document.createElement('input');
            vaultIdInput.type = 'hidden';
            vaultIdInput.name = 'vaultId';
            vaultIdInput.value = new URLSearchParams(window.location.search).get('id');

            form.appendChild(folderNameInput);
            form.appendChild(vaultIdInput);
            document.body.appendChild(form);
            form.submit();
        }

        function addFolderToDOM(folderId, folderName, type, createdAt) {
            window.location.reload();
        }
    }

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.your-knowledge-wrapper')) {
            document.querySelectorAll('.knowledge-menu').forEach(menu => {
                menu.style.display = 'none';
            });
        }
    });

    let globalIsCreatingSubfolder = false;

    document.addEventListener('DOMContentLoaded', function () {
        $('.').each(function () {
            const iconID = $(this).attr('id');
            if (iconID != undefined) {
                const iconVar = iconID.replace('-', '');
                if (!window['iq' + iconVar]) {
                    const settings = {
                        type: 'oneByOne',
                        start: 'inViewport',
                        dashGap: 10,
                        duration: 100
                    };
                    window['iq' + iconVar] = new Vivus(iconID, settings);
                }
            }
        });
    });

    document.addEventListener('click', function (e) {
        if (e.target.closest('.delete-folder')) {
            e.preventDefault();
            e.stopPropagation();

            const menuItem = e.target.closest('.knowledge-menu-item');
            const wrapper = menuItem.closest('.your-knowledge-wrapper');
            const menu = wrapper.querySelector('.knowledge-menu');
            const folderId = menuItem.getAttribute('data-folder-id');
            const type = wrapper.getAttribute('data-type');

            if (!folderId) {
                showToast('Không tìm thấy ID folder', 'error');
                return;
            }
            if (menu) {
                menu.style.display = 'none';
            }
            deleteFolder(folderId, wrapper, type);
            return;
        }

        if (e.target.closest('.rename-folder')) {
            e.preventDefault();
            e.stopPropagation();

            const menuItem = e.target.closest('.knowledge-menu-item');
            const wrapper = menuItem.closest('.your-knowledge-wrapper');
            const menu = wrapper.querySelector('.knowledge-menu');
            const folderId = menuItem.getAttribute('data-folder-id');
            const type = wrapper.getAttribute('data-type');

            if (!folderId) {
                showToast('Không tìm thấy ID folder', 'error');
                return;
            }

            if (menu) {
                menu.style.display = 'none';
            }

            showRenameInput(folderId, wrapper, type);
            return;
        }

        if (e.target.closest('.add-subfolder')) {
            e.preventDefault();
            e.stopPropagation();
            const menuItem = e.target.closest('.knowledge-menu-item');
            const wrapper = menuItem.closest('.your-knowledge-wrapper');
            const menu = wrapper.querySelector('.knowledge-menu');
            const li = menuItem.closest('li[data-folder-id], li[data-subfolder-id]');
            const folderId = li?.getAttribute('data-folder-id') || li?.getAttribute('data-subfolder-id');
            const type = wrapper.getAttribute('data-type');
            if (!folderId) {
                showToast('Không tìm thấy ID folder', 'error');
                return;
            }
            if (menu) {
                menu.style.display = 'none';
            }
            showSubfolderInput(folderId, wrapper, type);
            return;
        }

        if (e.target.closest('.knowledge-menu-item') &&
            !e.target.closest('.delete-folder') &&
            !e.target.closest('.rename-folder') &&
            !e.target.closest('.add-subfolder')
        ) {
            e.preventDefault();
            e.stopPropagation();

            const menuItem = e.target.closest('.knowledge-menu-item');
            const wrapper = menuItem.closest('.your-knowledge-wrapper');
            const menu = wrapper.querySelector('.knowledge-menu');
            const folderId = menuItem.getAttribute('data-folder-id');
            const type = wrapper.getAttribute('data-type');

            if (!folderId) {
                showToast('Không tìm thấy ID folder', 'error');
                return;
            }

            if (menu) {
                menu.style.display = 'none';
            }

            const selectedFolderInput = document.getElementById('selectedFolderId');
            if (selectedFolderInput) {
                selectedFolderInput.value = folderId;
            }

            if (typeof setCurrentFolderId === 'function') {
                setCurrentFolderId(folderId);
            }

            const collapseMenu = document.getElementById('collapseMenu');
            if (collapseMenu) {
                $(collapseMenu).collapse('show');
            }

            return;
        }
    });

    // Khởi tạo quá trình xóa folder
    function deleteFolder(folderId, wrapper, type) {
        if (!folderId) {
            showToast('Không tìm thấy ID folder', 'error');
            return;
        }
        let folderName = 'Folder';
        if (wrapper) {
            const folderNameElement = wrapper.querySelector('.folder-name');
            if (folderNameElement) {
                folderName = folderNameElement.textContent.trim();
            }
        }
        showDeleteModal(folderId, wrapper, folderName);
    }

    function showRenameInput(folderId, wrapper, type) {
        if (!wrapper) {
            showToast('Không tìm thấy folder wrapper', 'error');
            return;
        }
        const folderNameElement = wrapper.querySelector('.folder-name, .subfolder-name');
        if (!folderNameElement) {
            showToast('Không tìm thấy tên folder', 'error');
            return;
        }
        const currentName = folderNameElement.textContent.trim();
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'rename-folder-input';
        input.value = currentName;
        input.style.width = '100%';
        folderNameElement.style.display = 'none';
        folderNameElement.parentNode.insertBefore(input, folderNameElement);
        input.focus();
        input.select();

        function handleRename() {
            const newName = input.value.trim();
            if (newName === currentName) {
                input.remove();
                folderNameElement.style.display = '';
                return;
            }
            if (newName === '') {
                input.classList.add('error');
                showToast('Tên folder không được để trống', 'error');
                return;
            }
            if (newName.length > 50) {
                input.classList.add('error');
                showToast('Tên folder không được quá 50 ký tự', 'error');
                return;
            }
            wrapper.classList.add('rename-folder-loading');
            input.disabled = true;

            renameFolder(folderId, newName, wrapper, input, folderNameElement, type);
        }

        function cancelRename() {
            input.remove();
            folderNameElement.style.display = '';
        }
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleRename();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelRename();
            }
        });
        input.addEventListener('blur', function () {
            setTimeout(() => {
                if (document.activeElement !== input) {
                    handleRename();
                }
            }, 100);
        });

        function handleClickOutside(e) {
            if (!wrapper.contains(e.target)) {
                cancelRename();
                document.removeEventListener('click', handleClickOutside);
            }
        }
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 100);
    }

    function renameFolder(folderId, newName, wrapper, input, folderNameElement, type) {
        const urlParams = new URLSearchParams(window.location.search);
        const vaultId = urlParams.get('id');
        sessionStorage.setItem('lastOperation', 'rename');
        sessionStorage.setItem('lastInputValue', newName);
        sessionStorage.setItem('lastFolderId', folderId);
        sessionStorage.setItem('lastType', type);
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = type === 'public' ? '/vault-detail/rename-public-folder' : '/vault-detail/rename-folder';

        const folderIdInput = document.createElement('input');
        folderIdInput.type = 'hidden';
        folderIdInput.name = 'folderId';
        folderIdInput.value = folderId;

        const newNameInput = document.createElement('input');
        newNameInput.type = 'hidden';
        newNameInput.name = 'newName';
        newNameInput.value = newName;

        const vaultIdInput = document.createElement('input');
        vaultIdInput.type = 'hidden';
        vaultIdInput.name = 'vaultId';
        vaultIdInput.value = vaultId;

        form.appendChild(folderIdInput);
        form.appendChild(newNameInput);
        form.appendChild(vaultIdInput);
        document.body.appendChild(form);
        form.submit();
    }

    function restoreRenameInput(folderId, inputValue, type) {
        const folderElement = document.querySelector(`li[data-folder-id="${folderId}"]`);
        if (!folderElement) return;

        const wrapper = folderElement.querySelector('.your-knowledge-wrapper');
        if (!wrapper) return;

        const folderNameElement = wrapper.querySelector('.folder-name, .subfolder-name');
        if (!folderNameElement) return;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'rename-folder-input error';
        input.value = inputValue;
        input.style.width = '100%';

        folderNameElement.style.display = 'none';
        folderNameElement.parentNode.insertBefore(input, folderNameElement);
        input.focus();
        input.select();

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleRename();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelRename();
            }
        });

        input.addEventListener('blur', function () {
            setTimeout(() => {
                if (document.activeElement !== input) {
                    handleRename();
                }
            }, 100);
        });

        function handleRename() {
            const newName = input.value.trim();
            if (newName === '') {
                input.classList.add('error');
                showToast('Tên folder không được để trống', 'error');
                return;
            }
            if (newName.length > 50) {
                input.classList.add('error');
                showToast('Tên folder không được quá 50 ký tự', 'error');
                return;
            }
            wrapper.classList.add('rename-folder-loading');
            input.disabled = true;
            renameFolder(folderId, newName, wrapper, input, folderNameElement, type);
        }

        function cancelRename() {
            input.remove();
            folderNameElement.style.display = '';
        }

        function handleClickOutside(e) {
            if (!wrapper.contains(e.target)) {
                cancelRename();
                document.removeEventListener('click', handleClickOutside);
            }
        }
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 100);
    }

    function showSubfolderInput(folderId, wrapper, type) {
        if (!wrapper) {
            showToast('Không tìm thấy folder wrapper', 'error');
            return;
        }
        const folderLi = wrapper.closest('li');
        let submenuId = (type === 'public' ? 'public-user-' : 'personal-user-') + folderId;
        let submenu = document.getElementById(submenuId);
        if (!submenu) {
            submenu = document.createElement('ul');
            submenu.id = submenuId;
            submenu.className = 'iq-submenu collapse show';
            submenu.setAttribute('data-parent', type === 'public' ? '#notebooks' : '#yournote');
            folderLi.appendChild(submenu);
        } else {
            submenu.classList.add('show');
            submenu.style.display = 'block';
            submenu.style.opacity = '1';
            submenu.style.visibility = 'visible';
        }
        const newSubfolderLi = document.createElement('li');
        newSubfolderLi.className = 'new-subfolder-item';
        newSubfolderLi.style.paddingLeft = '20px';
        const link = document.createElement('a');
        link.className = ' d-flex align-items-center';
        link.style.padding = '10px 9px';
        link.style.textDecoration = 'none';
        link.style.color = 'inherit';
        const icon = document.createElement('i');
        icon.innerHTML = `
            <svg width="20" class="" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
        `;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'subfolder-input';
        input.placeholder = 'Nhập tên subfolder...';
        input.style.flexGrow = '1';

        link.appendChild(icon);
        link.appendChild(input);
        newSubfolderLi.appendChild(link);

        const firstLi = Array.from(submenu.children).find(child => child.tagName === 'LI');
        if (firstLi) {
            submenu.insertBefore(newSubfolderLi, firstLi);
        } else {
            submenu.appendChild(newSubfolderLi);
        }

        input.focus();

        function handleCreateSubfolder() {
            if (globalIsCreatingSubfolder) {
                return;
            }

            const subfolderName = input.value.trim();

            if (subfolderName === '') {
                input.classList.add('error');
                showToast('Tên subfolder không được để trống', 'error');
                return;
            }

            if (subfolderName.length > 50) {
                input.classList.add('error');
                showToast('Tên subfolder không được quá 50 ký tự', 'error');
                return;
            }
            globalIsCreatingSubfolder = true;
            newSubfolderLi.classList.add('subfolder-loading');
            input.disabled = true;
            createSubfolder(folderId, subfolderName, newSubfolderLi, submenu, type);
        }

        function cancelCreateSubfolder() {
            globalIsCreatingSubfolder = false;
            newSubfolderLi.remove();
        }

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateSubfolder();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelCreateSubfolder();
            }
        });

        function handleClickOutside(e) {
            if (!newSubfolderLi.contains(e.target)) {
                cancelCreateSubfolder();
                document.removeEventListener('click', handleClickOutside);
            }
        }

        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 100);
    }

    function createSubfolder(folderId, subfolderName, subfolderLi, submenu, type) {
        const urlParams = new URLSearchParams(window.location.search);
        const vaultId = urlParams.get('id');

        sessionStorage.setItem('lastOperation', 'subfolder');
        sessionStorage.setItem('lastInputValue', subfolderName);
        sessionStorage.setItem('lastFolderId', folderId);
        sessionStorage.setItem('lastType', type);

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = type === 'public' ? '/vault-detail/add-public-subfolder' : '/vault-detail/add-subfolder';

        const folderIdInput = document.createElement('input');
        folderIdInput.type = 'hidden';
        folderIdInput.name = 'folderId';
        folderIdInput.value = folderId;

        const subfolderNameInput = document.createElement('input');
        subfolderNameInput.type = 'hidden';
        subfolderNameInput.name = 'subfolderName';
        subfolderNameInput.value = subfolderName;

        const vaultIdInput = document.createElement('input');
        vaultIdInput.type = 'hidden';
        vaultIdInput.name = 'vaultId';
        vaultIdInput.value = vaultId;

        form.appendChild(folderIdInput);
        form.appendChild(subfolderNameInput);
        form.appendChild(vaultIdInput);
        document.body.appendChild(form);
        form.submit();
        setupSubfolderExpandCollapse();
        syncSubfolderNoExpand();
        syncSubfolderIcons();
    }

    function restoreSubfolderInput(folderId, inputValue, type) {
        const folderElement = document.querySelector(`li[data-folder-id="${folderId}"]`);
        if (!folderElement) return;

        const wrapper = folderElement.querySelector('.your-knowledge-wrapper');
        if (!wrapper) return;

        let submenuId = (type === 'public' ? 'public-user-' : 'personal-user-') + folderId;
        let submenu = document.getElementById(submenuId);
        if (!submenu) {
            submenu = document.createElement('ul');
            submenu.id = submenuId;
            submenu.className = 'iq-submenu collapse show';
            submenu.setAttribute('data-parent', type === 'public' ? '#notebooks' : '#yournote');
            folderElement.appendChild(submenu);
        } else {
            submenu.classList.add('show');
        }

        const newSubfolderLi = document.createElement('li');
        newSubfolderLi.className = 'new-subfolder-item';
        newSubfolderLi.style.paddingLeft = '20px';

        const link = document.createElement('a');
        link.className = ' d-flex align-items-center';
        link.style.padding = '10px 9px';
        link.style.textDecoration = 'none';
        link.style.color = 'inherit';

        const icon = document.createElement('i');
        icon.innerHTML = `
            <svg width="20" class="" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
        `;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'subfolder-input error';
        input.value = inputValue;
        input.placeholder = 'Nhập tên subfolder...';
        input.style.flexGrow = '1';

        link.appendChild(icon);
        link.appendChild(input);
        newSubfolderLi.appendChild(link);

        const firstLi = Array.from(submenu.children).find(child => child.tagName === 'LI');
        if (firstLi) {
            submenu.insertBefore(newSubfolderLi, firstLi);
        } else {
            submenu.appendChild(newSubfolderLi);
        }

        input.focus();
        input.select();

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateSubfolder();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelCreateSubfolder();
            }
        });

        function handleCreateSubfolder() {
            if (globalIsCreatingSubfolder) {
                return;
            }

            const subfolderName = input.value.trim();

            if (subfolderName === '') {
                input.classList.add('error');
                showToast('Tên subfolder không được để trống', 'error');
                return;
            }

            if (subfolderName.length > 50) {
                input.classList.add('error');
                showToast('Tên subfolder không được quá 50 ký tự', 'error');
                return;
            }
            globalIsCreatingSubfolder = true;
            newSubfolderLi.classList.add('subfolder-loading');
            input.disabled = true;
            createSubfolder(folderId, subfolderName, newSubfolderLi, submenu, type);
        }

        function cancelCreateSubfolder() {
            globalIsCreatingSubfolder = false;
            newSubfolderLi.remove();
        }

        function handleClickOutside(e) {
            if (!newSubfolderLi.contains(e.target)) {
                cancelCreateSubfolder();
                document.removeEventListener('click', handleClickOutside);
            }
        }

        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 100);
    }

    function restoreNewFolderInput(inputValue, type) {
        const list = type === 'public' ? document.getElementById('notebooks') : document.getElementById('yournote');
        if (!list) return;

        list.classList.add('show');

        const newFolderItem = document.createElement('li');
        newFolderItem.style.paddingLeft = '17px';
        newFolderItem.className = 'new-folder-item active';
        newFolderItem.setAttribute('data-type', type);

        const wrapper = document.createElement('div');
        wrapper.className = 'your-knowledge-wrapper';
        wrapper.style.position = 'relative';
        wrapper.setAttribute('data-type', type);

        const link = document.createElement('a');
        link.style.padding = '10px 10px';
        link.className = 'collapsed  d-flex align-items-center justify-content-between';
        link.style.gap = '8px';
        link.style.textDecoration = 'none';
        link.style.color = 'inherit';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'd-flex align-items-center flex-grow-1';
        contentDiv.style.position = 'relative';
        contentDiv.style.zIndex = '5';

        const icon = document.createElement('i');
        icon.style.marginRight = '5px';
        icon.style.marginTop = '-1px';
        icon.innerHTML = `
            <svg width="20" class="" id="iq-main-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
        `;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'new-folder-input error';
        input.value = inputValue;
        input.placeholder = 'Enter folder name...';
        input.style.border = 'none';
        input.style.outline = 'none';
        input.style.background = 'transparent';
        input.style.color = 'inherit';
        input.style.fontSize = 'inherit';
        input.style.fontFamily = 'inherit';
        input.style.width = '100%';
        input.style.padding = '0';
        input.style.margin = '0';
        input.style.position = 'relative';
        input.style.zIndex = '10';

        contentDiv.appendChild(icon);
        contentDiv.appendChild(input);
        link.appendChild(contentDiv);
        wrapper.appendChild(link);
        newFolderItem.appendChild(wrapper);

        contentDiv.addEventListener('click', function (e) {
            e.stopPropagation();
            input.focus();
        });

        link.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            input.focus();
        });

        list.insertBefore(newFolderItem, list.firstChild);

        newFolderItem.addEventListener('click', function (e) {
            if (e.target !== input) {
                e.preventDefault();
                e.stopPropagation();
                input.focus();
            }
        });

        input.focus();
        input.select();
        input.style.pointerEvents = 'auto';
        input.style.cursor = 'text';

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                input.dataset.enterPressed = 'true';
                createFolder(input.value.trim(), type);
            } else if (e.key === 'Escape') {
                removeNewFolderInput();
            }
        });

        function removeNewFolderInput() {
            if (newFolderItem.parentNode) {
                newFolderItem.parentNode.removeChild(newFolderItem);
            }
        }

        function handleClickOutside(e) {
            if (!newFolderItem.contains(e.target)) {
                removeNewFolderInput();
                document.removeEventListener('click', handleClickOutside);
            }
        }

        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 100);
    }
});


function setupRootFolderExpandCollapse(rootSelector, listSelector, iconClass, arrowActiveId, arrowHoverId) {
    const rootFolder = document.querySelector(rootSelector);
    const list = document.getElementById(listSelector);
    if (!rootFolder || !list) return;

    const combinedIcon = rootFolder.querySelector('.combined-icon-wrapper');
    const folderIcon = combinedIcon ? combinedIcon.querySelector(iconClass) : null;
    const expandIcon = combinedIcon ? combinedIcon.querySelector('.expand-collapse-icon') : null;
    const arrowActive = expandIcon ? expandIcon.querySelector('.arrow-active') : null;
    const arrowHover = expandIcon ? expandIcon.querySelector('.arrow-hover') : null;

    function updateExpandIconState() {
        const hasChild = list && list.querySelector('li[data-folder-id]');
        if (!hasChild) {
            if (folderIcon) {
                folderIcon.style.opacity = '1';
                folderIcon.style.visibility = 'visible';
            }
            if (expandIcon) {
                expandIcon.style.opacity = '0';
                expandIcon.style.visibility = 'hidden';
            }
            if (combinedIcon) {
                combinedIcon.classList.add('no-expand');
            }
            return;
        }
        if (folderIcon) {
            folderIcon.style.opacity = '0';
            folderIcon.style.visibility = 'hidden';
        }
        if (expandIcon) {
            expandIcon.style.opacity = '1';
            expandIcon.style.visibility = 'visible';
        }
        if (combinedIcon) {
            combinedIcon.classList.remove('no-expand');
        }
        if (list.classList.contains('show')) {
            if (arrowActive) {
                arrowActive.style.display = 'none';
                arrowActive.style.opacity = '0';
            }
            if (arrowHover) {
                arrowHover.style.display = 'block';
                arrowHover.style.opacity = '1';
            }
        } else {
            if (arrowActive) {
                arrowActive.style.display = 'block';
                arrowActive.style.opacity = '1';
            }
            if (arrowHover) {
                arrowHover.style.display = 'none';
                arrowHover.style.opacity = '0';
            }
        }
    }
    if (combinedIcon) {
        combinedIcon.addEventListener('mouseenter', function () {
            const hasChild = list && list.querySelector('li[data-folder-id]');
            if (!hasChild) {
                if (folderIcon) {
                    folderIcon.style.opacity = '1';
                    folderIcon.style.visibility = 'visible';
                }
                if (expandIcon) {
                    expandIcon.style.opacity = '0';
                    expandIcon.style.visibility = 'hidden';
                }
                if (combinedIcon) {
                    combinedIcon.classList.add('no-expand');
                }
                return;
            }
            if (combinedIcon) {
                combinedIcon.classList.remove('no-expand');
            }
            updateExpandIconState();
        });
        combinedIcon.addEventListener('mouseleave', function () {
            if (folderIcon) {
                folderIcon.style.opacity = '1';
                folderIcon.style.visibility = 'visible';
            }
            if (expandIcon) {
                expandIcon.style.opacity = '0';
                expandIcon.style.visibility = 'hidden';
            }
            if (combinedIcon) {
                const hasChild = list && list.querySelector('li[data-folder-id]');
                if (!hasChild) {
                    combinedIcon.classList.add('no-expand');
                } else {
                    combinedIcon.classList.remove('no-expand');
                }
            }
        });
    }
    const observer = new MutationObserver(updateExpandIconState);
    if (list) {
        observer.observe(list, { childList: true });
    }
    if (expandIcon) {
        expandIcon.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (list.classList.contains('show')) {
                list.classList.remove('show');
            } else {
                list.classList.add('show');
            }
            updateExpandIconState();
        });
    }
    if (!list.classList.contains('show')) {
        list.classList.add('show');
    }
    updateExpandIconState();
}

setupRootFolderExpandCollapse(
    '.personal-folder',
    'yournote',
    '.personal-icon',
    'personal-arrow-active',
    'personal-arrow-hover'
);

setupRootFolderExpandCollapse(
    '.public-folder',
    'notebooks',
    '.public-icon',
    'public-arrow-active',
    'public-arrow-hover'
);

function expandAllFolders() {
    const rootFolders = document.querySelectorAll('#yournote, #notebooks');
    rootFolders.forEach(rootFolder => {
        if (!rootFolder.classList.contains('show')) {
            rootFolder.classList.add('show');
            rootFolder.style.display = 'block';
        }
    });

    function expandSubfoldersRecursively(container) {
        const subfolders = container.querySelectorAll('li[data-folder-id]');
        subfolders.forEach(li => {
            const submenu = li.querySelector('ul.iq-submenu');
            const btn = li.querySelector('.expand-collapse-icon');
            const combinedIcon = li.querySelector('.combined-icon-wrapper');

            if (submenu && submenu.querySelector('li[data-folder-id]')) {
                submenu.classList.add('show');
                submenu.style.display = 'block';
                // Calculate top position for full day (00:00 to 23:59)
                // Each hour = 80px, start at 0:00 (top = 60px)
                const topPx = (hour * 80) + (minute / 60 * 80) + 60;
                if (btn) {
                    const arrowActive = btn.querySelector('.arrow-active');
                    const arrowHover = btn.querySelector('.arrow-hover');
                    if (arrowActive) arrowActive.style.display = 'none';
                    if (arrowHover) arrowHover.style.display = 'block';
                }

                if (combinedIcon) {
                    combinedIcon.classList.remove('no-expand');
                    combinedIcon.classList.add('open');
                }

                expandSubfoldersRecursively(submenu);
            } else {
                if (combinedIcon) {
                    combinedIcon.classList.add('no-expand');
                }
            }
        });
    }

    expandSubfoldersRecursively(document.getElementById('yournote'));
    expandSubfoldersRecursively(document.getElementById('notebooks'));
}

function initializeFolderState() {
    document.querySelectorAll('li[data-folder-id]').forEach(li => {
        if (li.classList.contains('public-folder') || li.classList.contains('personal-folder')) return;

        const submenu = li.querySelector('ul.iq-submenu');
        const btn = li.querySelector('.expand-collapse-icon');
        const combinedIcon = li.querySelector('.combined-icon-wrapper');

        if (!combinedIcon) return;

        if (submenu && submenu.querySelector('li[data-folder-id]')) {

            combinedIcon.classList.remove('no-expand');

            const arrowActive = btn.querySelector('.arrow-active');
            const arrowHover = btn.querySelector('.arrow-hover');

            // Kiểm tra xem submenu có được mở rộng mặc định hay không
            if (submenu.classList.contains('show')) {
                submenu.style.display = 'block';
                if (arrowActive) arrowActive.style.display = 'none';
                if (arrowHover) arrowHover.style.display = 'block';
            } else {
                submenu.style.display = 'none';
                if (arrowActive) arrowActive.style.display = 'block';
                if (arrowHover) arrowHover.style.display = 'none';
            }
        } else {
            // --- TRƯỜNG HỢP 2: THƯ MỤC RỖNG ---
            // Ẩn icon expand/collapse bằng cách thêm class 'no-expand'
            combinedIcon.classList.add('no-expand');
        }
    });
}

function setupSubfolderExpandCollapse() {
    document.querySelectorAll('.expand-collapse-icon.public-toggle-btn, .expand-collapse-icon.personal-toggle-btn').forEach(btn => {
        const li = btn.closest('li[data-folder-id]');
        if (!li) return;

        if (li.classList.contains('public-folder') || li.classList.contains('personal-folder')) return;

        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const submenu = li.querySelector('ul.iq-submenu');
            if (!submenu) return;

            const arrowActive = btn.querySelector('.arrow-active');
            const arrowHover = btn.querySelector('.arrow-hover');

            if (submenu.classList.contains('show')) {
                submenu.classList.remove('show');
                submenu.style.display = 'none';
                if (arrowActive) {
                    arrowActive.style.display = 'block';
                    arrowActive.style.opacity = '1';
                }
                if (arrowHover) {
                    arrowHover.style.display = 'none';
                    arrowHover.style.opacity = '0';
                }
            } else {
                submenu.classList.add('show');
                submenu.style.display = 'block';
                if (arrowActive) {
                    arrowActive.style.display = 'none';
                    arrowActive.style.opacity = '0';
                }
                if (arrowHover) {
                    arrowHover.style.display = 'block';
                    arrowHover.style.opacity = '1';
                }
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    initializeDropdownMenus();
    initializeFolderState();
    setupSubfolderExpandCollapse();
    setTimeout(() => {
        expandAllFolders();
        setTimeout(() => {
            initializeDropdownMenus();
            setupDeleteKnowledgeListeners();
        }, 50);
    }, 100);
});

document.addEventListener('click', function (e) {
    if (e.target.closest('.delete-knowledge-btn')) {
        e.preventDefault();
        e.stopPropagation();

        const deleteBtn = e.target.closest('.delete-knowledge-btn');

        const knowledgeId = deleteBtn.getAttribute('data-knowledge-id');
        const knowledgeTitle = deleteBtn.getAttribute('data-knowledge-title');
        const folderId = deleteBtn.getAttribute('data-folder-id');

        if (knowledgeId && knowledgeTitle && folderId) {
            showDeleteKnowledgeModal(knowledgeId, knowledgeTitle, folderId);
        }
    }

    if (e.target.closest('.delete-permanent-btn')) {
        e.preventDefault();
        e.stopPropagation();

        const deleteBtn = e.target.closest('.delete-permanent-btn');

        const knowledgeId = deleteBtn.getAttribute('data-knowledge-id');
        const knowledgeTitle = deleteBtn.getAttribute('data-knowledge-title');
        const folderId = deleteBtn.getAttribute('data-folder-id');

        if (knowledgeId && knowledgeTitle && folderId) {
            showDeletePermanentModal(knowledgeId, knowledgeTitle, folderId);
        }
    }

    // Xử lý xóa knowledge session khi click vào thẻ Delete
    if (e.target.closest('.dropdown-item') && e.target.closest('.dropdown-item').textContent.trim().includes('Delete')) {
        const deleteLink = e.target.closest('.dropdown-item');
        // Tìm sessionId từ thuộc tính data-session-id của phần tử cha card hoặc gán vào thẻ Delete
        let sessionId = null;
        // Nếu thẻ Delete có data-session-id thì lấy luôn
        if (deleteLink.hasAttribute('data-session-id')) {
            sessionId = deleteLink.getAttribute('data-session-id');
        } else {
            // Tìm phần tử card chứa sessionId
            const card = deleteLink.closest('.card');
            if (card && card.hasAttribute('data-session-id')) {
                sessionId = card.getAttribute('data-session-id');
            }
        }
        if (!sessionId) {
            showToast('Không tìm thấy sessionId để xóa!', 'error');
            return;
        }
        if (confirm('Bạn có chắc muốn xóa session này?')) {
            $.ajax({
                url: '/vault-detail/delete-session',
                type: 'POST',
                data: { sessionId },
                success: function (response) {
                    showToast('Xóa session thành công!', 'success');
                    window.location.reload();
                },
                error: function (xhr) {
                    showToast('Lỗi xóa session: ' + (xhr.responseText || 'Unknown error'), 'error');
                }
            });
        }
    }
});

function setupDeleteKnowledgeListeners() {
    const deleteButtons = document.querySelectorAll('.delete-knowledge-btn');
    const deletePermanentButtons = document.querySelectorAll('.delete-permanent-btn');
    deleteButtons.forEach((btn, index) => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const knowledgeId = this.getAttribute('data-knowledge-id');
            const knowledgeTitle = this.getAttribute('data-knowledge-title');
            const folderId = this.getAttribute('data-folder-id');

            if (knowledgeId && knowledgeTitle && folderId) {
                showDeleteKnowledgeModal(knowledgeId, knowledgeTitle, folderId);
            }
        });
    });

    deletePermanentButtons.forEach((btn, index) => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const knowledgeId = this.getAttribute('data-knowledge-id');
            const knowledgeTitle = this.getAttribute('data-knowledge-title');
            const folderId = this.getAttribute('data-folder-id');

            if (knowledgeId && knowledgeTitle && folderId) {
                showDeletePermanentModal(knowledgeId, knowledgeTitle, folderId);
            }
        });
    });
}// Test function to check if buttons exist
function testDeleteButtons() {
    const buttons = document.querySelectorAll('.delete-knowledge-btn');
    const permanentButtons = document.querySelectorAll('.delete-permanent-btn');

    console.log('Delete knowledge buttons found:', buttons.length);
    console.log('Delete permanent buttons found:', permanentButtons.length);

    buttons.forEach((btn, i) => {
        console.log(`Delete Button ${i}:`, btn, {
            id: btn.getAttribute('data-knowledge-id'),
            title: btn.getAttribute('data-knowledge-title'),
            folder: btn.getAttribute('data-folder-id')
        });
    });

    permanentButtons.forEach((btn, i) => {
        console.log(`Permanent Button ${i}:`, btn, {
            id: btn.getAttribute('data-knowledge-id'),
            title: btn.getAttribute('data-knowledge-title'),
            folder: btn.getAttribute('data-folder-id')
        });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const activeFolderId = urlParams.get('folder');
    if (!activeFolderId) {
        return;
    }
    const activeLi = document.querySelector(`li[data-folder-id="${activeFolderId}"]`);
    if (activeLi) {
        activeLi.classList.add('active');
        let parent = activeLi.parentElement;
        while (parent) {
            if (parent.classList && parent.classList.contains('iq-submenu')) {
                parent.classList.add('show');
                parent.style.display = 'block';
            }
            parent = parent.parentElement;
        }
    }
});


$('#collapseMenu').on('show.bs.collapse', function () {
    $('#knowledge-list-wrapper').hide();
});
$('#collapseMenu').on('hide.bs.collapse', function () {
    $('#knowledge-list-wrapper').show();
});

// Auto-close Bootstrap alerts after 5 seconds
setTimeout(function () {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(function (alert) {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
    });
}, 5000);

// Knowledge Assistant Functions
function updateKnowledgeAssistantMenuState() {
    const urlParams = new URLSearchParams(window.location.search);
    const isAssistantMode = urlParams.get('assistant') === 'true';

    const menuItem = document.getElementById('knowledge-assistant-menu');
    const normalIcon = document.getElementById('assistant-icon-normal');
    const activeIcon = document.getElementById('assistant-icon-active');

    if (isAssistantMode) {
        menuItem.classList.add('active');
        normalIcon.style.display = 'none';
        activeIcon.style.display = 'inline';
    } else {
        menuItem.classList.remove('active');
        normalIcon.style.display = 'inline';
        activeIcon.style.display = 'none';
    }
}

function showAssistantView() {
    document.querySelector('.content-page .container-fluid.note-details').style.display = 'none';

    document.getElementById('assistantView').style.display = 'block';

    const url = new URL(window.location);
    url.searchParams.set('assistant', 'true');
    window.history.replaceState({}, '', url);

    updateKnowledgeAssistantMenuState();
}

function hideAssistantView() {
    document.getElementById('assistantView').style.display = 'none';

    document.querySelector('.content-page .container-fluid.note-details').style.display = 'block';

    clearChatHistory();

    const url = new URL(window.location);
    url.searchParams.delete('assistant');
    window.history.replaceState({}, '', url);

    updateKnowledgeAssistantMenuState();
}

function showVaultDetail() {
    document.getElementById('assistantView').style.display = 'none';

    document.querySelector('.content-page .container-fluid.note-details').style.display = 'block';

    const url = new URL(window.location);
    url.searchParams.delete('assistant');
    window.history.replaceState({}, '', url);

    updateKnowledgeAssistantMenuState();
}

let currentKnowledgeIdToReject = null;
let currentVaultId = null;
let currentWeekStart = null;

function showRejectModal(knowledgeId, knowledgeTitle, folderId, vaultId) {
    console.log('showRejectModal called with:', { knowledgeId, knowledgeTitle, folderId, vaultId });

    currentKnowledgeIdToReject = knowledgeId;
    currentVaultId = vaultId;
    currentFolderId = folderId;

    const knowledgeNameElement = document.getElementById('knowledgeNameToReject');
    const rejectionReasonElement = document.getElementById('rejectionReason');
    const modalElement = document.getElementById('rejectKnowledgeModal');

    console.log('Modal elements found:', {
        knowledgeNameElement: !!knowledgeNameElement,
        rejectionReasonElement: !!rejectionReasonElement,
        modalElement: !!modalElement
    });

    if (knowledgeNameElement) {
        knowledgeNameElement.textContent = knowledgeTitle;
    }
    if (rejectionReasonElement) {
        rejectionReasonElement.value = '';
    }

    if (modalElement) {
        $('#rejectKnowledgeModal').modal('show');
    } else {
        console.error('rejectKnowledgeModal element not found!');
        const reason = prompt(`Please provide a reason for rejecting "${knowledgeTitle}":`);
        if (reason !== null && reason.trim() !== '') {
            confirmRejectKnowledgeWithReason(knowledgeId, folderId, vaultId, reason.trim());
        }
    }
}

function hideRejectModal() {
    $('#rejectKnowledgeModal').modal('hide');
    currentKnowledgeIdToReject = null;
    currentVaultId = null;
    currentFolderId = null;
}

$('#rejectKnowledgeModal').on('hidden.bs.modal', function () {
    currentKnowledgeIdToReject = null;
    currentVaultId = null;
    currentFolderId = null;
    $('#rejectionReason').val('');
});

function confirmRejectKnowledge() {
    if (!currentKnowledgeIdToReject) return;

    const rejectionReason = document.getElementById('rejectionReason').value;
    confirmRejectKnowledgeWithReason(currentKnowledgeIdToReject, currentFolderId, currentVaultId, rejectionReason);
}

function confirmRejectKnowledgeWithReason(knowledgeId, folderId, vaultId, rejectionReason) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/vault-detail/reject-knowledge';

    const fields = {
        'knowledgeId': knowledgeId,
        'vaultId': vaultId,
        'folderId': folderId,
        'rejectionReason': rejectionReason
    };

    Object.keys(fields).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = fields[key];
        form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
}

let currentKnowledgeIdToDelete = null;
let currentKnowledgeFolderId = null;
let currentVaultIdForDelete = null;

function showDeleteKnowledgeModal(knowledgeId, knowledgeTitle, folderId) {
    currentKnowledgeIdToDelete = knowledgeId;
    currentKnowledgeFolderId = folderId;
    currentVaultIdForDelete = new URLSearchParams(window.location.search).get('id');

    document.getElementById('knowledgeNameToDelete').textContent = knowledgeTitle;
    const popup = document.getElementById('deleteKnowledgePopup');

    popup.style.display = 'flex';
    setTimeout(() => popup.classList.add('show'), 10);
}



function hideDeleteKnowledgeModal() {
    const popup = document.getElementById('deleteKnowledgePopup');
    popup.classList.remove('show');
    setTimeout(() => popup.style.display = 'none', 300);
    currentKnowledgeIdToDelete = null;
    currentKnowledgeFolderId = null;
    currentVaultIdForDelete = null;
}

function confirmDeleteKnowledge() {
    if (!currentKnowledgeIdToDelete) return;

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/vault-detail/delete-knowledge';

    const fields = {
        'knowledgeId': currentKnowledgeIdToDelete,
        'vaultId': currentVaultIdForDelete,
        'folderId': currentKnowledgeFolderId
    };

    Object.keys(fields).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = fields[key];
        form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
}

let currentKnowledgeIdToDeletePermanent = null;
let currentKnowledgeFolderIdPermanent = null;
let currentVaultIdForDeletePermanent = null;

function showDeletePermanentModal(knowledgeId, knowledgeTitle, folderId) {
    currentKnowledgeIdToDeletePermanent = knowledgeId;
    currentKnowledgeFolderIdPermanent = folderId;
    currentVaultIdForDeletePermanent = new URLSearchParams(window.location.search).get('id');

    document.getElementById('knowledgeNameToDeletePermanent').textContent = knowledgeTitle;
    const popup = document.getElementById('deletePermanentKnowledgePopup');

    popup.style.display = 'flex';
    setTimeout(() => popup.classList.add('show'), 10);
}

function hideDeletePermanentModal() {
    const popup = document.getElementById('deletePermanentKnowledgePopup');
    popup.classList.remove('show');
    setTimeout(() => popup.style.display = 'none', 300);
    currentKnowledgeIdToDeletePermanent = null;
    currentKnowledgeFolderIdPermanent = null;
    currentVaultIdForDeletePermanent = null;
}

function confirmDeletePermanentKnowledge() {
    if (!currentKnowledgeIdToDeletePermanent) return;

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/vault-detail/delete-permanent-knowledge';

    const fields = {
        'knowledgeId': currentKnowledgeIdToDeletePermanent,
        'vaultId': currentVaultIdForDeletePermanent,
        'folderId': currentKnowledgeFolderIdPermanent
    };

    Object.keys(fields).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = fields[key];
        form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
}

let viewedKnowledgeIds = new Set();

$(document).ready(function () {
    setupApprovalEventHandlers();

    setTimeout(function () {
        const moveButtons = $('.move-knowledge-btn');

        const anyMove = $('[class*="move-knowledge"]');

        const dropdowns = $('.dropdown-item');

        moveButtons.each(function (index) {

            $(this).off('click').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                const knowledgeId = $(this).attr('data-knowledge-id');
                const knowledgeTitle = $(this).attr('data-knowledge-title');
                const currentFolderId = $(this).attr('data-folder-id');
                const approvalStatus = $(this).attr('data-approval-status');


                currentMoveKnowledgeData = {
                    knowledgeId: knowledgeId,
                    knowledgeTitle: knowledgeTitle,
                    currentFolderId: currentFolderId
                };

                selectedTargetFolder = null;
                $('#confirmMoveBtn').prop('disabled', true);
                $('#selectedFolderInfo').addClass('d-none');

                $('#privateFolderTree').closest('.col-md-6').removeClass('d-none col-md-12').addClass('col-md-6');
                $('#officialFolderTree').closest('.col-md-6').removeClass('d-none col-md-12').addClass('col-md-6');
                $('#privateFolderTree').empty();
                $('#officialFolderTree').empty();

                $('#moveKnowledgeId').val(knowledgeId);
                $('#moveKnowledgeTitle').text(knowledgeTitle);
                $('#moveCurrentFolderId').val(currentFolderId);

                const knowledgeStatus = determineKnowledgeStatusFromData(approvalStatus);
                $('#moveKnowledgeStatus').text(`Status: ${knowledgeStatus}`);

                const knowledgeInfoDiv = $('.knowledge-info');
                knowledgeInfoDiv.removeClass('knowledge-info knowledge-approved');
                if (knowledgeStatus === 'Draft') {
                    knowledgeInfoDiv.addClass('knowledge-info');
                } else if (knowledgeStatus === 'Approved') {
                    knowledgeInfoDiv.addClass('knowledge-approved');
                } else {
                    knowledgeInfoDiv.addClass('knowledge-info');
                }

                if (knowledgeStatus === 'Draft') {
                    $('#officialFolderTree').closest('.col-md-6').addClass('d-none');
                    $('#privateFolderTree').closest('.col-md-6').removeClass('col-md-6').addClass('col-md-12');

                    $('#moveRestrictions').html('');
                } else if (knowledgeStatus === 'Approved') {
                    $('#privateFolderTree').closest('.col-md-6').addClass('d-none');
                    $('#officialFolderTree').closest('.col-md-6').removeClass('col-md-6').addClass('col-md-12');

                } else if (knowledgeStatus === 'Pending') {
                    $('#privateFolderTree').closest('.col-md-6').addClass('d-none');
                    $('#officialFolderTree').closest('.col-md-6').addClass('d-none');

                    $('#moveRestrictions').html(`
                        <div class="alert alert-warning py-2">
                            <small><i class="fas fa-exclamation-triangle mr-2"></i>
                            Knowledge pending approval cannot be moved. Please wait for approval or withdraw the submission.</small>
                        </div>
                    `);
                } else {
                    $('#moveRestrictions').html(`
                        <div class="alert alert-warning py-2">
                            <small><i class="fas fa-question-circle mr-2"></i>
                            Unable to determine knowledge status. Please try again.</small>
                        </div>
                    `);
                }

                loadFolderTrees(knowledgeStatus);

                $('#moveKnowledgeModal').modal('show');

                return false;
            });
        });
    }, 2000);
});


$(document).on('click', '.view-knowledge-btn', function (e) {
    e.preventDefault();
    handleKnowledgeView(this);
});

function setupApprovalEventHandlers() {
    $(document).off('click', '.approve-knowledge-btn');
    $(document).off('click', '.reject-knowledge-btn');

    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('approve-knowledge-btn')) {
            e.preventDefault();
            e.stopPropagation();

            const knowledgeId = e.target.getAttribute('data-knowledge-id');
            const vaultId = e.target.getAttribute('data-vault-id');
            const folderId = e.target.getAttribute('data-folder-id');

            document.getElementById('approveKnowledgeId').value = knowledgeId;
            document.getElementById('approveFolderId').value = folderId;

            $('#folderSelectionModal').modal('show');
        }

        if (e.target.classList.contains('reject-knowledge-btn')) {
            e.preventDefault();
            e.stopPropagation();

            const knowledgeId = e.target.getAttribute('data-knowledge-id');
            const knowledgeTitle = e.target.getAttribute('data-knowledge-title');
            const folderId = e.target.getAttribute('data-folder-id');
            const vaultId = new URLSearchParams(window.location.search).get('id');

            console.log('Reject data:', { knowledgeId, knowledgeTitle, folderId, vaultId });

            showRejectModal(knowledgeId, knowledgeTitle, folderId, vaultId);
        }
    }, true);
}

$(document).on('click', '#confirmApproveBtn', function () {
    const selectedFolder = $('#targetFolderId').val();
    if (!selectedFolder) {
        alert('Please select a folder.');
        return;
    }

    $('#approveKnowledgeForm').submit();
});

$('#folderSelectionModal').on('hidden.bs.modal', function () {
    $('#targetFolderId').val('');
    $('#approveKnowledgeId').val('');
    $('#approveFolderId').val('');
});

document.addEventListener('DOMContentLoaded', function () {
    const instructorInput = document.getElementById('sessionInstructor');
    const vaultId = new URLSearchParams(window.location.search).get('id');
    let expertSuggestions = [];

    const suggestionBox = document.createElement('div');
    suggestionBox.className = 'autocomplete-suggestions';
    suggestionBox.style.position = 'absolute';
    suggestionBox.style.zIndex = '1000';
    suggestionBox.style.background = '#fff';
    suggestionBox.style.border = '1px solid #ccc';
    suggestionBox.style.display = 'none';
    instructorInput.parentNode.appendChild(suggestionBox);

    function renderSuggestions(query = '') {
        suggestionBox.style.width = instructorInput.offsetWidth + 'px';
        suggestionBox.style.borderRadius = '14px';
        const filtered = expertSuggestions.filter(user =>
            user.name.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase())
        );
        suggestionBox.innerHTML = '';
        filtered.forEach(user => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.padding = '10px 18px';
            item.style.cursor = 'pointer';
            item.style.borderRadius = '10px';
            item.style.margin = '3px 6px';
            // Avatar
            const avatar = document.createElement('img');
            avatar.src = user.avatar || '/images/logo/logo_100x100_transparent.png';
            avatar.alt = 'avatar';
            avatar.style.width = '34px';
            avatar.style.height = '34px';
            avatar.style.borderRadius = '17px';
            avatar.style.objectFit = 'cover';
            avatar.style.marginRight = '14px';
            // Info
            const info = document.createElement('span');
            info.textContent = `${user.name} (${user.email})`;
            item.appendChild(avatar);
            item.appendChild(info);
            item.addEventListener('mousedown', function () {
                instructorInput.value = user.email;
                var instructorIdInput = document.getElementById('sessionInstructorId');
                if (instructorIdInput) {
                    instructorIdInput.value = user.id;
                    console.log('Selected instructor id:', instructorIdInput.value);
                } else {
                    console.log('sessionInstructorId input not found!');
                }
                suggestionBox.style.display = 'none';
            });
            suggestionBox.appendChild(item);
        });
        suggestionBox.style.display = filtered.length ? 'block' : 'none';
    }

    instructorInput.addEventListener('focus', function () {
        if (expertSuggestions.length === 0) {
            $.get(`/vault-detail/experts?vaultId=${vaultId}`, function (data) {
                expertSuggestions = data;
                renderSuggestions();
            });
        } else {
            renderSuggestions();
        }
    });

    instructorInput.addEventListener('input', function () {
        renderSuggestions(instructorInput.value.trim());
    });

    instructorInput.addEventListener('blur', function () {
        setTimeout(() => suggestionBox.style.display = 'none', 200);
    });
});

function parseDurationToMinutes(durationString) {
    if (!durationString) return 0;

    let totalMinutes = 0;

    const hoursMatch = durationString.match(/(\d+)h/);
    const minutesMatch = durationString.match(/(\d+)m/);

    if (hoursMatch) {
        totalMinutes += parseInt(hoursMatch[1]) * 60;
    }

    if (minutesMatch) {
        totalMinutes += parseInt(minutesMatch[1]);
    }

    return totalMinutes;
}

// Prevent multiple session creation calls
let isCreatingSession = false;
let editingSessionId = null; // Track if we're editing

function createSession() {
    if (isCreatingSession) {
        return;
    }

    isCreatingSession = true;

    try {
        const title = document.getElementById('sessionTitle').value;
        const description = document.getElementById('sessionDescription').value;
        const date = document.getElementById('sessionDate').value;
        const time = document.getElementById('sessionTime').value;
        const endDate = document.getElementById('sessionEndDate').value;
        const endTime = document.getElementById('sessionEndTime').value;
        const durationString = document.getElementById('sessionDuration').value;
        const duration = parseDurationToMinutes(durationString);

        console.log('🔍 Form field values:', {
            endTimeField: document.getElementById('sessionEndTime'),
            endTimeValue: endTime,
            durationField: document.getElementById('sessionDuration'),
            durationString: durationString,
            parsedDuration: duration
        });
        const instructorIdInput = document.getElementById('sessionInstructorId');
        const instructor = instructorIdInput ? instructorIdInput.value : '';
        const meetingLink = document.getElementById('meetingLink').value;
        const tags = getSessionTagsAsString();
        const vaultId = new URLSearchParams(window.location.search).get('id');

        console.log('Session data before submit:', {
            title, description, date, time, endDate, endTime, duration, instructor, meetingLink, tags, vaultId,
            isEditing: editingSessionId !== null,
            sessionSelectedTags: sessionSelectedTags
        });

        if (!title || !date || !time || !duration || !instructor) {
            console.log('Validation failed:', {
                title: !!title,
                date: !!date,
                time: !!time,
                duration: !!duration,
                instructor: !!instructor,
                instructorValue: instructor
            });
            showToast('Please fill in all required fields!', 'error');
            isCreatingSession = false;
            return;
        }

        const ajaxData = {
            title,
            description,
            date,
            time,
            endDate,
            endTime,
            duration,
            instructor,
            meetingLink,
            tags,
            vaultId
        };

        // Add sessionId if editing
        if (editingSessionId) {
            ajaxData.sessionId = editingSessionId;
        }

        const isEditing = editingSessionId !== null;
        const url = isEditing ? '/vault-detail/update-session' : '/vault-detail/create-session';
        const successMessage = isEditing ? 'Session updated successfully!' : 'Session created successfully!';

        // Update button state
        const createBtn = document.getElementById('createSessionBtn');
        const originalText = createBtn.innerHTML;
        const loadingText = isEditing ? 'Updating...' : 'Creating...';
        createBtn.innerHTML = `<i class="las la-spinner la-spin mr-2"></i>${loadingText}`;
        createBtn.disabled = true;

        $.ajax({
            url: url,
            type: 'POST',
            data: ajaxData,
            success: function (response) {
                isCreatingSession = false;
                createBtn.innerHTML = originalText;
                createBtn.disabled = false;

                showToast(successMessage, 'success');
                $('#createSessionModal').modal('hide');
                document.getElementById('createSessionForm').reset();
                sessionSelectedTags = [];
                updateSessionSelectedTagsDisplay();

                editingSessionId = null;
                currentEditingSessionId = null;

                setTimeout(function () {
                    $('.modal-backdrop').remove();
                    $('body').removeClass('modal-open');
                    $('body').css('padding-right', '');
                }, 300);
                window.location.reload();

            },
            error: function (xhr) {
                isCreatingSession = false;
                createBtn.innerHTML = originalText;
                createBtn.disabled = false;
                showToast('Error creating session: ' + (xhr.responseText || 'Unknown error'), 'error');
            }
        });
    } catch (error) {
        console.error('Error in createSession():', error);
        showToast('Error creating session: ' + error.message, 'error');
        isCreatingSession = false;
        return;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('sessionDate').value = today;
});


// Withdraw functionality with popup confirmation - HIGHEST PRIORITY
document.addEventListener('click', function (e) {
    console.log('Document click detected, target:', e.target, 'classList:', e.target.classList);

    // Check if the clicked element or its parent is a withdraw button
    const withdrawBtn = e.target.closest('.withdraw-trigger-btn');
    if (withdrawBtn) {
        console.log('=== Withdraw button found via document listener! ===');
        e.preventDefault();
        e.stopImmediatePropagation(); // Stop all other listeners

        const knowledgeId = withdrawBtn.getAttribute('data-knowledge-id');
        const vaultId = withdrawBtn.getAttribute('data-vault-id');
        const folderId = withdrawBtn.getAttribute('data-folder-id');
        const knowledgeTitle = withdrawBtn.getAttribute('data-knowledge-title');

        console.log('Direct attributes:', { knowledgeId, vaultId, folderId, knowledgeTitle });

        if (knowledgeId && vaultId && folderId) {
            showWithdrawModal(knowledgeId, vaultId, folderId, knowledgeTitle);
        } else {
            console.error('Missing required data attributes:', { knowledgeId, vaultId, folderId, knowledgeTitle });
        }
    }
}, true); // Use capture phase for highest priority

// Debug: Check if withdraw buttons exist when page loads
$(document).ready(function () {
    console.log('Checking for withdraw buttons...');
    const withdrawButtons = $('.withdraw-trigger-btn');
    console.log('Found withdraw buttons:', withdrawButtons.length);

    withdrawButtons.each(function (index, btn) {
        const $btn = $(btn);
        console.log(`Button ${index}:`, {
            knowledgeId: $btn.data('knowledge-id'),
            vaultId: $btn.data('vault-id'),
            folderId: $btn.data('folder-id'),
            knowledgeTitle: $btn.data('knowledge-title'),
            visible: $btn.is(':visible'),
            enabled: !$btn.prop('disabled')
        });

        // Add direct onclick for testing
        btn.addEventListener('click', function (e) {
            console.log('=== Direct onclick event triggered! ===');
        });
    });
});

function showWithdrawModal(knowledgeId, vaultId, folderId, knowledgeTitle) {
    console.log('showWithdrawModal called:', { knowledgeId, vaultId, folderId, knowledgeTitle });

    // Set form data
    const withdrawKnowledgeId = document.getElementById('withdrawKnowledgeId');
    const withdrawVaultId = document.getElementById('withdrawVaultId');
    const withdrawFolderId = document.getElementById('withdrawFolderId');
    const withdrawPrivate = document.getElementById('withdrawPrivate');
    const knowledgeNameToWithdraw = document.getElementById('knowledgeNameToWithdraw');

    console.log('Form elements found:', {
        withdrawKnowledgeId: !!withdrawKnowledgeId,
        withdrawVaultId: !!withdrawVaultId,
        withdrawFolderId: !!withdrawFolderId,
        withdrawPrivate: !!withdrawPrivate,
        knowledgeNameToWithdraw: !!knowledgeNameToWithdraw
    });

    if (withdrawKnowledgeId) withdrawKnowledgeId.value = knowledgeId;
    if (withdrawVaultId) withdrawVaultId.value = vaultId;
    if (withdrawFolderId) withdrawFolderId.value = folderId;
    if (knowledgeNameToWithdraw) knowledgeNameToWithdraw.textContent = knowledgeTitle;

    // Check if we're in private mode based on current URL
    const urlParams = new URLSearchParams(window.location.search);
    const isPrivateMode = urlParams.get('private') === 'true';
    if (withdrawPrivate) {
        withdrawPrivate.value = isPrivateMode ? 'true' : '';
    }

    // Check review status
    fetch(`/vault-detail/get-reviewer-info?knowledgeId=${knowledgeId}`)
        .then(response => response.json())
        .then(data => {
            const warningDiv = document.getElementById('withdrawReviewWarning');
            const messageSpan = document.getElementById('withdrawReviewMessage');

            if (data.isBeingReviewed) {
                messageSpan.textContent = `This knowledge is currently being reviewed by ${data.reviewerName || 'an expert'}.`;
                warningDiv.style.display = 'block';
            } else {
                warningDiv.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error checking review status:', error);
            const warningDiv = document.getElementById('withdrawReviewWarning');
            if (warningDiv) warningDiv.style.display = 'none';
        });

    // Show modal
    const popup = document.getElementById('withdrawKnowledgePopup');
    console.log('Popup element:', popup);
    if (popup) {
        console.log('Showing popup...');
        popup.style.display = 'flex';
        setTimeout(() => {
            popup.classList.add('show');
            console.log('Added show class');
        }, 10);
    } else {
        console.error('withdrawKnowledgePopup not found!');
    }
}

function hideWithdrawModal() {
    const popup = document.getElementById('withdrawKnowledgePopup');
    popup.classList.remove('show');
    setTimeout(() => popup.style.display = 'none', 300);
}

function confirmWithdrawKnowledge() {
    document.getElementById('withdrawKnowledgeForm').submit();
}

// Close withdraw modal when clicking outside
document.addEventListener('click', function (e) {
    const popup = document.getElementById('withdrawKnowledgePopup');
    if (popup && popup.style.display === 'flex' && !popup.querySelector('.delete-folder-popup-content').contains(e.target)) {
        hideWithdrawModal();
    }
});

// Review status checking and withdraw functions removed
// Now using direct form submit with confirmation dialog

// Review tracking functions
function startReviewing(knowledgeId, vaultId) {
    fetch('/vault-detail/start-reviewing', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `knowledgeId=${encodeURIComponent(knowledgeId)}&vaultId=${encodeURIComponent(vaultId)}`
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast(data.message, 'success');
                // Refresh review status indicators
                loadReviewStatusIndicators();
            } else {
                showToast(data.message, 'error');
            }
        })
        .catch(error => {
            showToast('Có lỗi xảy ra khi bắt đầu review!', 'error');
            console.error(error);
        });
}

function stopReviewing(knowledgeId) {
    fetch('/vault-detail/stop-reviewing', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `knowledgeId=${encodeURIComponent(knowledgeId)}`
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast(data.message, 'success');
                // Refresh review status indicators
                loadReviewStatusIndicators();
            } else {
                showToast(data.message, 'error');
            }
        })
        .catch(error => {
            showToast('Có lỗi xảy ra khi dừng review!', 'error');
            console.error(error);
        });
}

function loadReviewStatusIndicators() {
    $('.review-status-indicator').each(function () {
        const knowledgeId = $(this).data('knowledge-id');
        const indicator = $(this);

        fetch(`/vault-detail/get-reviewer-info?knowledgeId=${knowledgeId}`)
            .then(response => response.json())
            .then(data => {
                const alert = indicator.find('.alert');
                if (data.isBeingReviewed) {
                    alert.find('.reviewer-name').text(data.reviewerName || 'Unknown');
                    alert.show();
                } else {
                    alert.hide();
                }
            })
            .catch(error => {
                console.error('Error loading review status:', error);
            });
    });
}

// Load review status indicators when page loads
$(document).ready(function () {
    loadReviewStatusIndicators();

    // Refresh review status every 30 seconds
    setInterval(loadReviewStatusIndicators, 30000);
});


// Calendar helper functions for 24-hour view
function calculateEventPosition(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    // Each hour = 80px, start at 0:00 (after 60px header)
    const topPx = (hours * 80) + (minutes / 60 * 80) + 60;
    return topPx;
}

function formatTimeForCalendar(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function showEventDetails(eventId) {
    // This function can be expanded to show event details in a modal
    console.log('Show event details for:', eventId);
}

function updateCalendarHeader() {
    const baseDate = currentWeekStart || new Date();
    const now = new Date();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const currentDay = baseDate.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() + mondayOffset);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const weekMonth = monthNames[monday.getMonth()];
    const weekYear = monday.getFullYear();

    const mondayMonth = monthNames[monday.getMonth()];
    const sundayMonth = monthNames[sunday.getMonth()];
    const mondayDay = monday.getDate();
    const sundayDay = sunday.getDate();

    let weekText;
    if (monday.getMonth() === sunday.getMonth()) {
        weekText = `${mondayMonth} ${mondayDay}-${sundayDay}, ${weekYear}`;
    } else {
        weekText = `${mondayMonth} ${mondayDay} - ${sundayMonth} ${sundayDay}, ${weekYear}`;
    }

    const startOfYear = new Date(weekYear, 0, 1);
    const pastDaysOfYear = (monday - startOfYear) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);

    const monthElement = document.getElementById('calendarCurrentMonth');
    const weekElement = document.getElementById('calendarCurrentWeek');
    const buttonElement = document.getElementById('calendarWeekButton');

    if (monthElement) {
        monthElement.textContent = `${weekMonth} ${weekYear}`;
    }

    if (weekElement) {
        weekElement.textContent = `Week of ${weekText}`;
    }

    if (buttonElement) {
        buttonElement.innerHTML = `
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" style="margin-right: 6px;">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"></path>
            </svg>
            Week ${weekNumber}, ${weekYear}
        `;
    }

    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(monday);
        dayDate.setDate(monday.getDate() + i);
        const dayElement = document.getElementById(`calendar-day-${i}`);

        if (dayElement) {
            const day = dayDate.getDate();
            dayElement.textContent = day;

            const isToday = dayDate.toDateString() === now.toDateString();
            if (isToday) {
                dayElement.style.color = 'rgb(245, 167, 0)';
                dayElement.style.fontWeight = '700';
            } else {
                dayElement.style.color = '#1f2937';
                dayElement.style.fontWeight = '600';
            }
        }
    }

    updateDropdownWeeks();
}

function updateDropdownWeeks() {
    const dropdown = document.getElementById('calendarWeekDropdown');
    if (!dropdown) return;

    const now = new Date();
    const currentYear = now.getFullYear();

    dropdown.innerHTML = '';

    const header = document.createElement('h6');
    header.className = 'dropdown-header';
    header.style.cssText = 'font-size: 11px; color: #6b7280; font-weight: 600;';
    header.textContent = `${currentYear} Weeks`;
    dropdown.appendChild(header);

    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    let weekIterator = new Date(startOfYear);
    const dayOfWeek = weekIterator.getDay();
    if (dayOfWeek !== 1) {
        weekIterator.setDate(weekIterator.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    }

    let weekNumber = 1;
    let currentMonth = '';

    while (weekIterator <= endOfYear) {
        const weekEnd = new Date(weekIterator);
        weekEnd.setDate(weekIterator.getDate() + 6);

        const weekStartMonth = weekIterator.toLocaleString('default', { month: 'long' });
        const weekStartYear = weekIterator.getFullYear();

        if (currentMonth !== weekStartMonth && weekIterator.getFullYear() === currentYear) {
            if (currentMonth !== '') {
                const divider = document.createElement('div');
                divider.className = 'dropdown-divider';
                divider.style.margin = '8px 0 4px 0';
                dropdown.appendChild(divider);
            }

            const monthHeader = document.createElement('h6');
            monthHeader.className = 'dropdown-header';
            monthHeader.style.cssText = 'font-size: 10px; color: #9ca3af;';
            monthHeader.textContent = `${weekStartMonth} ${weekStartYear}`;
            dropdown.appendChild(monthHeader);

            currentMonth = weekStartMonth;
        }

        const weekItem = document.createElement('a');
        weekItem.className = 'dropdown-item';
        weekItem.href = '#';
        weekItem.style.cssText = 'font-size: 12px; padding: 6px 16px;';

        const today = new Date();
        const todayWeekStart = new Date(today);
        const todayDay = todayWeekStart.getDay();
        const todayDiff = todayWeekStart.getDate() - (todayDay === 0 ? 6 : todayDay - 1);
        todayWeekStart.setDate(todayDiff);

        const selectedWeek = currentWeekStart || todayWeekStart;
        const isCurrentWeek = weekIterator.toDateString() === selectedWeek.toDateString();

        if (isCurrentWeek) {
            weekItem.classList.add('active');
            weekItem.style.cssText += ' background-color: #fffdefff; color: #f5a700ff;';
        }

        const weekContent = document.createElement('div');
        weekContent.className = 'd-flex justify-content-between align-items-center';

        const weekLabel = document.createElement('span');
        weekLabel.textContent = `Week ${weekNumber}`;
        if (isCurrentWeek) {
            weekLabel.style.fontWeight = '500';
        }

        const weekDates = document.createElement('small');
        weekDates.style.color = isCurrentWeek ? '#f5a700ff' : '#6b7280';

        const formatShortDate = (date) => {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        };

        weekDates.textContent = `${formatShortDate(weekIterator)} - ${formatShortDate(weekEnd)}`;

        weekContent.appendChild(weekLabel);
        weekContent.appendChild(weekDates);
        weekItem.appendChild(weekContent);


        const thisWeekStart = new Date(weekIterator);
        weekItem.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('📅 Clicked week starting:', thisWeekStart);
            navigateToWeek(thisWeekStart);
        });

        dropdown.appendChild(weekItem);

        weekIterator.setDate(weekIterator.getDate() + 7);
        weekNumber++;

        if (weekIterator.getFullYear() > currentYear) {
            break;
        }
    }

    const divider = document.createElement('div');
    divider.className = 'dropdown-divider';
    divider.style.margin = '8px 0 4px 0';
    dropdown.appendChild(divider);

    const viewAllItem = document.createElement('a');
    viewAllItem.className = 'dropdown-item';
    viewAllItem.href = '#';
    viewAllItem.style.cssText = 'font-size: 12px; padding: 6px 16px; color: #6b7280;';

    const viewAllContent = document.createElement('div');
    viewAllContent.className = 'text-center';
    viewAllContent.innerHTML = `
        <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24" style="margin-right: 4px;">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
        View All Weeks
    `;

    viewAllItem.appendChild(viewAllContent);
    dropdown.appendChild(viewAllItem);

    // Auto-scroll to current week after dropdown is populated
    setTimeout(() => {
        const activeWeek = dropdown.querySelector('.dropdown-item.active');
        if (activeWeek && dropdown.offsetParent !== null) {
            console.log('📍 Auto-scrolling to current week in dropdown');
            // Use scrollTop instead of scrollIntoView for better control
            const dropdownRect = dropdown.getBoundingClientRect();
            const activeRect = activeWeek.getBoundingClientRect();
            const scrollTop = activeWeek.offsetTop - (dropdown.offsetHeight / 2) + (activeWeek.offsetHeight / 2);
            dropdown.scrollTop = scrollTop;
        }
    }, 150);
}

function navigateToWeek(weekStart) {
    console.log('🗓️ Navigating to week starting:', weekStart);

    currentWeekStart = new Date(weekStart);
    console.log('✅ Updated currentWeekStart to:', currentWeekStart);

    updateCalendarHeader();
    console.log('✅ Calendar header updated');

    forceRefreshCalendarEvents();
    console.log('✅ Calendar events force re-rendered');

    updateDropdownWeeks();
    console.log('✅ Dropdown weeks updated');

    $('.dropdown-toggle').dropdown('hide');
}

function scrollCalendarToCurrentTime() {
    const calendarView = document.querySelector('.calendar-24h-view');
    if (!calendarView) {
        console.log('❌ Calendar view not found for auto-scroll');
        return;
    }

    const now = new Date();
    const currentHour = now.getHours();

    const scrollToHour = currentHour >= 8 ? currentHour - 2 : 6;
    const scrollPosition = scrollToHour * 80;

    console.log('📜 Auto-scrolling calendar:', {
        currentHour,
        scrollToHour,
        scrollPosition,
        description: `Scrolling to show hour ${scrollToHour} (${scrollPosition}px from top)`
    });

    setTimeout(() => {
        calendarView.scrollTop = scrollPosition;
        console.log('✅ Calendar scrolled to position:', scrollPosition);
    }, 100);
}

function scrollCalendarToFirstEvent() {
    const calendarView = document.querySelector('.calendar-24h-view');
    if (!calendarView) {
        console.log('❌ Calendar view not found for auto-scroll to first event');
        return;
    }

    // Find the first calendar event
    const firstEvent = document.querySelector('.calendar-event');
    if (!firstEvent) {
        console.log('📭 No events found, using default scroll position');
        // If no events, scroll to 8 AM as default
        const defaultScrollPosition = 8 * 80;
        setTimeout(() => {
            calendarView.scrollTop = defaultScrollPosition;
            console.log('✅ Calendar scrolled to default position (8 AM):', defaultScrollPosition);
        }, 100);
        return;
    }

    // Get the event position and scroll to it with some offset
    const eventTop = firstEvent.offsetTop;
    const scrollOffset = 80; // Show some content above the event
    const scrollPosition = Math.max(0, eventTop - scrollOffset);

    console.log('📜 Auto-scrolling calendar to first event:', {
        eventTop,
        scrollOffset,
        scrollPosition,
        description: `Scrolling to first event at ${scrollPosition}px`
    });

    setTimeout(() => {
        calendarView.scrollTop = scrollPosition;
        console.log('✅ Calendar scrolled to first event position:', scrollPosition);
    }, 100);
}

function showCurrentTimeLine() {
    const calendarView = document.querySelector('.calendar-24h-view');
    if (!calendarView) return;

    const existingLine = calendarView.querySelector('.calendar-current-time-line');
    if (existingLine) {
        existingLine.remove();
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const topPosition = (currentHour * 80) + (currentMinute / 60 * 80) + 60;

    const timeLine = document.createElement('div');
    timeLine.className = 'calendar-current-time-line';
    timeLine.style.top = `${topPosition}px`;

    calendarView.appendChild(timeLine);
}

function updateCurrentTimeLine() {
    showCurrentTimeLine();
    setTimeout(updateCurrentTimeLine, 60000);
}

$(document).on('shown.bs.tab', 'a[data-init="calendar-view"]', function (e) {
    console.log('Calendar tab activated');
    const noteContent = document.querySelector('.note-content');
    if (noteContent) {
        noteContent.classList.add('calendar-active');
        console.log('Added calendar-active class');
    }

    console.log('🔍 About to call current time line functions...');
    showCurrentTimeLine();
    updateCurrentTimeLine();

    document.querySelectorAll('.calendar-event').forEach(event => {
        event.addEventListener('click', function () {
            const eventId = this.getAttribute('onclick')?.match(/showEventDetails\('([^']+)'\)/)?.[1];
            if (eventId) {
                showEventDetails(eventId);
            }
        });
    });
});

$(document).on('shown.bs.tab', 'a[data-toggle="pill"]:not([data-init="calendar-view"])', function (e) {
    console.log('Other tab activated');
    const noteContent = document.querySelector('.note-content');
    if (noteContent) {
        noteContent.classList.remove('calendar-active');
        console.log('Removed calendar-active class'); // Debug log
    }
});

// Alternative event listeners for tab switching
$(document).ready(function () {
    // Listen for click events on all tab links
    $('a[data-toggle="pill"]').on('click', function (e) {
        const href = $(this).attr('href');
        const dataInit = $(this).attr('data-init');
        console.log('Tab clicked:', href, dataInit);

        setTimeout(function () {
            const noteContent = document.querySelector('.note-content');
            if (noteContent) {
                if (dataInit === 'calendar-view') {
                    noteContent.classList.add('calendar-active');
                    console.log('Added calendar-active class via click');
                    // Force refresh calendar when switching to calendar tab
                    setTimeout(() => {
                        forceRefreshCalendarEvents();
                    }, 200);
                } else {
                    noteContent.classList.remove('calendar-active');
                    console.log('Removed calendar-active class via click');
                }
            }
        }, 100);
    });
});


function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes}m`;
    } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (remainingMinutes === 0) {
            return `${hours}h`;
        } else {
            return `${hours}h${remainingMinutes}m`;
        }
    }
}

function updateEndTimeOptions() {
    const startTimeSelect = document.getElementById('sessionTime');
    const endTimeSelect = document.getElementById('sessionEndTime');
    const startDate = document.getElementById('sessionDate');
    const endDate = document.getElementById('sessionEndDate');

    const startTimeValue = startTimeSelect.value;

    endTimeSelect.innerHTML = '<option value="">Select end time</option>';

    if (!startTimeValue) {
        endDate.value = '';
        return;
    }

    endDate.value = startDate.value;

    const timeSlots = [
        { value: "00:00", display: "12:00 AM" },
        { value: "00:30", display: "12:30 AM" },
        { value: "01:00", display: "1:00 AM" },
        { value: "01:30", display: "1:30 AM" },
        { value: "02:00", display: "2:00 AM" },
        { value: "02:30", display: "2:30 AM" },
        { value: "03:00", display: "3:00 AM" },
        { value: "03:30", display: "3:30 AM" },
        { value: "04:00", display: "4:00 AM" },
        { value: "04:30", display: "4:30 AM" },
        { value: "05:00", display: "5:00 AM" },
        { value: "05:30", display: "5:30 AM" },
        { value: "06:00", display: "6:00 AM" },
        { value: "06:30", display: "6:30 AM" },
        { value: "07:00", display: "7:00 AM" },
        { value: "07:30", display: "7:30 AM" },
        { value: "08:00", display: "8:00 AM" },
        { value: "08:30", display: "8:30 AM" },
        { value: "09:00", display: "9:00 AM" },
        { value: "09:30", display: "9:30 AM" },
        { value: "10:00", display: "10:00 AM" },
        { value: "10:30", display: "10:30 AM" },
        { value: "11:00", display: "11:00 AM" },
        { value: "11:30", display: "11:30 AM" },
        { value: "12:00", display: "12:00 PM" },
        { value: "12:30", display: "12:30 PM" },
        { value: "13:00", display: "1:00 PM" },
        { value: "13:30", display: "1:30 PM" },
        { value: "14:00", display: "2:00 PM" },
        { value: "14:30", display: "2:30 PM" },
        { value: "15:00", display: "3:00 PM" },
        { value: "15:30", display: "3:30 PM" },
        { value: "16:00", display: "4:00 PM" },
        { value: "16:30", display: "4:30 PM" },
        { value: "17:00", display: "5:00 PM" },
        { value: "17:30", display: "5:30 PM" },
        { value: "18:00", display: "6:00 PM" },
        { value: "18:30", display: "6:30 PM" },
        { value: "19:00", display: "7:00 PM" },
        { value: "19:30", display: "7:30 PM" },
        { value: "20:00", display: "8:00 PM" },
        { value: "20:30", display: "8:30 PM" },
        { value: "21:00", display: "9:00 PM" },
        { value: "21:30", display: "9:30 PM" },
        { value: "22:00", display: "10:00 PM" },
        { value: "22:30", display: "10:30 PM" },
        { value: "23:00", display: "11:00 PM" },
        { value: "23:30", display: "11:30 PM" }
    ];

    const startTimeIndex = timeSlots.findIndex(slot => slot.value === startTimeValue);

    if (startTimeIndex === -1) return;

    const [startHour, startMinute] = startTimeValue.split(':').map(Number);
    const startTimeInMinutes = startHour * 60 + startMinute;

    for (let i = startTimeIndex + 1; i < timeSlots.length; i++) {
        const endSlot = timeSlots[i];
        const [endHour, endMinute] = endSlot.value.split(':').map(Number);
        const endTimeInMinutes = endHour * 60 + endMinute;

        let durationInMinutes = endTimeInMinutes - startTimeInMinutes;

        if (durationInMinutes > 1410) break;

        const durationText = formatDuration(durationInMinutes);

        const option = document.createElement('option');
        option.value = endSlot.value;
        option.textContent = `${endSlot.display} (${durationText})`;
        option.setAttribute('data-display-text', endSlot.display);
        endTimeSelect.appendChild(option);
    }

    if (timeSlots.length - startTimeIndex - 1 < 24) {
        for (let i = 0; i <= startTimeIndex; i++) {
            const endSlot = timeSlots[i];
            const [endHour, endMinute] = endSlot.value.split(':').map(Number);
            const endTimeInMinutes = endHour * 60 + endMinute;

            let durationInMinutes = (1440 - startTimeInMinutes) + endTimeInMinutes;

            if (durationInMinutes > 1410) break;

            const durationText = formatDuration(durationInMinutes);

            const option = document.createElement('option');
            option.value = endSlot.value;
            option.textContent = `${endSlot.display} +1 day (${durationText})`;
            option.setAttribute('data-display-text', `${endSlot.display} +1 day`);
            option.setAttribute('data-next-day', 'true');
            endTimeSelect.appendChild(option);
        }
    }
}

function calculateDuration() {
    const startTimeSelect = document.getElementById('sessionTime');
    const endTimeSelect = document.getElementById('sessionEndTime');
    const startDate = document.getElementById('sessionDate');
    const endDate = document.getElementById('sessionEndDate');
    const durationInput = document.getElementById('sessionDuration');

    const startTimeValue = startTimeSelect.value;
    const endTimeValue = endTimeSelect.value;

    if (!startTimeValue || !endTimeValue) {
        durationInput.value = '';
        return;
    }

    const selectedOption = endTimeSelect.options[endTimeSelect.selectedIndex];
    const displayText = selectedOption.getAttribute('data-display-text');
    if (displayText) {
        selectedOption.textContent = displayText;
    }

    if (selectedOption.getAttribute('data-next-day') === 'true') {
        const nextDate = new Date(startDate.value);
        nextDate.setDate(nextDate.getDate() + 1);
        endDate.value = nextDate.toISOString().split('T')[0];
    } else {
        endDate.value = startDate.value;
    }

    const [startHour, startMinute] = startTimeValue.split(':').map(Number);
    const [endHour, endMinute] = endTimeValue.split(':').map(Number);

    const startTimeInMinutes = startHour * 60 + startMinute;
    let endTimeInMinutes = endHour * 60 + endMinute;

    if (selectedOption.getAttribute('data-next-day') === 'true') {
        endTimeInMinutes += 1440;
    }

    const durationInMinutes = endTimeInMinutes - startTimeInMinutes;
    const formattedDuration = formatDuration(durationInMinutes);

    durationInput.value = formattedDuration;
}

function updateStartDateChange() {
    const startDateInput = document.getElementById('sessionDate');
    startDateInput.addEventListener('change', function () {
        const endDate = document.getElementById('sessionEndDate');
        const startTime = document.getElementById('sessionTime');
        const endTime = document.getElementById('sessionEndTime');

        endTime.innerHTML = '<option value="">Select end time</option>';
        endDate.value = this.value;

        if (startTime.value) {
            updateEndTimeOptions();
        }
    });
}

function getNextTimeSlot() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const timeSlots = [
        { value: "00:00", display: "12:00 AM" },
        { value: "00:30", display: "12:30 AM" },
        { value: "01:00", display: "1:00 AM" },
        { value: "01:30", display: "1:30 AM" },
        { value: "02:00", display: "2:00 AM" },
        { value: "02:30", display: "2:30 AM" },
        { value: "03:00", display: "3:00 AM" },
        { value: "03:30", display: "3:30 AM" },
        { value: "04:00", display: "4:00 AM" },
        { value: "04:30", display: "4:30 AM" },
        { value: "05:00", display: "5:00 AM" },
        { value: "05:30", display: "5:30 AM" },
        { value: "06:00", display: "6:00 AM" },
        { value: "06:30", display: "6:30 AM" },
        { value: "07:00", display: "7:00 AM" },
        { value: "07:30", display: "7:30 AM" },
        { value: "08:00", display: "8:00 AM" },
        { value: "08:30", display: "8:30 AM" },
        { value: "09:00", display: "9:00 AM" },
        { value: "09:30", display: "9:30 AM" },
        { value: "10:00", display: "10:00 AM" },
        { value: "10:30", display: "10:30 AM" },
        { value: "11:00", display: "11:00 AM" },
        { value: "11:30", display: "11:30 AM" },
        { value: "12:00", display: "12:00 PM" },
        { value: "12:30", display: "12:30 PM" },
        { value: "13:00", display: "1:00 PM" },
        { value: "13:30", display: "1:30 PM" },
        { value: "14:00", display: "2:00 PM" },
        { value: "14:30", display: "2:30 PM" },
        { value: "15:00", display: "3:00 PM" },
        { value: "15:30", display: "3:30 PM" },
        { value: "16:00", display: "4:00 PM" },
        { value: "16:30", display: "4:30 PM" },
        { value: "17:00", display: "5:00 PM" },
        { value: "17:30", display: "5:30 PM" },
        { value: "18:00", display: "6:00 PM" },
        { value: "18:30", display: "6:30 PM" },
        { value: "19:00", display: "7:00 PM" },
        { value: "19:30", display: "7:30 PM" },
        { value: "20:00", display: "8:00 PM" },
        { value: "20:30", display: "8:30 PM" },
        { value: "21:00", display: "9:00 PM" },
        { value: "21:30", display: "9:30 PM" },
        { value: "22:00", display: "10:00 PM" },
        { value: "22:30", display: "10:30 PM" },
        { value: "23:00", display: "11:00 PM" },
        { value: "23:30", display: "11:30 PM" }
    ];

    for (let slot of timeSlots) {
        const [slotHour, slotMinute] = slot.value.split(':').map(Number);
        const slotTimeInMinutes = slotHour * 60 + slotMinute;

        if (slotTimeInMinutes > currentTimeInMinutes) {
            return slot.value;
        }
    }

    return timeSlots[0].value;
}

function getEndTimeSlot(startTimeValue) {
    const [startHour, startMinute] = startTimeValue.split(':').map(Number);
    const startTimeInMinutes = startHour * 60 + startMinute;
    const targetEndTimeInMinutes = startTimeInMinutes + 30;

    let endHour, endMinute;

    if (targetEndTimeInMinutes >= 1440) {
        const nextDayMinutes = targetEndTimeInMinutes - 1440;
        endHour = Math.floor(nextDayMinutes / 60);
        endMinute = nextDayMinutes % 60;
    } else {
        endHour = Math.floor(targetEndTimeInMinutes / 60);
        endMinute = targetEndTimeInMinutes % 60;
    }

    const endTimeString = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    return endTimeString;
}

function initializeDefaultTimes() {
    const startDate = document.getElementById('sessionDate');
    const endDate = document.getElementById('sessionEndDate');
    const startTime = document.getElementById('sessionTime');
    const endTime = document.getElementById('sessionEndTime');
    const duration = document.getElementById('sessionDuration');

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    console.log('Current date:', today, 'Current time:', now.toLocaleTimeString());

    startDate.value = today;
    endDate.value = today;

    const nextStartTime = getNextTimeSlot();
    startTime.value = nextStartTime;

    updateEndTimeOptions();

    setTimeout(() => {
        const defaultEndTime = getEndTimeSlot(nextStartTime);

        let optionFound = false;

        const [startHour, startMinute] = nextStartTime.split(':').map(Number);
        const [endHour, endMinute] = defaultEndTime.split(':').map(Number);
        const startTimeInMinutes = startHour * 60 + startMinute;
        const endTimeInMinutes = endHour * 60 + endMinute;

        if (endTimeInMinutes <= startTimeInMinutes) {
            const nextDayOption = Array.from(endTime.options).find(option =>
                option.value === defaultEndTime && option.getAttribute('data-next-day') === 'true'
            );
            if (nextDayOption) {
                endTime.value = defaultEndTime;
                optionFound = true;

                const nextDay = new Date(now);
                nextDay.setDate(nextDay.getDate() + 1);
                const nextYear = nextDay.getFullYear();
                const nextMonth = String(nextDay.getMonth() + 1).padStart(2, '0');
                const nextDayDate = String(nextDay.getDate()).padStart(2, '0');
                const nextDayFormatted = `${nextYear}-${nextMonth}-${nextDayDate}`;
                endDate.value = nextDayFormatted;
            }
        } else {
            const sameDayOption = Array.from(endTime.options).find(option =>
                option.value === defaultEndTime && option.getAttribute('data-next-day') !== 'true'
            );
            if (sameDayOption) {
                endTime.value = defaultEndTime;
                optionFound = true;
            }
        }

        if (!optionFound) {
            const thirtyMinOption = Array.from(endTime.options).find(option =>
                option.textContent.includes('(30m)')
            );
            if (thirtyMinOption) {
                endTime.value = thirtyMinOption.value;
                optionFound = true;

                if (thirtyMinOption.getAttribute('data-next-day') === 'true') {
                    const nextDay = new Date(today);
                    nextDay.setDate(nextDay.getDate() + 1);
                    endDate.value = nextDay.toISOString().split('T')[0];
                }
            }
        }

        if (optionFound) {
            duration.value = '30m';
            calculateDuration();
        }
    }, 100);
}

document.addEventListener('DOMContentLoaded', function () {
    $('#createSessionModal').on('shown.bs.modal', function () {
        // Only initialize default times if not in editing mode
        if (!editingSessionId) {
            initializeDefaultTimes();
        }
        initializeSessionTagInput();
    });

    // Reset modal to create mode when closed
    $('#createSessionModal').on('hidden.bs.modal', function () {
        resetSessionModal();
    });

    // Prevent form default submission
    const createSessionForm = document.getElementById('createSessionForm');
    if (createSessionForm) {
        createSessionForm.addEventListener('submit', function (e) {
            e.preventDefault();
            createSession();
        });
    }

    // Add direct button click handler as backup
    const createSessionBtn = document.getElementById('createSessionBtn');
    if (createSessionBtn) {
        createSessionBtn.addEventListener('click', function (e) {
            e.preventDefault();
            createSession();
        });
    }

    updateStartDateChange();

    // Fix dropdown buttons by adding missing classes and attributes
    $('[data-toggle="dropdown"]').each(function () {
        $(this).addClass('dropdown-toggle');
        if (!$(this).attr('aria-haspopup')) {
            $(this).attr('aria-haspopup', 'true');
        }
        if (!$(this).attr('aria-expanded')) {
            $(this).attr('aria-expanded', 'false');
        }
    });

    $('.dropdown-toggle').dropdown();

    $(document).on('click', '.dropdown-menu', function (e) {
        e.stopPropagation(); // Prevent dropdown from closing when clicking inside
    });

    $(document).on('click', '.dropdown-item', function (e) {
        console.log('Dropdown item clicked:', this.className, this.textContent.trim());

        // Don't stop propagation for withdraw buttons
        if (!$(this).hasClass('withdraw-trigger-btn')) {
            e.stopPropagation();
        }
    });

    $(document).on('click', '.edit-session-btn', function (e) {
        console.log('Edit session button clicked specifically!');
        e.preventDefault();
        e.stopPropagation();
    });

    $(document).on('click', '.delete-session-btn', function (e) {
        console.log('Delete session button clicked specifically!');
        e.preventDefault();
        e.stopPropagation();
    });

    $(document).on('click', '.view-session-details', function (e) {
        console.log('View session details button clicked specifically!');
        e.preventDefault();
        e.stopPropagation();
    });

    // Handle upcoming join buttons - prevent navigation for offline meetings
    $(document).on('click', '.upcoming-join-btn', function (e) {
        const isOffline = $(this).data('is-offline');
        if (isOffline) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    });

    setTimeout(function () {
        $('[data-toggle="dropdown"]').each(function (index) {
        });

        $('button[data-toggle="dropdown"]').off('click.manual').on('click.manual', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const $dropdownMenu = $(this).next('.dropdown-menu');


            if ($dropdownMenu.length > 0) {
                $('.dropdown-menu').not($dropdownMenu).removeClass('show');

                $dropdownMenu.addClass('show');

                const dropdownItems = $dropdownMenu.find('.dropdown-item');
                dropdownItems.each(function (index) {
                });

                $dropdownMenu.find('.view-session-details').off('click.manual').on('click.manual', function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    const sessionData = {
                        id: $(this).data('session-id'),
                        title: $(this).data('session-title'),
                        description: $(this).data('session-description'),
                        startTime: $(this).data('session-start-time'),
                        duration: $(this).data('session-duration'),
                        instructor: $(this).data('session-instructor'),
                        meetingLink: $(this).data('session-meeting-link'),
                        tags: $(this).data('session-tags') || []
                    };

                    showSessionDetailModal(sessionData);
                    $dropdownMenu.removeClass('show');
                });

                $dropdownMenu.find('.edit-session-btn').off('click.manual').on('click.manual', function (e) {
                    console.log('Edit session clicked manually!');
                    e.preventDefault();
                    e.stopPropagation();

                    const sessionData = {
                        id: $(this).data('session-id'),
                        title: $(this).data('session-title'),
                        description: $(this).data('session-description'),
                        startDate: $(this).data('session-start-date'),
                        startTime: $(this).data('session-start-time'),
                        endDate: $(this).data('session-end-date'),
                        endTime: $(this).data('session-end-time'),
                        duration: $(this).data('session-duration'),
                        instructorId: $(this).data('session-instructor-id'),
                        instructorName: $(this).data('session-instructor-name'),
                        meetingLink: $(this).data('session-meeting-link')
                    };

                    editSession(sessionData);
                    $dropdownMenu.removeClass('show');
                });

                $dropdownMenu.find('.delete-session-btn').off('click.manual').on('click.manual', function (e) {
                    console.log('Delete session clicked manually!');
                    e.preventDefault();
                    e.stopPropagation();

                    const sessionId = $(this).data('session-id');
                    const sessionTitle = $(this).data('session-title');

                    showDeleteSessionModal(sessionId, sessionTitle);
                    $dropdownMenu.removeClass('show');
                });
            }
        });

        if (!$('#dropdown-fix-css').length) {
            $('<style id="dropdown-fix-css">')
                .text(`
                    .dropdown-menu.show { 
                        display: block !important; 
                        position: absolute !important;
                        top: 100% !important;
                        left: 0 !important;
                        z-index: 1000 !important;
                        background: white !important;
                        border: 1px solid #ddd !important;
                        border-radius: 4px !important;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important;
                    }
                    .dropdown-menu .dropdown-item {
                        display: block !important;
                        padding: 8px 16px !important;
                        text-decoration: none !important;
                        color: #333 !important;
                    }
                    .dropdown-menu .dropdown-item:hover {
                        background-color: #f8f9fa !important;
                    }
                    .delete-folder-popup {
                        transition: opacity 0.3s ease !important;
                        opacity: 0 !important;
                    }
                    .delete-folder-popup[style*="flex"] {
                        opacity: 1 !important;
                    }
                    /* Hide dropdown arrow for session dropdown buttons */
                    .dropdown button.dropdown-toggle::after {
                        display: none !important;
                    }
                    .dropdown .dropdown-toggle::after {
                        display: none !important;
                    }
                `)
                .appendTo('head');
        }
    }, 1000);

    // Debug: Check dropdown toggle clicks
    $(document).on('click', '[data-toggle="dropdown"]', function (e) {
        console.log('Dropdown toggle clicked');
        e.preventDefault();
        e.stopPropagation();

        const $dropdownMenu = $(this).siblings('.dropdown-menu');
        console.log('Dropdown menu found:', $dropdownMenu.length);

        // Close other dropdowns
        $('.dropdown-menu').not($dropdownMenu).removeClass('show');

        // Toggle current dropdown
        $dropdownMenu.toggleClass('show');

        console.log('Manual dropdown toggle, menu show:', $dropdownMenu.hasClass('show'));
        console.log('Dropdown menu HTML:', $dropdownMenu.html().substring(0, 200));
    });

    // Alternative: Listen for clicks on any button in dropdown
    $(document).on('click', '.dropdown button', function (e) {
        console.log('Dropdown button clicked (alternative)');
        e.preventDefault();
        e.stopPropagation();

        const $dropdownMenu = $(this).siblings('.dropdown-menu');
        if ($dropdownMenu.length === 0) {
            // Try parent's sibling
            const $dropdownMenu2 = $(this).parent().siblings('.dropdown-menu');
            console.log('Dropdown menu found (parent sibling):', $dropdownMenu2.length);
            $dropdownMenu2.toggleClass('show');
        } else {
            console.log('Dropdown menu found (sibling):', $dropdownMenu.length);
            $dropdownMenu.toggleClass('show');
        }
    });

    // Specific event listener for session dropdown buttons
    $(document).on('click', 'button[data-toggle="dropdown"]', function (e) {
        console.log('Session dropdown button clicked!');
        const $this = $(this);
        const $dropdownMenu = $this.next('.dropdown-menu');

        if ($dropdownMenu.length > 0) {
            e.preventDefault();
            e.stopPropagation();

            // Close other dropdowns
            $('.dropdown-menu').not($dropdownMenu).removeClass('show');

            // Toggle current dropdown
            $dropdownMenu.toggleClass('show');
            console.log('Session dropdown toggled, show:', $dropdownMenu.hasClass('show'));
        }
    });

    // Close dropdown when clicking outside
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.dropdown').length) {
            $('.dropdown-menu').removeClass('show');
        }
    });
});

let sessionAllTags = [];
let sessionSelectedTags = [];

function renderCalendarEvents() {
    try {
        // Get current week start date
        const baseDate = currentWeekStart || new Date();
        const currentDay = baseDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Calculate Monday of selected week
        const monday = new Date(baseDate);
        monday.setDate(baseDate.getDate() + mondayOffset);

        // Format date for API
        const weekStartStr = monday.toISOString().split('T')[0]; // YYYY-MM-DD format
        const vaultId = new URLSearchParams(window.location.search).get('id');

        console.log('📅 Fetching calendar events for week starting:', weekStartStr);

        // Fetch events from API
        fetch(`/vault-detail/calendar-sessions?vaultId=${vaultId}&weekStart=${weekStartStr}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(sessions => {
                console.log('📋 Fetched sessions:', sessions);

                // Clear existing events more thoroughly
                const existingEvents = document.querySelectorAll('.calendar-event');
                console.log(`🧹 Clearing ${existingEvents.length} existing events`);
                existingEvents.forEach(event => {
                    event.remove();
                });

                // Also clear any potential orphaned elements
                const orphanedEvents = document.querySelectorAll('.calendar-event');
                if (orphanedEvents.length > 0) {
                    console.log(`🧹 Clearing ${orphanedEvents.length} orphaned events`);
                    orphanedEvents.forEach(event => {
                        event.remove();
                    });
                }

                if (sessions.length === 0) {
                    console.log('📭 No sessions to render');
                    return;
                }

                // Group sessions by time slot and day
                const groupedSessions = groupSessionsByTimeSlot(sessions);

                // Render each group
                Object.keys(groupedSessions).forEach(groupKey => {
                    const group = groupedSessions[groupKey];
                    console.log(`🎯 Rendering group: ${groupKey} with ${group.sessions.length} sessions`);

                    if (group.sessions.length === 1) {
                        // Single event, render normally
                        console.log(`📌 Rendering single event: ${group.sessions[0].title}`);
                        renderCalendarEvent(group.sessions[0]);
                    } else {
                        // Multiple events in same time slot, render with division
                        console.log(`📌 Rendering ${group.sessions.length} events in group:`, group.sessions.map(s => s.title));
                        renderCalendarEventGroup(group);
                    }
                });

                console.log('✅ Calendar events rendering completed');

                // Auto-scroll to first event after rendering
                setTimeout(() => {
                    scrollCalendarToFirstEvent();
                }, 200);
            })
            .catch(error => {
                console.error('❌ Error fetching calendar events:', error);
                // Fallback to original method if API fails
                fallbackRenderCalendarEvents();
            });
    } catch (error) {
        console.error('❌ Error in renderCalendarEvents:', error);
        // Fallback to original method
        fallbackRenderCalendarEvents();
    }
}

function groupSessionsByTimeSlot(sessions) {
    const groups = {};

    sessions.forEach(session => {
        const { startDate, startTime, durationMinutes } = session;

        // Parse start time to get hour and minute
        let startHour, startMinute;
        if (startTime.includes(':')) {
            [startHour, startMinute] = startTime.split(':').map(Number);
        } else {
            const timeStr = startTime.toString().padStart(4, '0');
            startHour = parseInt(timeStr.substring(0, 2));
            startMinute = parseInt(timeStr.substring(2, 4));
        }

        // Calculate end time
        const startTimeInMinutes = startHour * 60 + startMinute;
        const endTimeInMinutes = startTimeInMinutes + durationMinutes;
        const endHour = Math.floor(endTimeInMinutes / 60);

        // Create a more specific key for grouping: date + exact start time + duration
        const sessionDate = new Date(startDate + 'T00:00:00');
        const groupKey = `${sessionDate.toDateString()}_${startTime}_${durationMinutes}`;

        if (!groups[groupKey]) {
            groups[groupKey] = {
                date: startDate,
                startTime: startTime,
                startHour: startHour,
                endHour: endHour,
                durationMinutes: durationMinutes,
                sessions: []
            };
        }

        groups[groupKey].sessions.push(session);
    });

    // Sort sessions within each group by start time
    Object.keys(groups).forEach(groupKey => {
        groups[groupKey].sessions.sort((a, b) => {
            const timeA = a.startTime;
            const timeB = b.startTime;
            return timeA.localeCompare(timeB);
        });
    });

    console.log('📊 Grouped sessions:', groups);
    return groups;
}

function renderCalendarEventGroup(group) {
    const { sessions } = group;
    const totalEvents = sessions.length;

    console.log(`🔄 Rendering group with ${totalEvents} events from hour ${group.startHour} to ${group.endHour}`);

    sessions.forEach((session, index) => {
        const { id, title, description, startDate, startTime, endDate, endTime, durationMinutes, tags, instructor, instructorAvatar, meetingLink } = session;

        // Parse start time
        let startHour, startMinute;
        if (startTime.includes(':')) {
            [startHour, startMinute] = startTime.split(':').map(Number);
        } else {
            const timeStr = startTime.toString().padStart(4, '0');
            startHour = parseInt(timeStr.substring(0, 2));
            startMinute = parseInt(timeStr.substring(2, 4));
        }

        const startTimeInMinutes = startHour * 60 + startMinute;
        const topPosition = Math.floor(startTimeInMinutes / 60) * 80;
        const heightInPx = Math.max(20, Math.floor(durationMinutes * (80 / 60)));

        // Find day columns
        let dayColumns = document.querySelectorAll('.col[style*="position: relative"]');
        if (dayColumns.length === 0) {
            dayColumns = document.querySelectorAll('#note3 .col');
        }
        if (dayColumns.length === 0) {
            dayColumns = document.querySelectorAll('.tab-pane.active .col');
        }
        if (dayColumns.length === 0) {
            console.log('❌ No day columns found');
            return;
        }

        // Calculate target column
        const baseDate = currentWeekStart || new Date();
        const currentDay = baseDate.getDay();
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(baseDate);
        monday.setDate(baseDate.getDate() + mondayOffset);

        const sessionDate = new Date(startDate + 'T00:00:00');
        let targetColumnIndex = -1;

        for (let i = 0; i < 7; i++) {
            const checkDate = new Date(monday);
            checkDate.setDate(monday.getDate() + i);

            if (checkDate.toDateString() === sessionDate.toDateString()) {
                targetColumnIndex = i;
                break;
            }
        }

        if (targetColumnIndex === -1) {
            console.log(`Session ${title} is not in current week, skipping`);
            return;
        }

        let targetColumn = null;
        if (dayColumns.length > targetColumnIndex) {
            targetColumn = dayColumns[targetColumnIndex];
        } else {
            targetColumn = dayColumns[0];
        }

        // Calculate width and position for divided events
        const columnWidth = targetColumn.offsetWidth - 8; // Subtract padding
        const eventWidth = Math.floor(columnWidth / totalEvents);
        const leftPosition = 4 + (index * eventWidth);
        const rightPosition = 4 + ((index + 1) * eventWidth);

        // Add small gap between events
        const gap = 2;
        const adjustedEventWidth = eventWidth - gap;
        const adjustedLeftPosition = leftPosition + (index * gap);

        // Check if this is a past meeting based on end time
        const now = new Date();
        const sessionEndDateTime = new Date(`${endDate}T${endTime}`);
        const isPastMeeting = sessionEndDateTime < now;

        // Use default yellow color for current/future meetings, gray for past meetings
        const eventColor = isPastMeeting
            ? { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' }  // Gray for past
            : { bg: '#fffbeb', border: '#f59e0b', text: '#d97706' }; // Yellow for current/future

        // Create event element
        const eventElement = document.createElement('div');
        eventElement.className = 'calendar-event divided';
        eventElement.style.cssText = `
            position: absolute;
            top: ${topPosition}px;
            left: ${adjustedLeftPosition}px;
            width: ${adjustedEventWidth}px;
            background-color: ${eventColor.bg};
            border-left: 3px solid ${eventColor.border};
            padding: 4px 6px;
            border-radius: 4px;
            cursor: pointer;
            height: ${heightInPx}px;
            overflow: hidden;
            z-index: 10;
            transition: all 0.2s ease;
            user-select: none;
            font-size: 10px;
        `;

        eventElement.innerHTML = `
            <div style="display: flex; flex-direction: column; height: 100%;">
                <div style="font-size: 9px; font-weight: 600; color: ${eventColor.text}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.2;">
                    ${title}
                </div>
                <div style="font-size: 8px; color: ${eventColor.text}; white-space: nowrap; line-height: 1.2;">
                    ${startTime}
                </div>
                <div style="font-size: 8px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.2;">
                    ${instructor ? instructor.replace(/<[^>]*>/g, '').substring(0, 15) : 'No instructor'}
                </div>
                ${totalEvents > 1 ? `<div style="font-size: 7px; color: #9ca3af; text-align: center; margin-top: 2px;">${index + 1}/${totalEvents}</div>` : ''}
            </div>
        `;

        // Add click handler
        eventElement.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            showEventDetailPanel(session, eventElement);
        };

        // Add tooltip for divided events
        if (totalEvents > 1) {
            eventElement.title = `${title} (${index + 1} of ${totalEvents} events at this time)`;
        }

        // Append to target column
        targetColumn.appendChild(eventElement);

        console.log(`📍 Rendered divided event: ${title} at position ${index + 1}/${totalEvents}`);
    });
}

function fallbackRenderCalendarEvents() {
    try {
        const calendarSessionsJson = document.getElementById('calendarSessionsJson');
        if (!calendarSessionsJson) {
            console.log('❌ Calendar sessions JSON element not found');
            return;
        }

        console.log('📄 Raw JSON content:', calendarSessionsJson.textContent);
        const sessions = JSON.parse(calendarSessionsJson.textContent);
        console.log('📋 Parsed sessions:', sessions);

        // Clear existing events more thoroughly
        const existingEvents = document.querySelectorAll('.calendar-event');
        console.log(`🧹 Clearing ${existingEvents.length} existing events (fallback)`);
        existingEvents.forEach(event => {
            event.remove();
        });

        // Also clear any potential orphaned elements
        const orphanedEvents = document.querySelectorAll('.calendar-event');
        if (orphanedEvents.length > 0) {
            console.log(`🧹 Clearing ${orphanedEvents.length} orphaned events (fallback)`);
            orphanedEvents.forEach(event => {
                event.remove();
            });
        }

        if (sessions.length === 0) {
            console.log('📭 No sessions to render');
            return;
        }

        // Group sessions by time slot and day
        const groupedSessions = groupSessionsByTimeSlot(sessions);

        // Render each group
        Object.keys(groupedSessions).forEach(groupKey => {
            const group = groupedSessions[groupKey];
            if (group.sessions.length === 1) {
                // Single event, render normally
                renderCalendarEvent(group.sessions[0]);
            } else {
                // Multiple events in same time slot, render with division
                renderCalendarEventGroup(group);
            }
        });

        console.log('✅ Calendar events rendering completed');

        // Auto-scroll to first event after rendering
        setTimeout(() => {
            scrollCalendarToFirstEvent();
        }, 200);
    } catch (error) {
        console.error('❌ Error rendering calendar events:', error);
    }
} function renderCalendarEvent(session) {
    const { id, title, description, startDate, startTime, endDate, endTime, durationMinutes, tags, instructor, instructorAvatar, meetingLink } = session;

    console.log('🕐 Rendering event:', title);
    console.log('📊 Complete session data:', session);
    console.log('📊 Session data fields:', {
        startDate,
        startTime,
        endDate,
        endTime,
        durationMinutes,
        instructor
    });

    // Parse start time - handle different formats
    let startHour, startMinute;
    if (startTime.includes(':')) {
        [startHour, startMinute] = startTime.split(':').map(Number);
    } else {
        // Handle time as number (e.g., 1130 for 11:30)
        const timeStr = startTime.toString().padStart(4, '0');
        startHour = parseInt(timeStr.substring(0, 2));
        startMinute = parseInt(timeStr.substring(2, 4));
    }

    const startTimeInMinutes = startHour * 60 + startMinute;

    console.log('⏰ Time parsing:', {
        originalStartTime: startTime,
        parsedHour: startHour,
        parsedMinute: startMinute,
        totalMinutes: startTimeInMinutes,
        expectedTime: `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`
    });

    // Each hour = 80px, align to hour slots (ignore minutes for positioning)
    const topPosition = Math.floor(startTimeInMinutes / 60) * 80;

    console.log('📍 Position calculation:', {
        hourSlots: Math.floor(startTimeInMinutes / 60),
        hourPosition: Math.floor(startTimeInMinutes / 60) * 80,
        minuteRemainder: startTimeInMinutes % 60,
        minuteOffset: 0, // Ignoring minute offset
        headerOffset: 0,
        finalTopPosition: topPosition
    });

    // Calculate height based on duration (minimum 20px)
    const heightInPx = Math.max(20, Math.floor(durationMinutes * (80 / 60)));

    // Find the correct day column based on start date
    console.log('🔍 Looking for day columns...');

    // Try multiple selectors to find day columns
    let dayColumns = document.querySelectorAll('.col[style*="position: relative"]');
    console.log('📍 Found columns with .col[style*="position: relative"]:', dayColumns.length);

    if (dayColumns.length === 0) {
        dayColumns = document.querySelectorAll('#note3 .col');
        console.log('📍 Found columns with #note3 .col:', dayColumns.length);
    }

    if (dayColumns.length === 0) {
        dayColumns = document.querySelectorAll('.tab-pane.active .col');
        console.log('📍 Found columns with .tab-pane.active .col:', dayColumns.length);
    }

    if (dayColumns.length === 0) {
        console.log('❌ No day columns found with any selector');
        return;
    }

    console.log('✅ Using', dayColumns.length, 'day columns');

    // Get current week dates to match with session date
    // Use currentWeekStart if available, otherwise use current date
    const baseDate = currentWeekStart || new Date();
    const currentDay = baseDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Calculate Monday of selected week
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() + mondayOffset);

    console.log('📅 Using week starting:', monday.toDateString());

    // Calculate which column the session belongs to
    const sessionDate = new Date(startDate + 'T00:00:00');
    let targetColumnIndex = -1;

    for (let i = 0; i < 7; i++) { // 7 days in a week
        const checkDate = new Date(monday);
        checkDate.setDate(monday.getDate() + i);

        if (checkDate.toDateString() === sessionDate.toDateString()) {
            targetColumnIndex = i;
            break;
        }
    }

    // If session date is not in current week, skip this event
    if (targetColumnIndex === -1) {
        console.log(`Session ${title} is not in current week, skipping`);
        return;
    }

    // Find target column (skip first column which might be time labels)
    let targetColumn = null;
    if (dayColumns.length > targetColumnIndex) {
        targetColumn = dayColumns[targetColumnIndex];
    } else {
        targetColumn = dayColumns[0]; // Fallback to first column
    }

    // Check if this is a past meeting based on end time
    const now = new Date();
    const sessionEndDateTime = new Date(`${endDate}T${endTime}`);
    const isPastMeeting = sessionEndDateTime < now;

    // Use default yellow color for current/future meetings, gray for past meetings
    const eventColor = isPastMeeting
        ? { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' }  // Gray for past
        : { bg: '#fffbeb', border: '#f59e0b', text: '#d97706' }; // Yellow for current/future

    // Create event element
    const eventElement = document.createElement('div');
    eventElement.className = 'calendar-event';
    eventElement.style.cssText = `
        position: absolute;
        top: ${topPosition}px;
        left: 4px;
        right: 4px;
        background-color: ${eventColor.bg};
        border-left: 3px solid ${eventColor.border};
        padding: 6px 8px;
        border-radius: 4px;
        cursor: pointer;
        height: ${heightInPx}px;
        overflow: hidden;
        z-index: 10;
        transition: all 0.2s ease;
        user-select: none;
    `;

    eventElement.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: -10px;">
            <div style="font-size: 11px; font-weight: 600; color: ${eventColor.text}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; margin-right: 4px;">
                ${title}
            </div>
            <div style="font-size: 10px; font-weight: 500; color: ${eventColor.text}; white-space: nowrap;">
                ${startTime} - ${endTime}
            </div>
        </div>
        <div style="font-size: 10px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: -5px;">
            ${instructor ? instructor.replace(/<[^>]*>/g, '') || 'No instructor assigned' : 'No instructor assigned'}
        </div>
    `;

    // Add click handler with event detail panel
    eventElement.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        showEventDetailPanel(session, eventElement);
    };

    // Append to target column
    targetColumn.appendChild(eventElement);

    // Check actual DOM position after append
    setTimeout(() => {
        const rect = eventElement.getBoundingClientRect();
        const columnRect = targetColumn.getBoundingClientRect();
        const relativeTop = rect.top - columnRect.top;

        console.log(`📍 Event position check for "${title}":`, {
            setTopPosition: topPosition,
            actualRelativeTop: relativeTop,
            actualScreenTop: rect.top,
            columnTop: columnRect.top,
            difference: relativeTop - topPosition
        });

        // Check what time slot this corresponds to
        const timeSlotIndex = Math.floor((relativeTop - 60) / 80);
        const minutesIntoSlot = ((relativeTop - 60) % 80) / 80 * 60;
        const correspondingTime = `${timeSlotIndex.toString().padStart(2, '0')}:${Math.floor(minutesIntoSlot).toString().padStart(2, '0')}`;

        console.log(`🕐 Visual time slot: ${correspondingTime} (slot ${timeSlotIndex}, ${Math.floor(minutesIntoSlot)} minutes in)`);
    }, 100);

    console.log(`Rendered event: ${title} at ${topPosition}px with height ${heightInPx}px in column ${targetColumnIndex}`);
}

// Function to force refresh calendar events
function forceRefreshCalendarEvents() {
    console.log('🔄 Force refreshing calendar events...');

    // Clear all existing events
    const allEvents = document.querySelectorAll('.calendar-event');
    console.log(`🧹 Force clearing ${allEvents.length} events`);
    allEvents.forEach(event => {
        event.remove();
    });

    // Wait a bit then re-render
    setTimeout(() => {
        renderCalendarEvents();
    }, 100);
}

function showEventDetails(sessionId) {
    console.log('Show event details for session:', sessionId);
}

let currentDetailPanel = null;
let selectedEventElement = null;

function showEventDetailPanel(session, eventElement) {
    hideEventDetailPanel();

    document.querySelectorAll('.calendar-event').forEach(el => el.classList.remove('selected'));
    eventElement.classList.add('selected');
    selectedEventElement = eventElement;

    const panel = createEventDetailPanel(session);

    positionDetailPanel(panel, eventElement);

    document.body.appendChild(panel);

    setTimeout(() => {
        panel.classList.add('show');
    }, 10);

    currentDetailPanel = panel;

    setTimeout(() => {
        document.addEventListener('click', handleClickOutsidePanel);
        document.addEventListener('wheel', handleWheelClosePanel, { passive: true });
    }, 100);
}

function createEventDetailPanel(session) {
    const { id, title, description, startDate, startTime, endDate, endTime, durationMinutes, tags, instructor, instructorAvatar, meetingLink } = session;

    // Generate instructor initials - clean the instructor name first
    const cleanInstructorName = instructor ? instructor.replace(/<[^>]*>/g, '').trim() : '';
    const instructorInitials = cleanInstructorName ?
        cleanInstructorName.split(' ').map(name => name.charAt(0)).join('').toUpperCase() :
        'N/A';

    console.log('Creating event detail panel for session:', session);
    console.log('Tags data:', tags, 'Type:', typeof tags);
    console.log('Instructor avatar:', instructorAvatar);
    console.log('Meeting link:', meetingLink);
    console.log('Clean instructor name:', cleanInstructorName);

    const panel = document.createElement('div');
    panel.className = 'event-detail-panel';

    // Format date and time
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    const formattedDate = startDateTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedStartTime = startDateTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    const formattedEndTime = endDateTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    // Format duration
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    // Ensure tags is an array
    const tagsArray = Array.isArray(tags) ? tags : (tags ? [tags] : []);

    panel.innerHTML = `
        <div class="event-detail-header">
            <h3 class="event-detail-title">${title}</h3>
            <button class="event-detail-close">×</button>
        </div>

        ${description ? `
            <div class="event-detail-section">
                <div >${description}</div>
             </div>
            ` : ''}
            
            ${tagsArray && tagsArray.length > 0 ? `
            <div class="event-detail-section">
                <div class="event-detail-tags">
                    ${tagsArray.map(tag => `<span class="event-detail-tag">${tag}</span>`).join('')}
                </div>
            </div>
            ` : ''}
            
        
        <div class="event-detail-body">
            <div class="event-detail-section">
                <div class="event-detail-time">
                    <svg class="time-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    ${formattedStartTime} - ${formattedEndTime} <span class="event-detail-duration">(${durationText})</span>
                </div>
                
            </div>
            
            ${cleanInstructorName ? `
            <div class="event-detail-section">
                <div class="event-detail-instructor">
                    <svg class="instructor-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right: -3px;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    ${instructorAvatar ?
                `<img class="event-detail-instructor-avatar-img" src="${instructorAvatar}" alt="${cleanInstructorName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                         <div class="event-detail-instructor-avatar-fallback" style="display:none;">${instructorInitials}</div>` :
                `<div class="event-detail-instructor-avatar">${instructorInitials}</div>`
            }
                    <div class="event-detail-instructor-info">
                        <p class="event-detail-instructor-name">${cleanInstructorName}</p>
                    </div>
                </div>
            </div>
            ` : ''}
            
            
            <div class="event-detail-actions">
                <button class="event-detail-btn edit-session-btn" data-session-id="${id}" style="border-radius: 20px;">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    Edit
                </button>
                <button class="event-detail-btn primary join-session-btn" data-session-id="${id}" ${meetingLink ? `data-meeting-link="${meetingLink}"` : ''} style="${!meetingLink ? 'opacity: 0.6; cursor: not-allowed;' : ''}">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        ${meetingLink ?
            `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>` :
            `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>`
        }
                    </svg>
                    ${meetingLink ? 'Join' : 'Offline'}
                </button>
            </div>
        </div>
    `;

    // Add event listeners
    const closeBtn = panel.querySelector('.event-detail-close');
    const editBtn = panel.querySelector('.edit-session-btn');
    const joinBtn = panel.querySelector('.join-session-btn');

    closeBtn.addEventListener('click', hideEventDetailPanel);
    editBtn.addEventListener('click', () => editSession(id));
    joinBtn.addEventListener('click', () => {
        const meetingLink = joinBtn.getAttribute('data-meeting-link');
        if (meetingLink && meetingLink.trim() !== '' && meetingLink !== 'null') {
            joinSession(id, meetingLink);
        } else {
            // Prevent action for offline meetings
            return false;
        }
    });

    return panel;
}

function positionDetailPanel(panel, eventElement) {
    const eventRect = eventElement.getBoundingClientRect();
    const calendarContainer = document.querySelector('.calendar-24h-view');
    const containerRect = calendarContainer ? calendarContainer.getBoundingClientRect() : document.body.getBoundingClientRect();

    // Calculate position to the right of the event
    let left = eventRect.right + 12; // 12px gap from the event
    let top = eventRect.top;

    // Ensure panel doesn't go off-screen
    const panelWidth = 280; // minimum width from CSS
    const panelHeight = 350; // estimated height with description and tags

    // Check if panel would go off right edge of screen
    if (left + panelWidth > window.innerWidth - 20) {
        // Position to the left of the event instead
        left = eventRect.left - panelWidth - 12;
    }

    // Check if panel would go off left edge of screen
    if (left < 20) {
        left = 20;
    }

    // Check vertical positioning
    if (top + panelHeight > window.innerHeight - 20) {
        top = window.innerHeight - panelHeight - 20;
    }

    if (top < 20) {
        top = 20;
    }

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
}

function hideEventDetailPanel() {
    if (currentDetailPanel) {
        currentDetailPanel.classList.remove('show');
        setTimeout(() => {
            if (currentDetailPanel && currentDetailPanel.parentNode) {
                currentDetailPanel.parentNode.removeChild(currentDetailPanel);
            }
            currentDetailPanel = null;
        }, 300);
    }

    if (selectedEventElement) {
        selectedEventElement.classList.remove('selected');
        selectedEventElement = null;
    }

    document.removeEventListener('click', handleClickOutsidePanel);
    document.removeEventListener('wheel', handleWheelClosePanel);
}

function handleClickOutsidePanel(event) {
    if (currentDetailPanel &&
        !currentDetailPanel.contains(event.target) &&
        !event.target.closest('.calendar-event')) {
        hideEventDetailPanel();
    }
}

function handleWheelClosePanel(event) {
    if (currentDetailPanel) {
        hideEventDetailPanel();
    }
}

function editSession(sessionId) {
    console.log('Edit session:', sessionId);
    hideEventDetailPanel();

    const calendarSessionsJson = document.getElementById('calendarSessionsJson');
    if (!calendarSessionsJson) {
        console.error('Calendar sessions data not found');
        return;
    }

    try {
        const sessions = JSON.parse(calendarSessionsJson.textContent);
        const session = sessions.find(s => s.id == sessionId);

        if (!session) {
            console.error('Session not found:', sessionId);
            return;
        }

        console.log('Found session for editing:', session);

        // Update modal title to indicate editing
        const modalTitle = document.getElementById('createSessionModalLabel');
        if (modalTitle) {
            modalTitle.innerHTML = `
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"
                    style="margin-right: 8px; color: #f59e0b;">
                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                Edit Session
            `;
        }

        populateSessionForm(session);

        $('#createSessionModal').modal('show');

    } catch (error) {
        console.error('Error editing session:', error);
    }
}

function populateSessionForm(session) {
    // Set editing mode
    editingSessionId = session.id;

    // Basic info
    const titleInput = document.getElementById('sessionTitle');
    const descriptionInput = document.getElementById('sessionDescription');
    const dateInput = document.getElementById('sessionDate');
    const timeInput = document.getElementById('sessionTime');
    const endDateInput = document.getElementById('sessionEndDate');
    const endTimeInput = document.getElementById('sessionEndTime');
    const durationInput = document.getElementById('sessionDuration');
    const meetingLinkInput = document.getElementById('meetingLink');

    if (titleInput) titleInput.value = session.title || '';
    if (descriptionInput) descriptionInput.value = session.description || '';
    if (dateInput) dateInput.value = session.startDate || '';
    if (timeInput) timeInput.value = session.startTime || '';
    if (endDateInput) endDateInput.value = session.endDate || '';
    if (endTimeInput) endTimeInput.value = session.endTime || '';
    if (meetingLinkInput) meetingLinkInput.value = session.meetingLink || '';

    // Calculate and set duration
    if (session.durationMinutes) {
        const hours = Math.floor(session.durationMinutes / 60);
        const minutes = session.durationMinutes % 60;
        const durationText = hours > 0 ? `${hours}h${minutes > 0 ? minutes + 'm' : ''}` : `${minutes}m`;
        if (durationInput) durationInput.value = durationText;
    }

    // Set instructor
    const instructorInput = document.getElementById('sessionInstructor');
    const instructorIdInput = document.getElementById('sessionInstructorId');
    if (session.instructor && instructorInput) {
        // Clean instructor name (remove HTML tags)
        const cleanInstructorName = session.instructor.replace(/<[^>]*>/g, '').trim();
        instructorInput.value = cleanInstructorName;
        // Note: We should set instructorIdInput if we have the instructor ID
    }

    // Handle tags if they exist
    if (session.tags && Array.isArray(session.tags)) {
        // Clear existing selected tags
        sessionSelectedTags = [];

        // Add session tags to selected tags
        session.tags.forEach(tagName => {
            if (typeof tagName === 'string' && tagName.trim()) {
                sessionSelectedTags.push({ id: null, name: tagName.trim() });
            }
        });

        // Update the display
        updateSessionSelectedTagsDisplay();
    }

    // Update end time options based on start time
    if (timeInput && timeInput.value) {
        updateEndTimeOptions();

        // Set end time after options are updated
        setTimeout(() => {
            if (endTimeInput && session.endTime) {
                endTimeInput.value = session.endTime;
                calculateDuration();
            }
        }, 100);
    }

    console.log('Session form populated with data:', session);
}

function resetSessionModal() {
    // Reset editing mode
    editingSessionId = null;

    // Reset modal title to create mode
    const modalTitle = document.getElementById('createSessionModalLabel');
    if (modalTitle) {
        modalTitle.innerHTML = `
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"
                style="margin-right: 8px; color: #3b82f6;">
                <path
                    d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
            </svg>
            Create New Session
        `;
    }

    // Clear form fields
    const form = document.getElementById('createSessionForm');
    if (form) {
        form.reset();
    }

    // Clear selected tags
    sessionSelectedTags = [];
    updateSessionSelectedTagsDisplay();

    console.log('Session modal reset to create mode');
}

function joinSession(sessionId, meetingLink) {
    console.log('Join session:', sessionId);
    console.log('Meeting link:', meetingLink);
    hideEventDetailPanel();

    // Use the meeting link if available, otherwise use default join URL
    if (meetingLink) {
        window.open(meetingLink, '_blank');
    } else {
        // Fallback to default join session functionality
        window.open(`/session/join/${sessionId}`, '_blank');
    }
}

// Initialize calendar events when calendar view is activated
$(document).on('shown.bs.tab', 'a[data-init="calendar-view"]', function (e) {
    console.log('📅 Calendar view activated via shown.bs.tab');

    // Initialize currentWeekStart to current week if not set
    if (!currentWeekStart) {
        const now = new Date();
        const currentDay = now.getDay();
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        currentWeekStart = new Date(now);
        currentWeekStart.setDate(now.getDate() + mondayOffset);
        console.log('📅 Initialized currentWeekStart to:', currentWeekStart);
    }

    updateCalendarHeader();
    setTimeout(() => {
        renderCalendarEvents();
    }, 100);
});

// Backup: Listen for click events on calendar view tab
$(document).on('click', 'a[data-init="calendar-view"]', function (e) {
    console.log('📅 Calendar view clicked');
    updateCalendarHeader();
    setTimeout(() => {
        forceRefreshCalendarEvents();
    }, 200);
});

// Also render on page load if calendar view is already active
$(document).ready(function () {
    // Debug: Check if calendar sessions JSON element exists
    const calendarElement = document.getElementById('calendarSessionsJson');

    // Add global event listeners for event detail panel
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && currentDetailPanel) {
            hideEventDetailPanel();
        }
    });

    window.addEventListener('resize', function () {
        if (currentDetailPanel && selectedEventElement) {
            positionDetailPanel(currentDetailPanel, selectedEventElement);
        }
    });

    if ($('a[data-init="calendar-view"]').hasClass('active')) {
        console.log('📅 Calendar view is already active on page load');

        // Initialize currentWeekStart to current week if not set
        if (!currentWeekStart) {
            const now = new Date();
            const currentDay = now.getDay();
            const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
            currentWeekStart = new Date(now);
            currentWeekStart.setDate(now.getDate() + mondayOffset);
            console.log('📅 Initialized currentWeekStart to:', currentWeekStart);
        }

        updateCalendarHeader();
        setTimeout(() => {
            forceRefreshCalendarEvents();
        }, 500);
    }

    // Add dropdown scroll to current week functionality
    $(document).on('shown.bs.dropdown', '#calendarWeekButton', function () {
        console.log('🔽 Dropdown opened - scrolling to current week');
        const dropdown = document.getElementById('calendarWeekDropdown');
        if (dropdown) {
            const activeWeek = dropdown.querySelector('.dropdown-item.active');
            if (activeWeek) {
                console.log('✅ Found active week, scrolling...');
                setTimeout(() => {
                    activeWeek.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }, 100);
            } else {
                console.log('❌ No active week found');
            }
        } else {
            console.log('❌ Dropdown not found');
        }
    });

    // Alternative: Listen for click on dropdown button
    $(document).on('click', '#calendarWeekButton', function () {
        console.log('🖱️ Dropdown button clicked');
        setTimeout(() => {
            const dropdown = document.getElementById('calendarWeekDropdown');
            if (dropdown) {
                const activeWeek = dropdown.querySelector('.dropdown-item.active');
                if (activeWeek) {
                    console.log('📍 Scrolling to active week after click');
                    const scrollTop = activeWeek.offsetTop - (dropdown.offsetHeight / 2) + (activeWeek.offsetHeight / 2);
                    dropdown.scrollTop = scrollTop;
                }
            }
        }, 200);
    });
});

// Listen for visibility change (when user switches tabs)
document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
        // User has returned to the tab
        const calendarTab = document.querySelector('a[data-init="calendar-view"].active');
        if (calendarTab) {
            console.log('👁️ User returned to calendar tab, refreshing...');
            setTimeout(() => {
                forceRefreshCalendarEvents();
            }, 300);
        }
    }
});

// Make functions globally available
window.hideEventDetailPanel = hideEventDetailPanel;
window.editSession = editSession;
window.joinSession = joinSession;
window.forceRefreshCalendarEvents = forceRefreshCalendarEvents;

// Session Detail Modal Functions
function showSessionDetailModal(sessionData) {
    // Populate modal with session data
    document.getElementById('sessionDetailTitle').textContent = sessionData.title || 'N/A';
    document.getElementById('sessionDetailDescription').textContent = sessionData.description || 'No description available';
    document.getElementById('sessionDetailInstructor').textContent = sessionData.instructor || 'Unknown';

    // Parse and format time information more simply
    if (sessionData.startTime) {
        try {
            // Try to parse the date string - it could be in different formats
            let startDate;
            if (sessionData.startTime.includes('T')) {
                // ISO format: 2024-01-15T10:00:00
                startDate = new Date(sessionData.startTime);
            } else {
                // Natural format: "Monday, January 15, 2024 10:00"
                startDate = new Date(sessionData.startTime);
            }

            if (!isNaN(startDate.getTime())) {
                // Format start time simply
                const startTimeFormatted = startDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                }) + ' at ' + startDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
                document.getElementById('sessionDetailStartTime').textContent = startTimeFormatted;

                // Calculate and format end time
                if (sessionData.duration) {
                    const durationMinutes = parseInt(sessionData.duration);
                    const endDate = new Date(startDate.getTime() + (durationMinutes * 60000));
                    const endTimeFormatted = endDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    }) + ' at ' + endDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });
                    document.getElementById('sessionDetailEndTime').textContent = endTimeFormatted;

                    // Format duration nicely
                    let durationText = '';
                    if (durationMinutes >= 60) {
                        const hours = Math.floor(durationMinutes / 60);
                        const remainingMinutes = durationMinutes % 60;
                        if (remainingMinutes > 0) {
                            durationText = `${hours}h ${remainingMinutes}m`;
                        } else {
                            durationText = `${hours} hour${hours > 1 ? 's' : ''}`;
                        }
                    } else {
                        durationText = `${durationMinutes} min`;
                    }
                    document.getElementById('sessionDetailDuration').textContent = durationText;
                } else {
                    document.getElementById('sessionDetailEndTime').textContent = 'Not specified';
                    document.getElementById('sessionDetailDuration').textContent = 'Not specified';
                }
            } else {
                throw new Error('Invalid date');
            }
        } catch (error) {
            console.warn('Error parsing date:', sessionData.startTime, error);
            document.getElementById('sessionDetailStartTime').textContent = sessionData.startTime;
            document.getElementById('sessionDetailEndTime').textContent = 'Not specified';
            document.getElementById('sessionDetailDuration').textContent = sessionData.duration ? sessionData.duration + ' min' : 'Not specified';
        }
    } else {
        document.getElementById('sessionDetailStartTime').textContent = 'Not specified';
        document.getElementById('sessionDetailEndTime').textContent = 'Not specified';
        document.getElementById('sessionDetailDuration').textContent = 'Not specified';
    }

    // Handle meeting link
    const meetingLinkContainer = document.getElementById('sessionDetailMeetingLinkContainer');
    const meetingLinkElement = document.getElementById('sessionDetailMeetingLink');
    const joinButton = document.getElementById('sessionDetailJoinBtn');

    if (sessionData.meetingLink && sessionData.meetingLink.trim() !== '' && sessionData.meetingLink !== 'null') {
        meetingLinkElement.innerHTML = `<a href="${sessionData.meetingLink}" target="_blank" style="color: #0369a1; text-decoration: none; font-weight: 500;">${sessionData.meetingLink}</a>`;
        joinButton.href = sessionData.meetingLink;
        joinButton.innerHTML = '<i class="las la-video mr-2"></i>Join Meeting';
        joinButton.style.display = 'inline-block';
        joinButton.style.pointerEvents = 'auto';
        meetingLinkContainer.style.display = 'block';
    } else {
        meetingLinkElement.innerHTML = '<span style="color: #6b7280; font-style: italic;">No meeting link provided</span>';
        joinButton.innerHTML = '<i class="las la-map-marker mr-2"></i>Offline';
        joinButton.style.display = 'inline-block';
        joinButton.style.pointerEvents = 'none';
        joinButton.style.opacity = '0.6';
        joinButton.style.cursor = 'not-allowed';
        meetingLinkContainer.style.display = 'block';
    }

    // Load tags asynchronously
    const tagsContainer = document.getElementById('sessionDetailTags');
    const tagsSection = document.getElementById('sessionDetailTagsContainer');

    // Show loading state
    tagsContainer.innerHTML = '<span style="color: #6b7280; font-style: italic; background: #f3f4f6; padding: 4px 8px; border-radius: 12px; font-size: 12px;">Loading...</span>';
    tagsSection.style.display = 'block';

    // Fetch tags for this session
    fetch(`/vault-detail/session/${sessionData.id}/tags`)
        .then(response => response.json())
        .then(tags => {
            tagsContainer.innerHTML = '';
            if (tags && tags.length > 0) {
                tags.forEach(tag => {
                    const tagElement = document.createElement('span');
                    tagElement.className = 'badge';
                    tagElement.style.cssText = 'background: #f8c930ff; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; margin-right: 4px; margin-bottom: 4px; font-weight: 500;';
                    tagElement.textContent = tag.name || tag;
                    tagsContainer.appendChild(tagElement);
                });
            } else {
                tagsContainer.innerHTML = '<span style="color: #6b7280; font-style: italic; background: #f3f4f6; padding: 4px 8px; border-radius: 12px; font-size: 12px;">No tags</span>';
            }
        })
        .catch(error => {
            console.error('Error loading tags:', error);
            tagsContainer.innerHTML = '<span style="color: #ef4444; font-style: italic; background: #fef2f2; padding: 4px 8px; border-radius: 12px; font-size: 12px;">Error loading tags</span>';
        });

    // Show modal
    $('#sessionDetailModal').modal('show');
}

$(document).on('click', '.view-session-details', function (e) {
    console.log('View session details button clicked!');
    e.preventDefault();
    e.stopPropagation(); // Prevent dropdown from closing

    const sessionData = {
        id: $(this).data('session-id'),
        title: $(this).data('session-title'),
        description: $(this).data('session-description'),
        startTime: $(this).data('session-start-time'),
        duration: $(this).data('session-duration'),
        instructor: $(this).data('session-instructor'),
        meetingLink: $(this).data('session-meeting-link'),
        tags: $(this).data('session-tags') || []
    };

    console.log('View session data:', sessionData);

    showSessionDetailModal(sessionData);
});

// Initialize session details when document is ready
$(document).ready(function () {
    // Session detail modal functionality initialized
});

function initializeSessionTagInput() {
    const tagInput = document.getElementById('sessionTags');
    const tagSuggestions = document.getElementById('session-tag-suggestions');
    const selectedTagsContainer = document.getElementById('session-selected-tags');

    if (!tagInput || !tagSuggestions || !selectedTagsContainer) {
        return;
    }

    sessionSelectedTags = [];
    loadSessionExistingTags();

    tagInput.removeEventListener('input', handleSessionTagInput);
    tagInput.removeEventListener('keydown', handleSessionTagKeydown);

    tagInput.addEventListener('input', handleSessionTagInput);
    tagInput.addEventListener('keydown', handleSessionTagKeydown);

    document.addEventListener('click', function (e) {
        if (!tagInput.contains(e.target) && !tagSuggestions.contains(e.target)) {
            hideSessionTagSuggestions();
        }
    });
}

function handleSessionTagInput(e) {
    const value = e.target.value.trim();
    if (value.length > 0) {
        showSessionTagSuggestions(value);
    } else {
        hideSessionTagSuggestions();
    }
}

function handleSessionTagKeydown(e) {
    const tagSuggestions = document.getElementById('session-tag-suggestions');
    const suggestionItems = tagSuggestions.querySelectorAll('.tag-suggestion-item');

    if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const value = e.target.value.trim();
        if (value) {
            addSessionTag(value);
            e.target.value = '';
            hideSessionTagSuggestions();
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
    }
}

function showSessionTagSuggestions(searchTerm) {
    const tagSuggestions = document.getElementById('session-tag-suggestions');
    if (!tagSuggestions) return;

    const filteredTags = sessionAllTags.filter(tag =>
        tag.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !sessionSelectedTags.some(selected => selected.name === tag.name)
    );

    if (filteredTags.length > 0) {
        tagSuggestions.innerHTML = filteredTags.map(tag =>
            `<div class="tag-suggestion-item" data-tag-name="${tag.name}" data-tag-id="${tag.id}">
                <span class="tag-suggestion-text">${tag.name}</span>
                <span class="tag-suggestion-count">${tag.usageCount} uses</span>
            </div>`
        ).join('');

        tagSuggestions.style.display = 'block';

        tagSuggestions.querySelectorAll('.tag-suggestion-item').forEach(item => {
            item.addEventListener('click', function () {
                const tagName = this.getAttribute('data-tag-name');
                const tagId = this.getAttribute('data-tag-id');
                addSessionTag(tagName, tagId);
                document.getElementById('sessionTags').value = '';
                hideSessionTagSuggestions();
            });
        });
    } else {
        tagSuggestions.innerHTML = `
            <div class="tag-suggestion-item new-tag" data-tag-name="${searchTerm}">
                <span class="tag-suggestion-text">Create "${searchTerm}"</span>
                <span class="tag-suggestion-count">New tag</span>
            </div>`;
        tagSuggestions.style.display = 'block';

        tagSuggestions.querySelector('.tag-suggestion-item').addEventListener('click', function () {
            const tagName = this.getAttribute('data-tag-name');
            addSessionTag(tagName);
            document.getElementById('sessionTags').value = '';
            hideSessionTagSuggestions();
        });
    }
}

function hideSessionTagSuggestions() {
    const tagSuggestions = document.getElementById('session-tag-suggestions');
    if (tagSuggestions) {
        tagSuggestions.style.display = 'none';
    }
}

function addSessionTag(tagName, tagId = null) {
    if (typeof tagName !== 'string') {
        return;
    }

    tagName = tagName.trim();
    if (!tagName) return;

    if (sessionSelectedTags.some(tag => tag.name === tagName)) {
        return;
    }

    sessionSelectedTags.push({ id: tagId, name: tagName });
    updateSessionSelectedTagsDisplay();
}

function removeSessionTag(tagName) {
    sessionSelectedTags = sessionSelectedTags.filter(tag => tag.name !== tagName);
    updateSessionSelectedTagsDisplay();
}

function updateSessionSelectedTagsDisplay() {
    const container = document.getElementById('session-selected-tags');
    if (!container) return;

    container.innerHTML = sessionSelectedTags.map(tag =>
        `<span class="tag-badge">
            ${tag.name}
            <button type="button" class="tag-remove" onclick="removeSessionTag('${tag.name}')">&times;</button>
        </span>`
    ).join('');
}

function loadSessionExistingTags() {
    fetch('/vault-detail/tags')
        .then(response => response.json())
        .then(tags => {
            sessionAllTags = tags;
        })
        .catch(error => {
            console.error('Error loading tags:', error);
            sessionAllTags = [];
        });
}

function getSessionTagsAsString() {
    const tagsString = sessionSelectedTags.map(tag => tag.name).join(',');
    console.log('🏷️ Getting session tags as string:', {
        sessionSelectedTags: sessionSelectedTags,
        tagsString: tagsString,
        tagCount: sessionSelectedTags.length,
        tagNames: sessionSelectedTags.map(tag => tag.name)
    });
    return tagsString;
}

// Edit Session Functions
let currentEditingSessionId = null;

// Event listener for Edit Session buttons
$(document).on('click', '.edit-session-btn', function (e) {
    console.log('Edit session button clicked!');
    e.preventDefault();
    e.stopPropagation(); // Prevent dropdown from closing

    // Get session data from data attributes
    const sessionId = $(this).data('session-id');
    let sessionData = {
        id: sessionId,
        title: $(this).data('session-title'),
        description: $(this).data('session-description'),
        startDate: $(this).data('session-start-date'),
        startTime: $(this).data('session-start-time'),
        endDate: $(this).data('session-end-date'),
        endTime: $(this).data('session-end-time'),
        duration: $(this).data('session-duration'),
        instructorId: $(this).data('session-instructor-id'),
        instructorName: $(this).data('session-instructor-name'),
        meetingLink: $(this).data('session-meeting-link')
    };

    // If data is incomplete (e.g., from calendar view), fetch from calendar sessions data
    if (!sessionData.title || !sessionData.startDate) {
        console.log('🔍 Session data incomplete, fetching from calendar data...');
        const calendarSessionsJson = document.getElementById('calendarSessionsJson');
        if (calendarSessionsJson) {
            try {
                const sessions = JSON.parse(calendarSessionsJson.textContent);
                const calendarSession = sessions.find(session => session.id === sessionId);
                if (calendarSession) {
                    console.log('📅 Found session in calendar data:', calendarSession);
                    sessionData = {
                        id: calendarSession.id,
                        title: calendarSession.title,
                        description: calendarSession.description,
                        startDate: calendarSession.startDate,
                        startTime: calendarSession.startTime,
                        endDate: calendarSession.endDate,
                        endTime: calendarSession.endTime,
                        duration: calendarSession.durationMinutes, // Map durationMinutes to duration
                        instructorId: calendarSession.instructorId || '', // Now available from backend
                        instructorName: calendarSession.instructor,
                        meetingLink: calendarSession.meetingLink
                    };
                    console.log('📝 Mapped calendar session data:', sessionData);
                }
            } catch (error) {
                console.error('Error parsing calendar sessions data:', error);
            }
        }
    }

    console.log('Session data:', sessionData);
    editSession(sessionData);
});

function editSession(sessionData) {
    console.log('🔧 Editing session:', sessionData);

    // Store the session ID for later use
    currentEditingSessionId = sessionData.id;
    editingSessionId = sessionData.id;

    // Populate the form with session data
    document.getElementById('sessionTitle').value = sessionData.title || '';
    document.getElementById('sessionDescription').value = sessionData.description || '';
    document.getElementById('sessionDate').value = sessionData.startDate || '';
    document.getElementById('sessionTime').value = sessionData.startTime || '';
    document.getElementById('sessionEndDate').value = sessionData.endDate || sessionData.startDate || '';
    document.getElementById('sessionEndTime').value = sessionData.endTime || '';
    // Handle both duration and durationMinutes fields
    const durationValue = sessionData.duration || sessionData.durationMinutes;
    document.getElementById('sessionDuration').value = durationValue ? durationValue + ' minutes' : '';
    document.getElementById('sessionInstructor').value = sessionData.instructorName || '';

    console.log('🔍 Form population debug:', {
        endTimeField: document.getElementById('sessionEndTime'),
        endTimeValue: sessionData.endTime,
        endTimeFieldValue: document.getElementById('sessionEndTime').value,
        durationValue: durationValue,
        durationFieldValue: document.getElementById('sessionDuration').value
    });

    // Ensure instructor ID is properly set for validation
    const instructorIdField = document.getElementById('sessionInstructorId');
    if (instructorIdField) {
        instructorIdField.value = sessionData.instructorId || '';
        console.log('Set instructor ID:', sessionData.instructorId);
    }

    document.getElementById('meetingLink').value = sessionData.meetingLink || '';

    console.log('Edit session data populated:', {
        title: sessionData.title,
        startDate: sessionData.startDate,
        startTime: sessionData.startTime,
        endDate: sessionData.endDate,
        endTime: sessionData.endTime,
        duration: sessionData.duration,
        durationMinutes: sessionData.durationMinutes,
        instructorId: sessionData.instructorId,
        instructorName: sessionData.instructorName,
        rawSessionData: sessionData
    });

    // Update modal title and button text
    document.getElementById('createSessionModalLabel').textContent = 'Edit Session';
    const createBtn = document.getElementById('createSessionBtn');
    createBtn.innerHTML = '<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" style="margin-right: 6px;"><path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V7l-4-4z"/><path d="m9 9 3 3 8-8"/></svg>Update Session';

    // Load existing tags for this session
    loadSessionTagsForEdit(sessionData.id);

    // Update end time options based on start time
    updateEndTimeOptions();

    // Show the modal
    $('#createSessionModal').modal('show');
}

function loadSessionTagsForEdit(sessionId) {
    console.log('Loading tags for session:', sessionId);
    fetch(`/vault-detail/session/${sessionId}/tags`)
        .then(response => response.json())
        .then(tags => {
            console.log('Loaded tags from server:', tags);
            sessionSelectedTags = tags.map(tag => ({
                id: tag.id,
                name: tag.name
            }));
            console.log('Session selected tags set to:', sessionSelectedTags);
            updateSessionSelectedTagsDisplay();
        })
        .catch(error => {
            console.error('Error loading session tags:', error);
            sessionSelectedTags = [];
            updateSessionSelectedTagsDisplay();
        });
}

function resetSessionModal() {
    // Reset editing state
    currentEditingSessionId = null;
    editingSessionId = null;

    // Reset form
    document.getElementById('sessionTitle').value = '';
    document.getElementById('sessionDescription').value = '';
    document.getElementById('sessionDate').value = '';
    document.getElementById('sessionTime').value = '';
    document.getElementById('sessionEndDate').value = '';
    document.getElementById('sessionEndTime').value = '';
    document.getElementById('sessionDuration').value = '';
    document.getElementById('sessionInstructor').value = '';
    document.getElementById('sessionInstructorId').value = '';
    document.getElementById('meetingLink').value = '';

    // Reset tags
    sessionSelectedTags = [];
    updateSessionSelectedTagsDisplay();

    // Reset modal title and button
    document.getElementById('createSessionModalLabel').textContent = 'Create New Session';
    const createBtn = document.getElementById('createSessionBtn');
    createBtn.innerHTML = '<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" style="margin-right: 6px;"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>Create Session';
    createBtn.disabled = false;
}

// Reset modal when it's hidden
$('#createSessionModal').on('hidden.bs.modal', function () {
    if (!isCreatingSession) {
        resetSessionModal();
    }
});

// Delete Session Functions
let currentDeleteSessionId = null;

// Event listener for Delete Session buttons
$(document).on('click', '.delete-session-btn', function (e) {
    console.log('Delete session button clicked!');
    e.preventDefault();
    e.stopPropagation(); // Prevent dropdown from closing

    const sessionId = $(this).data('session-id');
    const sessionTitle = $(this).data('session-title');

    console.log('Delete session:', sessionId, sessionTitle);
    showDeleteSessionModal(sessionId, sessionTitle);
});

function showDeleteSessionModal(sessionId, sessionTitle) {
    currentDeleteSessionId = sessionId;
    document.getElementById('sessionNameToDelete').textContent = sessionTitle || 'this session';
    const popup = document.getElementById('deleteSessionPopup');
    popup.style.display = 'flex';
    popup.style.opacity = '1';
}

function hideDeleteSessionModal() {
    const popup = document.getElementById('deleteSessionPopup');
    popup.style.opacity = '0';
    setTimeout(() => {
        popup.style.display = 'none';
    }, 300); // Wait for fade out animation
    currentDeleteSessionId = null;
}

function confirmDeleteSession() {
    if (currentDeleteSessionId) {
        deleteSession(currentDeleteSessionId);
    }
}

// Event listener for confirm delete button (now handled by onclick in HTML)
// $(document).on('click', '#confirmDeleteSessionBtn', function () {
//     if (currentDeleteSessionId) {
//         deleteSession(currentDeleteSessionId);
//     }
// });

function deleteSession(sessionId) {
    const urlParams = new URLSearchParams(window.location.search);
    const vaultId = urlParams.get('id');

    // Show loading state
    const deleteBtn = document.getElementById('confirmDeleteSessionBtn');
    const originalText = deleteBtn.innerHTML;
    deleteBtn.innerHTML = '<i class="las la-spinner la-spin mr-2"></i>Deleting...';
    deleteBtn.disabled = true;

    // Use AJAX call to match backend expectation
    $.ajax({
        url: '/vault-detail/delete-session',
        type: 'POST',
        data: {
            sessionId: sessionId
        },
        success: function (response) {
            console.log('Session deleted successfully');
            $('#deleteSessionModal').modal('hide');
            showToast('Session deleted successfully!', 'success');
            setTimeout(function () {
                $('.modal-backdrop').remove();
                $('body').removeClass('modal-open');
                $('body').css('padding-right', '');
            }, 300);
            // Reload page to show updated sessions
            window.location.reload();
        },
        error: function (xhr) {
            console.error('Error deleting session:', xhr.responseText);
            showToast('Failed to delete session: ' + (xhr.responseText || 'Unknown error'), 'error');
            // Reset button state
            deleteBtn.innerHTML = originalText;
            deleteBtn.disabled = false;
        }
    });
}


let currentMoveKnowledgeData = {};
let selectedTargetFolder = null;


function determineKnowledgeStatusFromData(approvalStatus) {
    if (approvalStatus === 'DRAFT') {
        return 'Draft';
    } else if (approvalStatus === 'APPROVED') {
        return 'Approved';
    } else if (approvalStatus === 'PENDING_APPROVAL') {
        return 'Pending';
    } else if (approvalStatus === 'REJECTED') {
        return 'Rejected';
    } else {
        return 'Unknown';
    }
}

function determineKnowledgeStatus() {
    // Check which tab is currently active to determine knowledge status
    const currentTab = $('.nav-link.active').text().trim();

    if (currentTab === 'Draft') {
        return 'Draft';
    } else if (currentTab === 'Approved' || currentTab === 'All Knowledge') {
        // In the main All Knowledge tab, we need to check the badge
        // We'll assume it's approved if not in Draft tab
        return 'Approved';
    } else if (currentTab === 'Pending Approval') {
        return 'Pending';
    } else if (currentTab === 'Reject') {
        return 'Rejected';
    } else {
        // Try to determine from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('private') === 'true') {
            return 'Draft';
        } else if (urlParams.get('official') === 'true') {
            return 'Approved';
        } else if (urlParams.get('reject') === 'true') {
            return 'Rejected';
        }
        return 'Unknown';
    }
}

function loadFolderTrees(knowledgeStatus) {
    const vaultId = new URLSearchParams(window.location.search).get('id');

    if (knowledgeStatus === 'Draft') {
        // Only load private folders for draft knowledge
        loadFolderTree('private', vaultId);
    } else if (knowledgeStatus === 'Approved') {
        // Only load official folders for approved knowledge  
        loadFolderTree('official', vaultId);
    } else {
        // Fallback - load both
        loadFolderTree('private', vaultId);
        loadFolderTree('official', vaultId);
    }
}

function loadFolderTree(type, vaultId) {
    const containerId = type === 'private' ? '#privateFolderTree' : '#officialFolderTree';
    $(containerId).html('<div class="text-center text-muted">Loading...</div>');

    $.get('/vault-detail/folder-tree', { vaultId: vaultId, type: type })
        .done(function (data) {
            renderFolderTree(data.folders, containerId, type);
        })
        .fail(function () {
            $(containerId).html('<div class="text-center text-danger">Error loading folders</div>');
        });
}

function renderFolderTree(folders, containerId, type) {
    const container = $(containerId);
    container.empty();

    if (!folders || folders.length === 0) {
        container.html('<div class="text-center text-muted">No folders available</div>');
        return;
    }

    folders.forEach(folder => {
        renderFolderItem(folder, container, 0, type);
    });
}

function renderFolderItem(folder, container, level, type) {
    const folderItem = $(`
        <div class="folder-item level-${level}" 
             data-folder-id="${folder.id}" 
             data-folder-name="${folder.name}"
             data-folder-type="${type}">
            <svg width="20" class="folder-icon" id="iq-main-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
            </svg>
            <span class="folder-name">${folder.name}</span>
        </div>
    `);

    // Add click handler
    folderItem.on('click', function () {
        selectFolder(folder.id, folder.name, type);
    });

    container.append(folderItem);

    // Render subfolders if any
    if (folder.subfolders && folder.subfolders.length > 0) {
        folder.subfolders.forEach(subfolder => {
            renderFolderItem(subfolder, container, level + 1, type);
        });
    }
}

function selectFolder(folderId, folderName, folderType) {
    // Remove previous selection
    $('.folder-item').removeClass('selected');

    // Select current folder
    $(`.folder-item[data-folder-id="${folderId}"]`).addClass('selected');

    // Store selection
    selectedTargetFolder = {
        id: folderId,
        name: folderName,
        type: folderType
    };

    // Update form
    $('#moveTargetFolderId').val(folderId);

    // Show selection info
    $('#selectedFolderName').text(folderName);
    $('#selectedFolderType').text(folderType === 'private' ? 'Private' : 'Official')
        .removeClass('badge-primary badge-success')
        .addClass(folderType === 'private' ? 'badge-primary' : 'badge-success');
    $('#selectedFolderInfo').removeClass('d-none');

    // Enable move button
    $('#confirmMoveBtn').prop('disabled', false);
}

// Confirm move button handler
$('#confirmMoveBtn').on('click', function () {
    if (!selectedTargetFolder) {
        alert('Please select a target folder.');
        return;
    }

    // Submit the form
    $('#moveKnowledgeForm').submit();
});

// Reset modal when hidden
$('#moveKnowledgeModal').on('hidden.bs.modal', function () {
    currentMoveKnowledgeData = {};
    selectedTargetFolder = null;
    $('#privateFolderTree').empty();
    $('#officialFolderTree').empty();
    $('#selectedFolderInfo').addClass('d-none');
    $('#confirmMoveBtn').prop('disabled', true);
    $('.folder-item').removeClass('selected');

    // Reset layout to default state when modal is closed
    $('#privateFolderTree').closest('.col-md-6').removeClass('d-none col-md-12').addClass('col-md-6');
    $('#officialFolderTree').closest('.col-md-6').removeClass('d-none col-md-12').addClass('col-md-6');
    $('#moveRestrictions').html('');
});

let notificationDropdown = null;
let notificationList = null;
let notificationBadge = null;
let lastUnreadCount = 0;

$(document).ready(function () {
    notificationDropdown = $('.iq-sub-dropdown.dropdown-menu');
    notificationList = $('#notification-list');
    notificationBadge = $('.count-mail');

    loadNotifications();

    setInterval(() => {
        if (notificationDropdown && notificationDropdown.hasClass('show')) {
            resetNotificationDropdownPosition();
        }
    }, 100);

    $('[aria-labelledby="dropdownMenuButton002"]').parent().on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        if (notificationDropdown.hasClass('show')) {
            notificationDropdown.removeClass('show');
        } else {
            // Close other dropdowns first
            $('.dropdown-menu.show').removeClass('show');
            notificationDropdown.addClass('show');

            // Force reset positioning - override Bootstrap/Popper.js
            setTimeout(() => {
                notificationDropdown.css({
                    'transform': 'none !important',
                    'top': '100%',
                    'right': '0',
                    'left': 'auto',
                    'position': 'absolute'
                });
                notificationDropdown.attr('style', notificationDropdown.attr('style').replace(/transform:[^;]*;?/g, ''));
            }, 10);

            loadNotifications(); // Refresh notifications when opened
        }
    });

    // Close dropdown when clicking outside
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.iq-sub-dropdown, [aria-labelledby="dropdownMenuButton002"]').length) {
            notificationDropdown.removeClass('show');
        }
    });

    // Mark all notifications as read
    $('#mark-all-read-btn').on('click', function () {
        markAllNotificationsAsRead();
    });

    // Auto-refresh notifications every 30 seconds and check for new ones
    setInterval(function () {
        checkForNewNotifications();
    }, 30000);
});

function checkForNewNotifications() {
    const vaultId = $('#vaultId').val();
    if (!vaultId) return;

    $.ajax({
        url: '/notification/unread-count',
        type: 'GET',
        data: { vaultId: vaultId },
        success: function (response) {
            const currentUnreadCount = response.count || 0;

            // Check if there are new notifications
            if (currentUnreadCount > lastUnreadCount && lastUnreadCount >= 0) {
                // New notifications detected - auto open dropdown
                autoOpenNotificationDropdown();
                showNewNotificationToast(currentUnreadCount - lastUnreadCount);
            }

            lastUnreadCount = currentUnreadCount;
            updateNotificationBadgeDisplay(currentUnreadCount);
        },
        error: function (xhr, status, error) {
            console.error('Error checking for new notifications:', error);
        }
    });
}

function autoOpenNotificationDropdown() {
    // Auto open notification dropdown
    $('.dropdown-menu.show').removeClass('show'); // Close other dropdowns
    notificationDropdown.addClass('show');

    // Force reset positioning
    setTimeout(() => {
        notificationDropdown.css({
            'transform': 'none !important',
            'top': '100%',
            'right': '0',
            'left': 'auto',
            'position': 'absolute'
        });
        notificationDropdown.attr('style', notificationDropdown.attr('style').replace(/transform:[^;]*;?/g, ''));
    }, 10);

    // Load fresh notifications
    loadNotifications();

    // Add a visual highlight effect
    notificationDropdown.addClass('new-notification-highlight');

    // Remove highlight after 3 seconds
    setTimeout(function () {
        notificationDropdown.removeClass('new-notification-highlight');
    }, 3000);
}

// Force reset notification dropdown positioning
function resetNotificationDropdownPosition() {
    if (notificationDropdown && notificationDropdown.length) {
        notificationDropdown.css({
            'transform': 'none !important',
            'top': '100%',
            'right': '0',
            'left': 'auto',
            'position': 'absolute'
        });

        // Remove any inline transform styles added by Bootstrap/Popper
        let currentStyle = notificationDropdown.attr('style') || '';
        currentStyle = currentStyle.replace(/transform:[^;]*;?/g, '');
        currentStyle = currentStyle.replace(/top:[^;]*;?/g, '');
        currentStyle = currentStyle.replace(/left:[^;]*;?/g, '');
        notificationDropdown.attr('style', currentStyle);
    }
}

function showNewNotificationToast(newCount) {
    const message = newCount === 1 ?
        'Bạn có 1 thông báo mới!' :
        `Bạn có ${newCount} thông báo mới!`;

    showToast(message, 'info');
}

function updateNotificationBadgeDisplay(count) {
    if (notificationBadge) {
        if (count > 0) {
            notificationBadge.text(count > 99 ? '99+' : count);
            notificationBadge.show();
            if (count > lastUnreadCount && lastUnreadCount >= 0) {
                notificationBadge.addClass('new-notification');
                setTimeout(function () {
                    notificationBadge.removeClass('new-notification');
                }, 4000);
            }
        } else {
            notificationBadge.hide();
        }
    }
}

function loadNotifications() {
    if (!notificationList) return;

    const vaultId = $('#vaultId').val();
    if (!vaultId) {
        console.error('Vault ID not found');
        return;
    }

    notificationList.html(`
        <div class="d-flex justify-content-center align-items-center" style="height: 60px;">
            <div class="spinner-border spinner-border-sm text-primary" role="status">
                <span class="sr-only">Đang tải...</span>
            </div>
        </div>
    `);

    $.ajax({
        url: '/notification/list',
        type: 'GET',
        data: { vaultId: vaultId },
        success: function (notifications) {
            displayNotifications(notifications);
            updateNotificationBadge();
        },
        error: function (xhr, status, error) {
            console.error('Error loading notifications:', error);
            notificationList.html(`
                <div class="text-center p-3 text-muted">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>Không thể tải thông báo</div>
                </div>
            `);
        }
    });
}

function displayNotifications(notifications) {
    if (!notificationList) return;

    if (!notifications || notifications.length === 0) {
        notificationList.html(`
            <div class="text-center p-3 text-muted">
                <i class="fas fa-bell-slash"></i>
                <div>Không có thông báo nào</div>
            </div>
        `);
        return;
    }

    let html = '';
    notifications.forEach(notification => {
        const timeAgo = formatTimeAgo(notification.createdAt);
        const isUnread = !notification.isRead;
        const iconClass = getNotificationIconClass(notification.type);

        html += `
            <div class="notification-item ${isUnread ? 'unread' : ''}" data-id="${notification.id}">
                <div class="notification-icon ${iconClass}">
                    ${getNotificationIcon(notification.type)}
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${timeAgo}</div>
                </div>
                <div class="notification-menu-wrapper">
                    <button class="notification-menu-btn" onclick="toggleNotificationMenu('${notification.id}', event)">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                        </svg>
                    </button>
                    <div class="notification-dropdown-menu" id="notification-menu-${notification.id}">
                        <div class="notification-menu-item" onclick="toggleNotificationReadStatus('${notification.id}')">
                            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                ${isUnread ? `
                                    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                                ` : `
                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                                `}
                            </svg>
                            <span>${isUnread ? 'Đánh dấu đã đọc' : 'Đánh dấu chưa đọc'}</span>
                        </div>
                        <div class="notification-menu-item delete-item" onclick="deleteNotification('${notification.id}')">
                            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                            </svg>
                            <span>Xóa</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    notificationList.html(html);

    // Setup notification menu listeners immediately
    setupNotificationMenuListeners();
}

function getNotificationIconClass(type) {
    switch (type) {
        case 'KNOWLEDGE_APPROVED': return 'knowledge-approved';
        case 'KNOWLEDGE_REJECTED': return 'knowledge-rejected';
        case 'NEW_KNOWLEDGE_CREATED': return 'knowledge-created';
        case 'KNOWLEDGE_SUBMITTED': return 'knowledge-submitted';
        case 'SESSION_CREATED': return 'session-created';
        default: return 'knowledge-created';
    }
}

function getNotificationIcon(type) {
    switch (type) {
        case 'KNOWLEDGE_APPROVED': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-award" viewBox="0 0 16 16"> <path d="M9.669.864 8 0 6.331.864l-1.858.282-.842 1.68-1.337 1.32L2.6 6l-.306 1.854 1.337 1.32.842 1.68 1.858.282L8 12l1.669-.864 1.858-.282.842-1.68 1.337-1.32L13.4 6l.306-1.854-1.337-1.32-.842-1.68zm1.196 1.193.684 1.365 1.086 1.072L12.387 6l.248 1.506-1.086 1.072-.684 1.365-1.51.229L8 10.874l-1.355-.702-1.51-.229-.684-1.365-1.086-1.072L3.614 6l-.25-1.506 1.087-1.072.684-1.365 1.51-.229L8 1.126l1.356.702z"/> <path d="M4 11.794V16l4-1 4 1v-4.206l-2.018.306L8 13.126 6.018 12.1z"/> </svg>';
        case 'KNOWLEDGE_REJECTED': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle" viewBox="0 0 16 16"> <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/> <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/> </svg>';
        case 'NEW_KNOWLEDGE_CREATED': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-award" viewBox="0 0 16 16"> <path d="M9.669.864 8 0 6.331.864l-1.858.282-.842 1.68-1.337 1.32L2.6 6l-.306 1.854 1.337 1.32.842 1.68 1.858.282L8 12l1.669-.864 1.858-.282.842-1.68 1.337-1.32L13.4 6l.306-1.854-1.337-1.32-.842-1.68zm1.196 1.193.684 1.365 1.086 1.072L12.387 6l.248 1.506-1.086 1.072-.684 1.365-1.51.229L8 10.874l-1.355-.702-1.51-.229-.684-1.365-1.086-1.072L3.614 6l-.25-1.506 1.087-1.072.684-1.365 1.51-.229L8 1.126l1.356.702z"/> <path d="M4 11.794V16l4-1 4 1v-4.206l-2.018.306L8 13.126 6.018 12.1z"/> </svg>';
        case 'KNOWLEDGE_SUBMITTED': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-send-check" viewBox="0 0 16 16"> <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855a.75.75 0 0 0-.124 1.329l4.995 3.178 1.531 2.406a.5.5 0 0 0 .844-.536L6.637 10.07l7.494-7.494-1.895 4.738a.5.5 0 1 0 .928.372zm-2.54 1.183L5.93 9.363 1.591 6.602z"/> <path d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0m-1.993-1.679a.5.5 0 0 0-.686.172l-1.17 1.95-.547-.547a.5.5 0 0 0-.708.708l.774.773a.75.75 0 0 0 1.174-.144l1.335-2.226a.5.5 0 0 0-.172-.686"/> </svg>';
        case 'SESSION_CREATED': return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-calendar-check" viewBox="0 0 16 16"> <path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0"/> <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/> </svg>';
        default: return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bell" viewBox="0 0 16 16"> <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2M8 1.918l-.797.161A4 4 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5 5 0 0 1 13 6c0 .88.32 4.2 1.22 6"/> </svg>';
    }
}

function formatTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
        return 'Vừa xong';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} phút trước`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} giờ trước`;
    } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} ngày trước`;
    } else {
        return date.toLocaleDateString('vi-VN');
    }
}

function updateNotificationBadge() {
    const vaultId = $('#vaultId').val();
    if (!vaultId) return;

    $.ajax({
        url: '/notification/unread-count',
        type: 'GET',
        data: { vaultId: vaultId },
        success: function (response) {
            const count = response.count || 0;
            updateNotificationBadgeDisplay(count);
        },
        error: function (xhr, status, error) {
            console.error('Error updating notification badge:', error);
        }
    });
}

function toggleNotificationReadStatus(notificationId) {
    // Close the notification menu first
    const menu = document.getElementById(`notification-menu-${notificationId}`);
    if (menu) {
        menu.classList.remove('show');
    }

    // Check current read status
    const notificationItem = $(`.notification-item[data-id="${notificationId}"]`);
    const isUnread = notificationItem.hasClass('unread');

    if (isUnread) {
        // Mark as read
        markNotificationAsRead(notificationId);
    } else {
        // Mark as unread
        markNotificationAsUnread(notificationId);
    }
}

function markNotificationAsRead(notificationId) {
    $.ajax({
        url: '/notification/mark-as-read',
        type: 'POST',
        data: { notificationId: notificationId },
        success: function () {
            // Remove unread styling and update menu
            const notificationItem = $(`.notification-item[data-id="${notificationId}"]`);
            notificationItem.removeClass('unread');

            // Update the menu icon, text and onclick
            const menuElement = $(`#notification-menu-${notificationId}`);
            if (menuElement.length) {
                const markReadItem = menuElement.find('.notification-menu-item').first();
                markReadItem.find('span').text('Đánh dấu chưa đọc');
                // Update icon to plus circle
                markReadItem.find('svg').html(`
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                `);
            }

            updateNotificationBadge();
            showToast('Đã đánh dấu thông báo đã đọc', 'success');
        },
        error: function (xhr, status, error) {
            console.error('Error marking notification as read:', error);
            showToast('Không thể đánh dấu thông báo đã đọc', 'error');
        }
    });
}

function markNotificationAsUnread(notificationId) {
    $.ajax({
        url: '/notification/mark-as-unread',
        type: 'POST',
        data: { notificationId: notificationId },
        success: function () {
            // Add unread styling and update menu
            const notificationItem = $(`.notification-item[data-id="${notificationId}"]`);
            notificationItem.addClass('unread');

            // Update the menu icon, text and onclick
            const menuElement = $(`#notification-menu-${notificationId}`);
            if (menuElement.length) {
                const markReadItem = menuElement.find('.notification-menu-item').first();
                markReadItem.find('span').text('Đánh dấu đã đọc');
                // Update icon to checkmark
                markReadItem.find('svg').html(`
                    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                `);
            }

            updateNotificationBadge();
            showToast('Đã đánh dấu thông báo chưa đọc', 'success');
        },
        error: function (xhr, status, error) {
            console.error('Error marking notification as unread:', error);
            showToast('Không thể đánh dấu thông báo chưa đọc', 'error');
        }
    });
}

function markAllNotificationsAsRead() {
    const vaultId = $('#vaultId').val();
    if (!vaultId) return;

    $.ajax({
        url: '/notification/mark-all-as-read',
        type: 'POST',
        data: { vaultId: vaultId },
        success: function () {
            // Remove unread styling from all notifications
            $('.notification-item.unread')
                .removeClass('unread')
                .find('.notification-actions').remove();

            updateNotificationBadge();
            showToast('Đã đánh dấu tất cả thông báo đã đọc', 'success');
        },
        error: function (xhr, status, error) {
            console.error('Error marking all notifications as read:', error);
            showToast('Không thể đánh dấu tất cả thông báo đã đọc', 'error');
        }
    });
}

function deleteNotification(notificationId) {
    // Close the notification menu first
    const menu = document.getElementById(`notification-menu-${notificationId}`);
    if (menu) {
        menu.classList.remove('show');
    }

    $.ajax({
        url: '/notification/delete',
        type: 'POST',
        data: { notificationId: notificationId },
        success: function () {
            $(`.notification-item[data-id="${notificationId}"]`).fadeOut(300, function () {
                $(this).remove();
                updateNotificationBadge();

                // Check if no notifications left
                if ($('.notification-item').length === 0) {
                    notificationList.html(`
                        <div class="text-center p-3 text-muted">
                            <i class="fas fa-bell-slash"></i>
                            <div>Không có thông báo nào</div>
                        </div>
                    `);
                }
            });
        },
        error: function (xhr, status, error) {
            console.error('Error deleting notification:', error);
            showToast('Không thể xóa thông báo', 'error');
        }
    });
}

// ===================== VAULT SEARCH FUNCTIONALITY =====================

let searchTimeout = null;
let lastSearchQuery = '';

function showVaultSearchModal() {
    const modal = document.getElementById('vaultSearchModal');
    modal.style.display = 'block';
    modal.classList.add('show');
    document.body.classList.add('modal-open');

    // Focus on search input
    setTimeout(() => {
        const searchInput = document.getElementById('vaultSearchInput');
        if (searchInput) {
            searchInput.focus();
        }
    }, 100);

    // Add click outside to close functionality
    const handleClickOutside = (event) => {
        if (event.target === modal) {
            hideVaultSearchModal();
        }
    };

    // Add escape key to close functionality
    const handleEscapeKey = (event) => {
        if (event.key === 'Escape') {
            hideVaultSearchModal();
        }
    };

    modal.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    // Store event listeners for cleanup
    modal._clickListener = handleClickOutside;
    modal._escapeListener = handleEscapeKey;
}

function hideVaultSearchModal() {
    const modal = document.getElementById('vaultSearchModal');
    modal.style.display = 'none';
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');

    // Hide filters when closing modal
    hideSearchFilters();

    // Remove event listeners
    if (modal._clickListener) {
        modal.removeEventListener('click', modal._clickListener);
        delete modal._clickListener;
    }
    if (modal._escapeListener) {
        document.removeEventListener('keydown', modal._escapeListener);
        delete modal._escapeListener;
    }
}

// Toggle search filters visibility
function toggleSearchFilters() {
    const filtersContainer = document.getElementById('searchFiltersContainer');
    const filterBtn = document.getElementById('filterToggleBtn');

    if (filtersContainer.style.display === 'none' || filtersContainer.style.display === '') {
        showSearchFilters();
    } else {
        hideSearchFilters();
    }
}

// Show search filters
function showSearchFilters() {
    const filtersContainer = document.getElementById('searchFiltersContainer');
    const filterBtn = document.getElementById('filterToggleBtn');

    filtersContainer.style.display = 'block';
    filterBtn.classList.add('active');
}

// Hide search filters
function hideSearchFilters() {
    const filtersContainer = document.getElementById('searchFiltersContainer');
    const filterBtn = document.getElementById('filterToggleBtn');

    filtersContainer.style.display = 'none';
    filterBtn.classList.remove('active');
}

// Clear all search filters
// function clearSearchFilters() {
//     // Reset sort dropdown
//     const sortDropdownMenu = document.getElementById('sortDropdownMenu');
//     if (sortDropdownMenu) {
//         sortDropdownMenu.querySelectorAll('.dropdown-item').forEach(item => item.classList.remove('selected'));
//         sortDropdownMenu.querySelector('[data-value="relevance"]').classList.add('selected');
//     }

//     // Reset title only button
//     const titleOnlyBtn = document.getElementById('titleOnlyBtn');
//     if (titleOnlyBtn) {
//         titleOnlyBtn.classList.add('active');
//     }

//     // Reset created by dropdown
//     const createdByDropdownMenu = document.getElementById('createdByDropdownMenu');
//     if (createdByDropdownMenu) {
//         createdByDropdownMenu.querySelectorAll('.dropdown-item').forEach(item => item.classList.remove('selected'));
//         createdByDropdownMenu.querySelector('[data-value="all"]').classList.add('selected');
//     }

//     // Clear member search input
//     const memberSearchInput = document.getElementById('memberSearchInput');
//     if (memberSearchInput) {
//         memberSearchInput.value = '';
//     }

//     // Re-perform search with cleared filters
//     const searchInput = document.getElementById('vaultSearchInput');
//     if (searchInput && searchInput.value.trim()) {
//         performVaultSearch(searchInput.value.trim());
//     }
// }

function initializeVaultSearch() {
    console.log('Initializing vault search...');

    const searchInput = document.getElementById('vaultSearchInput');

    if (!searchInput) {
        console.error('Search input not found!');
        return;
    }

    loadVaultMembers();

    searchInput.addEventListener('input', function (e) {
        const query = e.target.value.trim();

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        searchTimeout = setTimeout(() => {
            performVaultSearch(query);
        }, 300);
    });

    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = e.target.value.trim();
            performVaultSearch(query);
        }
    });

    console.log('Initializing filter dropdowns...');
    initializeFilterDropdowns();
    console.log('Initializing title only button...');
    initializeTitleOnlyButton();
    console.log('Vault search initialization complete!');
}

function initializeFilterDropdowns() {
    const sortDropdownBtn = document.getElementById('sortDropdownBtn');
    const sortDropdownMenu = document.getElementById('sortDropdownMenu');
    let currentSortValue = 'relevance';

    if (sortDropdownMenu) {
        const defaultSortItem = sortDropdownMenu.querySelector('[data-value="relevance"]');
        if (defaultSortItem) {
            defaultSortItem.classList.add('selected');
        }
    }

    if (sortDropdownBtn && sortDropdownMenu) {
        sortDropdownBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            sortDropdownMenu.classList.toggle('show');

            document.getElementById('createdByDropdownMenu').classList.remove('show');
        });

        sortDropdownMenu.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', function () {
                const value = this.getAttribute('data-value');
                currentSortValue = value;

                sortDropdownMenu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('selected'));
                this.classList.add('selected');

                sortDropdownMenu.classList.remove('show');

                const searchInput = document.getElementById('vaultSearchInput');
                if (searchInput && searchInput.value.trim()) {
                    performVaultSearch(searchInput.value.trim());
                }
            });
        });
    }

    const createdByDropdownBtn = document.getElementById('createdByDropdownBtn');
    const createdByDropdownMenu = document.getElementById('createdByDropdownMenu');
    const memberSearchInput = document.getElementById('memberSearchInput');
    let currentCreatedByValue = 'all';

    if (createdByDropdownMenu) {
        const defaultCreatedByItem = createdByDropdownMenu.querySelector('[data-value="all"]');
        if (defaultCreatedByItem) {
            defaultCreatedByItem.classList.add('selected');
        }
    }

    if (createdByDropdownBtn && createdByDropdownMenu) {
        createdByDropdownBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            createdByDropdownMenu.classList.toggle('show');

            document.getElementById('sortDropdownMenu').classList.remove('show');

            setTimeout(() => {
                if (memberSearchInput) {
                    memberSearchInput.focus();
                }
            }, 100);
        });

        if (memberSearchInput) {
            memberSearchInput.addEventListener('input', function () {
                const query = this.value.toLowerCase();
                const memberItems = createdByDropdownMenu.querySelectorAll('.dropdown-item:not([data-value="all"])');

                memberItems.forEach(item => {
                    const memberName = item.querySelector('span').textContent.toLowerCase();
                    if (memberName.includes(query)) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        }

        createdByDropdownMenu.addEventListener('click', function (e) {
            if (e.target.closest('.dropdown-item')) {
                const item = e.target.closest('.dropdown-item');
                const value = item.getAttribute('data-value');
                currentCreatedByValue = value;

                createdByDropdownMenu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');

                createdByDropdownMenu.classList.remove('show');

                if (memberSearchInput) {
                    memberSearchInput.value = '';
                }

                const searchInput = document.getElementById('vaultSearchInput');
                if (searchInput && searchInput.value.trim()) {
                    performVaultSearch(searchInput.value.trim());
                }
            }
        });
    }

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.filter-dropdown')) {
            document.querySelectorAll('.filter-dropdown-menu').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });
}

// Initialize title only button
function initializeTitleOnlyButton() {
    const titleOnlyBtn = document.getElementById('titleOnlyBtn');
    let titleOnlyActive = true;

    // Set default active state for title only button
    if (titleOnlyBtn) {
        titleOnlyBtn.classList.add('active');
    }

    if (titleOnlyBtn) {
        titleOnlyBtn.addEventListener('click', function () {
            titleOnlyActive = !titleOnlyActive;

            if (titleOnlyActive) {
                this.classList.add('active');
            } else {
                this.classList.remove('active');
            }

            // Perform search
            const searchInput = document.getElementById('vaultSearchInput');
            if (searchInput && searchInput.value.trim()) {
                performVaultSearch(searchInput.value.trim());
            }
        });
    }
}

// Helper functions to get current filter values
function getCurrentSortValue() {
    const selectedItem = document.querySelector('#sortDropdownMenu .dropdown-item.selected');
    return selectedItem ? selectedItem.getAttribute('data-value') : 'relevance';
}

function isTitleOnlyActive() {
    const titleOnlyBtn = document.getElementById('titleOnlyBtn');
    return titleOnlyBtn ? titleOnlyBtn.classList.contains('active') : true;
}

function getCurrentCreatedByValue() {
    const selectedItem = document.querySelector('#createdByDropdownMenu .dropdown-item.selected');
    return selectedItem ? selectedItem.getAttribute('data-value') : 'all';
}

// Load vault members for "Created by" filter
function loadVaultMembers() {
    const urlParams = new URLSearchParams(window.location.search);
    const vaultId = urlParams.get('id');

    if (!vaultId) return;

    $.ajax({
        url: '/vault-detail/experts',
        method: 'GET',
        data: { vaultId: vaultId },
        success: function (response) {
            const memberList = document.getElementById('memberList');
            if (memberList && response) {
                // Clear existing member list
                memberList.innerHTML = '';

                // Add member options
                response.forEach(member => {
                    const memberItem = document.createElement('div');
                    memberItem.className = 'dropdown-item';
                    memberItem.setAttribute('data-value', member.id);

                    const avatar = document.createElement('div');
                    avatar.className = 'member-avatar';
                    avatar.textContent = member.name.charAt(0).toUpperCase();

                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = member.name;

                    memberItem.appendChild(avatar);
                    memberItem.appendChild(nameSpan);
                    memberList.appendChild(memberItem);
                });
            }
        },
        error: function (xhr, status, error) {
            console.error('Error loading vault members:', error);
        }
    });
}

function performVaultSearch(query) {
    console.log('Performing search with query:', query);

    const searchResults = document.getElementById('searchResults');
    const searchEmpty = document.getElementById('searchEmpty');
    const searchNoResults = document.getElementById('searchNoResults');
    const searchLoading = document.getElementById('searchLoading');
    const searchResultsContent = document.getElementById('searchResultsContent');

    // Show/hide appropriate states
    if (!query) {
        searchEmpty.style.display = 'block';
        searchNoResults.style.display = 'none';
        searchLoading.style.display = 'none';
        searchResultsContent.style.display = 'none';
        return;
    }

    // Show loading
    searchEmpty.style.display = 'none';
    searchNoResults.style.display = 'none';
    searchLoading.style.display = 'block';
    searchResultsContent.style.display = 'none';

    // Get filter values from new UI
    const sortBy = getCurrentSortValue();
    const searchTitleOnly = isTitleOnlyActive();
    const createdBy = getCurrentCreatedByValue();

    console.log('Filter values:', { sortBy, searchTitleOnly, createdBy });

    const urlParams = new URLSearchParams(window.location.search);
    const vaultId = urlParams.get('id');

    // Perform AJAX search
    console.log('Making AJAX request with data:', {
        vaultId: vaultId,
        query: query,
        sortBy: sortBy,
        searchTitleOnly: searchTitleOnly,
        createdBy: createdBy
    });

    $.ajax({
        url: '/vault-detail/search',
        method: 'GET',
        data: {
            vaultId: vaultId,
            query: query,
            sortBy: sortBy,
            searchTitleOnly: searchTitleOnly,
            createdBy: createdBy
        },
        success: function (response) {
            console.log('Search response:', response);
            displaySearchResults(response, query);
        },
        error: function (xhr, status, error) {
            console.error('Search error:', error);
            console.error('Status:', status);
            console.error('Response:', xhr.responseText);
            searchLoading.style.display = 'none';
            searchNoResults.style.display = 'block';
        }
    });
}

function displaySearchResults(results, query) {
    const searchLoading = document.getElementById('searchLoading');
    const searchNoResults = document.getElementById('searchNoResults');
    const searchResultsContent = document.getElementById('searchResultsContent');
    const foldersResults = document.getElementById('foldersResults');
    const knowledgeResults = document.getElementById('knowledgeResults');
    const sessionsResults = document.getElementById('sessionsResults');

    searchLoading.style.display = 'none';

    // Check if we have any results
    const hasFolders = results.folders && results.folders.length > 0;
    const hasKnowledge = results.knowledgeItems && results.knowledgeItems.length > 0;
    const hasSessions = results.sessions && results.sessions.length > 0;

    if (!hasFolders && !hasKnowledge && !hasSessions) {
        searchNoResults.style.display = 'block';
        searchResultsContent.style.display = 'none';
        return;
    }

    searchNoResults.style.display = 'none';
    searchResultsContent.style.display = 'block';

    // Display folders
    if (hasFolders) {
        foldersResults.style.display = 'block';
        document.getElementById('foldersResultsList').innerHTML =
            results.folders.map(folder => createFolderResultItem(folder, query)).join('');
    } else {
        foldersResults.style.display = 'none';
    }

    // Display knowledge items
    if (hasKnowledge) {
        knowledgeResults.style.display = 'block';
        document.getElementById('knowledgeResultsList').innerHTML =
            results.knowledgeItems.map(item => createKnowledgeResultItem(item, query)).join('');
    } else {
        knowledgeResults.style.display = 'none';
    }

    // Display sessions
    if (hasSessions) {
        sessionsResults.style.display = 'block';
        document.getElementById('sessionsResultsList').innerHTML =
            results.sessions.map(session => createSessionResultItem(session, query)).join('');
    } else {
        sessionsResults.style.display = 'none';
    }
}

function createFolderResultItem(folder, query) {
    const highlightedName = highlightSearchTerm(folder.name, query);
    const folderType = folder.type === 'personal' ? 'Private' : 'Public';

    return `
        <div class="search-result-item" onclick="navigateToFolder('${folder.id}', '${folder.type}')">
            <div class="result-title">${highlightedName}</div>
            <div class="result-meta">
                <span class="result-type folder">Folder</span>
                <span>${folderType}</span>
                <span>${folder.itemCount || 0} items</span>
            </div>
        </div>
    `;
}

function createKnowledgeResultItem(item, query) {
    const highlightedTitle = highlightSearchTerm(item.title, query);
    const highlightedDescription = item.description ? highlightSearchTerm(item.description, query) : '';
    const statusBadge = getKnowledgeStatusBadge(item.status);

    return `
        <div class="search-result-item" onclick="viewKnowledge('${item.id}')">
            <div class="result-title">${highlightedTitle}</div>
            ${highlightedDescription ? `<div class="result-description">${highlightedDescription}</div>` : ''}
            <div class="result-meta">
                <span class="result-type knowledge">Knowledge</span>
                <span>${statusBadge}</span>
                <span>in ${item.folderName || 'Unknown folder'}</span>
                <span>${formatDate(item.createdAt)}</span>
                <span>by ${item.creatorName || 'Unknown'}</span>
            </div>
        </div>
    `;
}

function createSessionResultItem(session, query) {
    const highlightedTitle = highlightSearchTerm(session.title, query);
    const highlightedDescription = session.description ? highlightSearchTerm(session.description, query) : '';

    return `
        <div class="search-result-item" onclick="viewSession('${session.id}')">
            <div class="result-title">${highlightedTitle}</div>
            ${highlightedDescription ? `<div class="result-description">${highlightedDescription}</div>` : ''}
            <div class="result-meta">
                <span class="result-type session">Session</span>
                <span>${formatDateTime(session.date)}</span>
                <span>${session.duration} minutes</span>
                <span>by ${session.instructorName || 'Unknown'}</span>
            </div>
        </div>
    `;
}

function highlightSearchTerm(text, query) {
    if (!query || !text) return text;

    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getKnowledgeStatusBadge(status) {
    const statusMap = {
        'DRAFT': '<span style="color: #3b82f6;">Draft</span>',
        'PENDING_APPROVAL': '<span style="color: #f59e0b;">Pending</span>',
        'APPROVED': '<span style="color: #10b981;">Approved</span>',
        'REJECTED': '<span style="color: #ef4444;">Rejected</span>'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Navigation functions
function navigateToFolder(folderId, folderType) {
    hideVaultSearchModal();
    const urlParams = new URLSearchParams(window.location.search);
    const vaultId = urlParams.get('id');

    const typeParam = folderType === 'personal' ? 'private=true' : 'official=true';
    window.location.href = `/vault-detail?id=${vaultId}&folder=${folderId}&${typeParam}`;
}

function viewKnowledge(knowledgeId) {
    hideVaultSearchModal();
    // Trigger the existing view knowledge functionality
    const knowledgeElement = document.querySelector(`[data-knowledge-id="${knowledgeId}"]`);
    if (knowledgeElement) {
        const viewButton = knowledgeElement.querySelector('.view-knowledge-btn');
        if (viewButton) {
            viewButton.click();
        }
    }
}

function viewSession(sessionId) {
    hideVaultSearchModal();
    const urlParams = new URLSearchParams(window.location.search);
    const vaultId = urlParams.get('id');
    window.location.href = `/vault-detail?id=${vaultId}&sessions=true#session-${sessionId}`;
}

$(document).ready(function () {
    initializeVaultSearch();
    initializeUserProfile();
    setupNotificationMenuListeners();
});

// Notification menu handlers
function toggleNotificationMenu(notificationId, event) {
    event.stopPropagation();
    const menu = document.getElementById(`notification-menu-${notificationId}`);
    const allMenus = document.querySelectorAll('.notification-dropdown-menu');

    // Close all other menus
    allMenus.forEach(m => {
        if (m !== menu) {
            m.classList.remove('show');
        }
    });

    // Toggle current menu
    if (menu) {
        menu.classList.toggle('show');
    }
}

function setupNotificationMenuListeners() {
    // Remove existing listener if any
    if (window.notificationClickListener) {
        document.removeEventListener('click', window.notificationClickListener);
    }

    // Add click outside listener
    window.notificationClickListener = function (event) {
        if (!event.target.closest('.notification-menu-wrapper')) {
            document.querySelectorAll('.notification-dropdown-menu').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    };
    document.addEventListener('click', window.notificationClickListener);

    // Prevent notification item click when clicking menu
    document.querySelectorAll('.notification-menu-wrapper').forEach(wrapper => {
        // Remove existing listeners
        wrapper.removeEventListener('click', wrapper._clickHandler);

        // Add new listener
        wrapper._clickHandler = function (event) {
            event.stopPropagation();
        };
        wrapper.addEventListener('click', wrapper._clickHandler);
    });
}

// User Profile Functionality
function initializeUserProfile() {
    // Cache DOM elements for better performance
    const userDropdownToggle = document.getElementById('user-dropdown-toggle');
    const userDropdown = document.getElementById('user-dropdown');
    const openProfileModal = document.getElementById('open-profile-modal');
    const profileModal = document.getElementById('profile-modal');
    const closeProfileModal = document.getElementById('close-profile-modal');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const avatarFileInput = document.getElementById('avatar-file-input');
    const avatarUploadForm = document.getElementById('avatar-upload-form');

    // Pre-cache frequently used elements
    const profileNameElement = document.querySelector('.profile-name');
    const avatarImg = document.getElementById('profile-avatar-img');
    const profilePictureImg = document.querySelector('.profile-picture img');

    // Toggle user dropdown
    if (userDropdownToggle && userDropdown) {
        userDropdownToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            userDropdown.classList.toggle('show');

            // Add/remove class to user profile section for icon rotation
            if (userDropdown.classList.contains('show')) {
                userDropdownToggle.classList.add('dropdown-open');
            } else {
                userDropdownToggle.classList.remove('dropdown-open');
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!userDropdownToggle.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('show');
                userDropdownToggle.classList.remove('dropdown-open');
            }
        });
    }

    // Open profile modal
    if (openProfileModal && profileModal) {
        openProfileModal.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            userDropdown.classList.remove('show');
            userDropdownToggle.classList.remove('dropdown-open');

            // Optimize modal opening
            profileModal.style.display = 'flex';
            // Use requestAnimationFrame for better performance
            requestAnimationFrame(() => {
                profileModal.style.opacity = '1';
            });
        });
    }

    // Close profile modal
    if (closeProfileModal && profileModal) {
        closeProfileModal.addEventListener('click', function () {
            closeProfileModalFunction();
        });
    }

    // Close modal when clicking outside
    if (profileModal) {
        profileModal.addEventListener('click', function (e) {
            if (e.target === profileModal) {
                closeProfileModalFunction();
            }
        });
    }

    // Save profile changes
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', function () {
            // Disable button and show loading state
            saveProfileBtn.disabled = true;
            saveProfileBtn.textContent = 'Saving...';
            saveProfileChanges();
        });
    }

    // Handle avatar file upload
    if (avatarFileInput) {
        avatarFileInput.addEventListener('change', function (e) {
            if (e.target.files && e.target.files[0]) {
                // Show loading state
                const addPhotoLink = document.getElementById('add-photo-link');
                if (addPhotoLink) {
                    addPhotoLink.textContent = 'Uploading...';
                    addPhotoLink.style.pointerEvents = 'none';
                }
                uploadAvatar(e.target.files[0]);
            }
        });
    }

    // Close modal function
    function closeProfileModalFunction() {
        profileModal.style.opacity = '0';
        // Reduce timeout for faster closing
        setTimeout(() => {
            profileModal.style.display = 'none';
        }, 150);
    }

    // Save profile changes
    function saveProfileChanges() {
        const username = document.getElementById('profile-username').value;
        const gender = document.getElementById('profile-gender').value;
        const phone = document.getElementById('profile-phone').value;
        const dob = document.getElementById('profile-dob').value;

        // Validate required fields
        if (!username || username.trim() === '') {
            showToast('Username is required', 'error');
            // Reset button state
            saveProfileBtn.disabled = false;
            saveProfileBtn.textContent = 'Save Changes';
            return;
        }

        console.log('Saving profile changes:', { username, gender, phone, dob });

        const formData = new FormData();
        formData.append('name', username);
        formData.append('gender', gender);
        formData.append('phoneNumber', phone);
        formData.append('dateOfBirth', dob);

        fetch('/auth/update-profile', {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            },
            body: formData
        })
            .then(response => {
                console.log('Response status:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Response data:', data);
                if (data.success) {
                    showToast(data.message || 'Profile updated successfully!', 'success');
                    // Update the profile name in the header using cached element
                    if (profileNameElement) {
                        profileNameElement.textContent = username;
                    }
                    // Close modal after successful update
                    closeProfileModalFunction();
                } else {
                    showToast(data.error || 'Failed to update profile', 'error');
                }
                // Reset button state
                saveProfileBtn.disabled = false;
                saveProfileBtn.textContent = 'Save Changes';
            })
            .catch(error => {
                console.error('Error updating profile:', error);
                showToast('An error occurred while updating profile', 'error');
                // Reset button state
                saveProfileBtn.disabled = false;
                saveProfileBtn.textContent = 'Save Changes';
            });
    }

    // Upload avatar
    function uploadAvatar(file) {
        // Validate file
        if (!file) {
            showToast('Please select a file', 'error');
            return;
        }

        // Check file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            showToast('File size must be less than 10MB', 'error');
            return;
        }

        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            showToast('Please select a valid image file (PNG, JPEG, GIF)', 'error');
            return;
        }

        console.log('Uploading avatar:', file.name, file.size, file.type);

        const formData = new FormData();
        formData.append('avatar', file);

        fetch('/vault-management/upload-avatar', {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            },
            body: formData
        })
            .then(response => {
                console.log('Avatar upload response status:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Avatar upload response data:', data);
                if (data.success) {
                    showToast('Avatar uploaded successfully!', 'success');
                    // Update avatar images using cached elements
                    if (avatarImg) {
                        avatarImg.src = data.avatarUrl + '?t=' + new Date().getTime();
                    }
                    if (profilePictureImg) {
                        profilePictureImg.src = data.avatarUrl + '?t=' + new Date().getTime();
                    }
                } else {
                    showToast(data.message || 'Failed to upload avatar', 'error');
                }
                // Reset loading state
                const addPhotoLink = document.getElementById('add-photo-link');
                if (addPhotoLink) {
                    addPhotoLink.textContent = 'Add photo';
                    addPhotoLink.style.pointerEvents = 'auto';
                }
            })
            .catch(error => {
                console.error('Error uploading avatar:', error);
                showToast('An error occurred while uploading avatar', 'error');
                // Reset loading state
                const addPhotoLink = document.getElementById('add-photo-link');
                if (addPhotoLink) {
                    addPhotoLink.textContent = 'Add photo';
                    addPhotoLink.style.pointerEvents = 'auto';
                }
            });
    }
}
