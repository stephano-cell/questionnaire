const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");

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
router.get("/projects/template/:templateId", (req, res) => {
  const templateId = req.params.templateId;

  db.all(
    `SELECT * FROM projects WHERE templateId = ?`,
    [templateId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      return res.status(200).json(rows);
    }
  );
});
router.get("/projects", (req, res) => {
  db.all(
    `
    SELECT projects.*, template.name AS templateName
    FROM projects
    JOIN template ON projects.templateId = template.id
    `,
    [],
    (err, rows) => {
      if (err) {
        console.error("Error executing SQL query: ", err);
        return res.status(500).json({ error: err.message });
      }
      return res.status(200).json(rows);
    }
  );
});

router.get("/projects/:projectId", (req, res) => {
  const projectId = req.params.projectId;

  db.get(`SELECT * FROM projects WHERE id = ?`, [projectId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.status(200).json(row);
  });
});
router.get("/projects/:projectId/details", (req, res) => {
  const projectId = req.params.projectId;

  db.all(
    `
    SELECT
      projects.id as projectId, projects.name as projectName, projects.company as company, projects.comment as comment,
      template.id as templateId, template.name as templateName,
      templateGroups.id as groupId, templateGroups.groupName as groupName,
      templateQuestions.id as questionId, templateQuestions.questionTitle as questionText,
      projectsQuestions.isTicked as isTicked
    FROM
      projects
    INNER JOIN
      template ON projects.templateId = template.id
    INNER JOIN
      templateGroups ON template.id = templateGroups.templateId
    INNER JOIN
      templateQuestions ON templateGroups.id = templateQuestions.groupId
    LEFT JOIN
      projectsQuestions ON templateQuestions.id = projectsQuestions.templateQuestionId AND projects.id = projectsQuestions.projectId
    WHERE
      projects.id = ?
    `,
    [projectId],
    (err, rows) => {
      if (err) {
        console.error("SQL error:", err);
        return res.status(500).json({ error: err.message });
      }
      return res.status(200).json(rows);
    }
  );
});

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
