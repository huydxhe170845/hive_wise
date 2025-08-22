
function showAssistantView() {
    document.querySelector('.content-page .container-fluid.note-details').style.display = 'none';
    document.getElementById('assistantView').style.display = 'block';
    const url = new URL(window.location);
    url.searchParams.set('assistant', 'true');
    window.history.replaceState({}, '', url);
    loadChatHistory();
}

function hideAssistantView() {
    document.getElementById('assistantView').style.display = 'none';
    document.querySelector('.content-page .container-fluid.note-details').style.display = 'block';
    clearChatHistory();
    const url = new URL(window.location);
    url.searchParams.delete('assistant');
    window.history.replaceState({}, '', url);
}

function showVaultDetail() {
    document.getElementById('assistantView').style.display = 'none';
    document.querySelector('.content-page .container-fluid.note-details').style.display = 'block';
    const url = new URL(window.location);
    url.searchParams.delete('assistant');
    window.history.replaceState({}, '', url);
}
function clearChatHistory() {
    const chatHistory = document.getElementById('chatHistory');
    const emptyChatState = document.getElementById('emptyChatState');

    if (chatHistory) {
        chatHistory.innerHTML = '';
        const newEmptyState = document.createElement('div');
        newEmptyState.id = 'emptyChatState';
        newEmptyState.style.cssText = 'text-align: center; padding: 20px;';
        newEmptyState.innerHTML = '<p style="color: #9ca3af; font-size: 14px; margin: 0;">No conversations yet. Start by asking a question below!</p>';
        chatHistory.appendChild(newEmptyState);

        const welcomeSection = document.getElementById('welcomeSection');
        const chatHistorySection = document.getElementById('chatHistorySection');
        const quickActionsSection = document.getElementById('quickActionsSection');
        const inputSection = document.getElementById('inputSection');

        if (welcomeSection && chatHistorySection && quickActionsSection && inputSection) {
            welcomeSection.classList.remove('fade-out');
            chatHistorySection.classList.remove('fade-in');
            quickActionsSection.classList.remove('slide-out');
            inputSection.classList.remove('ready-to-slide', 'slide-down');

            setTimeout(() => {
                welcomeSection.style.display = 'block';
                chatHistorySection.style.display = 'none';
                chatHistorySection.style.marginBottom = '20px';
                quickActionsSection.style.display = 'block';
            }, 100);
        }
    }
}

function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    if (!chatInput) return;

    const userMessage = chatInput.value.trim();
    if (userMessage === '') return;

    const welcomeSection = document.getElementById('welcomeSection');
    const chatHistorySection = document.getElementById('chatHistorySection');
    const quickActionsSection = document.getElementById('quickActionsSection');
    const inputSection = document.getElementById('inputSection');
    const emptyChatState = document.getElementById('emptyChatState');

    if (!welcomeSection || !chatHistorySection || !quickActionsSection || !inputSection) return;

    if (emptyChatState) {
        emptyChatState.style.display = 'none';
    }

    welcomeSection.classList.add('fade-out');
    quickActionsSection.classList.add('slide-out');
    inputSection.classList.add('ready-to-slide');

    setTimeout(() => {
        welcomeSection.style.display = 'none';
        chatHistorySection.style.display = 'block';
        chatHistorySection.classList.add('fade-in');
        chatHistorySection.style.marginBottom = '0px';
        chatHistorySection.style.marginTop = '20px';
    }, 300);

    setTimeout(() => {
        inputSection.classList.remove('ready-to-slide');
        inputSection.classList.add('slide-down');

        // Hiển thị câu hỏi ngay lập tức
        addUserMessageToHistory(userMessage);

        // Thêm hiệu ứng thinking
        addThinkingMessage();

        // Lấy vaultId từ URL
        const urlParams = new URLSearchParams(window.location.search);
        const vaultId = urlParams.get('id');
        // Lấy source từ dropdown (nếu có)
        let selectedSource = 'all';
        const sourceSelect = inputSection.querySelector('select');
        if (sourceSelect && sourceSelect.value) {
            selectedSource = sourceSelect.value;
        }

        // Gọi API backend
        const requestBody = new URLSearchParams({
            vaultId: vaultId || '',
            source: selectedSource,
            question: userMessage
        });

        // Thêm sessionId nếu có
        if (window.currentSessionId) {
            requestBody.append('sessionId', window.currentSessionId);
        }

        fetch('/vault-detail/assistant/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: requestBody
        })
            .then(response => response.json())
            .then(data => {
                // Xóa hiệu ứng thinking và hiển thị câu trả lời
                removeThinkingMessage();
                addAIResponseToHistory(data.answer || "Không nhận được câu trả lời từ AI.");

                // Lưu sessionId để có thể load lại sau
                if (data.sessionId) {
                    window.currentSessionId = data.sessionId;
                    console.log('Current session ID:', data.sessionId);
                }
            })
            .catch(error => {
                // Xóa hiệu ứng thinking và hiển thị lỗi
                removeThinkingMessage();
                addAIResponseToHistory("Lỗi khi gọi AI backend: " + error);
            });
    }, 600);

    chatInput.value = '';
}

