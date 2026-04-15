# 🪄 Deathly Hallows Coding Challenge

A full-stack competitive coding platform for college-level programming competitions.

**Frontend**: React + Vite → Netlify  
**Backend**: Node.js + Express + child_process → Render  
**Database**: Supabase (PostgreSQL)  
**Code Execution**: Built-in (Python, C++, C, Java via child_process.exec)

---

## 📁 Project Structure

```
Coding_Round/
├── backend/           ← Node.js + Express API
│   ├── src/
│   │   ├── config/supabase.js
│   │   ├── middleware/ (auth.js, errorHandler.js)
│   │   ├── routes/ (auth, admin, questions, submissions, timer)
│   │   ├── services/codeRunner.js   ← Core code execution engine
│   │   └── server.js
│   ├── scripts/seedAdmin.js
│   └── package.json
├── frontend/          ← React + Vite
│   ├── src/
│   │   ├── components/ (CodeEditor, Timer, ProtectedRoute)
│   │   ├── context/ (AuthContext, SocketContext)
│   │   ├── pages/ (admin/* + participant/*)
│   │   ├── services/api.js
│   │   └── index.css
│   └── package.json
└── supabase_schema.sql
```

---

## 🚀 SETUP GUIDE (Step by Step)

### STEP 1 — Supabase Database

1. Go to https://supabase.com → **New Project** (free)
2. Copy your **Project URL** and **Service Role Key** from Settings → API
3. In the Supabase dashboard, go to **SQL Editor**
4. Paste the contents of `supabase_schema.sql` → Run it
5. Your tables are ready!

---

### STEP 2 — Backend Setup (Local)

```bash
cd backend
npm install

# Generate admin password hash
node scripts/seedAdmin.js
```

Copy the output. Create `backend/.env`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

JWT_SECRET=your_long_random_secret_key_here

ADMIN_EMAIL=admin@dh.com
ADMIN_PASSWORD_HASH=$2a$10$...paste_hash_from_seed_script...

FRONTEND_URL=http://localhost:5173
PORT=5000
NODE_ENV=development
```

Run backend:
```bash
npm run dev
```

---

### STEP 3 — Frontend Setup (Local)

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

```bash
cd frontend
npm install
npm run dev
```

Visit: http://localhost:5173

---

### STEP 4 — Local Language Requirements

For code execution to work, install:

| Language | Requirement |
|---|---|
| **Python** | Python 3.x — `python` command must work |
| **C++** | g++ (MinGW on Windows, gcc on Linux) |
| **C** | gcc |
| **Java** | JDK 11+ (javac + java commands) |

**Windows**: Install [MinGW-w64](https://winlibs.com/) for g++/gcc, [JDK](https://adoptium.net/) for Java.

---

## 🌍 DEPLOYMENT GUIDE

### Deploy Backend → Render

1. Push entire project to GitHub
2. Go to https://render.com → **New Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
5. Add **Environment Variables** (same as your `.env` but with `FRONTEND_URL=https://your-site.netlify.app`)
6. Deploy → copy the URL: `https://your-backend.onrender.com`

> ⚠️ **Important**: Render's free tier **does NOT** have Python/g++/Java pre-installed for code execution.
> For a competition, use **Render's paid tier** or a VPS (DigitalOcean $6/month) where you can install compilers.
> Alternatively, use Render's **Docker deploy** with a custom Dockerfile.

### Deploy Frontend → Netlify

1. Go to https://netlify.com → **Add New Site** → Import from GitHub
2. Settings:
   - **Base Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `frontend/dist`
3. Add **Environment Variables**:
   - `VITE_API_URL` = `https://your-backend.onrender.com`
   - `VITE_SOCKET_URL` = `https://your-backend.onrender.com`
4. Deploy!

---

## 🌐 DEPLOYMENT WITH CODE EXECUTION (Recommended VPS Option)

Since Render free tier lacks compilers, for a live competition use:

**DigitalOcean Droplet ($6/month):**
```bash
# Install required tools
sudo apt update
sudo apt install -y nodejs npm python3 g++ gcc default-jdk

# Clone repo, set up .env, run with PM2
npm install -g pm2
cd backend && npm install
pm2 start src/server.js --name dhcc-backend
pm2 save
```

Then point your `VITE_API_URL` to the droplet's IP.

---

## 🔐 Default Credentials

| Role | Email / PRN | Password |
|---|---|---|
| Admin | `admin@dh.com` | `Admin@123` |
| Participant | (any name + PRN) | None needed |

---

## 📡 API Routes

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/admin/login` | — | Admin JWT login |
| POST | `/api/auth/participant/login` | — | Participant PRN login |
| GET | `/api/questions/participant` | — | Questions for test |
| GET | `/api/questions` | Admin | All questions + test cases |
| POST | `/api/questions` | Admin | Create question |
| PUT | `/api/questions/:id` | Admin | Update question |
| DELETE | `/api/questions/:id` | Admin | Delete question |
| **POST** | **`/api/run-code`** | — | **Execute + score code** |
| POST | `/api/submissions/autosave` | — | Auto-save draft |
| PUT | `/api/submissions/start` | — | Start test |
| POST | `/api/submissions/final-submit` | — | Final submission |
| GET | `/api/admin/participants` | Admin | All participants |
| GET | `/api/admin/leaderboard` | Admin | Ranked leaderboard |
| GET | `/api/admin/submissions` | Admin | All submissions |
| GET | `/api/timer` | — | Timer state |
| POST | `/api/timer/set` | Admin | Set duration |
| POST | `/api/timer/start` | Admin | Start timer |
| POST | `/api/timer/stop` | Admin | Stop timer |

---

## 🧪 Code Execution Details

**Engine**: `child_process.exec` (Node.js built-in)

| Language | Compile | Execute | Timeout |
|---|---|---|---|
| Python | — | `python file.py` | 5s |
| C++ | `g++ file.cpp -o out` | `./out` | 5s (compile: 15s) |
| C | `gcc file.c -o out` | `./out` | 5s (compile: 15s) |
| Java | `javac Main.java` | `java Main` | 5s (compile: 15s) |

**Security filters** block: `import os`, `system()`, file operations, network calls, and shell injection patterns.

---

## ✨ Features

- 🔐 Admin JWT auth + participant PRN-based login
- 📝 Question CRUD with hidden test cases
- 💻 Monaco Editor (VS Code-like) with language switching
- ⏱️ Global timer with Socket.IO sync
- 🏆 Live leaderboard (auto-refreshes)
- 👁️ Real-time participant monitoring
- 🐛 Debug round (pre-filled buggy code)
- 🎯 Blind coding round
- 🛡️ Anti-cheat: no copy-paste, no right-click, tab switch detection
- 💾 Auto-save every 30 seconds
- 📊 Per-test-case scoring with partial marks
