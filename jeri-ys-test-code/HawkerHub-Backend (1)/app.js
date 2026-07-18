/**
 * app.js
 * Owner: Team (shared infrastructure)
 *
 * Main back-end entry point for HawkerHub - Singapore Hawker Centre
 * Management System. Wires up middleware, mounts every teammate's
 * RESTful API routes, serves the front-end (index.html / credit.html),
 * and starts the HTTP server.
 *
 * Run with: npm install && npm start   (or npm run dev with nodemon)
 */

const sql = require("mssql");
const dotenv = require("dotenv");
dotenv.config();
// require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const { errorHandler } = require("./middleware/errorHandler");

// ---- Route imports (one file per feature owner) ----
const usersRoutes = require("./routes/users.routes"); // Kenneth - Account Management
const paymentsRoutes = require("./routes/payments.routes"); // Kenneth - Payment Confirmation
const stallsRoutes = require("./routes/stalls.routes"); // Kyra    - Browse Stalls & Menu
const feedbackRoutes = require("./routes/feedback.routes"); // Kyra    - Patron Feedback
const complaintsRoutes = require("./routes/complaints.routes"); // Kyra  - Lodge Complaint
const menuRoutes = require("./routes/menu.routes"); // Wayne   - Vendor Menu CRUD
const ordersRoutes = require("./routes/orders.routes"); // Wayne   - Cart & Checkout
const inspectionsRoutes = require("./routes/inspections.routes"); // Jeremiah - NEA Inspections & Grades
const promotionsRoutes = require("./routes/promotions.routes"); // Jeremiah - Vendor Promotions
const rentalsRoutes = require("./routes/rentals.routes"); // Yongsheng - Rental Tracking
const likesRoutes = require("./routes/likes.routes"); // Yongsheng - Item Likes
const analyticsRoutes = require("./routes/analytics.routes"); // Yongsheng - Sales Analytics

const app = express();

/* ---------------------- Global Middleware ---------------------- */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev")); // request logging - handy evidence for the checkpoint demo video

/* ---------------------- Front-End (static) ----------------------
   Place your index.html, credit.html, css/, js/, images/ inside /public.
   The existing HawkerHub demo front-end can be dropped in here as-is. */
app.use(express.static(path.join(__dirname, "public")));

/* ------------------------- Health Check -------------------------- */
app.get("/api/v1/health", (req, res) => {
  res
    .status(200)
    .json({
      success: true,
      message: "HawkerHub API is running.",
      timestamp: new Date().toISOString(),
    });
});

/* --------------------------- API Routes --------------------------- */
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/payments", paymentsRoutes);
app.use("/api/v1/stalls", stallsRoutes);
app.use("/api/v1/feedback", feedbackRoutes);
app.use("/api/v1/complaints", complaintsRoutes);
app.use("/api/v1/menu", menuRoutes);
app.use("/api/v1/orders", ordersRoutes);
app.use("/api/v1/inspections", inspectionsRoutes);
app.use("/api/v1/promotions", promotionsRoutes);
app.use("/api/v1/rentals", rentalsRoutes);
app.use("/api/v1/likes", likesRoutes);
app.use("/api/v1/analytics", analyticsRoutes);

/* ------------------------- 404 fallback ---------------------------- */
app.use("/api", (req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

/* --------------------- Centralized Error Handler -------------------- */
app.use(errorHandler);

/* ------------------------------ Start ------------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 HawkerHub server running at http://localhost:${PORT}`);
});

module.exports = app;
