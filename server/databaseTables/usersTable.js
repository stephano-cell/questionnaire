const sqlite3 = require("sqlite3").verbose();
const express = require("express");
const router = express.Router(); // Define the router variable
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const secretKey = crypto.randomBytes(64).toString("hex");
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
// Open a database handle
let db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Connected to the SQLite database.");
});
db.run("PRAGMA foreign_keys = ON");
// Create the users table
db.run(
  `CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY,
  username TEXT,
  fullName TEXT,
  email TEXT UNIQUE,
  companyName TEXT,
  password TEXT,
  role TEXT,
  allowLogin INTEGER
)`,
  (err) => {
    if (err) {
      return console.log(err.message);
    }
    console.log("Users table created");
  }
);

// Register route
router.post("/register", (req, res) => {
  const { username, fullName, email, companyName, password, role, allowLogin } =
    req.body;

  const hashedPassword = bcrypt.hashSync(password, 10);
  const userId = uuidv4();
  db.run(
    `INSERT INTO users(id, username, fullName, email, companyName, password, role, allowLogin) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      username,
      fullName,
      email,
      companyName,
      hashedPassword,
      role,
      allowLogin,
    ],
    function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(201).json({ id: userId }); //
    }
  );
});

// Get all users
router.get("/users", (req, res) => {
  db.all(`SELECT * FROM users`, [], (err, rows) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(200).json(rows);
  });
});

// Update user route
router.put("/users/:id", (req, res) => {
  const { username, fullName, email, companyName, password, role, allowLogin } =
    req.body;

  let hashedPassword = null;
  if (password) {
    hashedPassword = bcrypt.hashSync(password, 10);
  }

  db.run(
    `UPDATE users SET username = ?, fullName = ?, email = ?, companyName = ?, password = COALESCE(?, password), role = ?, allowLogin = ? WHERE id = ?`,
    [
      username,
      fullName,
      email,
      companyName,
      hashedPassword,
      role,
      allowLogin,
      req.params.id, // Include the request parameter in the array of values
    ],
    function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(200).json({ id: req.params.id });
    }
  );
});

// Login route
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Fetch the user data from the database
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    // If the user doesn't exist or the password is incorrect, return a 401 Unauthorized status
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // If the login is successful, generate a token for the session
    const token = jwt.sign({ id: user.id }, secretKey, {
      expiresIn: "1h",
    });

    // Return the user's data and the token
    return res.status(200).json({ ...user, token });
  });
});

module.exports = router;
