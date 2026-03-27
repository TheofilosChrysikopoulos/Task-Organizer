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

export default function TaskCard({ task, onComplete, onUncomplete, onCreateSequel, onEdit, onDelete }) {
  const [showSequel, setShowSequel] = useState(false);
  const [sequelTitle, setSequelTitle] = useState('');
  const [sequelDescription, setSequelDescription] = useState('');
  const [sequelDeadline, setSequelDeadline] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [expandedPrequel, setExpandedPrequel] = useState(null);
  const isCompleted = task.status === 'completed';
  const overdue = !isCompleted && isOverdue(task.deadline);

  function handleCreateSequel(e) {
    e.preventDefault();
    if (sequelTitle.trim()) {
      onCreateSequel(task, {
        title: sequelTitle.trim(),
        description: sequelDescription.trim(),
        deadline: sequelDeadline || null,
      });
      setSequelTitle('');
      setSequelDescription('');
      setSequelDeadline('');
      setShowSequel(false);
    }
  }

  function togglePrequel(index) {
    setExpandedPrequel(expandedPrequel === index ? null : index);
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
            <button className="btn btn-uncomplete" onClick={() => onUncomplete(task.id)} title="Mark as in-progress">
              ↩
            </button>
          )}
          {isCompleted && (
            <button className="btn btn-reopen" onClick={() => setShowSequel(!showSequel)} title="Create sequel task">
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

      {/* History chain — clickable prequel items */}
      {task.chain && task.chain.length > 0 && (
        <div className="task-history">
          <div className="history-chain">
            {task.chain.map((entry, i) => (
              <span key={i}>
                <span
                  className="history-item clickable"
                  onClick={() => togglePrequel(i)}
                  title="Click to view details"
                >
                  {entry.title}
                </span>
                <span className="history-arrow">→</span>
              </span>
            ))}
            <span className="history-current">{task.title}</span>
          </div>
          {/* Expanded prequel details */}
          {expandedPrequel !== null && task.chain[expandedPrequel] && (
            <div className="prequel-details">
              <div className="prequel-header">
                <strong>{task.chain[expandedPrequel].title}</strong>
                <button className="prequel-close" onClick={() => setExpandedPrequel(null)}>✕</button>
              </div>
              <div className="prequel-meta">
                <span>Created {formatDate(task.chain[expandedPrequel].createdAt)}</span>
                {task.chain[expandedPrequel].deadline && (
                  <span>Due {formatDate(task.chain[expandedPrequel].deadline)}</span>
                )}
              </div>
              {task.chain[expandedPrequel].description && (
                <div className="prequel-description">{task.chain[expandedPrequel].description}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Expandable description */}
      {expanded && task.description && (
        <div className="task-description">{task.description}</div>
      )}

      {/* Sequel form — full form with title, description, deadline */}
      {showSequel && (
        <form className="sequel-form" onSubmit={handleCreateSequel}>
          <input
            type="text"
            placeholder="Sequel task title..."
            value={sequelTitle}
            onChange={(e) => setSequelTitle(e.target.value)}
            autoFocus
            className="sequel-input"
            required
          />
          <textarea
            placeholder="Description (optional)..."
            value={sequelDescription}
            onChange={(e) => setSequelDescription(e.target.value)}
            className="sequel-textarea"
            rows={2}
          />
          <div className="sequel-row">
            <input
              type="date"
              value={sequelDeadline}
              onChange={(e) => setSequelDeadline(e.target.value)}
              className="sequel-date"
            />
            <button type="submit" className="btn btn-sequel-submit">Create Sequel</button>
            <button type="button" className="btn btn-cancel" onClick={() => setShowSequel(false)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