function addUserMessageToHistory(userMessage) {
    const chatHistory = document.getElementById('chatHistory');
    const emptyChatState = document.getElementById('emptyChatState');

    if (!chatHistory) return;

    // Ẩn empty state nếu có
    if (emptyChatState) {
        emptyChatState.style.display = 'none';
    }

    const messageDiv = document.createElement('div');
    messageDiv.style.marginBottom = '16px';

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageDiv.innerHTML = `
        <!-- User Message -->
        <div style="display: flex; justify-content: flex-end; align-items: flex-start; gap: 8px; margin-bottom: 6px;">
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; 
                padding: 10px 15px; max-width: 70%; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <p style="margin: 0; font-size: 13px; color: #374151; line-height: 1.4;">
                    ${userMessage}
                </p>
                <span style="font-size: 11px; color: #9ca3af; margin-top: 4px; display: block;">
                    You • ${timeStr}
                </span>
            </div>
            <!-- User Avatar -->
            <div class="chat-avatar" style="width: 32px; height: 32px; border-radius: 50%; background: #3b82f6; 
                display: flex; align-items: center; justify-content: center; color: white; 
                font-weight: 600; font-size: 14px; flex-shrink: 0;">
                ${getUserAvatarHtml()}
            </div>
        </div>
    `;

    chatHistory.appendChild(messageDiv);
    scrollToBottom();
}

function addThinkingMessage() {
    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory) return;

    const thinkingDiv = document.createElement('div');
    thinkingDiv.id = 'thinkingMessage';
    thinkingDiv.style.marginBottom = '16px';
    thinkingDiv.style.display = 'flex';
    thinkingDiv.style.justifyContent = 'flex-start';
    thinkingDiv.style.alignItems = 'flex-start';
    thinkingDiv.style.gap = '8px';

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    thinkingDiv.innerHTML = `
        <!-- Assistant Avatar -->
        <div class="chat-avatar" style="width: 32px; height: 32px; border-radius: 50%; background: #10b981; 
            display: flex; align-items: center; justify-content: center; color: white; 
            font-weight: 600; font-size: 14px; flex-shrink: 0;">
            ${getAssistantAvatarHtml()}
        </div>
        <div style="padding: 10px 15px; max-width: 70%;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <div class="thinking-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <span style="font-size: 11px; color: #9ca3af;">
                    HiveWise Assistant • ${timeStr}
                </span>
            </div>
        </div>
    `;

    chatHistory.appendChild(thinkingDiv);
    scrollToBottom();
}

