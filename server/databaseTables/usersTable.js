const sqlite3 = require("sqlite3").verbose();
const express = require("express");
const router = express.Router(); // Define the router variable
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
// Set up rate limiter: maximum of five requests per minute

const secretKey = crypto.randomBytes(64).toString("hex");
router.use(bodyParser.json());
// Apply rate limiter to login route

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
  username TEXT UNIQUE,
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
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 3, // limit each IP to 5 requests per windowMs
  message: "Too many login attempts from this IP, please try again later.",
});
router.use("/login", loginLimiter);
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

    // Check if the user is a client and if their allowLogin is set to no
    if (user.role === "client" && user.allowLogin === 0) {
      return res.status(401).json({ error: "Login not allowed for this user" });
    }

    // If the login is successful, generate a token for the session
    const token = jwt.sign({ id: user.id }, secretKey, {
      expiresIn: "1h",
    });

    // Return the user's data and the token
    return res.status(200).json({ ...user, token });
  });
});

// ...

// Create the userProjects table
db.run(
  `CREATE TABLE IF NOT EXISTS userProjects(
  userId TEXT,
  projectId TEXT,
  PRIMARY KEY(userId, projectId),
  FOREIGN KEY(userId) REFERENCES users(id),
  FOREIGN KEY(projectId) REFERENCES projects(id)
)`,
  (err) => {
    if (err) {
      return console.log(err.message);
    }
    console.log("userProjects table created");
  }
);

// Assign projects to a user
router.put("/users/:id/assign", (req, res) => {
  console.log("PUT /users/:id/assign -> Received data:", req.body);
  const { id } = req.params;
  const { projects } = req.body;
  // Check for invalid project IDs
  if (projects.some((p) => p === null || p === undefined)) {
    return res.status(400).json({ error: "Invalid project IDs" });
  }
  const placeholders = projects.map(() => "(?, ?)").join(", ");
  const values = projects.flatMap((projectId) => [id, projectId]);

  db.run(
    `INSERT OR IGNORE INTO userProjects(userId, projectId) VALUES ${placeholders}`,
    values,
    function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(200).json({ id });
    }
  );
});

// Unassign projects from a user
router.put("/users/:id/unassign", (req, res) => {
  const { id } = req.params;
  const { projects } = req.body;

  // Check for invalid project IDs
  if (projects.some((p) => p === null || p === undefined)) {
    return res.status(400).json({ error: "Invalid project IDs" });
  }
  const placeholders = projects.map(() => "?").join(", ");

  db.run(
    `DELETE FROM userProjects WHERE userId = ? AND projectId IN (${placeholders})`,
    [id, ...projects],
    function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(200).json({ id });
    }
  );
});

// Get projects assigned to a user
router.get("/users/:id/projects", (req, res) => {
  const { id } = req.params;

  db.all(
    `SELECT * FROM projects INNER JOIN userProjects ON projects.id = userProjects.projectId WHERE userProjects.userId = ?`,
    [id],
    (err, rows) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return res.json(rows);
    }
  );
});

// Get a user with their assigned projects
router.get("/users-with-projects", (req, res) => {
  db.all(
    `SELECT users.*, GROUP_CONCAT(projects.name) as projectNames
     FROM users
     LEFT JOIN userProjects ON users.id = userProjects.userId
     LEFT JOIN projects ON userProjects.projectId = projects.id
     GROUP BY users.id`,
    [],
    (err, users) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      if (users) {
        users.forEach((user) => {
          user.projectNames = user.projectNames
            ? user.projectNames.split(",")
            : [];
        });
      }
      return res.json(users);
    }
  );
});

module.exports = router;
