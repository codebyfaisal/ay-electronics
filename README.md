# AY Electronics System

A comprehensive, offline-first full-stack application designed for managing an electronics retail business. This system handles inventory, sales (cash & installment), customer management, financial tracking, and automated backups, all wrapped in a robust local server environment.

## 🚀 Features

### Core Business Logic

- **POS & Sales Management**:
  - support for **Cash** and **Installment** sales.
  - Automatic calculation of discounts, remaining balances, and return amounts.
- **Installment Tracking**:
  - Track payments with statuses: `PENDING`, `PAID`, `LATE`, `UPCOMING`.
  - Automatic updates for overdue installments.
- **Inventory Management**:
  - Complete product catalog with categories and brands.
  - Stock transaction history (Purchases, Sales, Supplier Returns).
- **Customer Database**: Store customer details including CNIC, address, and purchase history.

### Financials

- **Dashboard**: Real-time overview of business health, daily sales, and stock value.
- **Transaction Manager**: Manual entry for Expenses, Cash, Bank, and Debt transactions.
- **Reporting**: Monthly summaries of profits, expenses, and net assets.
- **Investment Tracking**: Manage investor capital.

### System & Architecture

- **Offline-First**: Runs locally on the user's machine with a SQLite database.
- **Automated Backups**: configurable daily backups to a specified local drive.
- **Port Management**: Auto-detection of busy ports with fallback strategies and process killing capabilities.
- **Desktop Experience**: Auto-launches the browser on startup. Can be packaged as a standalone `.exe`.

## 🛠️ Tech Stack

### Backend

- **Runtime**: [Bun](https://bun.sh/) (preferred) & Node.js
- **Framework**: Express.js
- **Database**: SQLite
- **ORM**: Prisma w/ Zod validation
- **Build Tools**: esbuild, pkg (for executable generation)

### Frontend

- **Framework**: React (via Vite)
- **Styling**: Tailwind CSS v4
- **State & UI**: Context API, Lucide React (Icons), React Hot Toast
- **Data Fetching**: Axios

## 📂 Project Structure

```
ay-electronics/
├── backend/            # Express API & Server logic
│   ├── db/             # SQLite database file
│   ├── prisma/         # Database schema & migrations
│   ├── src/            # Controllers, Routes, Services
│   ├── ui/             # Static frontend files (for production serving)
│   └── index.js        # Entry point
├── frontend/           # React Application
│   ├── src/            # Components, Pages, Context
│   └── vite.config.js  # Vite configuration
└── online-demo/        # (Optional) Separated demo version (for online demo)
```

## ⚡ Getting Started

### Prerequisites

- **Bun**: Required for running the backend and executing build scripts.
- **Node.js**: Required for frontend dependencies.

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ay-electronics
   ```

2. **Setup Backend**

   ```bash
   cd backend
   bun install
   bun prisma generate
   bun prisma migrate dev  # Initialize the database
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

### 🏃‍♂️ Running the App

#### Development Mode

Run backend and frontend in separate terminals/tabs.

**Backend:**

```bash
cd backend
bun run dev
# Server starts at http://localhost:4000
```

**Frontend:**

```bash
cd frontend
npm run dev
# Client starts at http://localhost:5173
```

#### Production / Executable Build

To create a standalone executable that serves the frontend:

1. **Build the Frontend**

   ```bash
   cd frontend
   npm run build
   # Copy contents of dist/ to backend/ui/ (manual step if not automated)
   ```

2. **Build and Start Backend**

   ```bash
   cd ../backend
   bun run build:full    # Builds frontend and server bundle
   bun run start         # Starts server serving the UI
   ```

3. **Generate Executable (.exe)**
   ```bash
   cd backend
   bun run build:exe     # Creates AY_Electronics.exe in root
   ```

## 🔒 Configuration

- Create a `.env` file in the `backend` directory (see `.env.example` if available).
- **Default Database**: Uses `sqlite` located in `backend/db/`.
- **Port**: Defaults to `4000`. If busy, it tries 5000, 8000, etc.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**Built with ❤️ for AY Electronics**
