const quill = new Quill('#editor', {
    modules: {
        syntax: true,
        toolbar: '#toolbar-container'
    },
    theme: 'snow'
});

quill.focus();

document.addEventListener('DOMContentLoaded', function () {
    const editorContainer = document.getElementById('editor');
    const quillEditor = editorContainer.querySelector('.ql-editor');

    if (editorContainer && quillEditor) {
        editorContainer.addEventListener('click', function (e) {
            if (e.target === editorContainer || e.target.closest('.ql-container') === editorContainer) {
                if (!e.target.closest('.ql-editor')) {
                    quillEditor.focus();

                    const range = quill.getSelection();
                    if (!range) {
                        const length = quill.getLength();
                        quill.setSelection(length - 1, 0);
                    }
                }
            }
        });

        editorContainer.style.cursor = 'text';
    }
});

$(function () {
    setTimeout(function () {
        $('#toolbar-container button, #toolbar-container .ql-picker-label').each(function () {
            const $element = $(this);
            let classString = '';

            if ($element.hasClass('ql-picker-label')) {
                classString = $element.parent().attr('class');
            }
            else {
                classString = $element.attr('class');
            }

            const classList = classString.split(' ');
            let tooltipText = '';

            if (classList.includes('ql-size')) tooltipText = 'Font Size';
            else if (classList.includes('ql-font')) tooltipText = 'Font Family';
            else if (classList.includes('ql-color')) tooltipText = 'Font Color';
            else if (classList.includes('ql-background')) tooltipText = 'Background Color';
            else if (classList.includes('ql-align')) tooltipText = 'Alignment';
            else if (classList.includes('ql-bold')) tooltipText = 'Bold';
            else if (classList.includes('ql-italic')) tooltipText = 'Italic';
            else if (classList.includes('ql-underline')) tooltipText = 'Underline';
            else if (classList.includes('ql-strike')) tooltipText = 'Strikethrough';
            else if (classList.includes('ql-header')) tooltipText = 'Header';
            else if (classList.includes('ql-blockquote')) tooltipText = 'Blockquote';
            else if (classList.includes('ql-code-block')) tooltipText = 'Code Block';
            else if (classList.includes('ql-list')) tooltipText = 'List';
            else if (classList.includes('ql-indent')) tooltipText = 'Indent';
            else if (classList.includes('ql-link')) tooltipText = 'Insert Link';
            else if (classList.includes('ql-image')) tooltipText = 'Insert Image';
            else if (classList.includes('ql-video')) tooltipText = 'Insert Video';
            else if (classList.includes('ql-formula')) tooltipText = 'Formula';
            else if (classList.includes('ql-clean')) tooltipText = 'Clear Formatting';
            else if (classList.includes('ql-script')) tooltipText = 'Subscript/Superscript';
            else if (classList.includes('ql-direction')) tooltipText = 'Text Direction';
            else tooltipText = 'Format';
            $element.attr('data-toggle', 'tooltip');
            $element.attr('data-placement', 'bottom');
            $element.attr('title', tooltipText);
        });

        $('[data-toggle="tooltip"]').tooltip({
            container: 'body',
            trigger: 'hover',
            delay: { show: 100, hide: 50 }
        });
    }, 500);
});

document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const folderFromUrl = urlParams.get('folder');
    if (folderFromUrl) {
        currentFolderId = folderFromUrl;
        const folderInput = document.getElementById('selectedFolderId');
        if (folderInput) {
            folderInput.value = folderFromUrl;
        }
    }
});



