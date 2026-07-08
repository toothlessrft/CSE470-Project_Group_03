

## Project structure

```
mern-heritage/
├── backend/            Express + MongoDB API
│   ├── models/          Mongoose schemas
│   ├── routes/          auth.js, archaeologist.js, admin.js, museumManager.js, siteCaretaker.js
│   ├── middleware/       auth.js (JWT + role guard)
│   ├── scripts/seed.js   loads the same sample data the SQL dump had
│   └── server.js
├── frontend/            React (Vite) app
│   └── src/
│       ├── pages/arc, mm, sc, admin   one folder per role
│       ├── context/AuthContext.jsx    current user + login/logout
│       ├── components/                Navbar, ProtectedRoute
│       └── api.js                     fetch wrapper
└── docs/                 the original schema PDF + SQL dump, for reference
```

## Running it locally

You'll need Node.js and a MongoDB instance (local `mongod`, or a free
MongoDB Atlas cluster — either works, just change `MONGO_URI`).

```bash
# 1. Backend
cd backend
cp .env.example .env       # edit MONGO_URI / JWT_SECRET if needed
npm install
npm run seed               # loads the sample data (same as the SQL dump)
npm run dev                # starts on http://localhost:5555

# 2. Frontend (in a second terminal)
cd frontend
npm install
npm install leaflet
npm run dev                # starts on http://localhost:5173
```

Open http://localhost:5173. The dev server proxies `/api/*` to the backend
(see `vite.config.js`), and login uses an httpOnly cookie, so no extra config
is needed.

### Test logins (after `npm run seed`)

Every seeded user's password is `password123`. Log in with either the email
or the `nid`:

| Role | nid | 
|---|---|
| Archaeologist | `A001`, `A002`, `A003` |
| Admin | `AD001` |
| Museum manager | `MM001`, `MM002`, `MM003` |
| Site caretaker | `SC001`, `SC002`, `SC003` |

## What's implemented

Every route from the original `app.py` has an equivalent here:

- **Auth** — login (email or nid), logout, session check
- **Archaeologist** — dashboard, request excavation (existing or new site),
  manage projects (ongoing/past, end project), manage team (create/disband,
  auto-promotes/creates the manager user), edit site, add item (with the
  4 specialization types), request a tool
- **Museum manager** — dashboard, browse sites → items → request an item loan
- **Site caretaker** — dashboard, request maintenance
- **Admin** — dashboard, approve/deny item requests, maintenance requests,
  and tool requests; view all approved requests; review & approve/deny
  excavation requests (approving auto-creates the `ExcavationProject`, same
  as the original)

