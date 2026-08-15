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

## Tender Publication & Bidding (Ahad_23201016)

Government publishes excavation tenders, registered excavation teams bid on them,
and the winning bid becomes a live excavation project. Every file touched by this
feature carries an `Ahad_23201016` comment.

### Workflow

1. **Public** submits a discovery report.
2. **Admin** assigns an archaeologist to verify it (Field Reports).
3. **Archaeologist** verifies the site, then fills in the field report and ticks
   *Request an Excavation Team*, and submits it.
4. **Admin** approves the field report, then clicks *Publish Excavation Tender*.
   Project details, map location, and budget are carried over from the report.
5. **Excavation Teams** browse open tenders and submit a bid (cost, timeline,
   proposal). Bids can be edited or withdrawn until the deadline, and each team
   tracks its own bid status: Pending / Accepted / Rejected / Withdrawn.
6. **Admin** reviews every bid side by side and assigns the winning team. The
   other bids are auto-rejected and an **active excavation project** is created.
7. The project appears under **Manage Projects** for the archaeologist and
   **My Projects** for the excavation team. Both can add artifacts — the
   discovery location is fixed to wherever the original report came from.
8. When the dig is finished the team (or the lead archaeologist) completes it,
   handing the artifacts to the Government.
9. **Admin** allocates each artifact to a **museum** or to **auction** under
   *Excavation Projects*. Allocation releases the artifact into Smart Artifact
   Search; anything sent to auction becomes a candidate in Manage Auctions.

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
