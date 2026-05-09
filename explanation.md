# Complete Codebase Explanation
### Every file. Every line. Every concept.

---

## THE BIG PICTURE FIRST

Before reading a single line of code, you need to understand what you actually built and why there are two completely separate programs running at the same time.

```
Your Computer
│
├── Node.js Process (server.js)         ← runs in Terminal 1
│     Listens on port 3000
│     Talks to tasks.db
│
└── Vite/React Process (npm run dev)    ← runs in Terminal 2
      Listens on port 5173
      Serves HTML + JavaScript to browser
```

When someone opens `http://localhost:5173` in a browser:
1. The browser downloads your React app (HTML + JS files)
2. React runs INSIDE the browser
3. When it needs data, React talks to Express at port 3000
4. Express talks to SQLite and sends data back
5. React updates what the user sees

They are two completely different programs, written in the same language (JavaScript), but running in completely different environments.

---

## WHAT IS NODE.JS vs WHAT IS REACT

This is the most important conceptual distinction in your whole stack.

### Node.js

Node.js is JavaScript running on your **server** (your computer, a cloud machine, anywhere that isn't the browser). It was created because JavaScript was browser-only for years — Node.js brought it to the server side.

What Node.js can do that browsers cannot:
- Read and write files on disk (`fs` module)
- Open network ports and listen for connections (`http`, `net` modules)
- Access the operating system (`os`, `process` modules)
- Run databases, spawn child processes, etc.

What Node.js cannot do that browsers can:
- Render HTML/CSS visually
- Access the DOM (there is no document, window, etc.)
- Run in a user's machine without them installing it

**Express** is a library that runs on top of Node.js. It makes it easier to define routes and handle HTTP requests. Without Express you'd still use Node's raw `http` module, but it's much more verbose.

**server.js is a Node.js program. It runs on the server. Users never see this code directly.**

---

### React

React is a JavaScript library that runs inside the **browser**. It was built by Facebook to make it easier to build complex user interfaces.

React's core idea: instead of manually manipulating HTML elements (`document.getElementById(...).innerHTML = ...`), you describe what the UI should look like based on data (state), and React figures out the minimal DOM changes needed.

What React can do:
- Render and update HTML in the browser
- Manage component state (local data that triggers re-renders)
- Respond to user events (clicks, typing, etc.)
- Make HTTP requests to your backend

What React cannot do:
- Access the filesystem
- Open ports
- Run without a browser (mostly — there's SSR but that's another topic)

**App.jsx is React code. It runs in the browser. The server never executes this.**

---

### Why Both?

Because they solve different problems.

| Thing | Where | Why |
|-------|-------|-----|
| Store data permanently | Server (SQLite) | Browser storage gets cleared; not shared between users |
| Validate input safely | Server (Express) | Client-side validation is bypassable |
| Render the UI | Browser (React) | Server doesn't have a screen |
| Handle user interaction | Browser (React) | Clicks/typing happen in the browser |

---

## WHAT IS VITE

Vite is a **build tool and dev server** for frontend code. It does two things:

1. **In development**: serves your `.jsx` files with hot module replacement (HMR) so the browser updates instantly when you save a file. This is the `npm run dev` process.

2. **In production**: bundles all your JS/CSS into optimized static files (`npm run build`) that can be served from any web server.

Vite also transpiles JSX (the HTML-looking syntax in React files) into regular JavaScript, because browsers don't understand JSX natively.

---

## FILE-BY-FILE BREAKDOWN

---

## 1. `server/server.js`

This is your backend. A Node.js + Express HTTP server that stores and retrieves tasks.

```js
const express = require("express");
const cors    = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path    = require("path");
```

`require()` is Node.js's way of importing modules. This is CommonJS syntax (the old Node.js module system). In the browser / React you use `import` instead (ES Modules). Both do the same thing — load external code — but they're different syntaxes. Node.js supports both; older Node projects tend to use `require`.

- `express` — the web framework
- `cors` — middleware that adds HTTP headers allowing cross-origin requests
- `sqlite3` — the database driver. `.verbose()` enables more detailed error messages
- `path` — built into Node.js. Handles file paths across operating systems (Windows uses `\`, Linux/Mac use `/`, `path.join` abstracts this)

```js
const app  = express();
const PORT = 3000;
```

`express()` creates the application object. All routes and middleware attach to `app`. `PORT` is just a constant — you could change it to anything not in use.

```js
app.use(cors());
app.use(express.json());
```

`app.use()` registers **middleware**. Middleware is a function that runs on every incoming request before it reaches your route handlers. Think of it as a conveyor belt — every request passes through all middleware in order.

`cors()` — without this, browsers block requests from `localhost:5173` to `localhost:3000`. This is the **Same-Origin Policy** — a browser security rule that prevents JavaScript on one domain from fetching data from a different domain/port. The `cors` middleware adds `Access-Control-Allow-Origin` headers that tell the browser "this is allowed". If you forget this line, you'll see a CORS error in the browser console even though the server is running fine.

`express.json()` — HTTP requests carry data as raw text strings. When your React app sends `{ "title": "Buy milk" }` in a POST request body, it arrives as a raw string. `express.json()` parses that string into a real JavaScript object and puts it on `req.body`. Without this, `req.body` is `undefined` and you can't read the incoming data.

```js
const db = new sqlite3.Database(
  path.join(__dirname, "tasks.db"),
  (err) => {
    if (err) console.error("DB connection error:", err.message);
    else     console.log("Connected to SQLite");
  }
);
```

`__dirname` is a special Node.js variable that holds the **absolute path of the folder containing the current file**. So if `server.js` is at `/home/user/app/server/server.js`, then `__dirname` is `/home/user/app/server`.

`path.join(__dirname, "tasks.db")` creates `/home/user/app/server/tasks.db`. This is important: if you run `node server.js` from the wrong directory, the database file would be created in the wrong place. Using `__dirname` prevents this.

`new sqlite3.Database(path, callback)` — opens the database file. If the file doesn't exist, SQLite creates it automatically. The callback runs after the connection attempt — we just log success or failure.

```js
db.run(`
  CREATE TABLE IF NOT EXISTS tasks (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT    NOT NULL,
    done  INTEGER NOT NULL DEFAULT 0
  )
`);
```

`db.run()` executes SQL that doesn't return rows (CREATE, INSERT, UPDATE, DELETE). `db.all()` returns multiple rows. `db.get()` returns one row.

`CREATE TABLE IF NOT EXISTS` — the `IF NOT EXISTS` is critical. Without it, running the server a second time would crash with "table already exists". With it, this line is safe to run every time the server starts.

Column breakdown:
- `id INTEGER PRIMARY KEY AUTOINCREMENT` — SQLite automatically assigns an incrementing number. You never set this manually.
- `title TEXT NOT NULL` — a string that can't be null. If you try to insert a row without a title, SQLite rejects it.
- `done INTEGER NOT NULL DEFAULT 0` — SQLite has no boolean type. We use 0 for false and 1 for true. `DEFAULT 0` means new tasks start as not-done automatically.

```js
app.get("/", (req, res) => {
  res.json({ message: "server running", status: "db up" });
});
```

`app.get(path, handler)` registers a route. When a GET request arrives at `/`, the handler function runs.

`req` (request) — the incoming HTTP request. Contains headers, body, URL params, query string, etc.
`res` (response) — the outgoing HTTP response. You call methods on this to send a response.

`res.json(object)` — converts the object to a JSON string and sends it. Also automatically sets the `Content-Type: application/json` header so the client knows what it received.

Every route handler **must** send a response (`res.json`, `res.send`, `res.status(...).json(...)`, etc.). If you don't, the request hangs forever until it times out.

```js
app.get("/tasks", (req, res) => {
  db.all("SELECT * FROM tasks ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
```

`db.all(sql, params, callback)` — runs a SELECT and gives you all matching rows as an array. The `[]` is the params array — used for parameterized queries (see POST route for why this matters).

`ORDER BY id DESC` — newest tasks first (highest id = most recently inserted).

The `return` in `if (err) return res.status(500).json(...)` is important. Without `return`, the function continues executing after sending the error response and tries to call `res.json(rows)` — but you can't send two responses to one request. The `return` exits the callback immediately after sending the error.

`res.status(500)` — sets the HTTP status code. 500 means "Internal Server Error". `.json()` then sends the body. You can chain these.

```js
app.get("/tasks/:id", (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM tasks WHERE id = ?", [id], (err, row) => {
    if (err)  return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Task not found" });
    res.json(row);
  });
});
```

`:id` in the path is a **URL parameter**. Express captures whatever is in that position and puts it in `req.params`. So `GET /tasks/42` gives you `req.params.id === "42"` (always a string).

`const { id } = req.params` is destructuring — shorthand for `const id = req.params.id`.

`db.get()` returns one row or `undefined` if nothing matches. We check `if (!row)` and return 404 ("Not Found").

The `?` in the SQL is a **parameterized query** placeholder. The `[id]` array provides the values. SQLite substitutes them safely. This prevents **SQL injection** — if a user sends `id = "1; DROP TABLE tasks"`, a raw string concatenation would execute that SQL. With `?`, SQLite treats the entire value as a literal string, not SQL code.

```js
app.post("/tasks", (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "title is required" });
  }
  db.run(
    "INSERT INTO tasks (title) VALUES (?)",
    [title.trim()],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, title: title.trim(), done: 0 });
    }
  );
});
```

`req.body` contains the parsed JSON body (only works because of `app.use(express.json())`).

`!title.trim()` — `.trim()` removes leading/trailing whitespace. This catches inputs like `"   "` (just spaces) which aren't valid titles.

`res.status(400)` — 400 means "Bad Request" (client sent invalid data). Different from 500 which means the server itself broke.

The callback uses `function(err)` not `(err) =>`. This is intentional. Arrow functions don't have their own `this`. SQLite's `db.run` callback sets `this.lastID` to the auto-incremented ID of the inserted row. If you use an arrow function, `this` refers to the outer scope and `this.lastID` is undefined.

`title.trim()` is called again when building the response to match what was actually stored.

`res.status(201)` — 201 means "Created". Semantically more correct than 200 for a successful POST that created a resource.

```js
app.put("/tasks/:id", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM tasks WHERE id = ?", [id], (err, row) => {
    if (err)  return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Task not found" });

    const title = req.body.title !== undefined ? req.body.title.trim() : row.title;
    const done  = req.body.done  !== undefined ? req.body.done          : row.done;

    db.run(
      "UPDATE tasks SET title = ?, done = ? WHERE id = ?",
      [title, done, id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: Number(id), title, done });
      }
    );
  });
});
```

This is a **partial update** pattern. We first fetch the existing row, then merge the incoming fields with the existing values. This means you can send just `{ "done": 1 }` without needing to re-send the title.

`req.body.title !== undefined` — we check `!== undefined` specifically, not just `!req.body.title`, because an empty string `""` is falsy but it's a valid (if weird) value someone might want to set.

`Number(id)` — `req.params.id` is always a string. We convert it back to a number for the response so the client gets consistent types.

```js
app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM tasks WHERE id = ?", [id], function (err) {
    if (err)                return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Task not found" });
    res.json({ deleted: true, id: Number(id) });
  });
});
```

`this.changes` — another SQLite callback property (like `this.lastID`). It tells you how many rows were affected by the query. If `changes === 0`, the WHERE clause matched nothing — the ID doesn't exist — so we return 404.

```js
app.delete("/tasks/done/all", (req, res) => {
  db.run("DELETE FROM tasks WHERE done = 1", [], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});
```

Deletes all completed tasks. Returns how many were deleted.

Important: Express matches routes **in the order they are defined**. This route `/tasks/done/all` must be defined BEFORE `/tasks/:id`, otherwise Express would interpret "done" as the `:id` parameter and try to delete a task with id "done".

```js
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

This is what actually starts the server. Before this line, all you've done is define routes. `listen()` opens the port and starts accepting connections. The callback runs once the port is open.

---

## 2. `client/src/main.jsx`

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

This is the **entry point** of the React application. Vite loads this file first when the browser requests the app.

`import` is ES Module syntax — the browser-native (and modern Node.js) way to load modules. Unlike `require()`, imports are static and hoisted.

`import './index.css'` — Vite processes CSS imports. It bundles the CSS and injects it into the page. Browsers don't normally handle CSS imports in JS files — Vite does this transformation.

`document.getElementById('root')` — accesses the browser DOM. `document` is a global object browsers provide. It represents the HTML page. This finds the `<div id="root"></div>` that's in `index.html`. This is the **mount point** — the single HTML element React will take over.

`createRoot()` — creates a React root (React 18+ API). This is what connects React to the real DOM.

`.render(<StrictMode><App /></StrictMode>)` — tells React what to render inside the root element. `<App />` is JSX — it looks like HTML but it's actually a JavaScript function call. Vite transforms it to `React.createElement(App, null)`.

`StrictMode` — a React tool for development. It intentionally renders components twice and fires effects twice to help catch bugs. It has no visual effect and doesn't run in production.

After this file runs, React has full control of `<div id="root">`. Everything you see on screen is generated by React from this point on.

---

## 3. `client/src/index.css`

```css
:root {
  --text: #6b6375;
  --text-h: #08060d;
  ...
}
```

This is the **global CSS** file — styles that apply to the whole app. It's imported in `main.jsx` before `App.jsx`.

`:root` is a CSS pseudo-class that matches the `<html>` element. Defining CSS custom properties (variables) here makes them available everywhere in the document. `var(--text)` can be used in any CSS file to reference these values.

The Vite default `index.css` had styles for `#root` (the mount div) that set `width: 1126px`, `border-inline`, etc. — leftover from the Vite template. These fought against the todo app's layout. If you didn't modify this file, you need to either delete those `#root` styles or override them in `App.css`.

The `@media (prefers-color-scheme: dark)` block redefines the CSS variables when the user's system is in dark mode. Since components reference variables (`var(--bg)`, `var(--text)`), they automatically adapt without any JavaScript.

---

## 4. `client/src/App.jsx`

This is your entire frontend application. React applications are built from **components** — JavaScript functions that return JSX (which describes what to render).

```jsx
import { useState, useEffect } from 'react'
import './App.css'

const API = 'http://localhost:3000'
```

`useState` and `useEffect` are **React Hooks** — functions that let you use React features inside function components.

`API` is a constant so you only have to change the URL in one place if your backend moves.

```jsx
export default function App() {
  const [tasks,   setTasks]   = useState([])
  const [input,   setInput]   = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')
```

`function App()` is a React **component** — just a function that returns JSX. The name must start with a capital letter so React can distinguish it from HTML elements.

`export default` makes this the main export of the file. `main.jsx` imports it as `import App from './App.jsx'`.

`useState(initialValue)` is a Hook that creates a piece of **state** — data that, when changed, causes React to re-render the component with the new data.

It returns an array of exactly two things:
1. The current value
2. A setter function that updates the value AND triggers a re-render

`const [tasks, setTasks] = useState([])` is array destructuring — shorthand for:
```js
const result = useState([])
const tasks    = result[0]  // current value: empty array
const setTasks = result[1]  // setter function
```

State values:
- `tasks` — array of task objects from the database
- `input` — what's typed in the text box (controlled input)
- `error` — error message string, or empty string if none
- `loading` — whether we're waiting for the initial data fetch
- `filter` — which tab is active: 'all', 'active', or 'done'

**Why state?** Every time you call a setter (`setTasks(newValue)`), React re-runs the component function from the top, recalculates the JSX, and updates only the parts of the DOM that changed. This is React's core mechanism.

```jsx
useEffect(() => {
  fetch(`${API}/tasks`)
    .then(r => r.json())
    .then(data => {
      setTasks(data)
      setLoading(false)
    })
    .catch(err => {
      setError('Could not reach server. Is it running?')
      setLoading(false)
    })
}, [])
```

`useEffect(callback, dependencies)` runs **after** the component renders. The second argument `[]` (empty array) means "run this only once, after the first render". This is how you do things like fetch initial data.

Without the `[]`, the effect would run after every render — causing an infinite loop (fetch → setTasks → re-render → fetch → ...).

`fetch()` is a browser API (not Node.js — you're in the browser now). It makes HTTP requests and returns a **Promise** — an object representing a future value.

`.then(r => r.json())` — the first `.then` receives the Response object. `.json()` reads the body and parses it. It also returns a Promise.

`.then(data => { setTasks(data) ... })` — the second `.then` receives the parsed JavaScript array of tasks.

`.catch(err => ...)` — runs if anything in the chain fails (network error, server down, etc.).

```jsx
function addTask() {
  const title = input.trim()
  if (!title) return
```

`input.trim()` — strips whitespace. If the result is empty, we return early and do nothing. This is client-side validation — it prevents unnecessary requests to the server.

```jsx
  fetch(`${API}/tasks`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ title }),
  })
    .then(r => r.json())
    .then(task => {
      if (task.error) return setError(task.error)
      setTasks(prev => [task, ...prev])
      setInput('')
      setError('')
    })
    .catch(() => setError('Failed to add task'))
}
```

`method: 'POST'` — specifies the HTTP method. Default is GET.

`headers: { 'Content-Type': 'application/json' }` — tells the server what format the body is in. Without this, `express.json()` won't parse the body.

`body: JSON.stringify({ title })` — converts the JS object to a JSON string. `{ title }` is shorthand for `{ title: title }` (ES6 property shorthand).

`setTasks(prev => [task, ...prev])` — the functional form of setState. When new state depends on old state, always use the function form. `prev` is the current tasks array. `[task, ...prev]` creates a new array with the new task at the front (spread operator).

**Why not push?** React state must be treated as **immutable** — never modify the existing array directly (`tasks.push(task)` won't trigger a re-render). Always create a new array.

```jsx
function toggleTask(task) {
  fetch(`${API}/tasks/${task.id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ done: task.done ? 0 : 1 }),
  })
    .then(r => r.json())
    .then(updated => {
      if (updated.error) return setError(updated.error)
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
    })
