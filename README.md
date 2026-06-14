# Prism Chat

A real-time full-stack chat application built with React, Express, MongoDB, Socket.IO, and Firebase.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, Radix UI, Socket.IO Client |
| Backend | Node.js, Express 5, Socket.IO, Mongoose |
| Database | MongoDB Atlas |
| Auth | Firebase Authentication + JWT |
| Storage | Cloudinary |
| Email | Nodemailer |
| AI | Groq API |

## Project Structure

```
prism-chat/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── app.js
│   └── index.js
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── hooks/
    │   ├── services/
    │   └── utils/
    └── index.html
```

## Local Setup

### Prerequisites

- Node.js ≥ 18
- MongoDB Atlas cluster
- Firebase project with Authentication enabled
- Cloudinary account
- Gmail account with App Password
- Groq API key

### 1. Clone

```bash
git clone https://github.com/<your-username>/prism-chat.git
cd prism-chat
```

### 2. Configure environment variables

```bash
cd backend
cp .env.example .env

cd ../frontend
cp .env.example .env
```

Fill in all values in both `.env` files.

### 3. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4. Run

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

Backend runs on `http://localhost:5000`, frontend on `http://localhost:5173`.

## Deployment

### Backend → Render

1. Push to GitHub.
2. Create a new **Web Service** on [Render](https://render.com), connect the repo, and set the root directory to `backend`.
3. Render will detect `render.yaml` automatically.
4. Add all env vars from `backend/.env.example` in the Render dashboard. For `FIREBASE_SERVICE_ACCOUNT_JSON`, paste the entire JSON content of your Firebase service account key as a single line.

### Frontend → Vercel

1. Create a new project on [Vercel](https://vercel.com), connect the repo, and set the root directory to `frontend`.
2. Add all env vars from `frontend/.env.example` in the Vercel dashboard.
3. Set `VITE_API_URL` to your Render backend URL (e.g. `https://prism-chat-backend.onrender.com`).
4. Set `FRONTEND_URL` in Render to your Vercel deployment URL (e.g. `https://prism-chat.vercel.app`).

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/*` | Register / Login / Verify |
| GET/PUT | `/api/users/*` | User profile |
| GET/POST | `/api/messages/*` | Send & fetch messages |
| POST | `/api/upload` | Upload files to Cloudinary |
| GET/POST | `/api/groups/*` | Group management |

## License

MIT