document.addEventListener('DOMContentLoaded', function () {
    let isEditMode = false;
    let currentKnowledgeId = null;
    function waitForQuill() {
        if (typeof quill !== 'undefined') {
            setTimeout(() => {
                initializeKnowledgeFeatures();
            }, 500);
        } else {
            setTimeout(waitForQuill, 100);
        }
    }

    waitForQuill();

    function initializeKnowledgeFeatures() {
        const editBtns = document.querySelectorAll('.edit-knowledge-btn');
        const viewBtns = document.querySelectorAll('.view-knowledge-btn');
        document.addEventListener('click', function (e) {
            if (e.target.closest('.edit-knowledge-btn')) {
                e.preventDefault();
                const btn = e.target.closest('.edit-knowledge-btn');
                handleKnowledgeEdit(btn);
            } else if (e.target.closest('.view-knowledge-btn')) {
                e.preventDefault();
                const btn = e.target.closest('.view-knowledge-btn');
                handleKnowledgeView(btn);
            }
        });

        editBtns.forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                handleKnowledgeEdit(this);
            });
        });

        viewBtns.forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                handleKnowledgeView(this);
            });
        });

        const dropdownMenus = document.querySelectorAll('.dropdown-menu');
        dropdownMenus.forEach(menu => {
            menu.addEventListener('click', function (e) {
                if (e.target.closest('.edit-knowledge-btn')) {
                    e.preventDefault();
                    e.stopPropagation();
                    const btn = e.target.closest('.edit-knowledge-btn');
                    handleKnowledgeEdit(btn);
                } else if (e.target.closest('.view-knowledge-btn')) {
                    e.preventDefault();
                    e.stopPropagation();
                    const btn = e.target.closest('.view-knowledge-btn');
                    handleKnowledgeView(btn);
                }
            });
        });

        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                mutation.addedNodes.forEach(function (node) {
                    if (node.nodeType === 1) {
                        const newEditBtns = node.querySelectorAll ? node.querySelectorAll('.edit-knowledge-btn') : [];
                        const newViewBtns = node.querySelectorAll ? node.querySelectorAll('.view-knowledge-btn') : [];

                        newEditBtns.forEach(btn => {
                            btn.addEventListener('click', function (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                handleKnowledgeEdit(this);
                            });
                        });

                        newViewBtns.forEach(btn => {
                            btn.addEventListener('click', function (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                handleKnowledgeView(this);
                            });
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        function handleKnowledgeEdit(btn) {
            const knowledgeId = btn.getAttribute('data-knowledge-id');
            const title = btn.getAttribute('data-knowledge-title');
            const content = btn.getAttribute('data-knowledge-content');
            const folderId = btn.getAttribute('data-folder-id');
            const breadcrumbTitle = document.getElementById('breadcrumb-title');
            if (breadcrumbTitle && title) {
                const activeFolders = breadcrumbTitle.querySelectorAll('.active');
                activeFolders.forEach(f => f.classList.remove('active'));

                let titleElem = document.getElementById('breadcrumb-knowledge-title');
                if (!titleElem) {
                    titleElem = document.createElement('span');
                    titleElem.id = 'breadcrumb-knowledge-title';
                    titleElem.className = 'active';
                    titleElem.style.marginLeft = '8px';
                    titleElem.style.fontWeight = 'bold';
                    titleElem.style.color = '#1b1b1bd1';
                    titleElem.innerHTML = `<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 4px;"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m10 16 4-4-4-4"></path></svg> <span>${title}</span>`;
                    breadcrumbTitle.appendChild(titleElem);
                } else {
                    titleElem.className = 'active';
                    titleElem.style.color = '#1b1b1bd1';
                    titleElem.innerHTML = `<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 4px;"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m10 16 4-4-4-4"></path></svg> <span>${title}</span>`;
                }
            }

            const metadataCard = document.getElementById('knowledge-metadata-card');
            if (metadataCard) {
                metadataCard.style.display = 'block';
                const metadataTitleElem = metadataCard.querySelector('.metadata-card-title');
                if (metadataTitleElem) {
                    metadataTitleElem.textContent = 'Edit Knowledge';
                }
                const description = btn.getAttribute('data-knowledge-description');
                const tags = btn.getAttribute('data-knowledge-tag');
                const titleInput = document.getElementById('knowledge-title');
                const descInput = document.getElementById('knowledge-description');
                const tagInput = document.getElementById('knowledge-tag');
                if (titleInput) titleInput.value = title || '';
                if (descInput) descInput.value = description || '';
                if (tagInput) tagInput.value = tags || '';
                showTagBadges(tags);
            }

            loadKnowledgeToEditor(knowledgeId, title, content, folderId, 'edit');
            openEditor();
            // UI will be set by updateUIForMode('edit') inside loadKnowledgeToEditor

        }

        function handleKnowledgeView(btn) {
            const knowledgeId = btn.getAttribute('data-knowledge-id');
            const title = btn.getAttribute('data-knowledge-title');
            const content = btn.getAttribute('data-knowledge-content');
            const folderId = btn.getAttribute('data-folder-id');

            // Record knowledge view
            if (knowledgeId) {
                recordKnowledgeView(knowledgeId);
            }

            const metadataCard = document.getElementById('knowledge-metadata-card');
            if (metadataCard) {
                metadataCard.style.display = 'block';
                const metadataTitleElem = metadataCard.querySelector('.metadata-card-title');
                if (metadataTitleElem) {
                    metadataTitleElem.textContent = 'View Knowledge';
                }
                const cancelBtn = document.getElementById('cancel-edit-btn');
                if (cancelBtn) {
                    cancelBtn.style.display = 'inline-block';
                    cancelBtn.textContent = 'Close';
                }
            }
            const description = btn.getAttribute('data-knowledge-description');
            const tags = btn.getAttribute('data-knowledge-tag');
            loadKnowledgeToEditor(knowledgeId, title, content, folderId, 'view');
            const titleInput = document.getElementById('knowledge-title');
            const descInput = document.getElementById('knowledge-description');
            const tagInput = document.getElementById('knowledge-tag');
            if (titleInput) titleInput.value = title || '';
            if (descInput) descInput.value = description || '';
            if (tagInput) tagInput.value = tags || '';
            showTagBadges(tags);
            if (tags) {
                selectedTags = [];
                let tagArr = Array.isArray(tags) ? tags : tags.split(',');
                tagArr.forEach(tagName => {
                    if (tagName && tagName.trim()) addTag(tagName.trim());
                });
                updateSelectedTagsDisplay();
            }
            openEditor();

            const breadcrumbTitle = document.getElementById('breadcrumb-title');
            if (breadcrumbTitle && title) {
                const activeFolders = breadcrumbTitle.querySelectorAll('.active');
                activeFolders.forEach(f => f.classList.remove('active'));

                let titleElem = document.getElementById('breadcrumb-knowledge-title');
                if (!titleElem) {
                    titleElem = document.createElement('span');
                    titleElem.id = 'breadcrumb-knowledge-title';
                    titleElem.className = 'active';
                    titleElem.style.marginLeft = '8px';
                    titleElem.style.fontWeight = 'bold';
                    titleElem.style.color = '#1b1b1bd1';
                    titleElem.innerHTML = `<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 4px;"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m10 16 4-4-4-4"></path></svg> <span>${title}</span>`;
                    breadcrumbTitle.appendChild(titleElem);
                } else {
                    titleElem.className = 'active';
                    titleElem.style.color = '#1b1b1bd1';
                    titleElem.innerHTML = `<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 4px;"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m10 16 4-4-4-4"></path></svg> <span>${title}</span>`;
                }
            }

        }

        function loadKnowledgeToEditor(knowledgeId, title, content, folderId, mode) {
            document.getElementById('knowledgeId').value = knowledgeId;
            document.getElementById('article-title').value = title || '';
            document.getElementById('selectedFolderId').value = folderId;
            document.getElementById('editor-mode').value = mode;

            function decodeHtml(html) {
                if (!html) return '';
                const txt = document.createElement('textarea');
                txt.innerHTML = html;
                return txt.value;
            }

            if (typeof quill !== 'undefined') {
                if (content) {
                    const decodedContent = decodeHtml(content);
                    quill.root.innerHTML = decodedContent;
                } else {
                    quill.setText('');
                }

                quill.enable(mode !== 'view');
            }

            updateUIForMode(mode);
            currentKnowledgeId = knowledgeId;
            isEditMode = mode === 'edit';

            // Load interactions when viewing knowledge
            if (mode === 'view' && knowledgeId && typeof loadKnowledgeInteractions === 'function') {
                // Add a small delay to ensure the comment section is rendered
                setTimeout(() => {
                    loadKnowledgeInteractions(knowledgeId);
                }, 100);
            }

            // Hide metadata when viewing knowledge
            const metadataCard = document.getElementById('knowledge-metadata-card');
            if (metadataCard) {
                metadataCard.style.display = (mode === 'view') ? 'none' : 'block';
            }

            // Hide create-knowledge-btn when view or edit
            const createBtn = document.getElementById('create-knowledge-btn');
            if (createBtn) {
                if (mode === 'view' || mode === 'edit') {
                    createBtn.style.display = 'none';
                } else {
                    createBtn.style.display = 'inline-block';
                }
            }

            let closeBtn = document.getElementById('view-close-btn');
            const editorContainer = document.getElementById('editor');
            if (mode === 'view' && editorContainer) {
                if (!closeBtn) {
                    closeBtn = document.createElement('button');
                    closeBtn.id = 'view-close-btn';
                    closeBtn.textContent = 'Close';
                    closeBtn.className = 'btn btn-outline-primary btn-sm';
                    closeBtn.style.marginTop = '-12px';
                    closeBtn.style.position = 'relative';
                    closeBtn.style.zIndex = '700';
                    closeBtn.style.float = 'right';
                    closeBtn.style.pointerEvents = 'auto';
                    closeBtn.disabled = false;
                    closeBtn.onclick = function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const collapseMenu = document.getElementById('collapseMenu');
                        if (collapseMenu) {
                            $(collapseMenu).collapse('hide');
                        }
                        const toolbar = document.getElementById('toolbar-container');
                        if (toolbar) {
                            toolbar.style.display = 'none';
                        }
                        resetEditor();
                        if (createBtn) createBtn.style.display = 'inline-block';
                        if (closeBtn) closeBtn.remove();
                    };
                    editorContainer.parentNode.insertBefore(closeBtn, editorContainer);
                } else {
                    closeBtn.style.display = 'inline-block';
                    closeBtn.disabled = false;
                    closeBtn.style.pointerEvents = 'auto';
                    closeBtn.style.zIndex = '1000';
                }
            } else if (closeBtn) {
                closeBtn.remove();
            }
        }

        function updateUIForMode(mode) {
            const saveBtn = document.getElementById('save-knowledge-btn');
            const updateBtn = document.getElementById('update-knowledge-btn');
            const cancelBtn = document.getElementById('cancel-edit-btn');
            const defaultCloseBtn = document.getElementById('default-close-btn');
            const titleInput = document.getElementById('article-title');
            const editor = document.getElementById('editor');
            const toolbar = document.getElementById('toolbar-container');
            const commentSectionId = 'knowledge-comment-section';

            if (mode === 'edit') {
                if (saveBtn) saveBtn.style.display = 'none';
                if (updateBtn) updateBtn.style.display = 'inline-block';
                if (cancelBtn) cancelBtn.style.display = 'none';
                if (defaultCloseBtn) defaultCloseBtn.style.display = 'inline-block';
                if (titleInput) titleInput.readOnly = false;
                if (editor) editor.classList.remove('readonly-mode');
                if (toolbar) toolbar.style.display = '';
                const commentSection = document.getElementById(commentSectionId);
                if (commentSection) commentSection.remove();
            } else if (mode === 'view') {
                if (saveBtn) saveBtn.style.display = 'none';
                if (updateBtn) updateBtn.style.display = 'none';
                if (cancelBtn) {
                    cancelBtn.style.display = 'inline-block';
                    cancelBtn.textContent = 'Close';
                }
                if (defaultCloseBtn) defaultCloseBtn.style.display = 'none';
                if (titleInput) titleInput.readOnly = true;
                if (toolbar) {
                    toolbar.style.setProperty('display', 'none', 'important');
                    setTimeout(function () {
                        toolbar.style.setProperty('display', 'none', 'important');
                    }, 100);
                }
                if (!document.getElementById(commentSectionId)) {
                    const commentDiv = document.createElement('div');
                    commentDiv.id = commentSectionId;
                    commentDiv.style.marginTop = '32px';
                    commentDiv.innerHTML = `
                        <hr />
                        <div style="padding: 20px 0 0 0;">
                            <h5 style="margin-bottom: 18px; font-weight: 600; color: #1b1b1b;">Bình luận & Đánh giá</h5>
                                <div id="knowledge-rating" style="margin-bottom: 18px;display:flex;align-items:center;gap:8px;">
                                    <span style="font-weight:500;">Đánh giá:</span>
                                    <span class="star-rating" style="display:flex;gap:4px; margin-top:-7px;">
                                        <span class="star-svg" data-value="1" style="width:22px;height:22px;cursor:pointer;display:inline-block;transition:color 0.2s;">
                                            <svg viewBox="0 0 24 24" fill="#ccc" width="22" height="22"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                                        </span>
                                        <span class="star-svg" data-value="2" style="width:22px;height:22px;cursor:pointer;display:inline-block;transition:color 0.2s;">
                                            <svg viewBox="0 0 24 24" fill="#ccc" width="22" height="22"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                                        </span>
                                        <span class="star-svg" data-value="3" style="width:22px;height:22px;cursor:pointer;display:inline-block;transition:color 0.2s;">
                                            <svg viewBox="0 0 24 24" fill="#ccc" width="22" height="22"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                                        </span>
                                        <span class="star-svg" data-value="4" style="width:22px;height:22px;cursor:pointer;display:inline-block;transition:color 0.2s;">
                                            <svg viewBox="0 0 24 24" fill="#ccc" width="22" height="22"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                                        </span>
                                        <span class="star-svg" data-value="5" style="width:22px;height:22px;cursor:pointer;display:inline-block;transition:color 0.2s;">
                                            <svg viewBox="0 0 24 24" fill="#ccc" width="22" height="22"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                                        </span>
                                    </span>
                                </div>
                                <div id="knowledge-comments" style="background:#f8f9fa;border-radius:10px;padding:18px 16px;border:1px solid #e0e0e0;">
                                    <textarea id="comment-input" rows="2" style="width:100%;margin-bottom:10px;border-radius:8px;border:1px solid #d1d5db;padding:10px 12px;font-size:15px;resize:none;box-shadow:none;outline:none;" placeholder="Viết bình luận..."></textarea>
                                    <button type="button" id="submit-comment-btn" class="btn btn-primary btn-sm" style="border-radius:20px;padding:6px 18px;font-weight:500;font-size:15px;">Gửi bình luận</button>
                                    <div id="comments-list" style="margin-top:16px;"></div>
                                </div>
                            </div>
                        </div>
                    `;
                    editor.parentNode.appendChild(commentDiv);
                }
            } else {
                if (saveBtn) saveBtn.style.display = 'inline-block';
                if (updateBtn) updateBtn.style.display = 'none';
                if (cancelBtn) cancelBtn.style.display = 'none';
                if (defaultCloseBtn) defaultCloseBtn.style.display = 'inline-block';
                if (titleInput) titleInput.readOnly = false;
                editor.classList.remove('readonly-mode');
                if (toolbar) toolbar.style.display = '';
                const commentSection = document.getElementById(commentSectionId);
                if (commentSection) commentSection.remove();
            }
        }

        function openEditor() {
            const collapseMenu = document.getElementById('collapseMenu');
            if (collapseMenu) {
                if (!collapseMenu.classList.contains('show')) {
                    $(collapseMenu).collapse('show');
                }
            }
        }

        function resetEditor() {
            document.getElementById('knowledgeId').value = '';
            document.getElementById('article-title').value = '';
            document.getElementById('selectedFolderId').value = '';
            document.getElementById('editor-mode').value = 'create';

            // Luôn ẩn toolbar trước khi reset editor
            const toolbar = document.getElementById('toolbar-container');
            if (toolbar) {
                toolbar.style.display = 'none';
            }
            if (typeof quill !== 'undefined') {
                quill.setText('');
                quill.enable(true);
            }

            updateUIForMode('create');
            currentKnowledgeId = null;
            isEditMode = false;

            resetMetadataForm();

            const titleElem = document.getElementById('breadcrumb-knowledge-title');
            if (titleElem) titleElem.remove();
            const breadcrumbTitle = document.getElementById('breadcrumb-title');
            if (breadcrumbTitle) {
                const folderLinks = breadcrumbTitle.querySelectorAll('.breadcrumb-link');
                if (folderLinks.length > 0) {
                    folderLinks[folderLinks.length - 1].classList.add('active');
                    folderLinks[folderLinks.length - 1].style.color = '#1b1b1bd1';
                }
            }
        }

        function resetMetadataForm() {
            const metadataCard = document.getElementById('knowledge-metadata-card');
            if (metadataCard) {
                metadataCard.style.display = 'none';
            }

            const titleInput = document.getElementById('knowledge-title');
            const descInput = document.getElementById('knowledge-description');
            const tagInput = document.getElementById('knowledge-tag');

            if (titleInput) titleInput.value = '';
            if (descInput) descInput.value = '';
            if (tagInput) tagInput.value = '';

            selectedTags = [];
            updateSelectedTagsDisplay();
            hideTagSuggestions();
        }

        document.getElementById('update-knowledge-btn').addEventListener('click', function () {
            if (!currentKnowledgeId) return;

            const title = document.getElementById('article-title').value;
            const content = quill.root.innerHTML;
            const folderId = document.getElementById('selectedFolderId').value;
            const vaultId = document.getElementById('vaultId').value;

            if (!title.trim()) {
                alert('Please enter a title for the knowledge.');
                return;
            }

            if (!content.trim() || content === '<p><br></p>') {
                alert('Please enter some content for the knowledge.');
                return;
            }

            document.getElementById('knowledge-content').value = content;

            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/vault-detail/update-knowledge';

            const fields = {
                'knowledgeId': currentKnowledgeId,
                'vaultId': vaultId,
                'folderId': folderId,
                'title': title,
                'content': content
            };

            Object.keys(fields).forEach(key => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = fields[key];
                form.appendChild(input);
            });

            document.body.appendChild(form);

            resetEditor();
            $('#collapseMenu').collapse('hide');

            form.submit();
        });

        document.getElementById('cancel-edit-btn').addEventListener('click', function () {
            resetEditor();
            $('#collapseMenu').collapse('hide');
        });

        document.getElementById('save-knowledge-btn').addEventListener('click', function () {
            const metadataTitle = document.getElementById('knowledge-title')?.value?.trim();
            const metadataDescription = document.getElementById('knowledge-description')?.value?.trim();

            const title = metadataTitle || document.getElementById('article-title').value.trim();
            const content = quill.root.innerHTML;

            if (!title.trim()) {
                alert('Please enter a title for the knowledge.');
                return;
            }

            if (!content.trim() || content === '<p><br></p>') {
                alert('Please enter some content for the knowledge.');
                return;
            }

            const folderInput = document.getElementById('selectedFolderId');
            if (folderInput && (!folderInput.value || folderInput.value === '')) {
                const urlParams = new URLSearchParams(window.location.search);
                const folderFromUrl = urlParams.get('folder');
                if (folderFromUrl) {
                    folderInput.value = folderFromUrl;
                }
            }

            document.getElementById('article-title').value = title;
            document.getElementById('knowledge-content').value = content;

            const hiddenDescription = document.getElementById('hidden-knowledge-description');
            if (hiddenDescription) {
                hiddenDescription.value = metadataDescription || '';
            }

            const hiddenTag = document.getElementById('hidden-knowledge-tag');
            if (hiddenTag && selectedTags && selectedTags.length > 0) {
                const tagNames = selectedTags.map(tag => tag.name || tag);
                hiddenTag.value = tagNames.join(',');
            } else if (hiddenTag) {
                hiddenTag.value = '';
            }

            const form = document.getElementById('create-knowledge-form');
            const formData = new FormData(form);

            document.getElementById('create-knowledge-form').submit();
        });

        $('.iq-note-callapse-btn').on('click', function () {
            resetEditor();
            const urlParams = new URLSearchParams(window.location.search);
            const currentFolderId = urlParams.get('folder');
            if (currentFolderId) {
                document.getElementById('selectedFolderId').value = currentFolderId;
            }
        });

        $('#collapseMenu').on('hidden.bs.collapse', function () {
            resetEditor();
        });

        $('[data-extra-toggle="toggle"]').on('click', function () {
            resetEditor();
        });
    }
});

