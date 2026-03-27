import { useState } from 'react';

const EMERGENCY_LABELS = ['', 'Low', 'Medium-Low', 'Medium', 'High', 'Critical'];
const EMERGENCY_COLORS = ['', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function isOverdue(deadline) {
  if (!deadline) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return new Date(deadline) < now;
}

export default function TaskCard({ task, onComplete, onReopen, onEdit, onDelete }) {
  const [showSequel, setShowSequel] = useState(false);
  const [sequelTitle, setSequelTitle] = useState('');
  const [expanded, setExpanded] = useState(false);
  const isCompleted = task.status === 'completed';
  const overdue = !isCompleted && isOverdue(task.deadline);

  function handleReopen(e) {
    e.preventDefault();
    if (sequelTitle.trim()) {
      onReopen(task.id, task.title, task.history, sequelTitle.trim());
      setSequelTitle('');
      setShowSequel(false);
    }
  }

  return (
    <div className={`task-card ${isCompleted ? 'task-completed' : ''} ${overdue ? 'task-overdue' : ''}`}>
      <div className="task-header">
        <div className="task-emergency" style={{ background: EMERGENCY_COLORS[task.emergency] }}>
          {task.emergency}
        </div>
        <div className="task-title-area" onClick={() => setExpanded(!expanded)}>
          <h3 className={`task-title ${isCompleted ? 'line-through' : ''}`}>{task.title}</h3>
          <div className="task-meta">
            <span className="task-date">Created {formatDate(task.createdAt)}</span>
            {task.deadline && (
              <span className={`task-deadline ${overdue ? 'overdue-text' : ''}`}>
                Due {formatDate(task.deadline)}
              </span>
            )}
            <span className={`task-status-badge ${isCompleted ? 'badge-done' : 'badge-progress'}`}>
              {isCompleted ? 'Done' : 'In Progress'}
            </span>
          </div>
        </div>
        <div className="task-actions">
          {!isCompleted && (
            <button className="btn btn-done" onClick={() => onComplete(task.id)} title="Mark done">
              ✓
            </button>
          )}
          {isCompleted && (
            <button className="btn btn-reopen" onClick={() => setShowSequel(!showSequel)} title="Reopen with sequel">
              ↻
            </button>
          )}
          <button className="btn btn-edit" onClick={() => onEdit(task)} title="Edit">
            ✎
          </button>
          <button className="btn btn-delete" onClick={() => onDelete(task.id)} title="Delete">
            ✕
          </button>
        </div>
      </div>

      {/* History chain */}
      {task.history && task.history.length > 0 && (
        <div className="task-history">
          {task.history.map((h, i) => (
            <span key={i} className="history-item">
              {h}
              <span className="history-arrow">→</span>
            </span>
          ))}
          <span className="history-current">{task.title}</span>
        </div>
      )}

      {/* Expandable description */}
      {expanded && task.description && (
        <div className="task-description">{task.description}</div>
      )}

      {/* Sequel input */}
      {showSequel && (
        <form className="sequel-form" onSubmit={handleReopen}>
          <input
            type="text"
            placeholder="Next task title..."
            value={sequelTitle}
            onChange={(e) => setSequelTitle(e.target.value)}
            autoFocus
            className="sequel-input"
          />
          <button type="submit" className="btn btn-sequel-submit">Reopen</button>
          <button type="button" className="btn btn-cancel" onClick={() => setShowSequel(false)}>Cancel</button>
        </form>
      )}
    </div>
  );
}
