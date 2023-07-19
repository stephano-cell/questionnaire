const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");

const router = express.Router();
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

// Create projects table
db.run(
  `
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT,
    company TEXT,
    comment TEXT,
    templateId TEXT,
    FOREIGN KEY(templateId) REFERENCES template(id)
  )
`,
  (err) => {
    if (err) {
      console.error("Error creating projects table: ", err.message);
    }
  }
);

// Create projectsQuestions table
db.run(
  `
  CREATE TABLE IF NOT EXISTS projectsQuestions (
    id TEXT PRIMARY KEY,
    isTicked BOOLEAN DEFAULT false,
    isLocked BOOLEAN DEFAULT false,
    isCompleted BOOLEAN DEFAULT false,
    templateQuestionId TEXT,
    projectId TEXT,
    FOREIGN KEY(templateQuestionId) REFERENCES templateQuestions(id),
    FOREIGN KEY(projectId) REFERENCES projects(id)

  )
`,
  (err) => {
    if (err) {
      console.error("Error creating projectsQuestions table: ", err.message);
    }
    console.log("projectsQuestions table created");
  }
);

//post.request
// Add a new project
router.post("/projects/new", (req, res) => {
  const { name, company, comment, templateId } = req.body;

  const projectId = uuidv4(); // Generate a new ID for the project

  db.run(
    `INSERT INTO projects(id, name, company, comment, templateId) VALUES(?, ?, ?, ?, ?)`,
    [projectId, name, company, comment, templateId],
    function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(201).json({ id: projectId });
    }
  );
});

// Add a new project question
router.post("/projectsQuestions/new", (req, res) => {
  const { isTicked, isLocked, isCompleted, templateQuestionId, projectId } =
    req.body;

  const projectQuestionId = uuidv4(); // Generate a new ID for the project question

  db.run(
    `INSERT INTO projectsQuestions(id, isTicked, isLocked, isCompleted, templateQuestionId, projectId) VALUES(?, ?, ?, ?, ?, ?)`,
    [
      projectQuestionId,
      isTicked,
      isLocked,
      isCompleted,
      templateQuestionId,
      projectId,
    ],
    function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(201).json({ id: projectQuestionId });
    }
  );
});
//Projects
module.exports = router;