let selectedTags = [];
let allTags = [];

document.addEventListener('DOMContentLoaded', function () {
    loadExistingTags();

    setupCreateKnowledgeButton();

    setupFolderMenuCreateKnowledge();

    setupCloseButton();

    moveButtonsToHeader();

    setupSaveButton();
});

function setupCreateKnowledgeButton() {
    const createBtn = document.getElementById('create-knowledge-btn');
    if (createBtn) {
        createBtn.addEventListener('click', function (e) {
            e.preventDefault();
            showKnowledgeForm();
        });
    }
}

function setupFolderMenuCreateKnowledge() {
    document.addEventListener('click', function (e) {
        const menuItem = e.target.closest('.knowledge-menu-item');
        if (menuItem && menuItem.querySelector('span')?.textContent.trim() === 'Create Knowledge') {
            e.preventDefault();
            e.stopPropagation();

            const folderId = menuItem.getAttribute('data-folder-id');

            showKnowledgeFormForFolder(folderId);
        }
    });
}

function showKnowledgeForm() {
    const metadataCard = document.getElementById('knowledge-metadata-card');
    if (metadataCard) {
        metadataCard.style.display = 'block';
        const metadataTitleElem = metadataCard.querySelector('.metadata-card-title');
        if (metadataTitleElem) {
            metadataTitleElem.textContent = 'Create New Knowledge';
        }
        initializeTagInput();
        initializeFormSync();
        const titleInput = document.getElementById('knowledge-title');
        if (titleInput) {
            setTimeout(() => titleInput.focus(), 300);
        }
    }

    const collapseMenu = document.getElementById('collapseMenu');
    if (collapseMenu) {
        $(collapseMenu).collapse('show');
    }

    const urlParams = new URLSearchParams(window.location.search);
    const currentFolderId = urlParams.get('folder');
    if (currentFolderId) {
        const selectedFolderInput = document.getElementById('selectedFolderId');
        if (selectedFolderInput) {
            selectedFolderInput.value = currentFolderId;
        }
    }
}