function removeThinkingMessage() {
    const thinkingMessage = document.getElementById('thinkingMessage');
    if (thinkingMessage) {
        thinkingMessage.remove();
    }
}

// Helper function to convert markdown-like formatting to HTML
function parseMarkdownToHTML(text) {
    if (!text) return '';

    // Convert markdown formatting to HTML
    let html = text
        // Bold text (**text**)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Bullet points with emojis or symbols
        .replace(/^\s*[\*\-\+]\s+(.+)$/gm, '<li>$1</li>')
        // Numbered lists
        .replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>')
        // Headers with **
        .replace(/^\*\*(.+?)\*\*$/gm, '<h4 style="margin: 10px 0 5px 0; color: #1f2937; font-weight: 600;">$1</h4>')
        // Line breaks
        .replace(/\n/g, '<br>')
        // Remove extra <br> tags before lists
        .replace(/<br>\s*<li>/g, '<li>')
        .replace(/<\/li><br>/g, '</li>');

    // Wrap consecutive <li> elements in <ul>
    html = html.replace(/(<li>.*?<\/li>)(?:\s*<li>.*?<\/li>)*/g, function (match) {
        return '<ul style="margin: 8px 0; padding-left: 20px;">' + match + '</ul>';
    });

    return html;
}

function addAIResponseToHistory(aiResponse) {
    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory) return;

    const messageDiv = document.createElement('div');
    messageDiv.style.marginBottom = '16px';

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Parse markdown to HTML
    const formattedResponse = parseMarkdownToHTML(aiResponse);

    messageDiv.innerHTML = `
        <!-- AI Response -->
        <div style="display: flex; justify-content: flex-start; align-items: flex-start; gap: 8px;">
            <!-- Assistant Avatar -->
            <div class="chat-avatar" style="width: 32px; height: 32px; border-radius: 50%; background: #10b981; 
                display: flex; align-items: center; justify-content: center; color: white; 
                font-weight: 600; font-size: 14px; flex-shrink: 0;">
                ${getAssistantAvatarHtml()}
            </div>
            <div style="padding: 10px 15px; max-width: 70%;">
                <div style="margin: 0; font-size: 13px; color: #374151; line-height: 1.4;">
                    ${formattedResponse}
                </div>
                <span style="font-size: 11px; color: #9ca3af; margin-top: 4px; display: block;">
                    HiveWise Assistant • ${timeStr}
                </span>
            </div>
        </div>
    `;

    chatHistory.appendChild(messageDiv);
    scrollToBottom();
}

function scrollToBottom() {
    const chatHistorySection = document.getElementById('chatHistorySection');
    if (chatHistorySection) {
        chatHistorySection.scrollTop = chatHistorySection.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Initialize user avatar from server data
    if (window.userAvatarUrl && window.userAvatarUrl !== 'null' && window.userAvatarUrl.trim() !== '') {
        userAvatarPath = window.userAvatarUrl;
    }

    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('assistant') === 'true') {
        showAssistantView();
    }
});

// Global variables for avatar customization
let userAvatarPath = window.userAvatarUrl || "/images/user/01.jpg"; // Use server-provided avatar or fallback
let assistantAvatarPath = "/images/logo/logo_100x100_dark.png";

// Functions to set custom avatars
function setUserAvatar(avatarPath) {
    userAvatarPath = avatarPath;
}

function setAssistantAvatar(avatarPath) {
    assistantAvatarPath = avatarPath;
}

// Helper function to get user avatar HTML
function getUserAvatarHtml() {
    if (userAvatarPath && userAvatarPath !== 'null' && userAvatarPath.trim() !== '') {
        return `<img src="${userAvatarPath}" alt="User" 
            style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;"
            onerror="this.style.display='none'; this.parentElement.innerHTML='👤'; this.parentElement.style.background='#3b82f6';">`;
    } else {
        return '👤'; // Default user icon if no avatar
    }
}

