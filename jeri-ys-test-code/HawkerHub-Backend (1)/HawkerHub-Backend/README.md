# HawkerHub Back-End — Singapore Hawker Centre Management System

Node.js + Express + Microsoft SQL Server RESTful API for the BED
(Back-End Development) assignment. Front-end lives in `/public`
(your existing HawkerHub demo has been dropped in as `index.html`).

## 1. Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# then edit .env with your SQL Server credentials + a JWT secret

# 3. Create the database & tables (run in SSMS / Azure Data Studio,
#    or via sqlcmd)
sqlcmd -S localhost -U sa -P YourPassword -i database/01_schema.sql

# 4. Load sample/demo data (hashes passwords properly via bcrypt)
node database/seed.js

# 5. Start the server
npm start          # production
npm run dev         # auto-restart on changes (nodemon)
```

Server runs at `http://localhost:3000`. Front-end is served at
`http://localhost:3000/index.html`, credits page at `/credit.html`.

All seeded demo accounts share the password **`Password123!`**
e.g. `jonathan@example.com` (Patron), `ahhock@stall.sg` (Vendor),
`officer.tan@nea.gov.sg` (NEA Officer), `susan.lim@operator.sg` (Operator).

## 2. Folder Structure (MVC)

```
HawkerHub-Backend/
├── app.js                  # main entry point (mounts all routes, starts server)
├── dbConfig.js              # MSSQL connection pool
├── package.json
├── .env.example
├── models/                   # DATA ACCESS ONLY - raw SQL queries, no req/res
│   ├── user.model.js
│   ├── payment.model.js
│   ├── stall.model.js
│   ├── feedback.model.js
│   ├── complaint.model.js
│   ├── menu.model.js
│   ├── order.model.js
│   ├── inspection.model.js
│   ├── promotion.model.js
│   ├── rental.model.js
│   ├── like.model.js
│   └── analytics.model.js
├── controllers/               # HTTP LAYER ONLY - parses req, calls a model, sends res
│   └── (one file per feature, same names as models)
├── routes/                    # maps URLs -> controller functions
│   └── (one file per feature, same names as models)
├── middlewares/
│   ├── auth.middleware.js      # JWT verify / role guard / optional auth
│   └── errorHandler.js         # centralised error responses
├── database/
│   ├── 01_schema.sql           # CREATE DATABASE + all tables/constraints
│   └── seed.js                 # sample data loader (hashes passwords)
└── public/
    ├── index.html               # front-end (HawkerHub demo)
    └── credit.html               # image/library credits
```

**Why this split matters:** `models/` never sees `req`/`res` — it only takes
plain arguments and returns plain data. `controllers/` never writes raw SQL —
it only validates input, calls a model function, and shapes the HTTP
response. This is the classic MVC separation of concerns and keeps each
layer independently testable.

## 3. Team & Individual Feature Ownership

Each member owns a distinct database table / CRUD feature so work is
clearly distinguishable, per the assignment's individuality requirement.

| Member    | Feature (User Story)                         | Table(s)                     | Endpoints |
|-----------|-----------------------------------------------|-------------------------------|-----------|
| Kenneth   | Account Management (US2)                       | `Users`                       | `routes/users.routes.js` |
| Kenneth   | Payment Confirmation / Multi Payment (US8, US9)| `Payments`                    | `routes/payments.routes.js` |
| Kyra      | Browse Stalls & Menu (US1)                     | `Stalls`, `MenuItems`         | `routes/stalls.routes.js` |
| Kyra      | Patron Feedback (US5)                          | `Feedback`                    | `routes/feedback.routes.js` |
| Kyra      | Lodge Customer Complaint (US13)                | `Complaints`                  | `routes/complaints.routes.js` |
| Wayne     | Vendor Menu CRUD (US6)                         | `MenuItems`, `MenuItemCuisines`| `routes/menu.routes.js` |
| Wayne     | Add to Cart & Checkout (US3)                   | `Orders`, `OrderItems`        | `routes/orders.routes.js` |
| Jeremiah  | NEA Hygiene Inspections & Grades (US4, US12)   | `Inspections`, `HygieneGrades`| `routes/inspections.routes.js` |
| Jeremiah  | Vendor Promotions (US14)                       | `Promotions`                  | `routes/promotions.routes.js` |
| Yongsheng | Vendor Rental Tracking (US7)                   | `RentalAgreements`            | `routes/rentals.routes.js` |
| Yongsheng | Item Likes (US10)                              | `ItemLikes`                   | `routes/likes.routes.js` |
| Yongsheng | Operator Sales Analytics (US11)                | `Orders`, `OrderItems`        | `routes/analytics.routes.js` |

