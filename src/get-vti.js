/*
 * Copyright (c) 2024, Polarity.io, Inc.
 */
const polarityRequest = require('./polarity-request');
const { ApiRequestError } = require('./errors');
const { getLogger } = require('./logger');
const SUCCESS_CODES = [200];

async function getVti(sampleId, options) {
  const Logger = getLogger();

  const requestOptions = {
    uri: `${options.url}/rest/sample/${sampleId}/vtis`,
    method: 'GET'
  };

  const apiResponse = await polarityRequest.request(requestOptions, options);

  Logger.trace({ requestOptions, apiResponse }, 'Get VTI API Response');

  if (!SUCCESS_CODES.includes(apiResponse.statusCode)) {
    throw new ApiRequestError(
      `Unexpected status code ${apiResponse.statusCode} received when fetching VTIs from VMRay API`,
      {
        statusCode: apiResponse.statusCode,
        requestOptions: apiResponse.requestOptions
      }
    );
  }

  // Sort the results by score
  if (apiResponse.body.data && Array.isArray(apiResponse.body.data.threat_indicators)) {
    apiResponse.body.data.threat_indicators.sort((a, b) => {
      return b.score - a.score;
    });
  }

  return apiResponse.body.data;
}

module.exports = {
  getVti
};
