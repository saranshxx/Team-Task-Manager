const { Pool } = require('pg');
const path = require('path');

// PostgreSQL connection pool
// Uses DATABASE_URL from environment variables (Railway provides this)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initializeDb() {
  const client = await pool.connect();
  
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member'
      )
    `);

    // Create projects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        owner_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        assignee_id INTEGER,
        status TEXT NOT NULL DEFAULT 'todo',
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (assignee_id) REFERENCES users(id)
      )
    `);

    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
}

// Convert SQLite ? placeholders to PostgreSQL $n format
function convertPlaceholders(sql) {
  let paramIndex = 1;
  const converted = sql.replace(/\?/g, () => `$${paramIndex++}`);
  return converted;
}

// Helper methods for database operations
async function runAsync(sql, params = []) {
  let convertedSql = convertPlaceholders(sql);

  // For INSERT statements, use RETURNING id to get the last inserted ID
  if (/^\s*INSERT\s+INTO/i.test(convertedSql) && !/RETURNING/i.test(convertedSql)) {
    convertedSql += ' RETURNING id';
  }

  const result = await pool.query(convertedSql, params);
  return { 
    lastID: result.rows[0]?.id || 0, 
    changes: result.rowCount 
  };
}

async function getAsync(sql, params = []) {
  const convertedSql = convertPlaceholders(sql);
  const result = await pool.query(convertedSql, params);
  return result.rows[0] || null;
}

async function allAsync(sql, params = []) {
  const convertedSql = convertPlaceholders(sql);
  const result = await pool.query(convertedSql, params);
  return result.rows;
}

// Export for compatibility with existing code
module.exports = { 
  db: { 
    runAsync, 
    getAsync, 
    allAsync,
    run: runAsync,
    get: getAsync,
    all: allAsync
  },
  initializeDb,
  pool
};
