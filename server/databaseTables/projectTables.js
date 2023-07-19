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
    comment TEXT
  )
`,
  (err) => {
    if (err) {
      console.error("Error creating projects table: ", err.message);
    }
  }
);

// Create projectsGroups table
db.run(
  `
  CREATE TABLE IF NOT EXISTS projectsGroups (
    id TEXT PRIMARY KEY,
    groupName TEXT,
    projectId TEXT,
    FOREIGN KEY(projectId) REFERENCES projects(id)
  )
`,
  (err) => {
    if (err) {
      console.error("Error creating projectsGroups table: ", err.message);
    }
  }
);

// Create projectsQuestions table
db.run(
  `
  CREATE TABLE IF NOT EXISTS projectsQuestions (
    id TEXT PRIMARY KEY,
    questionTitle TEXT,
    questionDescription TEXT,
    groupId TEXT,
    isTicked BOOLEAN DEFAULT false,
    isLocked BOOLEAN DEFAULT false,
    isCompleted BOOLEAN DEFAULT false,
    FOREIGN KEY(groupId) REFERENCES projectsGroups(id)
  )
`,
  (err) => {
    if (err) {
      console.error("Error creating projectsQuestions table: ", err.message);
    }
  }
);

//Projects
module.exports = router;
