---
title: Mermaid Diagrams Test
canvasWidth: 1280
routerMode: history
---

# Mermaid Diagrams Test

## Create Beautiful Diagrams with Code

### What is Mermaid?

Mermaid lets you create diagrams and visualizations using **text-based syntax**. It's perfect for:
- 📊 **Documentation**
- 🎨 **Presentations** 
- 📝 **Technical writing**
- 🔄 **Process flows**
- 💻 **System architecture**

---

## Flowcharts

### Basic Flowchart

```mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> E[Check logs]
    E --> B
    C --> F[End]
```

### Complex Flowchart with Subgraphs

```mermaid
graph TB
    subgraph "User Interface"
        UI[Web Interface]
        API[API Gateway]
    end
    
    subgraph "Backend Services"
        AUTH[Authentication]
        USER[User Service]
        DATA[Data Service]
    end
    
    subgraph "Database"
        DB[(PostgreSQL)]
        CACHE[(Redis)]
    end
    
    UI --> API
    API --> AUTH
    API --> USER
    API --> DATA
    USER --> DB
    DATA --> CACHE
    DATA --> DB
```

---

## Sequence Diagrams

### Simple Communication

```mermaid
sequenceDiagram
    participant U as User
    participant W as Web App
    participant A as API
    participant D as Database
    
    U->>W: Login Request
    W->>A: Authenticate User
    A->>D: Check Credentials
    D-->>A: User Data
    A-->>W: Auth Token
    W-->>U: Login Success
```

### Complex Interaction

```mermaid
sequenceDiagram
    participant Client
    participant LoadBalancer
    participant Server1
    participant Server2
    participant Database
    
    Client->>LoadBalancer: HTTP Request
    LoadBalancer->>Server1: Forward Request
    Server1->>Database: Query Data
    Database-->>Server1: Results
    Server1-->>LoadBalancer: Response
    LoadBalancer-->>Client: HTTP Response
    
    Note over Client,Database: If Server1 fails:
    Client->>LoadBalancer: HTTP Request
    LoadBalancer->>Server2: Forward Request
    Server2->>Database: Query Data
    Database-->>Server2: Results
    Server2-->>LoadBalancer: Response
    LoadBalancer-->>Client: HTTP Response
```

---

## Class Diagrams

### Software Architecture

```mermaid
classDiagram
    class User {
        +String id
        +String email
        +String name
        +Date createdAt
        +login()
        +logout()
        +updateProfile()
    }
    
    class Course {
        +String id
        +String title
        +String description
        +Date startDate
        +addStudent()
        +removeStudent()
        +getStudents()
    }
    
    class Lecture {
        +String id
        +String title
        +String content
        +int order
        +publish()
        +unpublish()
    }
    
    class Enrollment {
        +String id
        +Date enrolledAt
        +String status
        +complete()
        +drop()
    }
    
    User ||--o{ Enrollment : has
    Course ||--o{ Enrollment : has
    Course ||--o{ Lecture : contains
    User ||--o{ Course : creates
```

### Database Schema

```mermaid
classDiagram
    class User {
        +UUID id PK
        +String email UK
        +String password_hash
        +String first_name
        +String last_name
        +Timestamp created_at
        +Timestamp updated_at
    }
    
    class Post {
        +UUID id PK
        +UUID user_id FK
        +String title
        +Text content
        +Timestamp created_at
        +Timestamp updated_at
    }
    
    class Comment {
        +UUID id PK
        +UUID post_id FK
        +UUID user_id FK
        +Text content
        +Timestamp created_at
    }
    
    class Tag {
        +UUID id PK
        +String name UK
        +String description
    }
    
    class PostTag {
        +UUID post_id FK
        +UUID tag_id FK
    }
    
    User ||--o{ Post : writes
    User ||--o{ Comment : makes
    Post ||--o{ Comment : has
    Post ||--o{ PostTag : has
    Tag ||--o{ PostTag : used_in
```

---

## State Diagrams

### User Authentication Flow

```mermaid
stateDiagram-v2
    [*] --> NotLoggedIn
    
    NotLoggedIn --> LoggingIn : attempt_login
    LoggingIn --> LoggedIn : success
    LoggingIn --> NotLoggedIn : failure
    
    LoggedIn --> Browsing : view_content
    LoggedIn --> Editing : edit_content
    LoggedIn --> LoggingOut : logout
    
    Browsing --> Editing : start_editing
    Browsing --> LoggingOut : logout
    
    Editing --> Browsing : save_changes
    Editing --> NotLoggedIn : session_expired
    
    LoggingOut --> NotLoggedIn : logout_complete
    
    NotLoggedIn --> [*]
    LoggedIn --> [*]
```

