const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const app = express();
const port = 3000;
const crypto = require("crypto");
const secretKey = crypto.randomBytes(64).toString("hex");

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
app.post("/register", (req, res) => {
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
app.get("/users", (req, res) => {
  db.all(`SELECT * FROM users`, [], (err, rows) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(200).json(rows);
  });
});

// Update user route
app.put("/users/:id", (req, res) => {
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
app.post("/login", (req, res) => {
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

//Templates
db.run(
  `
  CREATE TABLE IF NOT EXISTS template(
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT
  )
`,
  (err) => {
    if (err) {
      return console.log(err.message);
    }
    console.log("Templates table created");
  }
);
// Add this code to create new templates
app.post("/template/new", (req, res) => {
  const { name, description } = req.body;

  const templateId = uuidv4(); // Generate a new ID for the template

  db.run(
    `INSERT INTO template(id, name, description) VALUES(?, ?, ?)`,
    [templateId, name, description],
    function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(201).json({ id: templateId });
    }
  );
});

//create templateGroups table
db.run(
  `
  CREATE TABLE IF NOT EXISTS templateGroups(
    id TEXT PRIMARY KEY,
    groupName TEXT,
    templateId TEXT,
    FOREIGN KEY(templateId) REFERENCES template(id)
  )
`,
  (err) => {
    if (err) {
      return console.log(err.message);
    }
    console.log("TemplateGroups table created");
  }
);
// post new template groups
app.post("/templateGroups/new", (req, res) => {
  const { groupName, templateId } = req.body;

  const groupId = uuidv4(); // Generate a new ID for the group

  db.run(
    `INSERT INTO templateGroups(id, groupName, templateId) VALUES(?, ?, ?)`,
    [groupId, groupName, templateId],
    function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(201).json({ id: groupId });
    }
  );
});

// templateQuestions create table
db.run(
  `
  CREATE TABLE IF NOT EXISTS templateQuestions(
    id TEXT PRIMARY KEY,
    questionTitle TEXT,
    questionDescription TEXT,
    groupId TEXT,
    FOREIGN KEY(groupId) REFERENCES templateGroups(id)
  )
`,
  (err) => {
    if (err) {
      return console.log(err.message);
    }
    console.log("TemplateQuestions table created");
  }
);
//post create templateQuestions
app.post("/templateQuestions/new", (req, res) => {
  const { questionTitle, questionDescription, groupId } = req.body;

  const questionId = uuidv4(); // Generate a new ID for the question

  db.run(
    `INSERT INTO templateQuestions(id, questionTitle, questionDescription, groupId) VALUES(?, ?, ?, ?)`,
    [questionId, questionTitle, questionDescription, groupId],
    function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(201).json({ id: questionId });
    }
  );
});
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
