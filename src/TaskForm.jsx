import { useState } from 'react';

const EMERGENCY_OPTIONS = [
  { value: 1, label: '1 - Low' },
  { value: 2, label: '2 - Medium-Low' },
  { value: 3, label: '3 - Medium' },
  { value: 4, label: '4 - High' },
  { value: 5, label: '5 - Critical' },
];

export default function TaskForm({ onSubmit, editingTask, onCancelEdit }) {
  const [title, setTitle] = useState(editingTask?.title || '');
  const [description, setDescription] = useState(editingTask?.description || '');
  const [emergency, setEmergency] = useState(editingTask?.emergency || 3);
  const [deadline, setDeadline] = useState(
    editingTask?.deadline ? new Date(editingTask.deadline).toISOString().split('T')[0] : ''
  );

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      emergency: Number(emergency),
      deadline: deadline || null,
    });
    if (!editingTask) {
      setTitle('');
      setDescription('');
      setEmergency(3);
      setDeadline('');
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <input
          type="text"
          placeholder="Task title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="form-input form-title"
          required
        />
        <select
          value={emergency}
          onChange={(e) => setEmergency(e.target.value)}
          className="form-select"
        >
          {EMERGENCY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="form-input form-date"
        />
      </div>
      <div className="form-row">
        <textarea
          placeholder="Description (optional)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="form-textarea"
          rows={2}
        />
      </div>
      <div className="form-row form-actions">
        <button type="submit" className="btn btn-primary">
          {editingTask ? 'Update Task' : 'Add Task'}
        </button>
        {editingTask && (
          <button type="button" className="btn btn-cancel" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
