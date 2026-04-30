const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.db');

let db;

async function initializeDb() {
  const SQL = await initSqlJs();
  
  // Load existing database if it exists
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      owner_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      assignee_id INTEGER,
      status TEXT NOT NULL DEFAULT 'todo',
      due_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (assignee_id) REFERENCES users(id)
    )
  `);

  // Save database to file
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  
  console.log('Database initialized successfully');
}

// Helper methods with async-style API for backward compatibility
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      db.run(sql, params);
      const data = db.export();
      fs.writeFileSync(dbPath, Buffer.from(data));
      const lastIdResult = db.exec("SELECT last_insert_rowid() as id");
      const lastID = lastIdResult[0]?.values[0]?.[0] || 0;
      resolve({ lastID, changes: db.getRowsModified() });
    } catch (err) {
      reject(err);
    }
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        resolve(row);
      } else {
        stmt.free();
        resolve(null);
      }
    } catch (err) {
      reject(err);
    }
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      resolve(results);
    } catch (err) {
      reject(err);
    }
  });
}

// Export both styles for compatibility
module.exports = { 
  db: { 
    runAsync, 
    getAsync, 
    allAsync,
    run: runAsync,
    get: getAsync,
    all: allAsync
  },
  initializeDb 
};
