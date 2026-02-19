# Haven AI - Elite Real Estate Concierge

Haven AI is a next-generation real estate platform that leverages artificial intelligence to provide personalized property discovery and concierge services.

## Architecture

The project is built with a modern, modular architecture:

### Backend (Python/Flask)
- **Modular Routes**: Authentication, Property Management, and Chat are separated into clean blueprints.
- **LLM Integration**: Powered by LangChain and Google Gemini for intelligent conversation and property search.
- **Robustness**: Custom handlers for currency parsing (e.g., "2cr", "50L") and secure JWT management.
- **Automatic Listings**: Expressions of selling intent are automatically converted into public property listings.

### Frontend (Next.js/React)
- **Component-Based**: UI is decomposed into reusable components (`Navbar`, `Hero`, `ChatInterface`, `Footer`).
- **Clean Logic**: Business logic is decoupled from UI using custom hooks (`useChat`).
- **Premium Design**: Modern aesthetic using Tailwind CSS and Framer Motion for smooth animations.

## Getting Started

### Prerequisites
- Python 3.x
- Node.js & npm
- MongoDB URI
- Google Gemini API Key

### Installation

1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python run_prod.py
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Folder Structure

```text
haven_ai/
├── backend/
│   ├── models/       # Data models and DB logic
│   ├── routes/       # API endpoints
│   ├── services/     # Core logic (LLM, DB, Email)
│   ├── utils/        # Middlewares and helpers
│   └── run_prod.py   # Entry point
└── frontend/
    ├── src/
    │   ├── app/      # Next.js pages
    │   ├── components/ # Modular UI components
    │   ├── hooks/    # Custom logic hooks
    │   └── types/    # Shared TypeScript interfaces
    └── tailwind.config.ts
```

## License
© 2026 Haven AI Intelligence. All Rights Reserved.
