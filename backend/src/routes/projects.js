const express = require('express');
const { db } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

router.post('/', async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Project name is required' });
  const result = await db.runAsync(
    'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)',
    [name, description || '', req.user.id]
  );
  const project = await db.getAsync('SELECT * FROM projects WHERE id = ?', [result.lastID]);
  res.json(project);
});

router.get('/', async (req, res) => {
  const projects = await db.allAsync(`
    SELECT DISTINCT p.*, u.name as owner_name
    FROM projects p
    JOIN users u ON p.owner_id = u.id
    LEFT JOIN tasks t ON t.project_id = p.id
    WHERE p.owner_id = ? OR t.assignee_id = ?`,
    [req.user.id, req.user.id]
  );
  res.json(projects);
});

router.get('/:id', async (req, res) => {
  const project = await db.getAsync(`
    SELECT p.*, u.name as owner_name
    FROM projects p
    JOIN users u ON p.owner_id = u.id
    WHERE p.id = ?`,
    [req.params.id]
  );
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
});

router.delete('/:id', adminOnly, async (req, res) => {
  await db.runAsync('DELETE FROM projects WHERE id = ?', [req.params.id]);
  res.json({ message: 'Project deleted' });
});

module.exports = router;
