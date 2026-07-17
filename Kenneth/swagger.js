const swaggerAutogen = require("swagger-autogen")();

const outputFile = "./swagger-output.json"; // Output file for the spec
const routes = ["./app.js"]; // Path to your API route files

const doc = {
  info: {
    title: "NEA Officer API",
    description: "API documentation",
  },
  host: "localhost:3000",
  schemes: ["http"],
};

swaggerAutogen(outputFile, routes, doc);