### Order Processing System

```mermaid
stateDiagram-v2
    [*] --> NewOrder
    
    NewOrder --> Validating : validate_order
    Validating --> Valid : all_items_available
    Validating --> Invalid : insufficient_stock
    
    Invalid --> Cancelled : cancel_order
    Cancelled --> [*]
    
    Valid --> Processing : process_payment
    Processing --> Paid : payment_success
    Processing --> PaymentFailed : payment_failure
    
    PaymentFailed --> Cancelled : cancel_order
    Cancelled --> [*]
    
    Paid --> Shipping : prepare_shipment
    Shipping --> Shipped : ship_order
    Shipped --> Delivered : delivery_confirmed
    Delivered --> [*]
    
    Paid --> Failed : order_failed
    Failed --> [*]
```

---

## Entity-Relationship Diagrams

### E-commerce Database

```mermaid
erDiagram
    CUSTOMER {
        uuid id PK
        string email UK
        string first_name
        string last_name
        timestamp created_at
    }
    
    PRODUCT {
        uuid id PK
        string name
        string description
        decimal price
        int stock_quantity
        timestamp created_at
    }
    
    ORDER {
        uuid id PK
        uuid customer_id FK
        decimal total_amount
        string status
        timestamp order_date
        timestamp shipped_at
    }
    
    ORDER_ITEM {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        decimal unit_price
    }
    
    ADDRESS {
        uuid id PK
        uuid customer_id FK
        string street
        string city
        string state
        string zip_code
        string country
        boolean is_default
    }
    
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER ||--o{ ADDRESS : has
    ORDER ||--o{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : included_in
```

---

## User Journey Diagrams

### Online Shopping Experience

```mermaid
journey
    title User Shopping Journey
    
    section Browse Products
      Search for items: 5: User
      Filter results: 4: User
      View product details: 5: User
      Compare products: 3: User
    
    section Add to Cart
      Select size/color: 4: User
      Add to cart: 5: User
      Review cart: 4: User
      Apply discount: 3: User
    
    section Checkout
      Enter shipping info: 4: User
      Enter payment: 3: User
      Review order: 5: User
      Place order: 5: User
    
    section Post-Purchase
      Receive confirmation: 5: User
      Track shipment: 4: User
      Receive product: 5: User
      Leave review: 4: User
```

---

## Git Graphs

### Feature Development Flow

```mermaid
gitgraph
    commit id: "main"
    branch feature/login
    checkout feature/login
    commit id: "Add login form"
    commit id: "Add authentication"
    commit id: "Add validation"
    
    checkout main
    merge feature/login
    commit id: "Release v1.0"
    
    branch feature/search
    checkout feature/search
    commit id: "Add search API"
    commit id: "Add search UI"
    
    checkout main
    merge feature/search
    commit id: "Release v1.1"
```

---

## Gantt Charts

### Project Timeline

```mermaid
gantt
    title Software Development Project
    dateFormat YYYY-MM-DD
    section Planning
    Requirements Gathering :done, req, 2024-01-01, 2024-01-07
    System Design :done, design, 2024-01-08, 2024-01-14
    
    section Development
    Frontend Development :active, frontend, 2024-01-15, 2024-02-15
    Backend Development :backend, 2024-01-15, 2024-02-10
    Database Setup :db, 2024-01-15, 2024-01-21
    
    section Testing
    Unit Testing :test1, 2024-02-16, 2024-02-23
    Integration Testing :test2, 2024-02-24, 2024-03-02
    
    section Deployment
    Staging Deployment :stage, 2024-03-03, 2024-03-05
    Production Deployment :prod, 2024-03-06, 2024-03-07
```

---

## Pie Charts

### Technology Stack Distribution

```mermaid
pie title Frontend Technologies
    "React" : 35
    "Vue.js" : 25
    "Angular" : 20
    "Svelte" : 10
    "Others" : 10
```

### Market Share Analysis

```mermaid
pie title Browser Usage 2024
    "Chrome" : 65.5
    "Safari" : 18.3
    "Firefox" : 3.1
    "Edge" : 5.2
    "Others" : 7.9
```

---

## Advanced Examples

### System Architecture with Styling

