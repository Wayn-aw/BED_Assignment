/**
 * app.js
 * Owner: Team (shared infrastructure)
 *
 * Safe Plug-and-Play Version: Dynamic route loading that won't crash
 * if teammates haven't given you their files yet!
 */

const sql = require("mssql");
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs"); // Added to safely check for file existence

// 1. Load Error Handler Safely
let errorHandler = (err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ success: false, message: err.message || "Internal Server Error" });
};
const errorHandlerPath = "./middleware/errorHandler.js";
if (fs.existsSync(path.join(__dirname, errorHandlerPath))) {
  errorHandler =
    require(errorHandlerPath).errorHandler || require(errorHandlerPath);
}

const app = express();

/* ---------------------- Global Middleware ---------------------- */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use(express.static(path.join(__dirname, "public")));

/* ------------------------- Health Check -------------------------- */
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "HawkerHub API is running smoothly.",
    timestamp: new Date().toISOString(),
  });
});

/* --------------------------- API Routes --------------------------- */
// List all team routes and their paths
const teamRoutes = [
  { path: "/api/v1/users", file: "./routes/users.routes.js", owner: "Kenneth" },
  {
    path: "/api/v1/payments",
    file: "./routes/payments.routes.js",
    owner: "Kenneth",
  },
  { path: "/api/v1/stalls", file: "./routes/stalls.routes.js", owner: "Kyra" },
  {
    path: "/api/v1/feedback",
    file: "./routes/feedback.routes.js",
    owner: "Kyra",
  },
  {
    path: "/api/v1/complaints",
    file: "./routes/complaints.routes.js",
    owner: "Kyra",
  },
  { path: "/api/v1/menu", file: "./routes/menu.routes.js", owner: "Wayne" },
  { path: "/api/v1/orders", file: "./routes/orders.routes.js", owner: "Wayne" },
  {
    path: "/api/v1/inspections",
    file: "./routes/inspections.routes.js",
    owner: "Jeremiah",
  },
  {
    path: "/api/v1/promotions",
    file: "./routes/promotions.routes.js",
    owner: "Jeremiah",
  },
  {
    path: "/api/v1/rentals",
    file: "./routes/rentals.routes.js",
    owner: "Yongsheng",
  },
  {
    path: "/api/v1/likes",
    file: "./routes/likes.routes.js",
    owner: "Yongsheng",
  },
  {
    path: "/api/v1/analytics",
    file: "./routes/analytics.routes.js",
    owner: "Yongsheng",
  },
];

// Loop through and automatically load only the files that actually exist
teamRoutes.forEach((route) => {
  const fullPath = path.join(__dirname, route.file);
  if (fs.existsSync(fullPath)) {
    app.use(route.path, require(route.file));
    console.log(`✅ Loaded routes for ${route.path} (${route.owner})`);
  } else {
    console.log(`⚠️  Skipped ${route.path} (${route.owner}) - File not found.`);
  }
});

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
  console.log(`\n🚀 HawkerHub server running at http://localhost:${PORT}`);
});

module.exports = app;
