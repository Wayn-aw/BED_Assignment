/*
Owner: <YOUR NAME>
Feature: NEA Open Data integration (third-party API)

Wraps the data.gov.sg Datastore Search API. This is the ONLY file that knows
the upstream URL and response shape -- the controller stays ignorant of it, so
if data.gov.sg changes their schema we only edit here.

Upstream contract (from https://guide.data.gov.sg/developer-guide/dataset-apis):
  GET https://data.gov.sg/api/action/datastore_search
      ?resource_id=<dataset_id>   (required)
      &limit=<n>&offset=<n>&q=<search>
  200 -> { success: true, result: { records: [...], total, limit, fields } }
  429 -> rate limit exceeded
*/

const BASE_URL = "https://data.gov.sg/api/action/datastore_search";

// Dataset ID lives in .env so it can be swapped without a code change.
// Find it in the URL of any dataset page: data.gov.sg/datasets/<d_...>/view
const DATASET_ID = process.env.DATAGOV_HAWKER_DATASET_ID;

const REQUEST_TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour - this data changes rarely

/* In-memory cache.
   data.gov.sg rate-limits by IP (documented 429 response), and during a demo
   the same endpoint gets hit repeatedly. Caching keeps us well under the limit
   and makes the second call visibly instant, which is worth showing on video.
   A real deployment would use Redis; in-memory is honest for this scale. */
const cache = new Map(); // key -> { expiresAt, payload }

function getCached(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key); // expired - drop it so the Map doesn't grow forever
    return null;
  }
  return hit.payload;
}

function setCached(key, payload) {
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, payload });
}

// Exposed for tests, and useful if an admin ever needs to force a refresh.
function clearCache() {
  cache.clear();
}

/**
 * Fetches rows from the configured data.gov.sg dataset.
 *
 * @param {object}  options
 * @param {number}  options.limit  max rows to return (1-100)
 * @param {number}  options.offset rows to skip, for pagination
 * @param {string}  options.search free-text filter passed to the upstream `q`
 * @returns {Promise<{records: object[], total: number, cached: boolean}>}
 * @throws  {Error} with .statusCode set, so errorHandler maps it correctly
 */
async function fetchHawkerCentres({ limit = 20, offset = 0, search = "" } = {}) {
  if (!DATASET_ID) {
    throw Object.assign(
      new Error("DATAGOV_HAWKER_DATASET_ID is not configured on the server."),
      { statusCode: 500 }
    );
  }

  const params = new URLSearchParams({
    resource_id: DATASET_ID,
    limit: String(limit),
    offset: String(offset),
  });
  if (search) params.append("q", search);

  const url = `${BASE_URL}?${params.toString()}`;

  const cached = getCached(url);
  if (cached) return { ...cached, cached: true };

  /* Never let a slow third party hang our own request forever. Without this
     an unresponsive upstream would hold the Express connection open until the
     client gives up. */
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    // AbortError = our timeout fired; anything else = DNS/network failure.
    const isTimeout = err.name === "AbortError";
    throw Object.assign(
      new Error(
        isTimeout
          ? "The NEA open-data service took too long to respond. Please try again shortly."
          : "Could not reach the NEA open-data service. Please try again shortly."
      ),
      { statusCode: 503 }
    );
  } finally {
    clearTimeout(timeout); // always clear, or the timer keeps the process alive
  }

  if (response.status === 429) {
    throw Object.assign(
      new Error("NEA open-data rate limit reached. Please try again in a minute."),
      { statusCode: 429 }
    );
  }

  if (!response.ok) {
    throw Object.assign(
      new Error(`NEA open-data service returned an error (HTTP ${response.status}).`),
      { statusCode: 502 }
    );
  }

  const body = await response.json();

  // CKAN signals failure in the body even on a 200, so check it explicitly.
  if (!body || body.success !== true || !body.result) {
    throw Object.assign(
      new Error("NEA open-data service returned an unexpected response."),
      { statusCode: 502 }
    );
  }

  const payload = {
    records: body.result.records || [],
    total: body.result.total || 0,
  };

  setCached(url, payload);
  return { ...payload, cached: false };
}

module.exports = { fetchHawkerCentres, clearCache };
