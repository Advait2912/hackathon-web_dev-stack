# Full Stack Developer Field Manual
### React + Vite + Express + SQLite — Every Step, Every Error, Every Command

---

## TABLE OF CONTENTS

1. [Architecture Overview](#architecture)
2. [Project Structure](#structure)
3. [Ubuntu System Setup](#ubuntu-setup)
4. [Node.js Installation](#nodejs)
5. [Frontend Setup (React + Vite)](#frontend)
6. [Backend Setup (Express)](#backend)
7. [SQLite Database](#sqlite)
8. [Connecting Frontend to Backend](#connecting)
9. [Full Server Template](#server-template)
10. [Full Client Template](#client-template)
11. [Common Errors & Fixes](#errors)
12. [Networking / DNS Errors](#networking)
13. [Useful Commands Quick Reference](#commands)
14. [Hackathon Strategy](#strategy)

---

## 1. ARCHITECTURE OVERVIEW <a name="architecture"></a>

```
Browser (User)
     ↓  HTTP requests (fetch/axios)
React Frontend  → runs on http://localhost:5173
     ↓  fetch("http://localhost:3000/...")
Express Backend → runs on http://localhost:3000
     ↓  SQL queries
SQLite Database → tasks.db (file on disk)
```

### Rules
- Frontend NEVER talks to the database directly
- Backend handles ALL database operations
- Frontend only talks to backend via HTTP
- Backend sends JSON responses back

---

## 2. PROJECT STRUCTURE <a name="structure"></a>

```
app/
├── client/                  ← React + Vite frontend
│   ├── src/
│   │   ├── App.jsx          ← Main component
│   │   └── main.jsx         ← Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                  ← Express backend
│   ├── server.js            ← Main server file
│   ├── tasks.db             ← SQLite database (auto-created)
│   └── package.json
│
└── README.md / guide.md     ← You are here
```

---

## 3. UBUNTU SYSTEM SETUP <a name="ubuntu-setup"></a>

### Step 1 — Update package list

```bash
sudo apt update
```

> This refreshes the list of available packages. Always do this first.

### Step 2 — Upgrade existing packages (optional but recommended)

```bash
sudo apt upgrade -y
```

> `-y` auto-answers yes to prompts.

### Step 3 — Install core dependencies

```bash
sudo apt install -y git curl sqlite3 build-essential
```

What each package does:
- `git` — version control
- `curl` — download files, test APIs
- `sqlite3` — SQLite CLI tool
- `build-essential` — compilers needed by some npm packages

### Step 4 — Verify installs

```bash
git --version
curl --version
sqlite3 --version
```

---

## 4. NODE.JS INSTALLATION <a name="nodejs"></a>

### Step 1 — Add NodeSource repository

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
```

> This adds the official Node.js package source. Do NOT skip this — Ubuntu's default apt repos have old Node versions.

### Step 2 — Install Node.js

```bash
sudo apt install -y nodejs
```

### Step 3 — Verify

```bash
node -v
npm -v
```

Expected output:
```
v22.x.x
10.x.x
```

### ERROR: node: command not found

```bash
# Try using nvm instead
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
node -v
```

### ERROR: Permission denied during npm install -g

```bash
# Option 1: Use sudo
sudo npm install -g <package>

# Option 2: Fix npm prefix
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

---

## 5. FRONTEND SETUP (React + Vite) <a name="frontend"></a>

### Step 1 — Navigate to project root

```bash
cd ~/app
```

### Step 2 — Create React app with Vite

```bash
npm create vite@latest client
```

When prompted:
```
✔ Select a framework: › React
✔ Select a variant:   › JavaScript
```

### Step 3 — Enter the client directory

```bash
cd client
```

### Step 4 — Install dependencies

```bash
npm install
```

### Step 5 — Install additional packages (optional but useful)

```bash
npm install axios          # for HTTP requests (easier than fetch)
```

### Step 6 — Start the dev server

```bash
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://xxx.xxx.xxx.xxx:5173/
```

Open in browser: `http://localhost:5173`

---

### Frontend Error Reference

#### ERROR: Cannot find module 'vite'

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

#### ERROR: Port 5173 is already in use

```bash
# Find what's using the port
lsof -i :5173

# Kill it (replace PID with actual number from above)
kill -9 PID

# Or run on different port
npm run dev -- --port 5174
```

#### ERROR: ENOENT: no such file or directory

```bash
# You're in the wrong folder. Make sure you're inside /client
pwd
ls
# Should see: src/ index.html package.json vite.config.js
```

#### ERROR: SyntaxError in JSX

```
SyntaxError: Unexpected token '<'
```

Make sure the file is `.jsx` not `.js`, and that vite.config.js has React plugin:

```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()]
})
```

If plugin missing:
```bash
npm install @vitejs/plugin-react
```

---

## 6. BACKEND SETUP (Express) <a name="backend"></a>

### Step 1 — Create server folder

```bash
mkdir ~/app/server
cd ~/app/server
```

### Step 2 — Initialize npm

```bash
npm init -y
```

This creates `package.json`. The `-y` skips all prompts.

### Step 3 — Install dependencies

```bash
npm install express cors sqlite3
```

What each package does:
- `express` — web framework, handles routes
- `cors` — allows frontend (different port) to call backend
- `sqlite3` — SQLite database driver

### Step 4 — Create server.js

```bash
nano server.js
```

(See full template in Section 9)

### Step 5 — Run the server

```bash
node server.js
```

Expected output:
```
Server running on http://localhost:3000
```

### Step 6 — Test the server is running

Open new terminal tab and run:

```bash
curl http://localhost:3000
```

Expected:
```json
{"message":"server running"}
```

---

### Backend Error Reference

#### ERROR: Cannot find module 'express'

```bash
npm install express cors sqlite3
```

If still failing:
```bash
rm -rf node_modules package-lock.json
npm install
```

#### ERROR: Port 3000 already in use

```
Error: listen EADDRINUSE: address already in use :::3000
```

```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 PID

# OR change the port in server.js
const PORT = 3001;
```

#### ERROR: req.body is undefined

You're missing this middleware in server.js:

```js
app.use(express.json());
```

Add it BEFORE your routes.

#### ERROR: Cannot read properties of undefined (reading 'title')

Same issue — `req.body` is undefined because `express.json()` middleware is missing.

#### ERROR: ReferenceError: db is not defined

You forgot to create the database connection at the top of server.js:

```js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('tasks.db');
```

#### ERROR: UnhandledPromiseRejectionWarning

Wrap async code in try/catch or use `.catch()`:

```js
app.get('/tasks', (req, res) => {
  db.all('SELECT * FROM tasks', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});
```

---

## 7. SQLITE DATABASE <a name="sqlite"></a>

### Creating / Opening a Database

```js
// In server.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('tasks.db');
```

> If `tasks.db` doesn't exist, SQLite creates it automatically.

### Creating a Table

```js
db.run(`
  CREATE TABLE IF NOT EXISTS tasks (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done  INTEGER DEFAULT 0
  )
`);
```

> `IF NOT EXISTS` prevents crashing if table already exists. ALWAYS include this.

### SQLite CLI Commands

```bash
# Open database
sqlite3 tasks.db

# Show all tables
.tables

# Show table structure
.schema tasks

# See all rows
SELECT * FROM tasks;

# See specific columns
SELECT id, title FROM tasks;

# Delete all rows (keep table)
DELETE FROM tasks;

# Drop table completely
DROP TABLE tasks;

# Exit
.quit
```

### SQLite in Node.js — All Operations

```js
// SELECT all
db.all('SELECT * FROM tasks', [], (err, rows) => {
  if (err) throw err;
  console.log(rows);
});

// SELECT one
db.get('SELECT * FROM tasks WHERE id = ?', [1], (err, row) => {
  if (err) throw err;
  console.log(row);
});

// INSERT
db.run('INSERT INTO tasks (title) VALUES (?)', ['Buy milk'], function(err) {
  if (err) throw err;
  console.log('Inserted ID:', this.lastID);
});

// UPDATE
db.run('UPDATE tasks SET done = 1 WHERE id = ?', [1], (err) => {
  if (err) throw err;
  console.log('Updated');
});

// DELETE
db.run('DELETE FROM tasks WHERE id = ?', [1], (err) => {
  if (err) throw err;
  console.log('Deleted');
});
```

### SQLite Error Reference

#### ERROR: SQLITE_ERROR: no such table: tasks

Your `CREATE TABLE` didn't run, or the DB file is somewhere else.

```bash
# Check if db file exists
ls -la *.db

# Check from which directory you're running server.js
# tasks.db is created in the CURRENT WORKING DIRECTORY when node runs
```

Fix: always use an absolute path or run from the server folder:

```js
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'tasks.db'));
```

#### ERROR: SQLITE_CONSTRAINT: NOT NULL constraint failed

You're inserting a row without a required field.

```js
// Wrong — title is required but not provided
db.run('INSERT INTO tasks (done) VALUES (?)', [0]);

// Correct
db.run('INSERT INTO tasks (title, done) VALUES (?, ?)', ['My task', 0]);
```

#### ERROR: SQLITE_ERROR: table tasks already exists

```js
// Use IF NOT EXISTS — always
db.run('CREATE TABLE IF NOT EXISTS tasks (...)');
```

---

## 8. CONNECTING FRONTEND TO BACKEND <a name="connecting"></a>

### The CORS Problem

When React (port 5173) calls Express (port 3000), the browser blocks it unless the backend explicitly allows it. This is called CORS.

**Backend fix — add before all routes:**

```js
const cors = require('cors');
app.use(cors());
```

**If still blocked, be specific:**

```js
app.use(cors({
  origin: 'http://localhost:5173'
}));
```

### Making a GET Request from React

```jsx
import { useState, useEffect } from 'react';

function App() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/tasks')
      .then(res => res.json())
      .then(data => setTasks(data))
      .catch(err => console.error('Fetch error:', err));
  }, []);

  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  );
}
```

### Making a POST Request from React

```jsx
function addTask(title) {
  fetch('http://localhost:3000/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title })
  })
    .then(res => res.json())
    .then(data => console.log('Created:', data))
    .catch(err => console.error(err));
}
```

### Making a DELETE Request from React

```jsx
function deleteTask(id) {
  fetch(`http://localhost:3000/tasks/${id}`, {
    method: 'DELETE'
  })
    .then(res => res.json())
    .then(() => setTasks(prev => prev.filter(t => t.id !== id)));
}
```

### Frontend Error Reference

#### ERROR: Failed to fetch

```
TypeError: Failed to fetch
```

Causes:
1. Backend is not running → start `node server.js`
2. Wrong URL → check port number matches backend
3. CORS missing on backend → add `app.use(cors())`

#### ERROR: NetworkError when attempting to fetch resource

Same as above — backend is down or URL is wrong.

#### ERROR: 404 Not Found

The route doesn't exist on the backend. Check:
- Exact URL path spelling
- HTTP method (GET vs POST)
- Backend is actually running

#### ERROR: 500 Internal Server Error

Backend crashed on that request. Check:
- Terminal running `node server.js` for the actual error
- Missing error handling in the route
- SQLite query failed

---

## 9. FULL SERVER TEMPLATE <a name="server-template"></a>

```js
// server/server.js

const express = require('express');
const cors    = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path    = require('path');

const app  = express();
const PORT = 3000;

// ─── Middleware ───────────────────────────────────────────
app.use(cors());            // Allow cross-origin requests
app.use(express.json());    // Parse JSON request bodies

// ─── Database Setup ───────────────────────────────────────
const db = new sqlite3.Database(path.join(__dirname, 'tasks.db'), (err) => {
  if (err) {
    console.error('Could not connect to database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS tasks (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT    NOT NULL,
    done  INTEGER DEFAULT 0
  )
`);

// ─── Routes ───────────────────────────────────────────────

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'server running' });
});

// GET all tasks
app.get('/tasks', (req, res) => {
  db.all('SELECT * FROM tasks', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET single task
app.get('/tasks/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Task not found' });
    res.json(row);
  });
});

// POST create task
app.post('/tasks', (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  db.run('INSERT INTO tasks (title) VALUES (?)', [title], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, title, done: 0 });
  });
});

// PUT update task
app.put('/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, done } = req.body;

  db.run(
    'UPDATE tasks SET title = ?, done = ? WHERE id = ?',
    [title, done, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Task not found' });
      res.json({ id, title, done });
    }
  );
});

// DELETE task
app.delete('/tasks/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ deleted: true, id });
  });
});

// ─── Start Server ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

---

## 10. FULL CLIENT TEMPLATE <a name="client-template"></a>

```jsx
// client/src/App.jsx

import { useState, useEffect } from 'react';

const API = 'http://localhost:3000';

function App() {
  const [tasks,    setTasks]    = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [error,    setError]    = useState('');

  // Load tasks on mount
  useEffect(() => {
    fetchTasks();
  }, []);

  function fetchTasks() {
    fetch(`${API}/tasks`)
      .then(res => res.json())
      .then(data => setTasks(data))
      .catch(err => setError('Could not load tasks: ' + err.message));
  }

  function addTask() {
    if (!newTitle.trim()) return;

    fetch(`${API}/tasks`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title: newTitle })
    })
      .then(res => res.json())
      .then(task => {
        setTasks(prev => [...prev, task]);
        setNewTitle('');
      })
      .catch(err => setError('Could not add task: ' + err.message));
  }

  function deleteTask(id) {
    fetch(`${API}/tasks/${id}`, { method: 'DELETE' })
      .then(() => setTasks(prev => prev.filter(t => t.id !== id)))
      .catch(err => setError('Could not delete: ' + err.message));
  }

  function toggleTask(task) {
    fetch(`${API}/tasks/${task.id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title: task.title, done: task.done ? 0 : 1 })
    })
      .then(res => res.json())
      .then(updated => {
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      })
      .catch(err => setError('Could not update: ' + err.message));
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Task Manager</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div>
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          placeholder="New task..."
        />
        <button onClick={addTask}>Add</button>
      </div>

      <ul>
        {tasks.map(task => (
          <li key={task.id} style={{ margin: '0.5rem 0' }}>
            <input
              type="checkbox"
              checked={!!task.done}
              onChange={() => toggleTask(task)}
            />
            <span style={{ textDecoration: task.done ? 'line-through' : 'none', marginLeft: '0.5rem' }}>
              {task.title}
            </span>
            <button onClick={() => deleteTask(task.id)} style={{ marginLeft: '1rem' }}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
```

---

## 11. COMMON ERRORS & FIXES <a name="errors"></a>

### npm / Node Errors

| Error | Fix |
|-------|-----|
| `Cannot find module 'X'` | `npm install X` |
| `npm ERR! code ENOENT` | You're in the wrong folder — check `pwd` |
| `npm ERR! code EACCES` | Permission issue — use `sudo npm install` |
| `npm WARN deprecated` | Non-fatal warning — ignore it |
| `npm ERR! peer dep missing` | `npm install --legacy-peer-deps` |

### Process / Port Errors

```bash
# Find what's using any port
lsof -i :3000
lsof -i :5173

# Kill by PID
kill -9 PID

# Kill all node processes (nuclear option)
pkill -f node
```

### CORS Errors (in browser console)

```
Access to fetch at 'http://localhost:3000' from origin 'http://localhost:5173'
has been blocked by CORS policy
```

Fix in server.js:
```js
const cors = require('cors');
app.use(cors());  // ← must be BEFORE routes
```

### JSON Parse Errors

```
SyntaxError: Unexpected token < in JSON at position 0
```

Backend returned HTML (error page) instead of JSON.
Check:
- The route exists
- Server is running
- No crash on the backend side

### React Errors

#### Hooks error
```
Invalid hook call.
```
You called a hook inside a condition or loop. Hooks go at the TOP of the component function, always.

#### Key warning
```
Warning: Each child in a list should have a unique "key" prop.
```
```jsx
// Fix: add key to list items
{tasks.map(task => (
  <li key={task.id}>{task.title}</li>
))}
```

#### State not updating immediately
`setState` is async. If you need the new value right away:
```js
setTasks(prev => [...prev, newTask]);  // use functional update
```

---

## 12. NETWORKING / DNS ERRORS <a name="networking"></a>

### curl: (6) Could not resolve host

This means DNS is broken — not curl, not the URL.

### Diagnose Step by Step

```bash
# Step 1 — does internet exist at all?
ping 8.8.8.8

# If this works → internet exists, DNS is broken
# If this fails → VM has no internet at all
```

```bash
# Step 2 — is DNS broken specifically?
ping google.com

# If 8.8.8.8 works but this fails → DNS is the problem
```

### Fix DNS

```bash
sudo nano /etc/resolv.conf
```

Add these lines:
```
nameserver 8.8.8.8
nameserver 1.1.1.1
```

Save: `CTRL+O` → `ENTER` → `CTRL+X`

Then test:
```bash
ping google.com
curl https://google.com
```

### Fix VMware Network Adapter

1. Shut down the VM
2. Go to: VM Settings → Network Adapter
3. Select: **NAT**
4. Check both: "Connected" and "Connect at power on"
5. Start VM again

Then restart networking inside Ubuntu:
```bash
sudo systemctl restart NetworkManager
```

### Fix: No internet inside VM

```bash
# Check your network interfaces
ip addr show

# Restart networking service
sudo systemctl restart NetworkManager

# Check if DHCP assigned an IP
ip route
```

### apt: Failed to fetch (behind proxy or no DNS)

```bash
# Check if apt can reach anything
sudo apt update

# If DNS broken, add Google DNS first
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
sudo apt update
```

---

## 13. USEFUL COMMANDS QUICK REFERENCE <a name="commands"></a>

### Navigation

```bash
pwd                        # print current directory
ls                         # list files
ls -la                     # list with hidden files + permissions
cd folder                  # enter folder
cd ..                      # go up one level
cd ~                       # go to home directory
mkdir folder               # create folder
touch file.js              # create empty file
```

### File Editing

```bash
nano file.js               # open file in nano editor
cat file.js                # print file contents
```

Nano controls:
- `CTRL+O` → save
- `ENTER` → confirm filename
- `CTRL+X` → exit

### Process Management

```bash
CTRL+C                     # stop current running process
CTRL+Z                     # suspend process (use carefully)

lsof -i :3000              # who is using port 3000?
kill -9 PID                # force-kill process by PID
pkill -f node              # kill all node processes
pkill -f vite              # kill all vite processes
```

### npm

```bash
npm install                # install all packages from package.json
npm install express        # install specific package
npm install -g nodemon     # install globally
npm run dev                # run dev script from package.json
npm init -y                # create package.json with defaults
rm -rf node_modules        # delete installed packages
rm package-lock.json       # delete lock file
```

### SQLite3 CLI

```bash
sqlite3 tasks.db           # open/create database

# Inside SQLite CLI:
.tables                    # list tables
.schema tablename          # show table structure
SELECT * FROM tasks;       # show all rows
DELETE FROM tasks;         # delete all rows
DROP TABLE tasks;          # delete table entirely
.quit                      # exit
```

### Testing API Endpoints

```bash
# GET
curl http://localhost:3000/tasks

# POST with JSON body
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy milk"}'

# DELETE
curl -X DELETE http://localhost:3000/tasks/1

# PUT
curl -X PUT http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy oat milk","done":0}'
```

### Git

```bash
git init                   # initialize repo
git add .                  # stage all files
git commit -m "message"    # commit
git status                 # see what's changed
git log                    # see commit history
```

---

## 14. HACKATHON STRATEGY <a name="strategy"></a>

### Before You Write Code

1. Read the **full problem statement** at least twice
2. Identify the **must-have features** (what you need to pass)
3. Identify **nice-to-have features** (what impresses judges)
4. Estimate time — be conservative

### Build Order

```
1. Create folder structure
2. Setup backend first (Express + SQLite)
3. Test backend with curl
4. Create frontend skeleton
5. Connect frontend to backend (one endpoint at a time)
6. Test each feature before moving to next
7. Polish UI last (not first)
8. Prepare your explanation
```

### Minimal Viable Stack

```
Frontend : React + Vite
Backend  : Express.js
Database : SQLite
```

Reasons:
- No Docker needed
- No external database needed
- No environment variables needed
- SQLite file = zero setup
- Works fully offline once installed

### If Something Is Broken

```
1. Read the actual error message
2. Check which layer is failing: Frontend? Backend? Database? Network?
3. Isolate: test backend with curl before involving frontend
4. Check the most common culprits:
   - Missing middleware (express.json, cors)
   - Wrong port number
   - Node not running
   - node_modules missing
5. Google the exact error message
6. If nothing works: simplify, not complicate
```

### What Judges Actually Want

> A fully working simple app is infinitely better than:
> - An ambitious app that crashes
> - A complex app with broken features
> - An over-engineered app with nothing working

**Optimize for:**
- Does it run?
- Does the core feature work?
- Can you explain what you built?
- Can you explain what you'd add next?

---

## APPENDIX: HTTP Status Codes

| Code | Meaning | When to use |
|------|---------|-------------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST (new resource) |
| 400 | Bad Request | Missing/invalid input from client |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Your code crashed |

---

## APPENDIX: Express Route Pattern Reference

```js
app.get   ('/path',      handler);  // Read
app.post  ('/path',      handler);  // Create
app.put   ('/path/:id',  handler);  // Update (full replace)
app.patch ('/path/:id',  handler);  // Update (partial)
app.delete('/path/:id',  handler);  // Delete

// Handler signature always:
(req, res) => {
  // req.body    → POST/PUT body (JSON)
  // req.params  → URL params (/tasks/:id → req.params.id)
  // req.query   → Query string (/tasks?done=1 → req.query.done)
  res.json({ ... });
  res.status(400).json({ error: '...' });
}
```

---

*Built for constrained environments, pressure situations, and human memory under caffeine packet entropy.*