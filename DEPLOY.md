# Deploying FinSightAI

Frontend on **Vercel**, backend + SQLite database on **Railway**.

## 1. Backend (Railway)

1. railway.app → New Project → Deploy from GitHub repo → `FinSightAI`.
2. Service **Settings → Root Directory**: `backend`. Start command is `npm start`.
3. **Volumes → Add volume**, mount path `/data` (keeps the database between deploys).
4. **Variables**:
   - `DB_FILE` = `/data/database.sqlite`
   - `GEMINI_API_KEY` = a free key from https://aistudio.google.com/apikey (powers the AI summaries and chat; optional `GEMINI_MODEL`, default `gemini-2.5-flash`)
   - `CLIENT_URL` = your Vercel URL (optional; only needed if the frontend calls the backend directly)
5. **Networking → Generate Domain**. Copy it, e.g. `https://finsightai-backend.up.railway.app`.
6. Demo data is seeded automatically on every start (`npm start` runs `all_in_one_seed.js` first), so clients and policies reset to the sample set after each deploy or restart. Login: `admin@example.com` / `adminpassword`.

## 2. Frontend (Vercel)

1. In `frontend/vercel.json`, the Railway domain is already set to `finsightai-production-33d3.up.railway.app` (change it there if the backend domain changes).
2. vercel.com → Add New Project → import `FinSightAI`.
3. **Root Directory**: `frontend`. Framework: Vite (auto-detected).
4. Leave `VITE_API_BASE_URL` **empty**. Vercel forwards every `/api/...` request to Railway, so no CORS setup is needed.
5. Deploy.

`vercel.json` also sends every page route back to `index.html`, so refreshing on any page works.
