# HiveWise KMS - System Architecture Overview

## 🏗️ Kiến trúc Tổng quan

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Landing Page]
        B[Authentication Pages]
        C[Dashboard]
        D[Vault Management]
        E[Vault Detail]
        F[AI Assistant Interface]
        G[Calendar/Sessions]
        H[User Profile]
    end
    
    subgraph "Backend Layer"
        I[Spring Boot Controllers]
        J[Service Layer]
        K[Repository Layer]
        L[Security Layer]
    end
    
    subgraph "Data Layer"
        M[PostgreSQL Database]
        N[Qdrant Vector Database]
        O[File Storage]
    end
    
    subgraph "External Services"
        P[Email Service]
        Q[AI/ML Services]
        R[OAuth2 Providers]
    end
    
    A --> I
    B --> I
    C --> I
    D --> I
    E --> I
    F --> I
    G --> I
    H --> I
    
    I --> J
    J --> K
    K --> M
    K --> N
    K --> O
    
    J --> P
    J --> Q
    L --> R
```

## 🔄 Data Flow Diagram

```mermaid
graph LR
    subgraph "User Actions"
        A[Create Knowledge]
        B[Submit for Approval]
        C[Ask AI Assistant]
        D[Create Session]
        E[Search Content]
    end
    
    subgraph "Processing"
        F[Validation]
        G[Business Logic]
        H[Vector Embedding]
        I[AI Processing]
    end
    
    subgraph "Storage"
        J[PostgreSQL]
        K[Qdrant Vector DB]
        L[File System]
    end
    
    subgraph "Output"
        M[UI Updates]
        N[Notifications]
        O[AI Responses]
        P[Search Results]
    end
    
    A --> F
    B --> F
    C --> I
    D --> F
    E --> I
    
    F --> G
    G --> J
    G --> H
    H --> K
    I --> K
    
    J --> M
    K --> O
    K --> P
    G --> N
```

## 🎯 Core Business Processes

### 1. Knowledge Management Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Pending: Submit for Approval
    Pending --> Approved: Reviewer Approves
    Pending --> Rejected: Reviewer Rejects
    Pending --> Draft: Request Changes
    Rejected --> Draft: Author Revises
    Approved --> Archived: Time-based or Manual
    Archived --> [*]
```

### 2. User Role Hierarchy

```mermaid
graph TD
    A[System Admin] --> B[Vault Owner]
    B --> C[Vault Member]
    B --> D[Reviewer]
    C --> E[Viewer]
    
    A -.->|Manage all vaults| F[Global Management]
    B -.->|Manage vault| G[Vault Management]
    C -.->|Create/Edit content| H[Content Creation]
    D -.->|Review content| I[Content Review]
    E -.->|View only| J[Content Viewing]
```

### 3. Session Management Flow

```mermaid
sequenceDiagram
    participant U as User
    participant S as Session Service
    participant C as Calendar
    participant N as Notification Service
    
    U->>S: Create Session
    S->>S: Validate Schedule
    S->>C: Add to Calendar
    S->>N: Send Invitations
    N->>U: Notify Participants
    
    U->>C: View Calendar
    C->>U: Display Sessions
    
    U->>S: Join Session
    S->>U: Provide Meeting Link
```

## 🔐 Security Architecture

```mermaid
graph TD
    subgraph "Authentication Layer"
        A[JWT Token Generation]
        B[OAuth2 Integration]
        C[Session Management]
    end
    
    subgraph "Authorization Layer"
        D[Role-based Access Control]
        E[Permission Validation]
        F[Resource Protection]
    end
    
    subgraph "Data Security"
        G[Data Encryption]
        H[Input Validation]
        I[SQL Injection Prevention]
    end
    
    A --> D
    B --> D
    C --> E
    D --> F
    E --> G
    F --> H
    G --> I
```

## 📊 Database Schema Overview

