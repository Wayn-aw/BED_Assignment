const sql = require("mssql");
const dbConfig = require("../dbConfig");
const bcrypt = require("bcrypt");

async function getAllUsers() {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "SELECT * FROM NEA_Officer";
    const result = await connection.request().query(query);
    return result.recordset;
    //return result.recordset[0];
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

async function createUser(req, res) {
  //same as createUser
  const {
    OfficerName,
    OfficerContactNo,
    OfficerUsername,
    OfficerPassword,
    OfficerRoles,
    OfficerStatus,
  } = req.body;

  try {
    // Validate user data
    // ... your validation logic here ...

    if (
      !OfficerName ||
      OfficerName.match(/[!@#$%^&*(){}:"<>?/]/) ||
      isNaN(OfficerName) ||
      /\d/.test(OfficerName) // num checker
    ) {
      return res.status(400).json({
        message:
          "Username cannot include special characters, numbers or cannot be left blank",
      });
    }

    const onlyNumbers = /^[0-9]+$/;
    if (!onlyNumbers.test(OfficerContactNo)) {
      return res
        .status(400)
        .json({ message: "Phone number only accepts digits." });
    }

    const username = OfficerUsername;
    const password = OfficerPassword;

    if (
      !OfficerUsername ||
      OfficerUsername.trim() === "" ||
      username.length < 3 ||
      username.length > 15 ||
      username.includes("!") ||
      username.includes("?") ||
      username.includes("[") ||
      username.includes("]") ||
      username.includes("/") ||
      username.includes("{") ||
      username.includes("}") ||
      username.includes("(") ||
      username.includes(")")
    ) {
      return res
        .status(400)
        .json({ message: "Username too long or too short or is invalid" });
    }

    if (
      !OfficerPassword ||
      OfficerPassword.trim() === "" ||
      password.length < 8
    ) {
      return res.status(400).json({
        message: "Password format is invalid or less than 8 characters.",
      });
    }

    if (
      OfficerRoles !== "Health" &&
      OfficerRoles !== "Inspection" &&
      OfficerRoles !== "Compliance" &&
      OfficerRoles !== "Operations" &&
      OfficerRoles !== "Enforcement"
    ) {
      return res.status(400).json({ message: "Role is invalid" });
    }

    const statusList = ["Active", "Inactive", "Suspended", "Resigned"];
    if (!statusList.includes(OfficerStatus)) {
      return res.status(400).json({ message: "Status is invalid" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12); //more secure 10 -> 12
    const OfficerPasswordHashed = await bcrypt.hash(OfficerPassword, salt);

    let connection;

    try {
      connection = await sql.connect(dbConfig);

      const usernameCheckQuery = `
        SELECT OfficerName, OfficerContactNo, OfficerUsername, OfficerRoles
        FROM NEA_Officer
        WHERE OfficerUsername = @OfficerUsername
      `;

      const usernameRequest = connection.request();
      usernameRequest.input("OfficerUsername", sql.VarChar, OfficerUsername);

      const usernameResult = await usernameRequest.query(usernameCheckQuery);

      if (usernameResult.recordset.length > 0) {
        return res.status(400).json({
          message: "Username already exists",
        });
      }

      const query =
        "INSERT INTO NEA_Officer (OfficerUsername, passwordHash, OfficerRoles) VALUES (@username, @passwordHash, @OfficerRoles); SELECT SCOPE_IDENTITY() AS user_id;";

      const request = connection.request();

      const OfficerStatus = "Active";

      request.input("username", sql.VarChar, username);
      request.input("passwordHash", sql.VarChar, OfficerPasswordHashed);
      request.input("OfficerRoles", sql.VarChar(11), OfficerRoles);
      request.input("OfficerStatus", sql.VarChar(10), OfficerStatus);

      const result = await request.query(query);

      const newUserId = result.recordset[0].user_id;

      const newUser = await getUserById(newUserId);

      return res.status(201).json(newUser);
    } catch (error) {
      console.error("Database error:", error);
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error("Error closing connection:", err);
        }
      }
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  getAllUsers,
  createUser,
};
