# ArchiveEarth

A web application for managing archaeological excavation projects, artifact loans, research reports, and field teams.

## Project Overview

ArchiveEarth centralizes archaeological workflows for archaeologists, excavation teams, museum managers, and administrators. It provides role-based access control, artifact and inventory management, team coordination, and reporting across the full lifecycle of a discovery — from field report to museum exhibition.

## Architecture

This project follows an **MVC (Model-View-Controller)** architecture.

### Backend Structure
- **Models** (`backend/models/`) — Database schemas and data entities
- **Routes** (`backend/routes/`) — Controllers handling API endpoints and business logic
- **Middleware** (`backend/middleware/`) — Authentication and request processing
- **Config** (`backend/config/`) — Database and environment configuration
- **Scripts** (`backend/scripts/`) — Seed data and utilities
- **Services** (`backend/services/`) — Shared business logic and integrations

### Frontend Structure
- **Pages** (`frontend/src/pages/`) — Page-level components organized by user role
- **Components** (`frontend/src/components/`) — Reusable UI components
- **Context** (`frontend/src/context/`) — Global state management (Auth)
- **API** (`frontend/src/api.js`) — Centralized API communication layer

## Tech Stack

- **Backend**: Node.js, Express
- **Frontend**: React, Vite
- **Database**: MongoDB
- **Authentication**: JWT (middleware-based)

## Folder Structure

```
├── backend/
│   ├── config/           # Database configuration
│   ├── middleware/       # Auth and request processing
│   ├── models/           # Data models and schemas
│   ├── routes/           # API endpoints (Controllers)
│   ├── scripts/          # Seed data and utilities
│   ├── services/         # Shared business logic
│   └── server.js         # Express server entry point
├── frontend/
│   ├── src/
│   │   ├── pages/        # Page components by role
│   │   ├── components/   # Shared UI components
│   │   ├── context/      # Global state (Auth)
│   │   ├── api.js        # API communication
│   │   └── main.jsx      # React entry point
│   └── index.html        # HTML template
```

## User Roles

- **Admin** — System management, request approvals, user verification
- **Archaeologist** — Excavation projects, team management, artifact documentation
- **Excavation Team** — Field assignments, tool requests, project reporting
- **Museum Manager** — Artifact loans, exhibitions, inventory management
- **General Public** — Discovery reporting, knowledge hub access, Q&A

## Key Features

- Role-based access control (RBAC) across all user types
- Excavation project and field team management
- Artifact loan and museum inventory management
- Research and discovery report generation
- AI-assisted artifact identification and search
- Knowledge resource hub with advanced search

## Setup & Installation

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Configure .env with database credentials
   npm start
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Running it (with seed data)

```bash
cd backend  && npm install && npm run seed && npm run dev
cd frontend && npm install && npm run dev
```

`backend/.env` is included in this archive. The seed script **clears the database** before repopulating it.

## Login Credentials

Every seeded account uses the password `password123`.

| Role | NID |
|---|---|
| Government / Admin | `AD001`, `AD002` |
| Archaeologist | `A001`, `A002`, `A003` |
| Excavation Team | `E001`, `E002`, `E003` |
| Museum Manager | `MM001`, `MM002`, `MM003` |
| General Public | `PUB001`, `PUB002` |
