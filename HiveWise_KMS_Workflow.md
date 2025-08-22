# HiveWise KMS - Workflow Chính

## 1. Workflow Đăng nhập và Xác thực

```mermaid
graph TD
    A[User truy cập hệ thống] --> B{Đã đăng nhập?}
    B -->|Không| C[Hiển thị trang Login]
    B -->|Có| D[Chuyển đến Dashboard]
    
    C --> E[User nhập thông tin]
    E --> F{Validate thông tin}
    F -->|Sai| G[Hiển thị lỗi]
    F -->|Đúng| H[Generate JWT Token]
    
    H --> I[Lưu token vào session]
    I --> J[Redirect đến Dashboard]
    
    G --> C
    J --> K[Hiển thị Vault Management]
```

## 2. Workflow Quản lý Vault

```mermaid
graph TD
    A[User truy cập Vault Management] --> B[Hiển thị danh sách Vault]
    B --> C{User có quyền tạo Vault?}
    
    C -->|Có| D[Hiển thị nút "Create Vault"]
    C -->|Không| E[Chỉ hiển thị Vault được phân quyền]
    
    D --> F[User tạo Vault mới]
    F --> G[Validate thông tin Vault]
    G -->|Lỗi| H[Hiển thị thông báo lỗi]
    G -->|OK| I[Lưu Vault vào database]
    
    I --> J[Phân quyền VAULT_OWNER cho user]
    J --> K[Redirect về Vault Management]
    
    E --> L[User chọn Vault]
    L --> M[Kiểm tra quyền truy cập]
    M -->|Có quyền| N[Chuyển đến Vault Detail]
    M -->|Không có quyền| O[Hiển thị Access Denied]
```

## 3. Workflow Vault Detail - Quản lý Folder

```mermaid
graph TD
    A[User vào Vault Detail] --> B[Load cấu trúc folder]
    B --> C[Hiển thị Personal & Official folders]
    
    C --> D{User có quyền tạo folder?}
    D -->|Có| E[Hiển thị nút "Add Folder"]
    D -->|Không| F[Chỉ hiển thị folder hiện có]
    
    E --> G[User tạo folder mới]
    G --> H[Validate tên folder]
    H -->|Lỗi| I[Hiển thị lỗi validation]
    H -->|OK| J[Lưu folder vào database]
    
    J --> K[Refresh cấu trúc folder]
    K --> L[Hiển thị folder mới]
    
    F --> M[User chọn folder]
    M --> N[Load danh sách Knowledge Items]
    N --> O[Hiển thị Knowledge Items trong folder]
```

## 4. Workflow Quản lý Knowledge Items

```mermaid
graph TD
    A[User chọn folder] --> B[Load Knowledge Items]
    B --> C[Hiển thị danh sách Knowledge]
    
    C --> D{User có quyền tạo Knowledge?}
    D -->|Có| E[Hiển thị nút "Create Knowledge"]
    D -->|Không| F[Chỉ hiển thị Knowledge Items]
    
    E --> G[User tạo Knowledge mới]
    G --> H[Rich Text Editor]
    H --> I[User nhập title, content, tags]
    I --> J[Validate thông tin]
    J -->|Lỗi| K[Hiển thị lỗi validation]
    J -->|OK| L[Lưu Knowledge vào database]
    
    L --> M[Sync với Qdrant Vector Database]
    M --> N[Refresh danh sách Knowledge]
    
    F --> O[User chọn Knowledge Item]
    O --> P[Hiển thị chi tiết Knowledge]
    P --> Q[User có thể Edit/Delete/Submit for Approval]
```

## 5. Workflow Approval Process

```mermaid
graph TD
    A[User submit Knowledge for Approval] --> B[Kiểm tra quyền submit]
    B -->|Có quyền| C[Chuyển Knowledge sang trạng thái PENDING]
    B -->|Không có quyền| D[Hiển thị Access Denied]
    
    C --> E[Gửi notification cho Reviewers]
    E --> F[Reviewer nhận notification]
    
    F --> G[Reviewer mở Knowledge để review]
    G --> H[Reviewer đọc và đánh giá]
    
    H --> I{Quyết định}
    I -->|Approve| J[Chuyển sang trạng thái APPROVED]
    I -->|Reject| K[Chuyển sang trạng thái REJECTED]
    I -->|Request Changes| L[Chuyển về trạng thái DRAFT]
    
    J --> M[Move to Official Knowledge]
    K --> N[Gửi notification cho Author với lý do]
    L --> O[Gửi feedback cho Author]
    
    M --> P[Knowledge có thể được sử dụng trong AI Assistant]
    N --> Q[Author có thể chỉnh sửa và submit lại]
    O --> Q
```

