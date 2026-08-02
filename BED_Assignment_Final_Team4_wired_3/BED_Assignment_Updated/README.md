HawkerHub Back-End API

HawkerHub is a comprehensive Back-End Management System designed to digitalize and preserve the vibrant heritage of local hawker centres. Built for the Back-End Development (BED) module, this RESTful API seamlessly bridges the gap between patrons, vendors, and managing operators to modernize the community dining experience.

Core Technologies
Runtime Environment: Node.js

Web Framework: Express.js

Database: Microsoft SQL Server (MSSQL)

Architecture: Model-View-Controller (MVC) Pattern

1. Local Development Setup
   Follow these steps to spin up the local development environment:

Install Dependencies: Run npm install to grab all required packages.

Environment Configuration: Duplicate the .env.example file, rename it to .env, and populate it with your local SQL Server credentials and a secure JWT secret.

Database Initialization: Execute the schema script via SSMS, Azure Data Studio, or sqlcmd:
sqlcmd -S localhost -U sa -P YourPassword -i database/HawkerHubDB.sql

Seed the Database: Populate the tables with sample data (passwords are automatically hashed via bcrypt):
node database/seed.js

Boot the Server: Use npm run dev to start the server with nodemon for hot-reloading.

Note: The server defaults to http://localhost:3000. The integrated front-end demo is accessible at /index.html, and asset credits are listed at /credit.html.

2. Architectural Overview
   The codebase strictly adheres to the MVC design pattern to ensure a clean separation of concerns:

models/ (Data Layer): Exclusively handles raw SQL queries and database interactions.

controllers/ (Logic Layer): Processes incoming HTTP requests, validates payloads, interacts with the models, and structures the JSON responses.

routes/ (Routing Layer): Maps API endpoints to their respective controller functions.

This separation guarantees that our HTTP logic never leaks into our database queries, making the application highly scalable and ensuring that each layer remains independently testable.

3. Team Allocation & Architecture Ownership

To fulfill the module's individuality requirements, the backend architecture is segmented. While each member holds ownership over their respective database tables and HTTP controllers, the core server infrastructure, global middlewares, and master database schema were architected and standardized by the Tech Lead to ensure structural integrity.

| Member | Project Role | Feature Implementation | Core Tables |
| **Yongsheng** | **Tech Lead** | **Architecture, Global Routing, Rentals, Analytics & NEA Open Data (third-party API)** | `RentalAgreements`, `ItemLikes` |
| **Kenneth** | Backend Developer | Account Management & Secure Payments | `Users`, `Payments` |
| **Kyra** | Backend Developer | Public Menu Browsing & Feedback Systems | `Stalls`, `Feedback`, `Complaints` |
| **Wayne** | Backend Developer | Vendor Menu Management & Checkout, Cuisines Lookup | `MenuItems`, `Orders`, `OrderItems`, `Cuisines` |
| **Jeremiah**| Backend Developer | NEA Hygiene Tracking & Vendor Promotions | `Inspections`, `Promotions` |

**Core Infrastructure Setup (Led by Yongsheng):**

- Designed the centralized `HawkerHubDB.sql` relational database structure, incorporating schema requirements from all feature owners.
- Configured the MSSQL connection pool (`dbConfig.js`) and Express server initialization (`app.js`).
- Standardized the team's MVC design pattern and developed the `seed.js` data automation script alongside peer input.

4. API Endpoints & Testing
   The base URL for all endpoints is /api/v1. Route authorization is handled securely via JWT Bearer tokens.

Testing Protocol:
A complete Postman collection is included in the repository (docs/HawkerHub.postman_collection.json). To test protected routes, authenticate via POST /users/login using one of the seeded demonstration accounts (e.g., susan.lim@operator.sg or ahhock@stall.sg) with the default password Password123!.

5. API Documentation & Automated Tests

Interactive Swagger/OpenAPI docs are generated from the route annotations and served at http://localhost:3000/api-docs once the server is running. Regenerate them after any route change with npm run swagger.

Automated tests (Jest + Supertest) live in the tests/ folder and mock the database layer, so they run without a live SQL Server connection:
npm test runs the full suite; npm run test:coverage adds a coverage report.
