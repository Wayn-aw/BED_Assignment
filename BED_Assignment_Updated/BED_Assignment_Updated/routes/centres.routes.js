/*
Owner: <YOUR NAME>
Feature: NEA Open Data integration (third-party API)
*/

const express = require("express");
const router = express.Router();
const centresController = require("../controllers/centres.controller");

router.get(
  "/nea",
  // #swagger.tags = ['Centres']
  // #swagger.summary = 'List NEA-registered hawker centres (live from data.gov.sg)'
  // #swagger.description = 'Proxies the data.gov.sg Datastore Search API from the back-end. Responses are cached in memory for one hour to stay within the upstream rate limit; the cached flag in the response tells you which path was taken.'
  /* #swagger.parameters['limit']  = { in: 'query', description: 'Rows to return (1-100).', required: false, schema: { type: 'integer', default: 20 } } */
  /* #swagger.parameters['offset'] = { in: 'query', description: 'Rows to skip, for pagination.', required: false, schema: { type: 'integer', default: 0 } } */
  /* #swagger.parameters['search'] = { in: 'query', description: 'Free-text filter, e.g. Bedok.', required: false, schema: { type: 'string' } } */
  /* #swagger.responses[200] = { description: 'Centres returned.' } */
  /* #swagger.responses[400] = { description: 'Invalid limit, offset or search value.' } */
  /* #swagger.responses[429] = { description: 'Upstream rate limit reached.' } */
  /* #swagger.responses[502] = { description: 'Upstream returned an unexpected response.' } */
  /* #swagger.responses[503] = { description: 'Upstream unreachable or timed out.' } */
  centresController.getNeaHawkerCentres
);

module.exports = router;
