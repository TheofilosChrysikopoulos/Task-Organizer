import { useState } from 'react';

export default function ProjectSelector({
  projects,
  selectedProjectId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}) {
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  function handleCreate(e) {
    e.preventDefault();
    if (newName.trim()) {
      onCreate(newName.trim());
      setNewName('');
      setShowNew(false);
    }
  }

  function handleRename(e) {
    e.preventDefault();
    if (editName.trim()) {
      onRename(editingId, editName.trim());
      setEditingId(null);
      setEditName('');
    }
  }

  function startRename(project) {
    setEditingId(project.id);
    setEditName(project.name);
  }

  function handleDelete(projectId, projectName) {
    if (window.confirm(`Delete project "${projectName}" and all its tasks?`)) {
      onDelete(projectId);
    }
  }

  return (
    <div className="project-selector">
      <div className="project-header">
        <span className="project-label">Projects</span>
        <button
          className="btn btn-project-add"
          onClick={() => setShowNew(!showNew)}
          title="New project"
        >
          +
        </button>
      </div>

      {showNew && (
        <form className="project-new-form" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="Project name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="project-new-input"
            autoFocus
          />
          <button type="submit" className="btn btn-project-submit">Add</button>
        </form>
      )}

      <div className="project-list">
        {projects.map((p) => (
          <div
            key={p.id}
            className={`project-item ${selectedProjectId === p.id ? 'project-active' : ''}`}
          >
            {editingId === p.id ? (
              <form className="project-rename-form" onSubmit={handleRename}>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="project-rename-input"
                  autoFocus
                />
                <button type="submit" className="btn btn-project-submit">✓</button>
                <button
                  type="button"
                  className="btn btn-project-cancel"
                  onClick={() => setEditingId(null)}
                >
                  ✕
                </button>
              </form>
            ) : (
              <>
                <button
                  className="project-name"
                  onClick={() => onSelect(p.id)}
                >
                  {p.name}
                </button>
                <div className="project-item-actions">
                  <button
                    className="btn btn-project-action"
                    onClick={() => startRename(p)}
                    title="Rename"
                  >
                    ✎
                  </button>
                  <button
                    className="btn btn-project-action btn-project-delete"
                    onClick={() => handleDelete(p.id, p.name)}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