```

`task.done ? 0 : 1` — ternary operator. If `done` is truthy (1), send 0. If falsy (0), send 1. Toggles the value.

`prev.map(t => t.id === updated.id ? updated : t)` — creates a new array where the matching task is replaced with the updated one, and everything else stays the same. `.map()` always returns a new array — immutability preserved.

```jsx
function deleteTask(id) {
  fetch(`${API}/tasks/${id}`, { method: 'DELETE' })
    .then(r => r.json())
    .then(res => {
      if (res.error) return setError(res.error)
      setTasks(prev => prev.filter(t => t.id !== id))
    })
```

`prev.filter(t => t.id !== id)` — creates a new array with every task EXCEPT the deleted one. `.filter()` returns a new array — immutability preserved.

```jsx
function clearDone() {
  fetch(`${API}/tasks/done/all`, { method: 'DELETE' })
    .then(r => r.json())
    .then(() => setTasks(prev => prev.filter(t => !t.done)))
```

After the server deletes completed tasks, we update local state to match: filter out all done tasks from the array.

```jsx
  const visible = tasks.filter(t => {
    if (filter === 'active') return !t.done
    if (filter === 'done')   return  t.done
    return true
  })

  const doneCount   = tasks.filter(t =>  t.done).length
  const activeCount = tasks.filter(t => !t.done).length
```

These are **derived values** — computed from state, not stored in state. They're recalculated on every render. This is correct — don't store derived data in state (it creates synchronization bugs).

`visible` is the filtered list to display. `doneCount` and `activeCount` are just counts for the UI.

```jsx
  return (
    <div className="app">
```

The `return` of a React component is **JSX**. JSX looks like HTML but is actually JavaScript. Rules that differ from HTML:
- `class` → `className` (because `class` is a reserved word in JS)
- `for` → `htmlFor`
- All tags must be closed (`<input />` not `<input>`)
- JavaScript expressions go inside `{}`
- Event handlers are camelCase (`onClick`, `onChange`, `onKeyDown`)

```jsx
      <input
        className="task-input"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && addTask()}
        placeholder="What needs to be done?"
        autoFocus
      />
```

`value={input}` — this makes it a **controlled input**. The input's value is always exactly what `input` state says. Without this, the input manages its own value (uncontrolled).

`onChange={e => setInput(e.target.value)}` — every keystroke fires onChange. `e` is the event object. `e.target` is the input element. `e.target.value` is the current text. We update state, which triggers re-render, which sets `value={input}` to the new text. The DOM and React state are always in sync.

`onKeyDown={e => e.key === 'Enter' && addTask()}` — `&&` short-circuit: if `e.key === 'Enter'` is false, `addTask()` never runs. If true, it does.

`autoFocus` — a boolean prop. JSX boolean props: just writing `autoFocus` is equivalent to `autoFocus={true}`.

```jsx
      {['all', 'active', 'done'].map(f => (
        <button
          key={f}
          className={`btn btn-filter ${filter === f ? 'active' : ''}`}
          onClick={() => setFilter(f)}
        >
```

`.map()` on an array inside JSX renders one element per item. This is how React renders lists.

`key={f}` — React requires a unique `key` prop on list items. React uses keys to identify which items changed, were added, or removed when re-rendering lists. Without keys, React re-renders everything in the list on every change (slow and can cause bugs with forms).

Template literal: `` `btn btn-filter ${filter === f ? 'active' : ''}` `` — adds the `active` class only for the currently selected filter.

```jsx
      {loading ? (
        <p className="status">Loading...</p>
      ) : visible.length === 0 ? (
        <p className="status">...</p>
      ) : (
        <ul className="task-list">
          {visible.map(task => (
```

Nested ternaries for conditional rendering. React renders `null` for nothing, a component for something. The pattern `condition ? <A /> : <B />` is the standard way.

```jsx
            <li key={task.id} className={`task-item ${task.done ? 'done' : ''}`}>
              <input
                type="checkbox"
                className="task-check"
                checked={!!task.done}
                onChange={() => toggleTask(task)}
              />
```

`!!task.done` — double negation converts any value to a strict boolean. `task.done` is 0 or 1 (integers from SQLite). React's `checked` prop expects a boolean, not 0/1. `!!0` is `false`, `!!1` is `true`.

`onChange={() => toggleTask(task)}` — passes the whole task object so `toggleTask` knows both the id and current done state.

---

## 5. `client/src/App.css`

This styles only the todo app components. It's imported inside `App.jsx`, so Vite scopes it to this component's bundle (though with plain CSS, styles are still global — CSS Modules would scope them, but that's not used here).

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
```

The **CSS reset**. By default, browsers add their own margins, padding, and sizing to elements. This removes all of it for a consistent baseline.

`box-sizing: border-box` — changes how widths are calculated. By default (`content-box`), `width: 200px` means the content is 200px, then padding and border are added ON TOP. With `border-box`, `width: 200px` means the total including padding and border is 200px — much more intuitive.

```css
body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #f0f0f0;
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 48px 16px;
}
```

`system-ui` — uses the OS's default UI font. Looks native on every platform.

`100vh` — 100% of the viewport height. Ensures the background covers the full screen even on short pages.

`display: flex` on body + `justify-content: center` centers the `#root` div horizontally.

`align-items: flex-start` — without this, flexbox would stretch the child to full height, or center it vertically. `flex-start` keeps the app card at the top.

```css
.task-item:hover .btn-delete {
  opacity: 1;
}
```

A **descendant selector with pseudo-class**. When you hover `.task-item`, the `.btn-delete` inside it becomes visible. The delete button starts with `opacity: 0` (invisible) and transitions to `opacity: 1` (visible) on hover. This is a common UX pattern — don't clutter the UI with delete buttons until the user shows intent.

```css
.btn-delete {
  ...
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
}
```

`transition` — animates CSS property changes. `0.15s` is 150 milliseconds. Smooth, not jarring.

```css
.task-item.done .task-title {
  text-decoration: line-through;
  color: #9ca3af;
}
```

When a `task-item` element also has the `done` class (both on the same element), its child `.task-title` gets struck through. This happens because we set `className={`task-item ${task.done ? 'done' : ''}`}` in JSX.

---

## HOW THEY ALL CONNECT — REQUEST FLOW

Here's what happens when a user types "Buy milk" and presses Enter:

```
1. User presses Enter
   └── onKeyDown fires in App.jsx
       └── addTask() is called

2. addTask() calls fetch('http://localhost:3000/tasks', { method: 'POST', ... })
   └── Browser sends HTTP request:
       POST /tasks HTTP/1.1
       Host: localhost:3000
       Content-Type: application/json

       {"title":"Buy milk"}

3. Express receives the request on port 3000
   └── cors() middleware runs → adds CORS headers
   └── express.json() middleware runs → parses body → req.body = { title: "Buy milk" }
   └── app.post("/tasks") handler runs
       └── validates title
       └── db.run("INSERT INTO tasks...") runs
           └── SQLite writes to tasks.db
           └── callback fires with this.lastID = 42
       └── res.status(201).json({ id: 42, title: "Buy milk", done: 0 })

4. Response travels back to browser
   └── fetch .then(r => r.json()) parses the response
   └── .then(task => setTasks(prev => [task, ...prev]))
       └── React state updates
       └── Component re-renders
       └── New <li> appears in the list

Total time: ~5-20ms
```

---

## KEY CONCEPTS SUMMARY

| Concept | Where | What |
|---------|-------|------|
| `require()` | Node.js | Import modules (CommonJS) |
| `import` | Browser/React | Import modules (ES Modules) |
| Middleware | Express | Functions that run on every request |
| `req.body` | Express | Parsed request body (needs `express.json()`) |
| `req.params` | Express | URL parameters (`:id`) |
| State | React | Data that triggers re-renders when changed |
| `useState` | React | Creates a state variable |
| `useEffect` | React | Runs code after render (side effects) |
| JSX | React | JS syntax that looks like HTML |
| Props | React | Data passed into components |
| Controlled input | React | Input whose value is managed by state |
| `fetch()` | Browser | Makes HTTP requests (returns Promise) |
| Promise `.then()` | JS | Handles async results |
| Parameterized query | SQLite | `?` placeholders prevent SQL injection |
| `this.lastID` | sqlite3 | Auto-increment ID after INSERT |
| `this.changes` | sqlite3 | Rows affected after UPDATE/DELETE |
| CORS | HTTP | Browser policy; requires server to allow cross-origin |
| Port | Network | Virtual channel; 3000 = backend, 5173 = frontend |

---

*You now understand every line of your full stack application.*