// Helper function to get assistant avatar HTML
function getAssistantAvatarHtml() {
    return `<img src="${assistantAvatarPath}" alt="Assistant" 
        style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;"
        onerror="this.style.display='none'; this.parentElement.innerHTML='🤖';">`;
}

// Function to load chat history
function loadChatHistory() {
    const urlParams = new URLSearchParams(window.location.search);
    const vaultId = urlParams.get('id');

    // Kiểm tra session hiện tại cho vault
    fetch(`/vault-detail/assistant/current-session?vaultId=${vaultId}`)
        .then(response => response.json())
        .then(data => {
            console.log('Current session data:', data);
            if (data.hasHistory && data.sessionId) {
                window.currentSessionId = data.sessionId;
                loadSessionMessages(data.sessionId);
            } else {
                console.log('No existing session for this vault');
                // Hiển thị empty state
                displayChatHistory([]);
            }
        })
        .catch(error => {
            console.error('Error loading current session:', error);
            displayChatHistory([]);
        });
}

// Function to load messages from a specific session
function loadSessionMessages(sessionId) {
    fetch(`/vault-detail/assistant/session/${sessionId}/messages`)
        .then(response => response.json())
        .then(messages => {
            console.log('Session messages loaded:', messages);
            displayChatHistory(messages);
        })
        .catch(error => {
            console.error('Error loading session messages:', error);
        });
}

// Function to display chat history in UI
function displayChatHistory(messages) {
    const chatHistory = document.getElementById('chatHistory');
    const emptyChatState = document.getElementById('emptyChatState');

    if (!chatHistory) return;

    // Clear current history
    chatHistory.innerHTML = '';

    if (messages && messages.length > 0) {
        // Hide empty state
        if (emptyChatState) {
            emptyChatState.style.display = 'none';
        }

        // Show chat history section
        const welcomeSection = document.getElementById('welcomeSection');
        const chatHistorySection = document.getElementById('chatHistorySection');
        const quickActionsSection = document.getElementById('quickActionsSection');

        if (welcomeSection && chatHistorySection && quickActionsSection) {
            welcomeSection.style.display = 'none';
            chatHistorySection.style.display = 'block';
            quickActionsSection.style.display = 'none';
        }

        // Display each message
        messages.forEach(message => {
            if (message.sender === 'USER') {
                addUserMessageToHistoryFromDB(message.message, message.createdAt);
            } else if (message.sender === 'ASSISTANT') {
                addAIResponseToHistoryFromDB(message.message, message.createdAt);
            }
        });

        scrollToBottom();
    } else {
        // Show empty state
        const newEmptyState = document.createElement('div');
        newEmptyState.id = 'emptyChatState';
        newEmptyState.style.cssText = 'text-align: center; padding: 20px;';
        newEmptyState.innerHTML = '<p style="color: #9ca3af; font-size: 14px; margin: 0;">No conversations yet. Start by asking a question below!</p>';
        chatHistory.appendChild(newEmptyState);
    }
}

// Function to add user message from DB with timestamp
function addUserMessageToHistoryFromDB(userMessage, createdAt) {
    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory) return;

    const messageDiv = document.createElement('div');
    messageDiv.style.marginBottom = '16px';

    const timeStr = new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageDiv.innerHTML = `
        <!-- User Message -->
        <div style="display: flex; justify-content: flex-end; align-items: flex-start; gap: 8px; margin-bottom: 6px;">
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; 
                padding: 10px 15px; max-width: 70%; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <p style="margin: 0; font-size: 13px; color: #374151; line-height: 1.4;">
                    ${userMessage}
                </p>
                <span style="font-size: 11px; color: #9ca3af; margin-top: 4px; display: block;">
                    You • ${timeStr}
                </span>
            </div>
            <!-- User Avatar -->
            <div class="chat-avatar" style="width: 32px; height: 32px; border-radius: 50%; background: #3b82f6; 
                display: flex; align-items: center; justify-content: center; color: white; 
                font-weight: 600; font-size: 14px; flex-shrink: 0;">
                ${getUserAvatarHtml()}
            </div>
        </div>
    `;

    chatHistory.appendChild(messageDiv);
}

