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