```mermaid
erDiagram
    USERS ||--o{ USER_VAULT_ROLES : has
    USERS ||--o{ KNOWLEDGE_ITEMS : creates
    USERS ||--o{ COMMENTS : writes
    USERS ||--o{ RATINGS : gives
    
    VAULTS ||--o{ USER_VAULT_ROLES : contains
    VAULTS ||--o{ FOLDERS : has
    VAULTS ||--o{ KNOWLEDGE_SESSIONS : hosts
    
    FOLDERS ||--o{ KNOWLEDGE_ITEMS : contains
    FOLDERS ||--o{ FOLDERS : subfolder_of
    
    KNOWLEDGE_ITEMS ||--o{ COMMENTS : has
    KNOWLEDGE_ITEMS ||--o{ RATINGS : receives
    KNOWLEDGE_ITEMS ||--o{ KNOWLEDGE_ITEM_TAGS : tagged_with
    
    TAGS ||--o{ KNOWLEDGE_ITEM_TAGS : used_in
    TAGS ||--o{ KNOWLEDGE_SESSION_TAGS : used_in
    
    KNOWLEDGE_SESSIONS ||--o{ KNOWLEDGE_SESSION_TAGS : tagged_with
    
    USERS {
        string id PK
        string username
        string email
        string password
        string avatar_url
        datetime created_at
        datetime updated_at
    }
    
    VAULTS {
        string id PK
        string name
        string description
        string status
        datetime created_at
        datetime updated_at
    }
    
    FOLDERS {
        int id PK
        string name
        string type
        int parent_id FK
        string vault_id FK
        datetime created_at
    }
    
    KNOWLEDGE_ITEMS {
        string id PK
        string title
        text content
        string status
        int folder_id FK
        string created_by FK
        datetime created_at
        datetime updated_at
    }
```

## 🚀 Performance & Scalability

### Caching Strategy
```mermaid
graph LR
    A[User Request] --> B{Check Cache}
    B -->|Hit| C[Return Cached Data]
    B -->|Miss| D[Query Database]
    D --> E[Process Data]
    E --> F[Store in Cache]
    F --> G[Return Data]
    C --> H[Response]
    G --> H
```

### Load Balancing
```mermaid
graph TD
    A[Client Request] --> B[Load Balancer]
    B --> C[Instance 1]
    B --> D[Instance 2]
    B --> E[Instance 3]
    
    C --> F[Database Cluster]
    D --> F
    E --> F
```

## 🔧 Technology Stack

### Frontend
- **HTML5/CSS3/JavaScript**
- **Thymeleaf** (Server-side templating)
- **Bootstrap** (UI Framework)
- **Quill.js** (Rich Text Editor)

### Backend
- **Spring Boot 2.x**
- **Spring Security** (Authentication & Authorization)
- **Spring Data JPA** (Database access)
- **JWT** (Token-based authentication)

### Database
- **PostgreSQL** (Primary database)
- **Qdrant** (Vector database for AI)
- **File System** (Document storage)

### External Services
- **Email Service** (SMTP)
- **OAuth2** (Google, etc.)
- **AI/ML Services** (Vector embeddings, NLP)

## 📈 Monitoring & Analytics

```mermaid
graph TD
    A[Application Logs] --> B[Log Aggregation]
    C[Performance Metrics] --> D[Metrics Collection]
    E[User Behavior] --> F[Analytics Engine]
    
    B --> G[Centralized Monitoring]
    D --> G
    F --> G
    
    G --> H[Alerting System]
    G --> I[Dashboard]
    G --> J[Reports]
```

## 🎯 Key Performance Indicators (KPIs)

### User Engagement
- Daily/Monthly Active Users
- Knowledge Items Created
- Sessions Attended
- AI Assistant Usage

### System Performance
- Response Time
- Uptime Availability
- Error Rates
- Database Query Performance

### Business Metrics
- Knowledge Approval Rate
- User Adoption Rate
- Content Quality Score
- Search Success Rate