function showKnowledgeFormForFolder(folderId) {
    const metadataCard = document.getElementById('knowledge-metadata-card');
    if (metadataCard) {
        metadataCard.style.display = 'block';

        initializeTagInput();

        const titleInput = document.getElementById('knowledge-title');
        if (titleInput) {
            setTimeout(() => titleInput.focus(), 300);
        }
    }

    const collapseMenu = document.getElementById('collapseMenu');
    if (collapseMenu) {
        $(collapseMenu).collapse('show');
    }

    if (folderId) {
        const selectedFolderInput = document.getElementById('selectedFolderId');
        if (selectedFolderInput) {
            selectedFolderInput.value = folderId;
        }
    }
}

function initializeTagInput() {
    const tagInput = document.getElementById('knowledge-tag');
    const tagSuggestions = document.getElementById('tag-suggestions');
    const selectedTagsContainer = document.getElementById('selected-tags');

    if (!tagInput || !tagSuggestions || !selectedTagsContainer) {
        return;
    }

    tagInput.removeEventListener('input', handleTagInput);
    tagInput.removeEventListener('keydown', handleTagKeydown);

    tagInput.addEventListener('input', handleTagInput);
    tagInput.addEventListener('keydown', handleTagKeydown);

    document.addEventListener('click', function (e) {
        if (!tagInput.contains(e.target) && !tagSuggestions.contains(e.target)) {
            hideTagSuggestions();
        }
    });
}

