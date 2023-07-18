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

module.exports = router;
