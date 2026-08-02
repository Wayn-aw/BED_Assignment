/*
Owner: Team

Loads sample data into HawkerHubDB, including securely-hashed
passwords (bcrypt). We seed via a Node script rather than raw SQL
INSERTs for the Users table specifically because password hashes
must never be hand-written/plaintext in a .sql file.

Usage:
1. npm install
2. copy .env.example -> .env and fill in your DB credentials
3. Run HawkerHubDB.sql (creates tables)
4. node database/seed.js

All demo accounts use the password: Password123!
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const bcrypt = require("bcryptjs");
const { sql, poolPromise } = require("../dbConfig");

const DEMO_PASSWORD = "Password123!";

async function seed() {
  const pool = await poolPromise;
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  console.log("Clearing existing data...");
  await pool.request().query(`
    DELETE FROM HygieneGrades;
    DELETE FROM Inspections;
    DELETE FROM Complaints;
    DELETE FROM ItemLikes;
    DELETE FROM Feedback;
    DELETE FROM Payments;
    DELETE FROM OrderItems;
    DELETE FROM Orders;
    DELETE FROM Promotions;
    DELETE FROM MenuItemCuisines;
    DELETE FROM MenuItems;
    DELETE FROM Cuisines;
    DELETE FROM RentalAgreements;
    DELETE FROM Stalls;
    DELETE FROM HawkerCentres;
    DELETE FROM Users;
    DBCC CHECKIDENT ('Users', RESEED, 0);
    DBCC CHECKIDENT ('HawkerCentres', RESEED, 0);
    DBCC CHECKIDENT ('Stalls', RESEED, 0);
    DBCC CHECKIDENT ('RentalAgreements', RESEED, 0);
    DBCC CHECKIDENT ('Cuisines', RESEED, 0);
    DBCC CHECKIDENT ('MenuItems', RESEED, 0);
    DBCC CHECKIDENT ('Promotions', RESEED, 0);
    DBCC CHECKIDENT ('Orders', RESEED, 0);
    DBCC CHECKIDENT ('OrderItems', RESEED, 0);
    DBCC CHECKIDENT ('Payments', RESEED, 0);
    DBCC CHECKIDENT ('Feedback', RESEED, 0);
    DBCC CHECKIDENT ('ItemLikes', RESEED, 0);
    DBCC CHECKIDENT ('Complaints', RESEED, 0);
    DBCC CHECKIDENT ('Inspections', RESEED, 0);
    DBCC CHECKIDENT ('HygieneGrades', RESEED, 0);
  `);

  console.log("Seeding Users...");
  const users = [
    ["NEA Officer Tan", "officer.tan@nea.gov.sg", "NEAOfficer"],
    ["Operator Susan Lim", "susan.lim@operator.sg", "Operator"],
    ["Vendor Ah Hock", "ahhock@stall.sg", "Vendor"],
    ["Vendor Mei Ling", "meiling@stall.sg", "Vendor"],
    ["Vendor Ramesh", "ramesh@stall.sg", "Vendor"],
    ["Patron Jonathan", "jonathan@example.com", "Patron"],
    ["Patron Aisyah", "aisyah@example.com", "Patron"],
    ["Patron Wei Jie", "weijie@example.com", "Patron"],
  ];
  const userIds = {};
  for (const [name, email, role] of users) {
    const result = await pool
      .request()
      .input("name", sql.VarChar, name)
      .input("email", sql.VarChar, email)
      .input("hash", sql.VarChar, hash)
      .input("role", sql.VarChar, role)
      .query(`INSERT INTO Users (Name, Email, PasswordHash, Role)
              OUTPUT INSERTED.UserID
              VALUES (@name, @email, @hash, @role)`);
    userIds[email] = result.recordset[0].UserID;
  }

  console.log("Seeding HawkerCentres...");
  const centreResult = await pool
    .request()
    .input("name", sql.VarChar, "Maxwell Food Centre")
    .input("address", sql.VarChar, "1 Kadayanallur St, Singapore 069184")
    .input("operatorId", sql.Int, userIds["susan.lim@operator.sg"])
    .query(`INSERT INTO HawkerCentres (Name, Address, OperatorID)
            OUTPUT INSERTED.CentreID
            VALUES (@name, @address, @operatorId)`);
  const centreId = centreResult.recordset[0].CentreID;

  console.log("Seeding Stalls...");
  const stalls = [
    ["Hock's Chicken Rice", "ahhock@stall.sg", "Classic Hainanese chicken rice.", "/images/chicken-rice.jpg"],
    ["Mei Ling Noodle House", "meiling@stall.sg", "Handmade noodles & wanton mee.", "/images/noodles.jpg"],
    ["Ramesh's Roti Corner", "ramesh@stall.sg", "Indian-Muslim roti prata & curries.", "/images/roti.jpg"],
  ];
  const stallIds = [];
  for (const [name, ownerEmail, desc, img] of stalls) {
    const r = await pool
      .request()
      .input("centreId", sql.Int, centreId)
      .input("ownerId", sql.Int, userIds[ownerEmail])
      .input("name", sql.VarChar, name)
      .input("desc", sql.VarChar, desc)
      .input("img", sql.VarChar, img)
      .query(`INSERT INTO Stalls (CentreID, OwnerID, StallName, Description, ImageURL)
              OUTPUT INSERTED.StallID
              VALUES (@centreId, @ownerId, @name, @desc, @img)`);
    stallIds.push(r.recordset[0].StallID);
  }
  const [stallChicken, stallNoodle, stallRoti] = stallIds;

  console.log("Seeding Cuisines...");
  const cuisineNames = ["Chinese", "Halal", "Indian", "Noodles", "Rice", "Vegetarian-Friendly"];
  const cuisineIds = {};
  for (const c of cuisineNames) {
    const r = await pool
      .request()
      .input("name", sql.VarChar, c)
      .query(`INSERT INTO Cuisines (Name) OUTPUT INSERTED.CuisineID VALUES (@name)`);
    cuisineIds[c] = r.recordset[0].CuisineID;
  }

  console.log("Seeding MenuItems...");
  const menuItems = [
    [stallChicken, "Chicken Rice (Regular)", "Steamed chicken with fragrant rice.", 4.5, "Main", ["Chinese", "Rice"]],
    [stallChicken, "Roasted Chicken Rice", "Roasted chicken with fragrant rice.", 5.0, "Main", ["Chinese", "Rice"]],
    [stallChicken, "Winter Melon Soup", "Light soup, refill available.", 1.5, "Side", ["Chinese"]],
    [stallNoodle, "Wanton Mee (Dry)", "Springy noodles with wanton dumplings.", 4.0, "Main", ["Chinese", "Noodles"]],
    [stallNoodle, "Wanton Mee (Soup)", "Noodles served in soup.", 4.0, "Main", ["Chinese", "Noodles"]],
    [stallNoodle, "Iced Lemon Tea", "House-brewed lemon tea.", 1.8, "Drink", ["Chinese"]],
    [stallRoti, "Roti Prata (Plain) x2", "Crispy prata with curry.", 2.5, "Main", ["Halal", "Indian"]],
    [stallRoti, "Roti Prata (Egg) x2", "Prata with egg filling.", 3.5, "Main", ["Halal", "Indian"]],
    [stallRoti, "Teh Tarik", "Pulled milk tea.", 1.8, "Drink", ["Halal", "Indian"]],
  ];
  const menuItemIds = [];
  for (const [stallId, name, desc, price, cat, cuisines] of menuItems) {
    const r = await pool
      .request()
      .input("stallId", sql.Int, stallId)
      .input("name", sql.VarChar, name)
      .input("desc", sql.VarChar, desc)
      .input("price", sql.Decimal(8, 2), price)
      .input("cat", sql.VarChar, cat)
      .query(`INSERT INTO MenuItems (StallID, ItemName, Description, Price, Category)
              OUTPUT INSERTED.ItemID
              VALUES (@stallId, @name, @desc, @price, @cat)`);
    const itemId = r.recordset[0].ItemID;
    menuItemIds.push(itemId);
    for (const c of cuisines) {
      await pool
        .request()
        .input("itemId", sql.Int, itemId)
        .input("cuisineId", sql.Int, cuisineIds[c])
        .query(`INSERT INTO MenuItemCuisines (ItemID, CuisineID) VALUES (@itemId, @cuisineId)`);
    }
  }

  console.log("Seeding RentalAgreements...");
  const today = new Date();
  const inOneYear = new Date(today);
  inOneYear.setFullYear(today.getFullYear() + 1);
  const lastYear = new Date(today);
  lastYear.setFullYear(today.getFullYear() - 1);
  for (const stallId of stallIds) {
    await pool
      .request()
      .input("stallId", sql.Int, stallId)
      .input("start", sql.Date, lastYear)
      .input("end", sql.Date, today)
      .input("rent", sql.Decimal(10, 2), 1200.0)
      .input("status", sql.VarChar, "Expired")
      .query(`INSERT INTO RentalAgreements (StallID, StartDate, EndDate, MonthlyRent, Status)
              VALUES (@stallId, @start, @end, @rent, @status)`);
    await pool
      .request()
      .input("stallId", sql.Int, stallId)
      .input("start", sql.Date, today)
      .input("end", sql.Date, inOneYear)
      .input("rent", sql.Decimal(10, 2), 1350.0)
      .input("status", sql.VarChar, "Active")
      .query(`INSERT INTO RentalAgreements (StallID, StartDate, EndDate, MonthlyRent, Status)
              VALUES (@stallId, @start, @end, @rent, @status)`);
  }

  console.log("Seeding Promotions...");
  await pool
    .request()
    .input("stallId", sql.Int, stallNoodle)
    .input("title", sql.VarChar, "Off-Peak 15% Discount")
    .input("pct", sql.Int, 15)
    .input("start", sql.DateTime, today)
    .input("end", sql.DateTime, inOneYear)
    .query(`INSERT INTO Promotions (StallID, Title, DiscountPercentage, StartDate, EndDate)
            VALUES (@stallId, @title, @pct, @start, @end)`);

  console.log("Seeding an Order + OrderItems + Payment...");
  const orderResult = await pool
    .request()
    .input("patronId", sql.Int, userIds["jonathan@example.com"])
    .input("stallId", sql.Int, stallChicken)
    .input("status", sql.VarChar, "Collected")
    .input("total", sql.Decimal(10, 2), 6.0)
    .query(`INSERT INTO Orders (PatronID, StallID, OrderStatus, TotalAmount)
            OUTPUT INSERTED.OrderID
            VALUES (@patronId, @stallId, @status, @total)`);
  const orderId = orderResult.recordset[0].OrderID;

  await pool
    .request()
    .input("orderId", sql.Int, orderId)
    .input("itemId", sql.Int, menuItemIds[0])
    .input("qty", sql.Int, 1)
    .input("price", sql.Decimal(8, 2), 4.5)
    .query(`INSERT INTO OrderItems (OrderID, ItemID, Quantity, UnitPrice)
            VALUES (@orderId, @itemId, @qty, @price)`);
  await pool
    .request()
    .input("orderId", sql.Int, orderId)
    .input("itemId", sql.Int, menuItemIds[2])
    .input("qty", sql.Int, 1)
    .input("price", sql.Decimal(8, 2), 1.5)
    .query(`INSERT INTO OrderItems (OrderID, ItemID, Quantity, UnitPrice)
            VALUES (@orderId, @itemId, @qty, @price)`);

  await pool
    .request()
    .input("orderId", sql.Int, orderId)
    .input("method", sql.VarChar, "PayNow")
    .input("amount", sql.Decimal(10, 2), 6.0)
    .input("status", sql.VarChar, "Success")
    .query(`INSERT INTO Payments (OrderID, PaymentMethod, Amount, PaymentStatus, PaidAt)
            VALUES (@orderId, @method, @amount, @status, GETDATE())`);

  console.log("Seeding Feedback...");
  await pool
    .request()
    .input("patronId", sql.Int, userIds["jonathan@example.com"])
    .input("stallId", sql.Int, stallChicken)
    .input("rating", sql.Int, 5)
    .input("comments", sql.VarChar, "Really fragrant rice, chicken was tender!")
    .query(`INSERT INTO Feedback (PatronID, StallID, Rating, Comments)
            VALUES (@patronId, @stallId, @rating, @comments)`);

  console.log("Seeding ItemLikes...");
  await pool
    .request()
    .input("patronId", sql.Int, userIds["aisyah@example.com"])
    .input("itemId", sql.Int, menuItemIds[6])
    .query(`INSERT INTO ItemLikes (PatronID, ItemID) VALUES (@patronId, @itemId)`);

  console.log("Seeding Complaints...");
  await pool
    .request()
    .input("patronId", sql.Int, userIds["weijie@example.com"])
    .input("stallId", sql.Int, stallNoodle)
    .input("desc", sql.VarChar, "Table was not cleared for a long time during peak hour.")
    .query(`INSERT INTO Complaints (PatronID, StallID, Description)
            VALUES (@patronId, @stallId, @desc)`);

  console.log("Seeding Inspections + HygieneGrades...");
  for (const [stallId, score, grade] of [
    [stallChicken, 92, "A"],
    [stallNoodle, 78, "B"],
    [stallRoti, 95, "A"],
  ]) {
    const insResult = await pool
      .request()
      .input("stallId", sql.Int, stallId)
      .input("officerId", sql.Int, userIds["officer.tan@nea.gov.sg"])
      .input("score", sql.Int, score)
      .input("remarks", sql.VarChar, "Routine inspection, standards observed.")
      .query(`INSERT INTO Inspections (StallID, OfficerID, Score, Remarks)
              OUTPUT INSERTED.InspectionID
              VALUES (@stallId, @officerId, @score, @remarks)`);
    const inspectionId = insResult.recordset[0].InspectionID;

    await pool
      .request()
      .input("inspectionId", sql.Int, inspectionId)
      .input("stallId", sql.Int, stallId)
      .input("grade", sql.Char(1), grade)
      .query(`INSERT INTO HygieneGrades (InspectionID, StallID, Grade)
              VALUES (@inspectionId, @stallId, @grade)`);
  }

  console.log("\n Seed complete!");
  console.log(`   All demo accounts share the password: ${DEMO_PASSWORD}`);
  console.log("   e.g. jonathan@example.com (Patron), ahhock@stall.sg (Vendor), officer.tan@nea.gov.sg (NEAOfficer)");
  process.exit(0);
}

seed().catch((err) => {
  console.error(" Seeding failed:", err);
  process.exit(1);
});