function handleTagInput(e) {
    const value = e.target.value.trim();
    if (value.length > 0) {
        showTagSuggestions(value);
    } else {
        hideTagSuggestions();
    }
}

function handleTagKeydown(e) {
    const tagSuggestions = document.getElementById('tag-suggestions');
    const suggestionItems = tagSuggestions.querySelectorAll('.tag-suggestion-item');

    if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const value = e.target.value.trim();
        if (value) {
            addTag(value);
            e.target.value = '';
            hideTagSuggestions();
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        // Handle suggestion navigation if needed
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        // Handle suggestion navigation if needed
    }
}

function showTagSuggestions(searchTerm) {
    const tagSuggestions = document.getElementById('tag-suggestions');
    if (!tagSuggestions) return;

    // Filter tags based on search term
    const filteredTags = allTags.filter(tag =>
        tag.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedTags.some(selected => selected.name === tag.name)
    );

    if (filteredTags.length > 0) {
        tagSuggestions.innerHTML = filteredTags.map(tag =>
            `<div class="tag-suggestion-item" data-tag-name="${tag.name}" data-tag-id="${tag.id}">
                <span class="tag-name">${tag.name}</span>
                <span class="tag-usage">${tag.usageCount} uses</span>
            </div>`
        ).join('');

        tagSuggestions.style.display = 'block';

        // Add click listeners to suggestions
        tagSuggestions.querySelectorAll('.tag-suggestion-item').forEach(item => {
            item.addEventListener('click', function () {
                const tagName = this.getAttribute('data-tag-name');
                const tagId = this.getAttribute('data-tag-id');
                addTag(tagName, tagId);
                document.getElementById('knowledge-tag').value = '';
                hideTagSuggestions();
            });
        });
    } else {
        // Show "Create new tag" option
        tagSuggestions.innerHTML = `
            <div class="tag-suggestion-item new-tag" data-tag-name="${searchTerm}">
                <span class="tag-name">Create "${searchTerm}"</span>
                <span class="tag-usage">New tag</span>
            </div>`;
        tagSuggestions.style.display = 'block';

        tagSuggestions.querySelector('.tag-suggestion-item').addEventListener('click', function () {
            const tagName = this.getAttribute('data-tag-name');
            addTag(tagName);
            document.getElementById('knowledge-tag').value = '';
            hideTagSuggestions();
        });
    }
}

