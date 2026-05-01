import { useEffect, useState } from 'react';
import { auth, projects, tasks, users } from './api';
import './App.css';

const initialForm = { name: '', email: '', password: '', role: 'member' };

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(initialForm);
  const [projectsList, setProjectsList] = useState([]);
  const [tasksList, setTasksList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [projectForm, setProjectForm] = useState({ name: '', description: '' });
  const [taskForm, setTaskForm] = useState({ project_id: '', title: '', description: '', assignee_id: '', due_date: '' });
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('taskManagerToken');
    const savedUser = localStorage.getItem('taskManagerUser');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    console.log('Token changed:', token ? '[TOKEN]' : 'null');
    if (token) {
      loadProjects();
      loadTasks();
      loadUsers();
    }
  }, [token]);

  console.log('App render - user:', user ? user.name : 'null', 'token:', token ? '[TOKEN]' : 'null');

  const handleChange = (event, setter) => {
    setError('');
    setter((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const login = async () => {
    setLoading(true);
    setError('');
    const payload = {
      email: form.email.trim(),
      password: form.password,
    };

    if (!payload.email || !payload.password) {
      setError('Email and password are required.');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting login with:', { email: payload.email, password: payload.password ? '[HIDDEN]' : '' });
      const result = await auth.login(payload);
      console.log('Login successful:', result);
      setUser(result.user);
      setToken(result.token);
      localStorage.setItem('taskManagerToken', result.token);
      localStorage.setItem('taskManagerUser', JSON.stringify(result.user));
      console.log('User state set to:', result.user);
      console.log('Token state set to:', result.token ? '[TOKEN]' : 'null');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const signup = async () => {
    setLoading(true);
    setError('');
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
    };

    if (!payload.name || !payload.email || !payload.password) {
      setError('Name, email, and password are required.');
      setLoading(false);
      return;
    }

    try {
      const result = await auth.signup(payload);
      setUser(result.user);
      setToken(result.token);
      localStorage.setItem('taskManagerToken', result.token);
      localStorage.setItem('taskManagerUser', JSON.stringify(result.user));
      setError('');
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const data = await projects.list(token);
      setProjectsList(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadTasks = async () => {
    try {
      const data = await tasks.list(token);
      setTasksList(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await users.list(token);
      setUsersList(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const submitProject = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await projects.create(projectForm, token);
      setProjectForm({ name: '', description: '' });
      loadProjects();
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitTask = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await tasks.create(taskForm, token);
      setTaskForm({ project_id: '', title: '', description: '', assignee_id: '', due_date: '' });
      loadTasks();
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (task, status) => {
    setLoading(true);
    try {
      await tasks.update(task.id, {
        title: task.title,
        description: task.description,
        assignee_id: task.assignee_id || '',
        due_date: task.due_date || '',
        status,
      }, token);
      await loadTasks();
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken('');
    setProjectsList([]);
    setTasksList([]);
    setUsersList([]);
    setForm(initialForm);
    setError('');
    setMenuOpen(false);
    localStorage.removeItem('taskManagerToken');
    localStorage.removeItem('taskManagerUser');
  };

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const getStatusBadgeClass = (status, isOverdue) => {
    if (isOverdue) return 'status-overdue';
    switch (status) {
      case 'todo': return 'status-todo';
      case 'in-progress': return 'status-in-progress';
      case 'done': return 'status-done';
      default: return 'status-todo';
    }
  };

  console.log('App render - user:', user ? user.name : 'null', 'token:', token ? '[TOKEN]' : 'null');

  if (!user) {
    return (
      <div className="app">
        <div className="auth-container">
          <div className="auth-card fade-in">
            <div className="auth-header">
              <h1 className="auth-title">Team Task Manager</h1>
              <p className="auth-subtitle">Manage projects and tasks with your team</p>
            </div>

            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => { setMode('login'); setError(''); }}
              >
                Login
              </button>
              <button
                type="button"
                className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => { setMode('signup'); setError(''); }}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              console.log('Form submitted, mode:', mode);
              if (mode === 'login') {
                login();
              } else {
                signup();
              }
            }}>
              {mode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    value={form.name}
                    onChange={(e) => handleChange(e, setForm)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={form.email}
                  onChange={(e) => handleChange(e, setForm)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  value={form.password}
                  onChange={(e) => handleChange(e, setForm)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              {mode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    name="role"
                    className="form-select"
                    value={form.role}
                    onChange={(e) => handleChange(e, setForm)}
                  >
                    <option value="member">Team Member</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
                </button>
              </div>
            </form>

            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-app">
      <header className="app-header">
        <div className="container header-content">
          <div className="brand-block">
            <div className="brand-logo">TTM</div>
            <div>
              <h1 className="brand-title">Team Task Manager</h1>
              <p className="brand-subtitle">Organize work and collaborate with ease</p>
            </div>
          </div>
          <div className="user-menu">
            <button type="button" className="user-menu-button" onClick={toggleMenu}>
              <span className="user-avatar">{user.name.split(' ').map((n) => n[0]).slice(0,2).join('')}</span>
              <div>
                <div className="user-name">{user.name}</div>
                <div className="user-role-label">{user.role}</div>
              </div>
            </button>
            {menuOpen && (
              <div className="user-dropdown">
                <button type="button" className="dropdown-item" onClick={logout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="welcome-section">
        <div className="container">
          <div className="welcome-content">
            <h1 className="welcome-title">Welcome back, {user.name}! 👋</h1>
            <p className="welcome-subtitle">Manage your team's projects and tasks efficiently</p>

            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-number">{projectsList.length}</span>
                <span className="stat-label">Projects</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{tasksList.length}</span>
                <span className="stat-label">Tasks</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{tasksList.filter(t => t.status === 'done').length}</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{tasksList.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length}</span>
                <span className="stat-label">Overdue</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="grid-2">
          <div>
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">
                  <span className="icon icon-project"></span>
                  Projects
                </h2>
              </div>

              <div className="form-card">
                <form onSubmit={submitProject}>
                  <div className="form-group">
                    <label className="form-label">Project Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-input"
                      value={projectForm.name}
                      onChange={(e) => handleChange(e, setProjectForm)}
                      placeholder="Enter project name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      name="description"
                      className="form-input"
                      value={projectForm.description}
                      onChange={(e) => handleChange(e, setProjectForm)}
                      placeholder="Describe your project"
                      rows="3"
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading && <span className="spinner"></span>}
                      {loading ? 'Creating...' : 'Create Project'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="grid">
                {projectsList.length ? projectsList.map((project) => (
                  <div key={project.id} className="card project-card fade-in">
                    <div className="card-header">
                      <h3 className="card-title">{project.name}</h3>
                      <p className="card-description">{project.description}</p>
                    </div>
                    <div className="card-meta">
                      <span>👤 {project.owner_name || project.owner_id}</span>
                      <span>📅 {new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                )) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">📁</div>
                    <h3 className="empty-state-title">No Projects Yet</h3>
                    <p className="empty-state-description">Create your first project to get started with team collaboration!</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div>
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">
                  <span className="icon icon-task"></span>
                  Tasks
                </h2>
              </div>

              <div className="form-card">
                <form onSubmit={submitTask}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Project</label>
                      <select
                        name="project_id"
                        className="form-select"
                        value={taskForm.project_id}
                        onChange={(e) => handleChange(e, setTaskForm)}
                        required
                      >
                        <option value="">Select project</option>
                        {projectsList.map((project) => (
                          <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Assignee</label>
                      <select
                        name="assignee_id"
                        className="form-select"
                        value={taskForm.assignee_id}
                        onChange={(e) => handleChange(e, setTaskForm)}
                      >
                        <option value="">Unassigned</option>
                        {usersList.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} ({member.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Task Title</label>
                    <input
                      type="text"
                      name="title"
                      className="form-input"
                      value={taskForm.title}
                      onChange={(e) => handleChange(e, setTaskForm)}
                      placeholder="Enter task title"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      name="description"
                      className="form-input"
                      value={taskForm.description}
                      onChange={(e) => handleChange(e, setTaskForm)}
                      placeholder="Describe the task"
                      rows="3"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Due Date</label>
                      <input
                        type="date"
                        name="due_date"
                        className="form-input"
                        value={taskForm.due_date}
                        onChange={(e) => handleChange(e, setTaskForm)}
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading && <span className="spinner"></span>}
                      {loading ? 'Creating...' : 'Create Task'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="grid">
                {tasksList.length ? tasksList.map((task) => {
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                  return (
                    <div key={task.id} className="task-card fade-in">
                      <h3 className="task-title">{task.title}</h3>
                      <p className="task-description">{task.description}</p>

                      <div className="task-meta">
                        <div>
                          <span className="task-project">📁 {task.project_name}</span>
                          <span className="task-assignee">
                            {task.assignee_name ? `👤 ${task.assignee_name}` : '🤷 Unassigned'}
                          </span>
                        </div>
                        <div className="task-status-control">
                          <span className={`status-badge ${getStatusBadgeClass(task.status, isOverdue)}`}>
                            <span className="status-indicator"></span>
                            {isOverdue ? 'Overdue' : task.status.replace('-', ' ')}
                          </span>
                          <label className="sr-only" htmlFor={`status-${task.id}`}>Task status</label>
                          <select
                            id={`status-${task.id}`}
                            className="status-select"
                            value={task.status}
                            onChange={(event) => updateTaskStatus(task, event.target.value)}
                            disabled={loading}
                          >
                            <option value="todo">To do</option>
                            <option value="in-progress">In progress</option>
                            <option value="done">Done</option>
                          </select>
                        </div>
                      </div>

                      {task.due_date && (
                        <div className="card-meta">
                          <span>📅 Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  );
                }) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <h3 className="empty-state-title">No Tasks Yet</h3>
                    <p className="empty-state-description">Create your first task and start collaborating with your team!</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {error && <div className="error-message">⚠️ {error}</div>}
      </div>
    </div>
  );
}

export default App;
