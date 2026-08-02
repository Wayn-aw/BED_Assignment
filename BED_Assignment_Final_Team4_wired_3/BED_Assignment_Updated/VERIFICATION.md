# Integration verification log

Everything below was run against this merged project after a clean
`rm package-lock.json && npm install`. Node 22, no database available.

| Check | Result |
| --- | --- |
| `node --check` on every `.js` file | all parse |
| Every module in `controllers/ models/ routes/ middlewares/ services/` requires cleanly | 41/41 |
| `npm run swagger` | 32 paths, 13 tags |
| `npm test` | **78 passed, 5 suites** |
| `npm start` boots with no database reachable | starts, does not crash |
| `GET /api/v1/health` | 200 |
| `GET /api-docs/` | 200 (Swagger UI renders) |
| `/index.html`, `/credit.html` | 200 |
| `GET /api/v1/stalls` with DB down | 500, generic message, no stack trace leaked |
| `GET /api/v1/centres/nea?limit=999` | 400, validation fired before the outbound call |
| `GET /api/v1/users/profile` with no token | 401 |
| Unknown `/api/...` route | 404 |
| Server still responding after all of the above | yes |

## One expected difference on your machine

The container this was verified in blocks outbound traffic to data.gov.sg, so
`GET /api/v1/centres/nea` returned:

```json
{"success":false,"message":"NEA open-data service returned an error (HTTP 403)."}
```

with HTTP 502. That is the error mapping working correctly against a genuine
upstream failure — it is not a bug. On your machine with normal internet it
should return 200 and real records, **provided the dataset ID is valid**.

## Before you demo: verify the dataset ID

I could not confirm the data.gov.sg dataset ID (my requests hit a 404 on one
dataset and a 429 rate limit on another). It is set in `.env` as
`DATAGOV_HAWKER_DATASET_ID`. Check it:

```bash
curl "https://data.gov.sg/api/action/datastore_search?resource_id=d_68a42f09f350881996d83f9cd73ab02f&limit=2"
```

If that 404s, pick another hawker dataset from data.gov.sg, take the `d_...` ID
from its URL, and paste it into `.env`. No code change needed.

## Small fixes applied while merging

- `README.md` pointed at `database/01_schema.sql`; corrected to `HawkerHubDB.sql`.
- `.gitignore` now excludes `video_demo/` (380 MB — GitHub rejects files over
  100 MB) and `coverage/`.
- `.env.example` gained the missing `JWT_EXPIRES_IN` and the new dataset ID.
- `package-lock.json` regenerated to match the updated `package.json`.

## Still open

`node_modules/` and `video_demo/` are **not** in this zip. Run `npm install`;
submit the videos through POLITEMall separately.

The remaining gaps from `REVIEW_AND_SETUP.md` are unchanged: stalls CRUD,
order history (`GET /orders/mine`), the missing PUT on promotions, DELETE on
payments and orders, and the cuisines/centres tables that no endpoint reads.

---

## Round 2 — closing the documentation/attribution gaps (1 Aug 2026)

Everything below was re-verified after this round of changes, same method as
above (`rm package-lock.json && npm install`, Node 22, no database available).

| Check | Result |
| --- | --- |
| Swagger annotations added to the 10 route files that had none | done — every route file now has `#swagger` comments |
| `npm run swagger` | **32 paths, 13 tags** — every path now has a real tag + summary (previously only Users and Centres did; the other 10 files rendered generic autogen guesses) |
| `npm test` | **78 passed, 5 suites** — unchanged, nothing broken by the route rewrites |
| `node --check` on every route file | all 13 parse cleanly |
| `npm start` boots with no database reachable | starts, does not crash |
| `GET /api/v1/health`, `GET /api-docs/`, `/index.html`, `/credit.html` | all 200 |
| `GET /api/v1/stalls` with DB down | 500, generic message, no stack trace leaked |

### What changed

- **`credit.html`** — added a "Data Sources / Third-Party APIs" section
  crediting data.gov.sg / NEA for the hawker centre data proxied by
  `GET /api/v1/centres/nea`. This was missing and is required for Team
  Criterion 5 (credit page covers all external sources, not just libraries).
- **Owner placeholders** — `centres.controller.js`, `centres.routes.js`,
  `dataGovSg.service.js` and their test files had `Owner: <YOUR NAME>` left
  in from scaffolding. Filled in as Yongsheng (Tech Lead) since that's who
  owns the rest of the infrastructure work; change this if someone else
  should get credit for the third-party API feature.
- **`README.md`** — Yongsheng's row in the ownership table now lists the
  Centres/NEA feature; added a short section pointing at `/api-docs` and the
  `npm test` / `npm run test:coverage` commands.
- **`docs/HawkerHub.postman_collection.json`** — added a "Yongsheng - NEA
  Open Data" folder with three requests: default list, paginated + search,
  and a deliberate `limit=999` validation-error case.
- **Cover page** — `BED_2026Apr_Assignment_Checkpoint_Team4.docx` was still
  the *Checkpoint* cover page (Week 13 dates, Checkpoint declaration).
  Replaced with `BED_2026Apr_Assignment_Final_Team4.docx`: deadline label
  and date updated to the Final Submission (Week 15), late-penalty cutoff
  updated, and Yongsheng's functions-implemented cell now includes the
  Centres feature.
- **Dataset ID verified live.** `DATAGOV_HAWKER_DATASET_ID` in `.env`
  (`d_68a42f09f350881996d83f9cd73ab02f`) was checked directly against
  data.gov.sg outside this sandbox: it's NEA's real "List of Government
  Markets Hawker Centres" dataset (107 rows), and its column names
  (`name_of_centre`, `location_of_centre`, `type_of_centre`, `owner`,
  `no_of_stalls`, …) match what `dataGovSg.service.js` expects. No change
  needed here — this was flagged as unverified in Round 1 and is now
  confirmed working.

### Still open (unchanged from Round 1)

Deliberately not touched, since these belong to individual teammates' own
graded components and a fix needs their sign-off, not a rewrite from outside:
stalls CRUD (Kyra), order history `GET /orders/mine` (Wayne), promotions
missing PUT (Jeremiah), payments missing DELETE (Kenneth), and the
`Cuisines`/`HawkerCentres` tables that no endpoint reads yet. See
`REVIEW_AND_SETUP.md` §2 for the full list and reasoning.
