import { useState, useEffect, useMemo, useCallback } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import TaskForm from './TaskForm';
import TaskCard from './TaskCard';
import ProjectSelector from './ProjectSelector';
import {
  subscribeTasks,
  createTask,
  completeTask,
  uncompleteTask,
  createSequel,
  updateTask,
  deleteTask,
} from './taskService';
import {
  subscribeProjects,
  createProject,
  renameProject,
  deleteProject,
  migrateOrphanTasks,
} from './projectService';
import './App.css';

function LoginPage() {
  const { loginWithGoogle } = useAuth();
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <svg viewBox="0 0 32 32" fill="none" width="56" height="56">
            <rect width="32" height="32" rx="6" fill="#4F46E5"/>
            <path d="M8 10h16M8 16h12M8 22h8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="24" cy="22" r="4" fill="#10B981" stroke="white" strokeWidth="1.5"/>
            <path d="M22.5 22l1 1 2-2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1>Task Organizer</h1>
        <p className="login-subtitle">Organize, track, and evolve your tasks</p>
        <button className="btn btn-google" onClick={loginWithGoogle}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingTask, setEditingTask] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [migrated, setMigrated] = useState(false);

  // Subscribe to projects
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeProjects(user.uid, (fetchedProjects) => {
      setProjects(fetchedProjects);
      // Auto-select first project if none selected
      if (fetchedProjects.length > 0) {
        setSelectedProjectId((prev) => {
          if (prev && fetchedProjects.some((p) => p.id === prev)) return prev;
          return fetchedProjects[0].id;
        });
      } else {
        setSelectedProjectId(null);
      }
    });
    return unsub;
  }, [user]);

  // Migrate orphan tasks once projects are loaded and "Traffic Simulation" exists
  useEffect(() => {
    if (!user || migrated || projects.length === 0) return;
    const trafficSim = projects.find((p) => p.name === 'Traffic Simulation');
    if (trafficSim) {
      migrateOrphanTasks(user.uid, trafficSim.id).then((count) => {
        if (count > 0) console.log(`Migrated ${count} orphan tasks to Traffic Simulation`);
        setMigrated(true);
      });
    } else {
      // Create the default project for existing tasks
      createProject(user.uid, 'Traffic Simulation').then((ref) => {
        migrateOrphanTasks(user.uid, ref.id).then((count) => {
          if (count > 0) console.log(`Migrated ${count} orphan tasks to Traffic Simulation`);
          setMigrated(true);
        });
      });
    }
  }, [user, projects, migrated]);

  // Subscribe to tasks for selected project
  useEffect(() => {
    if (!user || !selectedProjectId) {
      setTasks([]);
      return;
    }
    const unsub = subscribeTasks(user.uid, selectedProjectId, setTasks);
    return unsub;
  }, [user, selectedProjectId]);

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (filter !== 'all') {
      result = result.filter((t) => t.status === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.chain?.some((entry) => entry.title.toLowerCase().includes(q))
      );
    }
    return result;
  }, [tasks, filter, search]);

  const stats = useMemo(() => {
    const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    return { total: tasks.length, inProgress, completed };
  }, [tasks]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  async function handleCreate(data) {
    await createTask(user.uid, selectedProjectId, data);
    setShowForm(false);
  }

  async function handleUpdate(data) {
    await updateTask(editingTask.id, data);
    setEditingTask(null);
  }

  async function handleComplete(taskId) {
    await completeTask(taskId);
  }

  async function handleUncomplete(taskId) {
    await uncompleteTask(taskId);
  }

  async function handleCreateSequel(parentTask, { title, description, emergency, deadline }) {
    await createSequel(user.uid, parentTask, { title, description, emergency, deadline });
    await deleteTask(parentTask.id);
  }

  async function handleDelete(taskId) {
    if (window.confirm('Delete this task permanently?')) {
      await deleteTask(taskId);
    }
  }

  function handleEdit(task) {
    setEditingTask(task);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleCreateProject(name) {
    await createProject(user.uid, name);
  }

  async function handleRenameProject(projectId, name) {
    await renameProject(projectId, name);
  }

  async function handleDeleteProject(projectId) {
    await deleteProject(projectId);
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
    }
  }

  return (
    <div className="dashboard">
      <header className="app-header">
        <div className="header-left">
          <svg viewBox="0 0 32 32" fill="none" width="32" height="32">
            <rect width="32" height="32" rx="6" fill="#4F46E5"/>
            <path d="M8 10h16M8 16h12M8 22h8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="24" cy="22" r="4" fill="#10B981" stroke="white" strokeWidth="1.5"/>
            <path d="M22.5 22l1 1 2-2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1 className="app-title">Task Organizer</h1>
        </div>
        <div className="header-right">
          <img
            src={user.photoURL}
            alt=""
            className="avatar"
            referrerPolicy="no-referrer"
          />
          <span className="user-name">{user.displayName?.split(' ')[0]}</span>
          <button className="btn btn-logout" onClick={logout}>Sign out</button>
        </div>
      </header>

      <div className="dashboard-body">
        <aside className="sidebar">
          <ProjectSelector
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelect={setSelectedProjectId}
            onCreate={handleCreateProject}
            onRename={handleRenameProject}
            onDelete={handleDeleteProject}
          />
        </aside>

        <main className="main-content">
          {selectedProjectId ? (
            <>
              <h2 className="project-title-bar">{selectedProject?.name}</h2>

              <div className="stats-bar">
                <div className="stat">
                  <span className="stat-num">{stats.total}</span>
                  <span className="stat-label">Total</span>
                </div>
                <div className="stat">
                  <span className="stat-num stat-progress">{stats.inProgress}</span>
                  <span className="stat-label">In Progress</span>
                </div>
                <div className="stat">
                  <span className="stat-num stat-done">{stats.completed}</span>
                  <span className="stat-label">Completed</span>
                </div>
              </div>

              <div className="toolbar">
                <div className="search-box">
                  <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-input"
                  />
                  {search && (
                    <button className="search-clear" onClick={() => setSearch('')}>✕</button>
                  )}
                </div>
                <div className="filter-tabs">
                  {['all', 'in-progress', 'completed'].map((f) => (
                    <button
                      key={f}
                      className={`filter-tab ${filter === f ? 'active' : ''}`}
                      onClick={() => setFilter(f)}
                    >
                      {f === 'all' ? 'All' : f === 'in-progress' ? 'In Progress' : 'Completed'}
                    </button>
                  ))}
                </div>
                <button
                  className="btn btn-primary btn-new"
                  onClick={() => { setEditingTask(null); setShowForm(!showForm); }}
                >
                  {showForm && !editingTask ? '− Close' : '+ New Task'}
                </button>
              </div>

              {showForm && (
                <div className="form-container">
                  <TaskForm
                    key={editingTask?.id || 'new'}
                    onSubmit={editingTask ? handleUpdate : handleCreate}
                    editingTask={editingTask}
                    onCancelEdit={() => { setEditingTask(null); setShowForm(false); }}
                  />
                </div>
              )}

              <div className="task-list">
                {filteredTasks.length === 0 ? (
                  <div className="empty-state">
                    {search ? 'No tasks match your search.' : 'No tasks yet. Create one to get started!'}
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={handleComplete}
                      onUncomplete={handleUncomplete}
                      onCreateSequel={handleCreateSequel}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              {projects.length === 0
                ? 'Create a project to get started!'
                : 'Select a project from the sidebar.'}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  return user ? <Dashboard /> : <LoginPage />;
}