## 6. Workflow AI Assistant

```mermaid
graph TD
    A[User mở AI Assistant] --> B[Load chat history]
    B --> C[Hiển thị welcome message]
    
    C --> D[User nhập câu hỏi]
    D --> E[Validate câu hỏi]
    E -->|Lỗi| F[Hiển thị lỗi validation]
    E -->|OK| G[Search trong Knowledge Base]
    
    G --> H[Query Qdrant Vector Database]
    H --> I[Retrieve relevant documents]
    I --> J[Generate AI response]
    
    J --> K[Lưu conversation vào database]
    K --> L[Hiển thị response cho user]
    
    L --> M[User có thể tiếp tục hỏi]
    M --> D
    
    F --> D
```

## 7. Workflow Session Management

```mermaid
graph TD
    A[User truy cập Calendar] --> B[Load sessions của tuần]
    B --> C[Hiển thị calendar view]
    
    C --> D{User có quyền tạo session?}
    D -->|Có| E[Hiển thị nút "Create Session"]
    D -->|Không| F[Chỉ hiển thị sessions]
    
    E --> G[User tạo session mới]
    G --> H[Chọn instructor, time, duration]
    H --> I[Validate thông tin session]
    I -->|Lỗi| J[Hiển thị lỗi validation]
    I -->|OK| K[Lưu session vào database]
    
    K --> L[Gửi notification cho participants]
    L --> M[Refresh calendar view]
    
    F --> N[User chọn session]
    N --> O[Hiển thị session details]
    O --> P[User có thể Join/Edit/Delete session]
```

## 8. Workflow Notification System

```mermaid
graph TD
    A[System Event xảy ra] --> B[Determine notification type]
    B --> C[Create notification record]
    
    C --> D[Set notification metadata]
    D --> E[Save to database]
    
    E --> F[Update notification badge]
    F --> G[Real-time push to user]
    
    G --> H[User nhận notification]
    H --> I[User click vào notification]
    I --> J[Navigate to relevant page]
    
    J --> K[Mark notification as read]
    K --> L[Update notification count]
```

## 9. Workflow Search System

```mermaid
graph TD
    A[User mở Search Modal] --> B[Load search interface]
    B --> C[User nhập search query]
    
    C --> D[Debounce search input]
    D --> E[Send search request]
    
    E --> F[Search across multiple sources]
    F --> G[Search Folders]
    F --> H[Search Knowledge Items]
    F --> I[Search Sessions]
    
    G --> J[Combine search results]
    H --> J
    I --> J
    
    J --> K[Highlight search terms]
    K --> L[Display results with categories]
    
    L --> M[User click vào result]
    M --> N[Navigate to specific item]
```

## 10. Workflow User Management

```mermaid
graph TD
    A[Vault Owner quản lý members] --> B[Load danh sách members]
    B --> C[Hiển thị roles và permissions]
    
    C --> D[Vault Owner thêm member mới]
    D --> E[Search users trong system]
    E --> F[Select user và assign role]
    
    F --> G[Validate role assignment]
    G -->|Lỗi| H[Hiển thị lỗi validation]
    G -->|OK| I[Save user-vault relationship]
    
    I --> J[Send invitation email]
    J --> K[Update member list]
    
    C --> L[Vault Owner update role]
    L --> M[Select new role]
    M --> N[Validate role change]
    N -->|Lỗi| O[Hiển thị lỗi]
    N -->|OK| P[Update user role]
    
    P --> Q[Send notification cho user]
    Q --> R[Refresh member list]
```

## Các điểm quan trọng trong Workflow:

### 🔐 **Security & Authentication**
- JWT-based authentication
- Role-based access control (VAULT_OWNER, VAULT_MEMBER, etc.)
- Session management

### 📊 **Data Flow**
- Real-time notifications
- Vector database integration (Qdrant)
- File upload và management

### 🔄 **State Management**
- Knowledge approval workflow
- Session scheduling
- User role transitions

### 📱 **User Experience**
- Responsive design
- Real-time updates
- Intuitive navigation

### 🎯 **Business Logic**
- Knowledge lifecycle management
- Approval process automation
- AI-powered search và assistance

