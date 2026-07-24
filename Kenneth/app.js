const express = require("express");
const app = express();
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger-output.json");

const sql = require("mssql");
require("dotenv").config();
const path = require("path");

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

const ofcontroller = require("./controller/OfficerController");
const ofmiddleware = require("./middleware/Officer");

app.use(express.static(path.join(__dirname, "public")));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/NEAofficers", ofcontroller.getAllUsers);

app.post(
  "/createNEAOfficer",
  ofmiddleware.validateuser,
  ofcontroller.createUser,
);

app.put(
  "/NEAofficers/:username/status",
  ofmiddleware.validateOfficerStatus,
  ofcontroller.updateUsersStatus,
);

app.delete(
  "/NEAofficers/:id",
  ofmiddleware.validateusersId,
  ofcontroller.deleteOfficerById,
);
PORT = process.env.PORT || 3000;
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
