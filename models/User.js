const db = require("../config/db");

// Find a user by email
async function findByEmail(email) {
  const [rows] = await db.execute(
    `SELECT id, name, email, password
     FROM users
     WHERE email = ?`,
    [email],
  );

  return rows.length > 0 ? rows[0] : null;
}

// Create a new user
async function createUser(name, email, hashedPassword) {
  const [result] = await db.execute(
    `INSERT INTO users (name, email, password)
     VALUES (?, ?, ?)`,
    [name, email, hashedPassword],
  );

  return result.insertId;
}

module.exports = {
  findByEmail,
  createUser,
};
