const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

router.post('/', async (req, res) => {
  const { project_id, title, description, assignee_id, due_date } = req.body;
  if (!project_id || !title) return res.status(400).json({ message: 'Project and title are required' });

  const project = await db.getAsync('SELECT owner_id FROM projects WHERE id = ?', [project_id]);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You are not authorized to add tasks to this project' });
  }

  // New tasks are created with default status 'todo'
  const result = await db.runAsync(
    'INSERT INTO tasks (project_id, title, description, assignee_id, due_date) VALUES (?, ?, ?, ?, ?)',
    [project_id, title, description || '', assignee_id || null, due_date || null]
  );
  const task = await db.getAsync('SELECT * FROM tasks WHERE id = ?', [result.lastID]);
  res.json(task);
});

router.get('/', async (req, res) => {
  const tasks = await db.allAsync(`
    SELECT t.*, p.name as project_name, u.name as assignee_name, p.owner_id
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE p.owner_id = ? OR t.assignee_id = ?`,
    [req.user.id, req.user.id]
  );
  res.json(tasks);
});

router.put('/:id', async (req, res) => {
  const { title, description, assignee_id, due_date, status } = req.body;
  const task = await db.getAsync(`
    SELECT t.id, t.assignee_id, p.owner_id
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    WHERE t.id = ?`,
    [req.params.id]
  );
  if (!task) return res.status(404).json({ message: 'Task not found' });
  if (task.assignee_id !== req.user.id && task.owner_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to update this task' });
  }

  await db.runAsync(
    `UPDATE tasks SET title = ?, description = ?, assignee_id = ?, due_date = ?, status = ? WHERE id = ?`,
    [title, description || '', assignee_id || null, due_date || null, status || 'todo', req.params.id]
  );
  const updatedTask = await db.getAsync('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
  res.json(updatedTask);
});

router.delete('/:id', async (req, res) => {
  const task = await db.getAsync(`
    SELECT t.id, t.assignee_id, p.owner_id
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    WHERE t.id = ?`,
    [req.params.id]
  );
  if (!task) return res.status(404).json({ message: 'Task not found' });
  if (task.assignee_id !== req.user.id && task.owner_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to delete this task' });
  }

  await db.runAsync('DELETE FROM tasks WHERE id = ?', [req.params.id]);
  res.json({ message: 'Task deleted' });
});

module.exports = router;