function hideTagSuggestions() {
    const tagSuggestions = document.getElementById('tag-suggestions');
    if (tagSuggestions) {
        tagSuggestions.style.display = 'none';
    }
}

function addTag(tagName, tagId = null) {
    if (typeof tagName !== 'string') {
        return;
    }

    tagName = tagName.trim();
    if (!tagName) return;

    if (selectedTags.some(tag => tag.name === tagName)) {
        return;
    }

    selectedTags.push({ id: tagId, name: tagName });

    updateSelectedTagsDisplay();
}

function removeTag(tagName) {
    selectedTags = selectedTags.filter(tag => tag.name !== tagName);
    updateSelectedTagsDisplay();
}

function updateSelectedTagsDisplay() {
    const container = document.getElementById('selected-tags');
    if (!container) return;

    container.innerHTML = selectedTags.map(tag =>
        `<span class="tag-badge">
            ${tag.name}
            <button type="button" class="tag-remove" onclick="removeTag('${tag.name}')">&times;</button>
        </span>`
    ).join('');
}

function loadExistingTags() {
    fetch('/vault-detail/tags')
        .then(response => response.json())
        .then(tags => {
            allTags = tags;
        })
        .catch(error => {
            allTags = [];
        });
}

function initializeFormSync() {
    const metadataTitle = document.getElementById('knowledge-title');
    const articleTitle = document.getElementById('article-title');

    if (metadataTitle && articleTitle) {
        metadataTitle.removeEventListener('input', syncTitleToArticle);
        articleTitle.removeEventListener('input', syncTitleToMetadata);

        metadataTitle.addEventListener('input', syncTitleToArticle);
        articleTitle.addEventListener('input', syncTitleToMetadata);
    }
}

