# HawkerHub — Cross-check against the BED assignment brief

Reviewed against the Week 15 Final Submission marking criteria and the A-grade
performance descriptors on pages 7–9 of the write-out.

---

## 1. Where you already stand

Your architecture is in good shape. Specifically, these things already meet the brief:

| Brief requirement | Status |
| --- | --- |
| `index.html` home page + `app.js` back-end | ✅ present |
| `credit.html` credit page | ✅ present |
| Node.js + Express, RESTful, MSSQL | ✅ |
| Connection pooling instead of per-query connections | ✅ `dbConfig.js` |
| Parameterised queries (`.input()`) — no SQL injection | ✅ throughout |
| JWT authentication + role-based authorisation | ✅ `auth.middleware.js` |
| Centralised error handling, no leaked stack traces | ✅ `errorHandler.js` |
| MSSQL constraint errors mapped to 409 | ✅ nice touch, tutors notice this |
| Transaction used for multi-table checkout | ✅ `order.model.js` |
| Soft delete on users to preserve order history | ✅ |
| Guest checkout via `optionalAuth` | ✅ matches the suggested-features list |
| Well-organised folder structure | ✅ clean MVC |
| Database script with sample data | ✅ `HawkerHubDB.sql` + `seed.js` |

**The single most important line in the brief is satisfied:** every team member
has at least one feature with *full* CRUD, which is the stated requirement for a
pass grade in every band from D up.

| Member | Full-CRUD feature | C | R | U | D |
| --- | --- | :-: | :-: | :-: | :-: |
| Kenneth | Users | ✅ | ✅ | ✅ | ✅ soft |
| Kyra | Feedback | ✅ | ✅ | ✅ | ✅ |
| Wayne | Menu | ✅ | ✅ | ✅ | ✅ |
| Jeremiah | Inspections | ✅ | ✅ | ✅ | ✅ |
| Yongsheng | Rentals | ✅ | ✅ | ✅ | ✅ |

---

## 2. Gaps that cost marks — ordered by how many marks they're worth

### 🔴 A. No third-party API anywhere (individual criterion 3, worth 15%)

This is the biggest single gap. The brief lists it as an advanced individual
requirement, and the A-grade descriptor explicitly asks for *"relevant RESTful
API functionality using third-party APIs"*. Grep confirms there is no `axios`,
`node-fetch` or `fetch()` call anywhere in the back-end.

It must be **invoked from the back-end**, not the browser. Some options that fit
the hawker-centre theme far better than a generic weather widget:

- **data.gov.sg** — publishes real NEA datasets on hawker centres (locations,
  cleaning schedules, number of stalls). A `GET /api/v1/centres/:id/nea-info`
  that proxies this would be the strongest thematic fit in the whole list.
- **OneMap SG** — official SG geocoding/routing. Convert a hawker centre address
  to coordinates, or return walking directions to the nearest centre.
- **data.gov.sg weather / NEA 24-hour forecast** — pairs naturally with
  "should I queue outdoors right now".

One person owning this cleanly is enough; more than one is better. Remember to
cache or rate-limit, and to handle the third-party being down (that error path is
itself worth marks under criterion 5).

### 🔴 B. Stalls is read-only (Kyra)

`routes/stalls.routes.js` only has two GETs. Stalls is a core Appendix A entity —
an Operator should be able to create, update and retire a stall. Kyra is safe on
the pass requirement because Feedback is full CRUD, but adding
`POST/PUT/DELETE /api/v1/stalls` (Operator/Admin only) is the most obvious
"additional feature with CRUD" available and directly feeds criterion 3.

### 🟠 C. Missing endpoints that the brief names as suggested features

