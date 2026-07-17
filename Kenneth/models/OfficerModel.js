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

async function createUser(dbData) {
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
    request.input("OfficerRoles", sql.VarChar(255), OfficerRoles);
    request.input("OfficerStatus", sql.VarChar(255), OfficerStatus);

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

module.exports = {
  getAllUsers,
  createUser,
};