function syncTitleToArticle() {
    const articleTitle = document.getElementById('article-title');
    if (articleTitle) {
        articleTitle.value = this.value;
    }
}

function syncTitleToMetadata() {
    const metadataTitle = document.getElementById('knowledge-title');
    if (metadataTitle) {
        metadataTitle.value = this.value;
    }
}

function setupCloseButton() {
    const closeBtn = document.getElementById('default-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function (e) {
            e.preventDefault();

            const metadataCard = document.getElementById('knowledge-metadata-card');
            if (metadataCard) {
                metadataCard.style.display = 'none';
            }

            const collapseMenu = document.getElementById('collapseMenu');
            if (collapseMenu) {
                $(collapseMenu).collapse('hide');
            }

            const showElements = document.querySelectorAll('.show-note-button');
            showElements.forEach(el => el.classList.remove('d-none'));

            const hideElements = document.querySelectorAll('.hide-note-button');
            hideElements.forEach(el => el.classList.add('d-none'));

            resetKnowledgeForm();
        });
    }
}

function resetKnowledgeForm() {
    const articleTitle = document.getElementById('article-title');
    if (articleTitle) {
        articleTitle.value = '';
    }

    const selectedFolderId = document.getElementById('selectedFolderId');
    if (selectedFolderId) {
        selectedFolderId.value = '';
    }

    const knowledgeId = document.getElementById('knowledgeId');
    if (knowledgeId) {
        knowledgeId.value = '';
    }

    const editorMode = document.getElementById('editor-mode');
    if (editorMode) {
        editorMode.value = 'create';
    }

    if (typeof quill !== 'undefined') {
        quill.setText('');
        quill.enable(true);
    }

    resetMetadataForm();
}