```mermaid
graph TD
    subgraph "Frontend Layer"
        UI[Web Application]
        Mobile[Mobile App]
    end
    
    subgraph "API Gateway"
        Gateway[API Gateway]
        LB[Load Balancer]
    end
    
    subgraph "Service Layer"
        Auth[Authentication Service]
        User[User Service]
        Order[Order Service]
        Payment[Payment Service]
    end
    
    subgraph "Data Layer"
        UserDB[(User Database)]
        OrderDB[(Order Database)]
        Cache[(Redis Cache)]
    end
    
    UI --> Gateway
    Mobile --> Gateway
    Gateway --> LB
    LB --> Auth
    LB --> User
    LB --> Order
    LB --> Payment
    
    Auth --> UserDB
    User --> UserDB
    User --> Cache
    Order --> OrderDB
    Order --> Cache
    
    classDef frontend fill:#e1f5fe
    classDef gateway fill:#f3e5f5
    classDef service fill:#e8f5e8
    classDef data fill:#fff3e0
    
    class UI,Mobile frontend
    class Gateway,LB gateway
    class Auth,User,Order,Payment service
    class UserDB,OrderDB,Cache data
```

### Complex Sequence with Notes

```mermaid
sequenceDiagram
    participant C as Customer
    participant W as Website
    participant P as Payment Gateway
    participant B as Bank
    participant E as Email Service
    
    Note over C,E: Online Purchase Process
    
    C->>W: Browse products
    W-->>C: Show product catalog
    C->>W: Add to cart
    C->>W: Proceed to checkout
    
    Note over C,W: Customer enters shipping and payment info
    
    C->>W: Submit order
    W->>P: Process payment
    P->>B: Verify card
    B-->>P: Authorization response
    P-->>W: Payment confirmation
    
    alt Payment Successful
        W->>E: Send confirmation email
        W->>C: Order confirmation
        W->>W: Update inventory
        W->>W: Generate shipping label
    else Payment Failed
        W->>C: Payment error message
    end
    
    Note over C,E: Order processing complete
```

---

## Customization and Styling

### Custom Theme Configuration

```typescript
// slidev.config.ts
import { defineConfig } from '@slidev/types'

export default defineConfig({
  mermaid: {
    theme: 'default',
    themeVariables: {
      primaryColor: '#3b82f6',
      primaryTextColor: '#1f2937',
      primaryBorderColor: '#2563eb',
      lineColor: '#6b7280',
      secondaryColor: '#f3f4f6',
      tertiaryColor: '#f9fafb',
      background: '#ffffff',
      mainBkg: '#f9fafb',
      secondBkg: '#f3f4f6',
      tertiaryBkg: '#e5e7eb'
    },
    flowchart: {
      curve: 'basis',
      padding: 20
    },
    sequence: {
      actorMargin: 50,
      width: 150,
      height: 65
    }
  }
})
```

### CSS Styling

```css
/* Custom Mermaid styles */
.mermaid {
  font-family: 'Inter', sans-serif;
}

.mermaid .node rect {
  fill: #3b82f6;
  stroke: #2563eb;
  stroke-width: 2px;
}

.mermaid .node.classBox rect {
  fill: #10b981;
  stroke: #059669;
}

.mermaid .edgePath path {
  stroke: #6b7280;
  stroke-width: 2px;
}
```

---

## Integration Tips

### With Other Modules

```mermaid
graph LR
    A[Code Block] --> B[Shiki Highlight]
    A --> C[Monaco Editor]
    B --> D[Syntax Coloring]
    C --> E[Interactive Editing]
    
    F[Math Expression] --> G[KaTeX Render]
    G --> H[Beautiful Math]
    
    I[Diagram Description] --> J[Mermaid Render]
    J --> K[Interactive Diagram]
    
    D --> L[Complete Slide]
    H --> L
    K --> L
```

### Performance Considerations

1. **Limit diagram complexity** - Complex diagrams can slow down rendering
2. **Use appropriate themes** - Dark themes work better for presentations
3. **Optimize for mobile** - Consider responsive design for diagrams
4. **Lazy loading** - Load diagrams only when needed

---

## Troubleshooting

### Common Issues

#### Diagrams Not Rendering
1. Check Mermaid is enabled in slidev.config.ts
2. Verify proper code block syntax: ` ```mermaid`
3. Ensure valid Mermaid syntax

#### Styling Issues
1. Check theme configuration in config file
2. Verify CSS class names are correct
3. Test with different themes

#### Performance Problems
1. Simplify complex diagrams
2. Use appropriate diagram types
3. Consider breaking large diagrams into smaller ones

### Browser Compatibility

- ✅ **Chrome** 80+
- ✅ **Firefox** 75+
- ✅ **Safari** 13+
- ✅ **Edge** 80+

---

*Mermaid brings professional diagram creation to your presentations with simple, readable syntax!*