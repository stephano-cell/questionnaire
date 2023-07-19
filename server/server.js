const express = require("express");

const cors = require("cors");

const app = express();
const port = 3000;

app.use(cors());

// Import routes
const usersTable = require("./databaseTables/usersTable");
const templateTables = require("./databaseTables/templateTables");
const projectTables = require("./databaseTables/projectTables");
// Use routes
app.use(usersTable);
app.use(templateTables);
app.use(projectTables);

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