function resetMetadataForm() {
    const metadataCard = document.getElementById('knowledge-metadata-card');
    if (metadataCard) {
        metadataCard.style.display = 'none';
    }

    const titleInput = document.getElementById('knowledge-title');
    const descInput = document.getElementById('knowledge-description');
    const tagInput = document.getElementById('knowledge-tag');

    if (titleInput) titleInput.value = '';
    if (descInput) descInput.value = '';
    if (tagInput) tagInput.value = '';

    selectedTags = [];
    updateSelectedTagsDisplay();
    hideTagSuggestions();
}

function moveButtonsToHeader() {
    const formButtons = document.getElementById('form-buttons');
    const headerPlaceholder = document.getElementById('header-buttons-placeholder');

    if (formButtons && headerPlaceholder) {
        headerPlaceholder.appendChild(formButtons);
        formButtons.style.position = 'static';
        formButtons.style.top = 'auto';
        formButtons.style.right = 'auto';
        formButtons.style.zIndex = 'auto';
    }
}

function setupSaveButton() {
    const saveBtn = document.getElementById('save-knowledge-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function (e) {
            e.preventDefault();

            const metadataTitleInput = document.getElementById('knowledge-title');
            const metadataDescriptionInput = document.getElementById('knowledge-description');
            const articleTitleInput = document.getElementById('article-title');

            const metadataTitle = metadataTitleInput ? metadataTitleInput.value.trim() : '';
            const metadataDescription = metadataDescriptionInput ? metadataDescriptionInput.value.trim() : '';

            let title = metadataTitle;
            if (!title && articleTitleInput) {
                title = articleTitleInput.value.trim();
            }

            let content = '';
            if (typeof quill !== 'undefined') {
                content = quill.root.innerHTML;
            }

            if (!title.trim()) {
                alert('Please enter a title for the knowledge.');
                return;
            }

            if (!content.trim() || content === '<p><br></p>') {
                alert('Please enter some content for the knowledge.');
                return;
            }

            const folderInput = document.getElementById('selectedFolderId');
            if (folderInput && (!folderInput.value || folderInput.value === '')) {
                const urlParams = new URLSearchParams(window.location.search);
                const folderFromUrl = urlParams.get('folder');
                if (folderFromUrl) {
                    folderInput.value = folderFromUrl;
                }
            }

            const hiddenTitleInput = document.getElementById('knowledge-title-hidden');
            if (hiddenTitleInput) {
                hiddenTitleInput.value = title;
            }

            const knowledgeContentInput = document.getElementById('knowledge-content');
            if (knowledgeContentInput) {
                knowledgeContentInput.value = content;
            }

            const hiddenDescription = document.getElementById('hidden-knowledge-description');
            if (hiddenDescription) {
                hiddenDescription.value = metadataDescription || '';
            }

            const hiddenTag = document.getElementById('hidden-knowledge-tag');
            if (hiddenTag && selectedTags && selectedTags.length > 0) {
                const tagNames = selectedTags.map(tag => tag.name || tag);
                hiddenTag.value = tagNames.join(',');
            } else if (hiddenTag) {
                hiddenTag.value = '';
            }

            const form = document.getElementById('create-knowledge-form');
            if (form) {
                const formData = new FormData(form);

                form.submit();
            }
        });
    }
}

function showTagBadges(tags) {
    const selectedTagsContainer = document.getElementById('selected-tags');
    if (!selectedTagsContainer) return;
    selectedTags = [];
    selectedTagsContainer.innerHTML = '';
    if (!tags) {
        updateSelectedTagsDisplay();
        return;
    }
    let tagArr = Array.isArray(tags) ? tags : tags.split(',');
    tagArr.forEach(tagName => {
        if (tagName && tagName.trim()) {
            selectedTags.push({ name: tagName.trim() });
        }
    });
    updateSelectedTagsDisplay();
}

// Function to record knowledge view
function recordKnowledgeView(knowledgeId) {
    // Get CSRF token
    const csrfToken = document.querySelector('meta[name="_csrf"]')?.getAttribute('content');
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.getAttribute('content') || 'X-CSRF-TOKEN';

    const headers = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    };

    if (csrfToken && csrfHeader) {
        headers[csrfHeader] = csrfToken;
    }

    fetch(`/vault-detail/knowledge/${knowledgeId}/record-view`, {
        method: 'POST',
        headers: headers,
        credentials: 'same-origin'
    })
        .then(response => {
            if (!response.ok) {
                console.warn('Failed to record knowledge view:', response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log('Knowledge view recorded:', data);
        })
        .catch(error => {
            console.error('Error recording knowledge view:', error);
        });
}
