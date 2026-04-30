const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const users = await db.allAsync('SELECT id, name, email, role FROM users ORDER BY name');
  res.json(users);
});

module.exports = router;
