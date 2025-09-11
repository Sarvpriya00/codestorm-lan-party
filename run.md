# How to Run the Codestorm LAN Party Application

This document outlines the steps to set up and run the Codestorm LAN Party application, which consists of a React frontend and a Node.js/Express backend with Prisma.

## Prerequisites

*   Node.js (LTS version recommended)
*   npm (Node Package Manager) or Bun

## Setup Steps

### 1. Install Dependencies

Navigate to both the root directory (for the frontend) and the `backend` directory, and install the dependencies.

```bash
# In the root directory (frontend)
npm install
# or if you prefer bun
# bun install

# Navigate to the backend directory
cd backend

# In the backend directory
npm install
# or if you prefer bun
# bun install
```

## 2. Running the Application

You can use the provided shell scripts to easily start both the backend and frontend servers.

### Option 1: Development Environment (`start-dev.sh`)

This script is ideal for local development. It installs dependencies (if needed), generates the Prisma client, creates test users, and starts both servers.

```bash
# In the root directory
./start-dev.sh
```

*   **Backend:** Runs on `http://localhost:3000`
*   **Frontend:** Runs on `http://localhost:5173` (or as indicated by Vite)
*   **Test Credentials:**
    *   Username: `test_user`, Password: `test123`
    *   Username: `admin`, Password: `admin123`

### Option 2: Servers with Specific Configuration (`start-servers.sh`)

This script is useful for a more controlled environment, explicitly setting the backend port and API base URL for the frontend. It also includes a health check for the backend.

```bash
# In the root directory
./start-servers.sh
```

*   **Backend:** Runs on `http://localhost:3001`
*   **Frontend:** Connects to backend at `http://localhost:3001/api`. The frontend's port will be indicated in the terminal output.
*   **Test Credentials:**
    *   Username: `admin`, Password: `admin123`
    *   Username: `test_user`, Password: `test123`

**Note:** After running either script, you can stop all servers by pressing `Ctrl+C` in the terminal where the script is running.

## Running Tests

### Frontend Tests

```bash
# In the root directory
npm test
# or bun test
```

### Backend Tests

```bash
# In the backend directory
cd backend
npm test
# or bun test
```