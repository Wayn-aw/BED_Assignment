/*
Owner: <YOUR NAME>
Feature: NEA Open Data integration (third-party API)

Controllers stay thin: validate the query string, delegate to the service,
shape the JSON. All upstream knowledge lives in services/dataGovSg.service.js.
*/

const dataGovSg = require("../services/dataGovSg.service");

const MAX_LIMIT = 100;

//READ: list NEA-registered hawker centres from data.gov.sg
exports.getNeaHawkerCentres = async (req, res, next) => {
  try {
    const { limit, offset, search } = req.query;

    // Validate BEFORE calling out - never forward junk to a third party.
    const parsedLimit = limit === undefined ? 20 : Number(limit);
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > MAX_LIMIT) {
      return res.status(400).json({
        success: false,
        message: `limit must be a whole number between 1 and ${MAX_LIMIT}.`,
      });
    }

    const parsedOffset = offset === undefined ? 0 : Number(offset);
    if (!Number.isInteger(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({
        success: false,
        message: "offset must be a whole number of 0 or more.",
      });
    }

    if (search !== undefined && typeof search !== "string") {
      return res.status(400).json({ success: false, message: "search must be a single text value." });
    }

    const result = await dataGovSg.fetchHawkerCentres({
      limit: parsedLimit,
      offset: parsedOffset,
      search: search ? search.trim() : "",
    });

    res.status(200).json({
      success: true,
      source: "data.gov.sg (National Environment Agency)",
      cached: result.cached, // handy to point at during the demo video
      count: result.records.length,
      total: result.total,
      data: result.records,
    });
  } catch (err) {
    next(err); // errorHandler reads err.statusCode (503 / 429 / 502)
  }
};
