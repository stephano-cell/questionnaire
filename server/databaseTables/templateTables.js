const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const { v4: uuidv4 } = require("uuid");
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
router.post("/template/new", (req, res) => {
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

//get
router.get("/template/list", (req, res) => {
  db.all("SELECT * FROM template", [], (err, rows) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(200).json(rows);
  });
});
// Get a single template by ID
router.get("/template/:id", (req, res) => {
  db.get("SELECT * FROM template WHERE id = ?", [req.params.id], (err, row) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(200).json(row);
  });
});
// Update a template by ID
router.put("/template/:id", (req, res) => {
  const { name, description } = req.body;

  db.run(
    `UPDATE template SET name = ?, description = ? WHERE id = ?`,
    [name, description, req.params.id],
    function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(200).json({ id: req.params.id });
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
router.post("/templateGroups/new", (req, res) => {
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
// Get all groups for a specific template
router.get("/templateGroups/:templateId", (req, res) => {
  db.all(
    "SELECT * FROM templateGroups WHERE templateId = ?",
    [req.params.templateId],
    (err, rows) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(200).json(rows);
    }
  );
});
// Update a group by ID
router.put("/templateGroups/:id", (req, res) => {
  const { groupName } = req.body;

  db.run(
    `UPDATE templateGroups SET groupName = ? WHERE id = ?`,
    [groupName, req.params.id],
    function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(200).json({ id: req.params.id });
    }
  );
});
// delete group
router.delete("/templateGroups/:id", (req, res) => {
  db.run(
    `DELETE FROM templateGroups WHERE id = ?`,
    [req.params.id],
    function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(200).json({ id: req.params.id });
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
router.post("/templateQuestions/new", (req, res) => {
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
// Get all questions for a specific group
router.get("/templateQuestions/:groupId", (req, res) => {
  db.all(
    "SELECT * FROM templateQuestions WHERE groupId = ?",
    [req.params.groupId],
    (err, rows) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(200).json(rows);
    }
  );
});
// Update a question by ID
router.put("/templateQuestions/:id", (req, res) => {
  const { questionTitle, questionDescription } = req.body;

  db.run(
    `UPDATE templateQuestions SET questionTitle = ?, questionDescription = ? WHERE id = ?`,
    [questionTitle, questionDescription, req.params.id],
    function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(200).json({ id: req.params.id });
    }
  );
});

//delete questions
router.delete("/templateQuestions/:id", (req, res) => {
  db.run(
    `DELETE FROM templateQuestions WHERE id = ?`,
    [req.params.id],
    function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(200).json({ id: req.params.id });
    }
  );
});

module.exports = router;
