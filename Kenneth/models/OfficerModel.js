const sql = require("mssql");
const dbConfig = require("../dbConfig");

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

module.exports = {
  getAllUsers,
};