// Function to add AI response from DB with timestamp
function addAIResponseToHistoryFromDB(aiResponse, createdAt) {
    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory) return;

    const messageDiv = document.createElement('div');
    messageDiv.style.marginBottom = '16px';

    const timeStr = new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Parse markdown to HTML
    const formattedResponse = parseMarkdownToHTML(aiResponse);

    messageDiv.innerHTML = `
        <!-- AI Response -->
        <div style="display: flex; justify-content: flex-start; align-items: flex-start; gap: 8px;">
            <!-- Assistant Avatar -->
            <div class="chat-avatar" style="width: 32px; height: 32px; border-radius: 50%; background: #10b981; 
                display: flex; align-items: center; justify-content: center; color: white; 
                font-weight: 600; font-size: 14px; flex-shrink: 0;">
                ${getAssistantAvatarHtml()}
            </div>
            <div style="padding: 10px 15px; max-width: 70%;">
                <div style="margin: 0; font-size: 13px; color: #374151; line-height: 1.4;">
                    ${formattedResponse}
                </div>
                <span style="font-size: 11px; color: #9ca3af; margin-top: 4px; display: block;">
                    HiveWise Assistant • ${timeStr}
                </span>
            </div>
        </div>
    `;

    chatHistory.appendChild(messageDiv);
}

// History Sidebar Management
function toggleHistorySidebar() {
    const sidebar = document.getElementById('assistantHistorySidebar');
    const openBtn = document.getElementById('openHistorySidebarBtn');

    if (!sidebar || !openBtn) return;

    const isOpen = sidebar.style.width !== '0px' && sidebar.style.width !== '';

    if (isOpen) {
        closeHistorySidebar();
    } else {
        openHistorySidebar();
    }
}

function openHistorySidebar() {
    const sidebar = document.getElementById('assistantHistorySidebar');
    const openBtn = document.getElementById('openHistorySidebarBtn');

    if (sidebar) {
        sidebar.style.width = '320px';
    }

    // Load chat sessions when opening sidebar
    loadChatSessions();
}

function closeHistorySidebar() {
    const sidebar = document.getElementById('assistantHistorySidebar');

    if (sidebar) {
        sidebar.style.width = '0px';
    }
}

// Helper function to get vault ID from URL
function getVaultIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Load chat sessions for the sidebar
async function loadChatSessions() {
    try {
        const vaultId = getVaultIdFromUrl();
        console.log('Loading chat sessions for vault ID:', vaultId);

        if (!vaultId) {
            console.error('Vault ID not found');
            return;
        }

        const response = await fetch(`/vault-detail/assistant/sessions`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error('Failed to load chat sessions');
        }

        const sessions = await response.json();
        console.log('Loaded sessions:', sessions);
        displayChatSessions(sessions);
    } catch (error) {
        console.error('Error loading chat sessions:', error);
    }
}

