// Knowledge Comment and Rating Management
class KnowledgeInteractionManager {
    constructor() {
        this.currentKnowledgeId = null;
        this.currentUserRating = null;
        this.commentToDelete = null;
        this.csrfToken = $('meta[name="_csrf"]').attr('content') || '';
        this.csrfHeader = $('meta[name="_csrf_header"]').attr('content') || 'X-CSRF-TOKEN';
        this.init();
    }

    init() {
        this.bindEventListeners();
    }

    getAjaxHeaders() {
        const headers = {};
        if (this.csrfToken && this.csrfHeader) {
            headers[this.csrfHeader] = this.csrfToken;
        }
        return headers;
    }

    bindEventListeners() {
        // Rating stars click event
        $(document).on('click', '.star-svg', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const starValue = parseInt($(e.currentTarget).data('value'));
            this.setRating(starValue);
        });

        // Comment submission
        $(document).on('click', '#submit-comment-btn', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.submitComment();
        });

        // Enter key in comment textarea
        $(document).on('keypress', '#comment-input', (e) => {
            if (e.which === 13 && !e.shiftKey) {
                e.preventDefault();
                this.submitComment();
            }
        });

        // Reply to comment
        $(document).on('click', '.reply-comment-btn', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const commentId = $(e.currentTarget).data('comment-id');
            this.showReplyForm(commentId);
        });

        // Edit comment
        $(document).on('click', '.edit-comment-btn', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const commentId = $(e.currentTarget).data('comment-id');
            this.showEditForm(commentId);
        });

        // Delete comment
        $(document).on('click', '.delete-comment-btn', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const commentId = $(e.currentTarget).data('comment-id');
            this.deleteComment(commentId);
        });

        // Submit reply
        $(document).on('click', '.submit-reply-btn', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const parentCommentId = $(e.currentTarget).data('parent-id');
            this.submitReply(parentCommentId);
        });

        // Submit edit
        $(document).on('click', '.submit-edit-btn', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const commentId = $(e.currentTarget).data('comment-id');
            this.submitEdit(commentId);
        });

        // Cancel reply/edit
        $(document).on('click', '.cancel-btn', (e) => {
            e.preventDefault();
            e.stopPropagation();
            $(e.currentTarget).closest('.reply-form, .edit-form').remove();
        });

        // Modal confirm delete button
        $(document).on('click', '#confirmDeleteComment', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.confirmDeleteComment();
        });

        // Reset commentToDelete when modal is hidden
        $(document).on('hidden.bs.modal', '#deleteCommentModal', () => {
            this.commentToDelete = null;
        });

        // Toggle replies visibility
        $(document).on('click', '.view-replies-btn', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleReplies($(e.currentTarget));
        });

        // Mouse events for rating stars
        $(document).on('mouseenter', '.star-svg', (e) => {
            const starValue = parseInt($(e.currentTarget).data('value'));
            this.highlightStars(starValue);
        });

        $(document).on('mouseleave', '.star-rating', () => {
            this.updateStarDisplay(this.currentUserRating || 0);
        });
    }

    loadKnowledgeInteractions(knowledgeId) {
        this.currentKnowledgeId = knowledgeId;

        $.ajax({
            url: `/vault-detail/knowledge/${knowledgeId}/interactions`,
            method: 'GET',
            success: (data) => {
                this.renderComments(data.comments);
                this.updateRatingDisplay(data);
                this.currentUserRating = data.userRating;
                this.updateStarDisplay(this.currentUserRating || 0);
            },
            error: (xhr) => {
                console.error('Error loading interactions:', xhr.responseJSON);
                this.showError('Không thể tải bình luận và đánh giá');
            }
        });
    }

    setRating(ratingValue) {
        if (!this.currentKnowledgeId) {
            this.showError('Không tìm thấy knowledge item');
            return;
        }

        // If clicking the same star, remove rating
        if (this.currentUserRating === ratingValue) {
            this.removeRating();
            return;
        }

        $.ajax({
            url: `/vault-detail/knowledge/${this.currentKnowledgeId}/rating`,
            method: 'POST',
            headers: this.getAjaxHeaders(),
            data: {
                ratingValue: ratingValue
            },
            success: (response) => {
                this.currentUserRating = response.userRating;
                this.updateStarDisplay(this.currentUserRating);
                this.updateRatingStats(response);
                this.showSuccess('Đánh giá của bạn đã được lưu');
            },
            error: (xhr) => {
                console.error('Error setting rating:', xhr.responseJSON);
                this.showError('Không thể lưu đánh giá');
            }
        });
    }

    removeRating() {
        $.ajax({
            url: `/vault-detail/knowledge/${this.currentKnowledgeId}/rating/remove`,
            method: 'POST',
            headers: this.getAjaxHeaders(),
            success: (response) => {
                this.currentUserRating = null;
                this.updateStarDisplay(0);
                this.updateRatingStats(response);
                this.showSuccess('Đánh giá đã được xóa');
            },
            error: (xhr) => {
                console.error('Error removing rating:', xhr.responseJSON);
                this.showError('Không thể xóa đánh giá');
            }
        });
    }

    submitComment() {
        const content = $('#comment-input').val().trim();
        if (!content) {
            this.showError('Vui lòng nhập nội dung bình luận');
            return;
        }

        if (!this.currentKnowledgeId) {
            this.showError('Không tìm thấy knowledge item');
            return;
        }

        $.ajax({
            url: `/vault-detail/knowledge/${this.currentKnowledgeId}/comment`,
            method: 'POST',
            headers: this.getAjaxHeaders(),
            data: {
                content: content
            },
            success: (comment) => {
                $('#comment-input').val('');
                this.addCommentToList(comment);
                this.showSuccess('Bình luận đã được thêm');
            },
            error: (xhr) => {
                console.error('Error submitting comment:', xhr.responseJSON);
                this.showError('Không thể thêm bình luận');
            }
        });
    }

    submitReply(parentCommentId) {
        const content = $(`.reply-form[data-parent-id="${parentCommentId}"] textarea`).val().trim();
        if (!content) {
            this.showError('Vui lòng nhập nội dung phản hồi');
            return;
        }

        $.ajax({
            url: `/vault-detail/knowledge/${this.currentKnowledgeId}/comment`,
            method: 'POST',
            headers: this.getAjaxHeaders(),
            data: {
                content: content,
                parentCommentId: parentCommentId
            },
            success: (comment) => {
                $(`.reply-form[data-parent-id="${parentCommentId}"]`).remove();
                this.addReplyToComment(parentCommentId, comment);
                this.showSuccess('Phản hồi đã được thêm');
            },
            error: (xhr) => {
                console.error('Error submitting reply:', xhr.responseJSON);
                this.showError('Không thể thêm phản hồi');
            }
        });
    }

    submitEdit(commentId) {
        const content = $(`.edit-form[data-comment-id="${commentId}"] textarea`).val().trim();
        if (!content) {
            this.showError('Vui lòng nhập nội dung bình luận');
            return;
        }

        $.ajax({
            url: `/vault-detail/comment/${commentId}/update`,
            method: 'POST',
            headers: this.getAjaxHeaders(),
            data: {
                content: content
            },
            success: (comment) => {
                $(`.edit-form[data-comment-id="${commentId}"]`).remove();
                this.updateCommentContent(commentId, comment);
                this.showSuccess('Bình luận đã được cập nhật');
            },
            error: (xhr) => {
                console.error('Error updating comment:', xhr.responseJSON);
                this.showError('Không thể cập nhật bình luận');
            }
        });
    }

    deleteComment(commentId) {
        // Store the comment ID for later use
        this.commentToDelete = commentId;

        // Show the modal
        $('#deleteCommentModal').modal('show');
    }

    confirmDeleteComment() {
        if (!this.commentToDelete) {
            return;
        }

        const commentId = this.commentToDelete;

        $.ajax({
            url: `/vault-detail/comment/${commentId}/delete`,
            method: 'POST',
            headers: this.getAjaxHeaders(),
            success: () => {
                $(`.comment-item[data-comment-id="${commentId}"]`).fadeOut(300, function () {
                    $(this).remove();
                });
                this.showSuccess('Bình luận đã được xóa');
                $('#deleteCommentModal').modal('hide');
                this.commentToDelete = null;
            },
            error: (xhr) => {
                console.error('Error deleting comment:', xhr.responseJSON);
                this.showError('Không thể xóa bình luận');
                $('#deleteCommentModal').modal('hide');
                this.commentToDelete = null;
            }
        });
    }

    toggleReplies(button) {
        const commentId = button.data('comment-id');
        const repliesContainer = $(`.replies[data-comment-id="${commentId}"]`);
        const icon = button.find('i');

        if (repliesContainer.is(':visible')) {
            // Hide replies
            repliesContainer.slideUp(300);
            icon.removeClass('fa-chevron-up').addClass('fa-chevron-down');
            const replyCount = repliesContainer.find('.comment-item').length;
            button.html(`Xem ${replyCount} phản hồi`);
        } else {
            // Show replies
            repliesContainer.slideDown(300);
            icon.removeClass('fa-chevron-down').addClass('fa-chevron-up');
            button.html(`Ẩn phản hồi`);
        }
    }

    highlightStars(rating) {
        $('.star-svg').each(function (index) {
            const starValue = index + 1;
            const svg = $(this).find('svg');
            if (starValue <= rating) {
                svg.attr('fill', '#ffc107');
            } else {
                svg.attr('fill', '#ccc');
            }
        });
    }

    updateStarDisplay(rating) {
        $('.star-svg').each(function (index) {
            const starValue = index + 1;
            const svg = $(this).find('svg');
            if (starValue <= rating) {
                svg.attr('fill', '#ffc107');
            } else {
                svg.attr('fill', '#ccc');
            }
        });
    }

    updateRatingDisplay(data) {
        const averageRating = data.averageRating || 0;
        const totalRatings = data.totalRatings || 0;

        // Update average rating display if needed
        // You can add a display element for this
    }

    updateRatingStats(response) {
        this.updateRatingDisplay(response);
    }

    renderComments(comments) {
        const commentsContainer = $('#comments-list');
        commentsContainer.empty();

        if (!comments || comments.length === 0) {
            commentsContainer.html('<p class="text-muted text-center py-3">Chưa có bình luận nào</p>');
            return;
        }

        comments.forEach(comment => {
            commentsContainer.append(this.createCommentHTML(comment));
        });
    }

    createCommentHTML(comment) {
        const timeAgo = this.getTimeAgo(comment.createdAt);
        const isEdited = comment.isEdited ? ' (đã chỉnh sửa)' : '';

        let repliesHTML = '';
        let viewRepliesButton = '';

        if (comment.replies && comment.replies.length > 0) {
            // Create view replies button
            viewRepliesButton = `
                <button type="button" class="btn btn-link p-0 text-primary view-replies-btn" 
                        data-comment-id="${comment.id}" style="font-size: 13px; margin-top: 5px;">
                    Xem ${comment.replies.length} phản hồi
                </button>
            `;

            // Create replies HTML (initially hidden)
            repliesHTML = `<div class="replies ml-4 mt-2" data-comment-id="${comment.id}" style="display: none;">`;
            comment.replies.forEach(reply => {
                repliesHTML += this.createCommentHTML(reply);
            });
            repliesHTML += '</div>';
        }

        return `
            <div class="comment-item mb-3" data-comment-id="${comment.id}">
                <div class="d-flex">
                    <div class="avatar mr-3">
                        <img src="${comment.userAvatar || '/static/images/avatar/default.png'}" 
                             class="rounded-circle" width="40" height="40" alt="${comment.username}">
                    </div>
                    <div class="comment-content flex-grow-1">
                        <div class="comment-header d-flex align-items-center mb-1">
                            <strong class="mr-2">${comment.username}</strong>
                            <small class="text-muted">${timeAgo}${isEdited}</small>
                        </div>
                        <div class="comment-text" data-comment-id="${comment.id}">
                            ${this.escapeHtml(comment.content)}
                        </div>
                        <div class="comment-actions mt-1">
                            <button type="button" class="btn btn-sm btn-link p-0 mr-2 reply-comment-btn" data-comment-id="${comment.id}">
                                Phản hồi
                            </button>
                            <button type="button" class="btn btn-sm btn-link p-0 mr-2 edit-comment-btn" data-comment-id="${comment.id}" data-user-id="${comment.userId}">
                                Sửa
                            </button>
                            <button type="button" class="btn btn-sm btn-link p-0 text-danger delete-comment-btn" data-comment-id="${comment.id}" data-user-id="${comment.userId}">
                                Xóa
                            </button>
                        </div>
                        ${viewRepliesButton}
                        ${repliesHTML}
                    </div>
                </div>
            </div>
        `;
    }

    addCommentToList(comment) {
        const commentsContainer = $('#comments-list');

        // Remove "no comments" message if it exists
        commentsContainer.find('.text-muted.text-center').remove();

        // Add new comment at the top
        commentsContainer.prepend(this.createCommentHTML(comment));
    }

    addReplyToComment(parentCommentId, reply) {
        const parentComment = $(`.comment-item[data-comment-id="${parentCommentId}"]`);
        let repliesContainer = parentComment.find('.replies');

        if (repliesContainer.length === 0) {
            repliesContainer = $('<div class="replies ml-4 mt-2"></div>');
            parentComment.find('.comment-content').append(repliesContainer);
        }

        repliesContainer.append(this.createCommentHTML(reply));
    }

    updateCommentContent(commentId, comment) {
        const commentElement = $(`.comment-text[data-comment-id="${commentId}"]`);
        commentElement.html(this.escapeHtml(comment.content));

        // Update edited indicator
        const header = commentElement.closest('.comment-content').find('.comment-header small');
        const currentText = header.text();
        if (!currentText.includes('(đã chỉnh sửa)')) {
            header.text(currentText + ' (đã chỉnh sửa)');
        }
    }

    showReplyForm(commentId) {
        // Remove any existing reply forms
        $('.reply-form').remove();

        const replyForm = $(`
            <div class="reply-form mt-2" data-parent-id="${commentId}">
                <textarea class="form-control mb-2" rows="2" placeholder="Viết phản hồi..."></textarea>
                <div>
                    <button type="button" class="btn btn-primary btn-sm submit-reply-btn" data-parent-id="${commentId}">Gửi</button>
                    <button type="button" class="btn btn-secondary btn-sm ml-2 cancel-btn">Hủy</button>
                </div>
            </div>
        `);

        $(`.comment-item[data-comment-id="${commentId}"] .comment-content`).append(replyForm);
        replyForm.find('textarea').focus();
    }

    showEditForm(commentId) {
        // Remove any existing edit forms
        $('.edit-form').remove();

        const commentContent = $(`.comment-text[data-comment-id="${commentId}"]`);
        const currentContent = commentContent.text();

        const editForm = $(`
            <div class="edit-form mt-2" data-comment-id="${commentId}">
                <textarea class="form-control mb-2" rows="2">${currentContent}</textarea>
                <div>
                    <button type="button" class="btn btn-primary btn-sm submit-edit-btn" data-comment-id="${commentId}">Lưu</button>
                    <button type="button" class="btn btn-secondary btn-sm ml-2 cancel-btn">Hủy</button>
                </div>
            </div>
        `);

        commentContent.after(editForm);
        editForm.find('textarea').focus();
    }

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'vừa xong';
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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showSuccess(message) {
        // You can implement a toast notification system here
        console.log('Success:', message);
        // For now, you can use a simple alert or implement with your existing toast system
    }

    showError(message) {
        // You can implement a toast notification system here
        console.error('Error:', message);
        // For now, you can use a simple alert or implement with your existing toast system
    }
}

// Initialize the knowledge interaction manager
const knowledgeInteractionManager = new KnowledgeInteractionManager();

// Function to load interactions when viewing a knowledge item
function loadKnowledgeInteractions(knowledgeId) {
    knowledgeInteractionManager.loadKnowledgeInteractions(knowledgeId);
}
