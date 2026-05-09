import { useState, useEffect } from 'react'
import './App.css'

const API = 'http://localhost:3000'

export default function App() {
  const [tasks,    setTasks]    = useState([])
  const [input,    setInput]    = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all') // 'all' | 'active' | 'done'

  // ── Load tasks on mount ──────────────────────────────────
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

  // ── Add task ─────────────────────────────────────────────
  function addTask() {
    const title = input.trim()
    if (!title) return

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

  // ── Toggle done ──────────────────────────────────────────
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
      .catch(() => setError('Failed to update task'))
  }

  // ── Delete one task ──────────────────────────────────────
  function deleteTask(id) {
    fetch(`${API}/tasks/${id}`, { method: 'DELETE' })
      .then(r => r.json())
      .then(res => {
        if (res.error) return setError(res.error)
        setTasks(prev => prev.filter(t => t.id !== id))
      })
      .catch(() => setError('Failed to delete task'))
  }

  // ── Clear all completed ───────────────────────────────────
  function clearDone() {
    fetch(`${API}/tasks/done/all`, { method: 'DELETE' })
      .then(r => r.json())
      .then(() => setTasks(prev => prev.filter(t => !t.done)))
      .catch(() => setError('Failed to clear completed tasks'))
  }

  // ── Filtered view ─────────────────────────────────────────
  const visible = tasks.filter(t => {
    if (filter === 'active') return !t.done
    if (filter === 'done')   return  t.done
    return true
  })

  const doneCount   = tasks.filter(t =>  t.done).length
  const activeCount = tasks.filter(t => !t.done).length

  return (
    <div className="app">
      <h1>Todo</h1>

      {/* ── Input ── */}
      <div className="input-row">
        <input
          className="task-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          placeholder="What needs to be done?"
          autoFocus
        />
        <button className="btn btn-add" onClick={addTask}>Add</button>
      </div>

      {error && (
        <p className="error" onClick={() => setError('')}>{error} <span>(click to dismiss)</span></p>
      )}

      {/* ── Filter tabs ── */}
      <div className="filters">
        {['all', 'active', 'done'].map(f => (
          <button
            key={f}
            className={`btn btn-filter ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        {doneCount > 0 && (
          <button className="btn btn-clear" onClick={clearDone}>
            Clear done ({doneCount})
          </button>
        )}
      </div>

      {/* ── Task list ── */}
      {loading ? (
        <p className="status">Loading...</p>
      ) : visible.length === 0 ? (
        <p className="status">
          {filter === 'done' ? 'Nothing completed yet.' :
           filter === 'active' ? 'All done! 🎉' : 'No tasks yet. Add one above.'}
        </p>
      ) : (
        <ul className="task-list">
          {visible.map(task => (
            <li key={task.id} className={`task-item ${task.done ? 'done' : ''}`}>
              <input
                type="checkbox"
                className="task-check"
                checked={!!task.done}
                onChange={() => toggleTask(task)}
              />
              <span className="task-title">{task.title}</span>
              <button
                className="btn btn-delete"
                onClick={() => deleteTask(task.id)}
                aria-label="Delete task"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ── Footer count ── */}
      {tasks.length > 0 && (
        <p className="footer-count">
          {activeCount} item{activeCount !== 1 ? 's' : ''} left
        </p>
      )}
    </div>
  )
}