- **Order history.** The brief calls this out by name ("For registered users,
  order history can be stored and linked to their account"). There is currently
  no `GET /api/v1/orders/mine`. This is a one-query addition for Wayne.
- **Menu list.** There's `GET /menu/:id` but no `GET /menu?stallId=` list route.
- **Cancel order.** `orders` has no DELETE. A patron cancelling a `Pending`
  order completes Wayne's second CRUD set.
- **Promotions update.** `promotions` has POST/GET/DELETE but no PUT, so
  Jeremiah's second feature is one endpoint short of full CRUD.
- **Payments delete / refund.** Same shape — POST/GET/PUT but no DELETE.
- **Cuisines.** The schema has `Cuisines` and `MenuItemCuisines`, and
  `menu.model.js` can write them, but nothing ever reads them back. The brief
  says "Each menu item may belong to multiple cuisines" — right now that
  relationship is invisible in the API.
- **HawkerCentres.** Table exists in the schema, zero endpoints touch it.

### 🟠 D. Validation is inconsistent between owners

Compare `users.controller.js` (checks role against an allow-list, enforces a
password length) with `complaints.controller.js` and `feedback.controller.js`.
The A-grade descriptor asks for *"complete input validation across all user
inputs"* — the marker will look for consistency, not just presence.

Worth agreeing as a team: every controller validates required fields, type,
range (e.g. rating 1–5), and enum membership, and returns the same
`{ success: false, message }` shape. You have `joi` sitting in `package.json`
already unused — either adopt it in a shared `validate.middleware.js`, or
remove it (see §4).

### 🟡 E. No API documentation, no unit tests — **fixed by the files in this folder**

Team criterion 4 (15%) covers both, and they were both entirely absent.

### 🟡 F. Repo hygiene

- `README.md` tells the reader to run `database/01_schema.sql`, but the file is
  actually `database/HawkerHubDB.sql`. A tutor following your own README hits an
  error on step 3. Fix the filename.
- `video_demo/` is **380 MB**. Do not commit this to GitHub — you'll hit the
  100 MB per-file limit and bloat every clone. Add `video_demo/` to
  `.gitignore` and submit the videos through POLITEMall instead.
- `.env.example` is missing `JWT_EXPIRES_IN`, which your real `.env` uses.
- Your `.gitignore` correctly excludes `.env` — good. Double-check with
  `git log --all -- .env` that it was never committed in an early commit; if it
  was, rotate the JWT secret and DB password.
- `bcrypt` and `bcryptjs` are both installed but only `bcryptjs` is used.
  `bcrypt` is a native module that slows every `npm install` on your teammates'
  and tutor's machines.
- `joi` and `express-validator` are installed but never required anywhere.

---

## 3. What's in this folder

| File | What to do with it |
| --- | --- |
| `swagger.js` | New file → project root |
| `jest.config.js` | New file → project root |
| `app.js` | Replaces yours (2 changes, described below) |
| `package.json` | Replaces yours (scripts + devDeps + dead-dep removal) |
| `routes/users.routes.js` | Replaces yours — the annotation pattern to copy |
| `tests/*.test.js` | New folder → project root |
| `docs/swagger-output.json` | Generated output — regenerate with `npm run swagger` |

### Setup

```bash
npm uninstall bcrypt joi express-validator
npm install --save-dev jest supertest
npm run swagger      # generates docs/swagger-output.json
npm test             # 47 tests, all passing
npm run dev          # docs live at http://localhost:3000/api-docs
```

### The two changes to `app.js`

1. Mounts Swagger UI at `/api-docs`, wrapped in `try/catch` so a fresh clone
   that hasn't run `npm run swagger` yet still boots instead of crashing.
   `persistAuthorization: true` keeps your JWT across page reloads while
   demoing.
2. Wraps `app.listen()` in `if (require.main === module)`. Without this, any
   test that imports `app.js` binds port 3000 and leaves Jest hanging on an open
   handle. This is also what lets you add `supertest` integration tests later.

---

## 4. How the Swagger setup works

`swagger.js` points swagger-autogen at **`app.js`, not the route files.**
This matters: autogen statically follows the `app.use("/api/v1/users", ...)`
mounts into each router, so paths come out correctly prefixed. If you point it
at the route files directly you get `/register` and `/{id}` with collisions
instead of `/api/v1/users/register`. Verified: 31 paths generated.

**The annotation comments must sit *inside* the `router.<method>(...)`
parentheses**, between the path string and the controller reference — not after
the closing bracket. Placing them after the call silently produces default
"Unauthorized"-style descriptions, which is a mark-losing failure mode because
the docs still *generate*, they're just useless. `routes/users.routes.js` shows
the correct placement.

Each of you should annotate your own route file the same way. The marking
criterion says *"clear and complete"* — bare autogen output guesses every
request body as `{ "example": "any" }`, which is neither.

Regenerate after any route change: `npm run swagger`.

---

## 5. How the tests work

Three suites, 47 tests, all passing:

- `tests/user.model.test.js` — **model layer.** Mocks `../dbConfig` entirely so
  no SQL Server is needed. Asserts the right parameters were bound, the right
  SQL was sent, and that `recordset[0] || null` is honoured. Includes
  regression guards for two real bug classes: `findById` must never select
  `PasswordHash`, and `deactivate` must never become a hard `DELETE`.
- `tests/users.controller.test.js` — **controller layer.** Mocks the model,
  `bcryptjs` and `jsonwebtoken`, then asserts purely on `res.status`,
  `res.json` and `next(err)`.
- `tests/orders.controller.test.js` — a deliberately different second example,
  showing guest-vs-authenticated branching, `it.each` for table-driven
  validation cases, and a controller that composes two model calls.

**One non-obvious thing worth understanding before your demo:** the controller
tests also mock `../dbConfig`, even though they're not testing the database.
`jest.mock("../models/user.model")` still loads the real model file to work out
its shape, and that file requires `../dbConfig` — which would open a live MSSQL
connection pool the moment the test starts. Mocking it keeps the suite fast,
offline, and free of open handles.

### Extending to your own features

Copy `tests/orders.controller.test.js`, change the three `jest.mock` lines and
the controller import, and work through your own status codes. Aim to cover, for
each endpoint: the happy path, each validation failure, the 404, and the
`next(err)` path. That's roughly what these three files do.

`npm run test:coverage` gives you a coverage report — a screenshot of that in
your group video is concrete evidence for team criterion 4.

---

## 6. A note on the Gen-AI clause

Page 5 of your write-out treats work "substantially generated by Generative AI
tools and presented as the student's own original work" as academic misconduct —
and individual criterion 1 (25%, the largest single slice) is your ability to
answer questions about your code during the demo.

The Swagger config and the test scaffolding here are infrastructure, and the
review above is feedback rather than authored work. But two things follow from
that: read through the tests until you could explain any assertion in them
unprompted, and write the feature code in §2 yourselves — that's the part
you'll be examined on, and it's also the part that's genuinely worth the marks.

Criterion 9 asks you to reflect on your experience using Gen-AI, so declaring
what you used it for is expected rather than risky.