// Display chat sessions in sidebar
function displayChatSessions(sessions) {
    const sessionList = document.getElementById('chatSessionList');
    if (!sessionList) return;

    sessionList.innerHTML = '';

    if (sessions.length === 0) {
        sessionList.innerHTML = `
            <li style="padding: 15px; text-align: center; color: #9ca3af; font-size: 14px;">
                No chat history yet
            </li>
        `;
        return;
    }

    sessions.forEach(session => {
        const li = document.createElement('li');
        li.style.cssText = `
            padding: 12px 18px; border-bottom: 1px solid #f3f4f6; 
            cursor: pointer; transition: background 0.2s;
        `;

        const createdDate = new Date(session.startedAt).toLocaleDateString();
        // Sử dụng firstQuestion làm title, fallback về session ID nếu không có
        const sessionTitle = session.firstQuestion || session.title || `Chat ${session.id}`;

        // Cắt ngắn title nếu quá dài
        const displayTitle = sessionTitle.length > 50
            ? sessionTitle.substring(0, 50) + '...'
            : sessionTitle;

        li.innerHTML = `
            <div style="font-weight: 500; font-size: 14px; color: #374151; margin-bottom: 4px;">
                ${displayTitle}
            </div>
            <div style="font-size: 12px; color: #9ca3af;">
                ${createdDate}
            </div>
        `;

        li.addEventListener('mouseenter', () => {
            li.style.background = '#f9fafb';
        });

        li.addEventListener('mouseleave', () => {
            li.style.background = 'transparent';
        });

        li.addEventListener('click', () => {
            loadChatSession(session.id);
            closeHistorySidebar();
        });

        sessionList.appendChild(li);
    });
}

// Load specific chat session
async function loadChatSession(sessionId) {
    try {
        const vaultId = getVaultIdFromUrl();
        if (!vaultId) {
            console.error('Vault ID not found');
            return;
        }

        const response = await fetch(`/vault-detail/assistant/session/${sessionId}/messages`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load chat session');
        }

        const messages = await response.json();

        // Clear current chat
        const chatHistory = document.getElementById('chatHistory');
        if (chatHistory) {
            chatHistory.innerHTML = '';
        }

        // Set current session
        window.currentSessionId = sessionId;

        // Display messages
        messages.forEach(message => {
            if (message.sender === 'USER') {
                addUserMessageToHistoryFromDB(message.message, message.createdAt);
            } else if (message.sender === 'ASSISTANT') {
                addAIResponseToHistoryFromDB(message.message, message.createdAt);
            }
        });

        scrollToBottom();

        // Hide welcome section and show chat
        hideWelcomeSection();

    } catch (error) {
        console.error('Error loading chat session:', error);
    }
}

// Initialize event listeners when page loads
document.addEventListener('DOMContentLoaded', function () {
    // History sidebar toggle
    const openHistoryBtn = document.getElementById('openHistorySidebarBtn');
    if (openHistoryBtn) {
        openHistoryBtn.addEventListener('click', toggleHistorySidebar);
    }

    // New chat button
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', function () {
            startNewChat();
            closeHistorySidebar();
        });
    }

    // Search chat functionality
    const searchChatInput = document.getElementById('searchChatInput');
    if (searchChatInput) {
        searchChatInput.addEventListener('input', function (e) {
            // Implement search functionality here if needed
            console.log('Search chat:', e.target.value);
        });
    }
});

// Start new chat session
function startNewChat() {
    currentSessionId = null;
    const chatHistory = document.getElementById('chatHistory');
    if (chatHistory) {
        chatHistory.innerHTML = '';
    }
    showWelcomeSection();
}

// Show welcome section
function showWelcomeSection() {
    const welcomeSection = document.getElementById('welcomeSection');
    const chatHistorySection = document.getElementById('chatHistorySection');
    const quickActionsSection = document.getElementById('quickActionsSection');
    const inputSection = document.getElementById('inputSection');

    if (welcomeSection && chatHistorySection && quickActionsSection && inputSection) {
        welcomeSection.style.display = 'block';
        welcomeSection.classList.remove('fade-out');

        chatHistorySection.style.display = 'none';
        chatHistorySection.classList.remove('fade-in');

        quickActionsSection.classList.remove('slide-out');
        inputSection.classList.remove('ready-to-slide', 'slide-down');
    }
}

// Hide welcome section
function hideWelcomeSection() {
    const welcomeSection = document.getElementById('welcomeSection');
    const chatHistorySection = document.getElementById('chatHistorySection');

    if (welcomeSection && chatHistorySection) {
        welcomeSection.style.display = 'none';
        chatHistorySection.style.display = 'block';
    }
}
