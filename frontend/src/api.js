const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  console.log('Making request to:', url, options.method || 'GET');
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      method: options.method || 'GET',
    });
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data;
  } catch (error) {
    console.error('Request error:', error);
    if (error instanceof TypeError) {
      throw new Error('Unable to reach the backend. Make sure the server is running on http://localhost:4000.');
    }
    throw error;
  }
}

export const auth = {
  signup: (body) => request('/auth/signup', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
};

export const projects = {
  list: (token) => request('/projects', { token }),
  create: (body, token) => request('/projects', { method: 'POST', body, token }),
};

export const tasks = {
  list: (token) => request('/tasks', { token }),
  create: (body, token) => request('/tasks', { method: 'POST', body, token }),
  update: (id, body, token) => request(`/tasks/${id}`, { method: 'PUT', body, token }),
};

export const users = {
  list: (token) => request('/users', { token }),
};