Each feature area has 3 matching files: `models/X.model.js` (SQL),
`controllers/X.controller.js` (HTTP logic), `routes/X.routes.js` (URL mapping).

Each member has at least one **GET** and one **POST/PUT/DELETE** route,
satisfying the Checkpoint requirement.

## 4. API Quick Reference

Base URL: `/api/v1`

### Auth (Kenneth)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/users/register` | – | Create account |
| POST | `/users/login` | – | Login, returns JWT |
| GET  | `/users/profile` | JWT | Get own profile |
| PUT  | `/users/profile` | JWT | Update own profile |
| GET  | `/users/:id` | JWT (Admin/Operator) | Get user by id |
| DELETE | `/users/:id` | JWT (Admin) | Deactivate account |

### Payments (Kenneth)
| POST | `/payments` | JWT | Pay for an order |
| GET | `/payments/:orderId` | JWT | Get payment status |
| PUT | `/payments/:id` | JWT | Update payment status |

### Stalls & Menu Browsing (Kyra)
| GET | `/stalls` | – | List all stalls |
| GET | `/stalls/:id` | – | Stall detail + full menu |

### Feedback (Kyra)
| POST | `/feedback` | JWT (Patron) | Submit feedback |
| GET | `/feedback/stall/:id` | – | List feedback for a stall |
| PUT | `/feedback/:id` | JWT (Patron) | Edit own feedback |
| DELETE | `/feedback/:id` | JWT (Patron/Admin) | Delete own feedback |

### Complaints (Kyra)
| POST | `/complaints` | JWT (Patron) | Lodge a complaint |
| GET | `/complaints/mine` | JWT (Patron) | View own complaints |
| PUT | `/complaints/:id` | JWT (Operator/Admin) | Update complaint status |

### Vendor Menu CRUD (Wayne)
| POST | `/menu` | JWT (Vendor) | Add menu item |
| GET | `/menu/:id` | – | Get menu item |
| PUT | `/menu/:id` | JWT (Vendor, owner only) | Update menu item |
| DELETE | `/menu/:id` | JWT (Vendor, owner only) | Delete menu item |

### Cart & Checkout (Wayne)
| POST | `/orders` | Optional JWT (guest or Patron) | Place an order |
| GET | `/orders/:id` | Optional JWT | View order + items |
| PUT | `/orders/:id` | JWT (Vendor) | Update order status |

### NEA Inspections & Hygiene Grades (Jeremiah)
| POST | `/inspections` | JWT (NEAOfficer) | Log inspection + auto-assign grade |
| GET | `/inspections/stall/:id` | – | Full inspection/grade history |
| PUT | `/inspections/:id` | JWT (NEAOfficer, own record) | Amend inspection |
| DELETE | `/inspections/:id` | JWT (NEAOfficer, own record) | Delete inspection |

### Promotions (Jeremiah)
| POST | `/promotions` | JWT (Vendor) | Create promotion |
| GET | `/promotions/stall/:id` | – | List promotions for a stall |
| DELETE | `/promotions/:id` | JWT (Vendor, owner only) | End a promotion |

### Rental Agreements (Yongsheng)
| POST | `/rentals` | JWT (Operator/Admin) | Create/renew agreement |
| GET | `/rentals/stall/:id` | JWT (Operator/Vendor/Admin) | Rental history |
| PUT | `/rentals/:id` | JWT (Operator/Admin) | Update agreement |
| DELETE | `/rentals/:id` | JWT (Operator/Admin) | Delete agreement |

### Item Likes (Yongsheng)
| PUT | `/likes/:itemId` | JWT (Patron) | Toggle like on/off |
| GET | `/likes/:itemId` | – | Get like count |

### Sales Analytics (Yongsheng)
| GET | `/analytics/sales/:stallId` | JWT (Operator/Vendor/Admin) | Revenue, popular items, peak hours |

## 5. Testing with Postman

1. Import the collection at `docs/HawkerHub.postman_collection.json`
   (or manually hit the endpoints above).
2. `POST /api/v1/users/login` with a seeded account to get a JWT.
3. Add header `Authorization: Bearer <token>` to any protected route.
4. Each teammate should record a short Postman screen-capture per
   assignment's checkpoint video requirement, showing at least one
   GET and one POST/PUT/DELETE call succeeding (with real DB rows
   returned) as evidence of testing.

## 6. Notes for the Team

- Everyone works out of `/routes` and `/controllers` in their **own
  file(s)** (see ownership table above) to avoid merge conflicts —
  create a feature branch per person, e.g. `feature/kenneth-users`.
- `config/db.js` and `middleware/*` are shared infrastructure — please
  discuss in the group chat before changing them.
- Remember to **never commit your real `.env` file** (already in
  `.gitignore`).
