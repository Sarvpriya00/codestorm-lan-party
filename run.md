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

### 2. Backend Setup and Start

The backend requires a database. This project uses Prisma, and you'll need to generate the Prisma client, run migrations, and optionally seed the database.

```bash
# Ensure you are in the 'backend' directory
cd backend

# Generate Prisma client (this is usually done automatically on npm install via postinstall script)
npm run postinstall
# or bun run postinstall

# Run database migrations
npm run migrate
# or bun run migrate

# Optionally, seed the database with initial data
npm run seed
# or bun run seed

# Build the backend TypeScript code
npm run build
# or bun run build

# Start the backend server
npm run start
# or bun run start
```

The backend server should now be running, typically on `http://localhost:3000` (or as configured in its environment variables).

### 3. Frontend Setup and Start

Once the backend is running, you can start the frontend development server.

```bash
# Navigate back to the root directory
cd ..

# Start the frontend development server
npm run dev
# or bun run dev
```

The frontend application should now be accessible in your web browser, typically at `http://localhost:5173` (or as indicated by Vite in your terminal).

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
