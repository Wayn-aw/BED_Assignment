const express = require("express");

const app = express();

const sql = require("mssql");
require("dotenv").config();

const path = require("path");

const ofcontroller = require("./controller/OfficerController");

const ofmiddleware = require("./middleware/Officer");

PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.get("/NEAofficers", ofcontroller.getAllUsers);

app.post("/createNEAOfficer", ofmiddleware.validateuser, ofcontroller.);

app.listen(PORT, () => {
  console.log(`The server is running at PORT ${PORT}`);
});

process.on("SIGINT", async () => {
  try {
    console.log(`This server is gracefully shutting down`);

    await sql.close();
    console.log("Database connection closed.");

    process.exit(0);
  } catch (err) {
    console.error("Error Shutting down database: ", err);

    process.exitCode = 1;
  }
});
