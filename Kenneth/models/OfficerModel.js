const sql = require("mssql");
const dbConfig = require("../dbConfig");
const bcrypt = require("bcrypt");
const { use } = require("react");

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

async function createUser(dbData) {
  //console.log("Model received:", dbData);
  let {
    OfficerName,
    OfficerUsername,
    OfficerPasswordHashed,
    OfficerContactNo,
    OfficerRoles,
    OfficerStatus,
  } = dbData;
  let connection;

  try {
    connection = await sql.connect(dbConfig);

    // 1. Check if username already exists
    const usernameCheckQuery = `
      SELECT OfficerName, OfficerContactNo, OfficerUsername, OfficerRoles
      FROM NEA_Officer
      WHERE OfficerUsername = @OfficerUsername
    `;

    const usernameRequest = connection.request();
    usernameRequest.input("OfficerUsername", sql.VarChar, OfficerUsername);

    const usernameResult = await usernameRequest.query(usernameCheckQuery);

    if (usernameResult.recordset.length > 0) {
      return { errorType: "EXISTS" };
    }

    // 2. Calculate the next custom OfficerID (e.g., 'OFF011')
    const maxIdRequest = connection.request();
    const maxIdResult = await maxIdRequest.query(`
      SELECT MAX(OfficerID) AS maxId FROM NEA_Officer
    `);

    const maxIdStr = maxIdResult.recordset[0].maxId;
    let nextOfficerID = "OFF001"; // Fallback if database is empty

    if (maxIdStr) {
      const currentNumber = parseInt(maxIdStr.substring(3), 10); // Extracts '010' -> 10
      const nextNumber = currentNumber + 1; // 10 -> 11
      nextOfficerID = "OFF" + String(nextNumber).padStart(3, "0"); // 11 -> 'OFF011'
    }
    // 3. Insert Query (No SCOPE_IDENTITY() since we generate the ID manually)
    const query = `
      INSERT INTO NEA_Officer (
        OfficerID, 
        OfficerName, 
        OfficerUsername, 
        OfficerPasswordHashed, 
        OfficerContactNo, 
        OfficerRoles, 
        OfficerStatus
      ) 
      VALUES (
        @OfficerID, 
        @OfficerName, 
        @OfficerUsername, 
        @OfficerPasswordHashed, 
        @OfficerContactNo, 
        @OfficerRoles, 
        @OfficerStatus
      );
    `;

    const request = connection.request();

    // Reassigning fallback
    OfficerStatus = OfficerStatus || "Active";

    // Bind inputs
    request.input("OfficerID", sql.Char(6), nextOfficerID);
    request.input("OfficerName", sql.VarChar, OfficerName);
    request.input("OfficerUsername", sql.VarChar, OfficerUsername);
    request.input("OfficerPasswordHashed", sql.VarChar, OfficerPasswordHashed);
    request.input("OfficerContactNo", sql.VarChar, OfficerContactNo);
    request.input("OfficerRoles", sql.VarChar(11), OfficerRoles);
    request.input("OfficerStatus", sql.VarChar(10), OfficerStatus);

    await request.query(query);

    return {
      OfficerID: nextOfficerID,
      OfficerName,
      OfficerUsername,
      OfficerContactNo,
      OfficerRoles,
      OfficerStatus,
    };

    return newUser;
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

async function updateUsersStatus(username, OfficerStatus) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);

    const query =
      "UPDATE NEA_Officer SET OfficerStatus = @OfficerStatus WHERE OfficerUsername = @OfficerUsername; " +
      "SELECT * FROM NEA_Officer WHERE OfficerUsername = @OfficerUsername";

    const request = connection.request();

    request.input("OfficerUsername", username);
    request.input("OfficerStatus", OfficerStatus.OfficerStatus);

    const result = await request.query(query);

    return result.recordset[0];
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function deleteOfficerById(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const request = connection.request();
    request.input("OfficerID", id);
    //console.log("DELETE ID:", id);
    const query = "DELETE FROM NEA_Officer WHERE OfficerID  = @OfficerID ";

    const result = await request.query(query);

    if (result.rowsAffected[0] === 0) {
      return null; // Officer not found
    }
    return true;

    return {
      id: id,
      OfficerName,
      OfficerContactNo,
      OfficerUsername,
      OfficerRoles,
    };
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

async function getOfficerById(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query =
      "SELECT OfficerID, OfficerName, OfficerContactNo, OfficerUsername, OfficerRoles, OfficerStatus FROM NEA_Officer WHERE OfficerID = @OfficerID";
    const request = connection.request();
    request.input("OfficerID", id);
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return null; // Officer not found
    }

    return result.recordset[0];
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

async function registerUser(req, res) {
  //same as createUser
  const { username, password, role, status } = req.body;

  try {
    // Validate user data
    // ... your validation logic here ...
    if (
      !req.body.username ||
      req.body.username.trim() === "" ||
      username.length < 1 ||
      username.length > 255 ||
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

    if (!password || req.body.password.trim() === "" || password.length < 8) {
      return res.status(400).json({
        message: "Password format is invalid or less than 8 characters.",
      });
    }

    if (
      req.body.role !== "Health" &&
      req.body.role !== "Inspection" &&
      req.body.role !== "Compliance" &&
      req.body.role !== "Enforcement" &&
      req.body.role !== "Operations"
    ) {
      return res.status(400).json({ message: "Role is invalid" });
    }

    if (
      req.body.status !== "Active" &&
      req.body.status !== "Suspended" &&
      req.body.status !== "Inactive" &&
      req.body.status !== "Resigned"
    ) {
      return res.status.json({ message: "Status is invalid" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12); //more secure 10-> 12
    const hashedPassword = await bcrypt.hash(password, salt);

    const passwordHash = req.body.password;

    let connection;

    try {
      connection = await sql.connect(dbConfig);
      const usernameInput = req.body.username;
      const usernameCheckQuery = `
    SELECT OfficerUsername
    FROM NEA_Officer
    WHERE OfficerUsername = @OfficerUsername
`;
      const usernameRequest = connection.request();

      usernameRequest.input("OfficerUsername", sql.VarChar, usernameInput);

      const usernameResult = await usernameRequest.query(usernameCheckQuery);

      if (usernameResult.recordset.length > 0) {
        return res.status(400).json({
          message: "Username already exists",
        });
      }

      const query =
        "INSERT INTO  NEA_Officer (OfficerID, OfficerUsername, OfficerPasswordHashed, OfficerRoles, ) VALUES (@OfficerID, @OfficerUsername, @OfficerPasswordHashed, @OfficerRoles, @OfficerStatus); ";

      const request = connection.request();

      request.input("OfficerID", sql.VarChar, OfficerID);
      request.input("OfficerUsername", sql.VarChar, OfficerUsername);
      request.input("OfficerPasswordHashed", sql.VarChar, hashedPassword);
      request.input("role", sql.VarChar(11), OfficerRoles);
      request.input("status", sql.VarChar(10), OfficerStatus); //tightly coupled
      const result = await request.query(query);

      const newUserId = result.recordset[0].OfficerID;

      const newUser = await getUserById(newUserId);

      // return created user (fixing your function name mismatch)

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
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message }); // err.message is application error not system error (checked with ai upon this)
  }
}

module.exports = {
  getAllUsers,
  createUser,
  updateUsersStatus,
  deleteOfficerById,
  getOfficerById,
  registerUser,
};
