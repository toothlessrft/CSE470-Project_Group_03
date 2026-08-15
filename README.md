# ArchiveEarth

A comprehensive web application for managing archaeological excavation projects, artifact loans, research reports, and field teams.

## Project Overview

This system supports multiple user roles (Admin, Archaeologist, Museum Manager, Excavation Team) with role-based access control, artifact management, team coordination, and reporting capabilities.

## Architecture

This project follows **MVC (Model-View-Controller) architecture**:

### Backend Structure
- **Models** (`backend/models/`) - Database schemas and data entities
- **Routes** (`backend/routes/`) - Controllers handling API endpoints and business logic
- **Middleware** (`backend/middleware/`) - Authentication and request processing
- **Config** (`backend/config/`) - Database and environment configuration

### Frontend Structure
- **Pages** (`frontend/src/pages/`) - Page-level components organized by user role
- **Components** (`frontend/src/components/`) - Reusable UI components
- **Context** (`frontend/src/context/`) - Global state management (Auth)
- **API** (`frontend/src/api.js`) - Centralized API communication layer

## Tech Stack

- **Backend**: Node.js, Express
- **Frontend**: React, Vite
- **Database**: MongoDB (based on model structure)
- **Authentication**: JWT (middleware-based)

## Folder Structure

```
├── backend/
│   ├── models/          # Data models and schemas
│   ├── routes/          # API endpoints (Controllers)
│   ├── middleware/      # Auth and request processing
│   ├── config/          # Database configuration
│   ├── scripts/         # Seed data and utilities
│   └── server.js        # Express server entry point
├── frontend/
│   ├── src/
│   │   ├── pages/       # Page components by role
│   │   ├── components/  # Shared UI components
│   │   ├── context/     # Global state (Auth)
│   │   ├── api.js       # API communication
│   │   └── main.jsx     # React entry point
│   └── index.html       # HTML template
```

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

## User Roles

- **Admin** - System management, request approvals, user verification
- **Archaeologist** - Excavation projects, team management, artifact documentation
- **Museum Manager** - Artifact loans, inventory management
- **Site Caretaker** - Maintenance requests, site operations

## Features

- Role-based access control (RBAC)
- Excavation project management
- Artifact loan system
- Research report generation
- Team assignment and coordination
- Maintenance request tracking
- Knowledge resource hub
- Advanced search capabilities



---


### Login credentials

Every seeded account uses the password `password123`.

| Role | NID |
|---|---|
| Government / Admin | `AD001`, `AD002` |
| Archaeologist | `A001`, `A002`, `A003` |
| **Excavation Team** | **`E001`**, `E002`, `E003` |
| Museum Manager | `MM001`, `MM002`, `MM003` |
| General Public | `PUB001`, `PUB002` |

Excavation team accounts are companies; the account holder is the company
representative.

| NID | Company | Representative |
|---|---|---|
| `E001` | Bengal Excavation Works Ltd. | Rahim Khan |
| `E002` | Heritage Digs & Conservation | Sultana Ahmed |
| `E003` | Padma Groundworks | Jamal Uddin |

### Running it

```bash
cd backend  && npm install && npm run seed && npm run dev
cd frontend && npm install && npm run dev
```

`backend/.env` is included in this archive. The seed script **clears the database**
before repopulating it.

### Seeded demo data

- An **open tender** (Mahasthangarh) with **three competing bids** — log in as
  `AD001` to evaluate and award it, or as `E001`/`E002`/`E003` to edit or
  withdraw a bid.
- An **active project** awarded to `E001` with two unallocated artifacts — visible
  to `A002` under Manage Projects and to `E001` under My Projects.
- A **completed project** from `E002` with three artifacts **awaiting allocation** —
  allocate them under Admin → Excavation Projects.
- A **cancelled tender**, and an **approved field report with no tender yet**, which
  shows up in the admin's Create Tender source list.
