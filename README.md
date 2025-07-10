### FinSightAI

FinSightAI is a smart portfolio and policy management platform tailored for financial and insurance advisors. It combines CRUD operations with powerful **Generative AI** enhancements to help users manage client policies, detect issues, summarize portfolios, and ensure data quality efficiently.

---

###  Features

### Policy & Coverage Management
- Add, view, edit, and delete policies
- Auto-generate `client_id`, validate fields, and calculate policy status
- Intelligent dropdowns for product type and fund type

### GenAI Enhancements
- Detect multiple expiring policies
- Identify coverage overlaps or redundancies
- Flag missing/invalid data (e.g. invalid NRIC, missing contact info)
- Auto-generate notes per row and summary insights across clients
- "Ask Anything" feature to query your dataset in natural language

### Excel Import System
- Drag and drop Excel files to preview cleaned data
- AI fills in missing info and flags issues
- Inline and modal-based row editing
- Smart validation and enrichment before import

---

## Tech Stack

| Layer         | Technology                        |
|---------------|-----------------------------------|
| Frontend      | React.js, MUI, Axios              |
| Backend       | Node.js, Express.js               |
| Database      | MongoDB + Mongoose                |
| AI Integration| OpenAI API                        |
| File Upload   | Multer                            |

---

## 📂 Folder Structure
FinSightAI/
│
├── backend/                          # Node.js + Express.js backend
│   ├── controllers/                 # Route handler logic (e.g., create/update policies)
│   ├── models/                      # MongoDB schemas/models (Client, Policy)
│   ├── routes/                      # API route definitions
│   ├── services/                    # AI services (e.g., OpenAI summarizer, validations)
│   ├── uploads/                     # Excel or document file uploads
│   ├── utils/                       # Utility functions
│   ├── openaiClient.js              # OpenAI API configuration and client
│   ├── server.js                    # Backend entry point
│   ├── seed_clients.js              # Seed data for clients
│   ├── seed_policies.js             # Seed data for policies
│   └── .env                         # Environment variables
│
├── frontend/                         # React.js frontend
│   ├── public/                      # Static files
│   │   ├── favicon.ico              # Browser tab icon
│   │   ├── index.html               # Main HTML entry point
│   │   ├── logo192.png, logo512.png# App logos
│   │   ├── manifest.json, robots.txt
│   │
│   ├── src/                         # Source code (React)
│   │   ├── Dashboard/              # Dashboard views/components (client & policy overview)
│   │   ├── Import/                 # Excel import and preview features
│   │   ├── Layout/                 # Navbar, sidebar, and layout wrappers
│   │   ├── PolicyPage/            # Policy CRUD interfaces and AI-enhanced pages
│   │   ├── utils/                  # Shared frontend utility functions
│   │   ├── App.js, App.css         # Main application component and styles
│   │   ├── index.js, index.css     # App bootstrapping and global styles
│   │   ├── logo.svg                # App logo (React default)
│   │   ├── reportWebVitals.js      # Optional performance analytics
│   │   └── setupTests.js           # Test configuration for React Testing Library
│   │
│   ├── package.json                # Frontend dependencies and scripts
│   └── README.md                   # Frontend documentation
│
├── .gitignore                       # Git ignored files
├── package-lock.json                # Auto-generated dependency tree lock
└── README.md                        # Main project documentation

### Status

- MVP completed
- GenAI integrations working
- Future: Role-based access, analytics dashboard