/*
Owner: Team
Generates docs/swagger-output.json by statically scanning every route file.

Run:  npm run swagger        (regenerate after adding/changing endpoints)
View: http://localhost:3000/api-docs

NOTE: this script does not start the server or touch the database - it only
reads the route files, so it is safe to run any time.
*/

const swaggerAutogen = require("swagger-autogen")({ openapi: "3.0.0" });

const doc = {
  info: {
    title: "HawkerHub API",
    version: "1.0.0",
    description:
      "RESTful API for the HawkerHub Singapore Hawker Centre Management System. " +
      "Protected endpoints require a JWT: call POST /api/v1/users/login, copy the " +
      "token from the response, then click Authorize above and paste it.",
  },
  servers: [{ url: "http://localhost:3000", description: "Local development" }],
  tags: [
    { name: "Users", description: "Account management, login, profiles (Kenneth)" },
    { name: "Payments", description: "Order payment records (Kenneth)" },
    { name: "Stalls", description: "Public browsing of stalls and menus (Kyra)" },
    { name: "Feedback", description: "Patron ratings and comments (Kyra)" },
    { name: "Complaints", description: "Formal complaints against stalls (Kyra)" },
    { name: "Menu", description: "Vendor menu item CRUD (Wayne)" },
    { name: "Orders", description: "Cart checkout and order status (Wayne)" },
    { name: "Inspections", description: "NEA inspections and hygiene grades (Jeremiah)" },
    { name: "Promotions", description: "Stall promotions (Jeremiah)" },
    { name: "Rentals", description: "Rental agreement tracking (Yongsheng)" },
    { name: "Likes", description: "Likes on individual menu items (Yongsheng)" },
    { name: "Analytics", description: "Sales and performance analytics (Yongsheng)" },
    { name: "Centres", description: "NEA hawker centre open data via data.gov.sg (third-party API)" },
    { name: "Cuisines", description: "Cuisine lookup for menu item categorisation (Wayne)" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      // Reusable response shapes -- reference these from route comments with
      // #/components/schemas/<Name> so the docs stay consistent.
      SuccessResponse: {
        success: true,
        message: "Operation completed successfully.",
        data: {},
      },
      ErrorResponse: {
        success: false,
        message: "A human-readable explanation of what went wrong.",
      },
      RegisterRequest: {
        $name: "Kenneth Lim",
        $email: "kenneth@np.edu.sg",
        $password: "Password123!",
        $role: "Patron",
        phone: "91234567",
      },
      LoginRequest: {
        $email: "kenneth@np.edu.sg",
        $password: "Password123!",
      },
      MenuItemRequest: {
        $stallId: 1,
        $itemName: "Chicken Rice",
        description: "Steamed chicken with fragrant rice",
        $price: 4.5,
        category: "Main",
        cuisineIds: [1, 2],
        imageUrl: "https://example.com/chicken-rice.jpg",
      },
      OrderRequest: {
        $stallId: 1,
        $items: [{ itemId: 1, quantity: 2 }],
      },
      FeedbackRequest: {
        $stallId: 1,
        $rating: 5,
        comments: "Very tasty and the stall was clean.",
      },
    },
  },
};

const outputFile = "./docs/swagger-output.json";

// Point swagger-autogen at app.js. It statically follows the app.use() mounts
// into each router file, so every path comes out correctly prefixed with
// /api/v1/... . (Pointing it at the route files directly loses the prefix.)
const routes = ["./app.js"];

swaggerAutogen(outputFile, routes, doc).then(() => {
  console.log("Swagger spec written to docs/swagger-output.json");
});
