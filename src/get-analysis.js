/*
 * Copyright (c) 2024, Polarity.io, Inc.
 */
const polarityRequest = require('./polarity-request');
const { ApiRequestError } = require('./errors');
const { getLogger } = require('./logger');
const SUCCESS_CODES = [200];

async function getAnalysis(sampleId, options) {
  const Logger = getLogger();

  const requestOptions = {
    uri: `${options.url}/rest/analysis/sample/${sampleId}`,
    method: 'GET'
  };

  Logger.trace({ requestOptions }, 'Request Options');

  const apiResponse = await polarityRequest.request(requestOptions, options);

  Logger.trace({ apiResponse }, 'Get Sample API Response');

  if (!SUCCESS_CODES.includes(apiResponse.statusCode)) {
    throw new ApiRequestError(
      `Unexpected status code ${apiResponse.statusCode} received when fetching Analysis from VMRay API`,
      {
        statusCode: apiResponse.statusCode,
        requestOptions,
        responseBody: apiResponse.body
      }
    );
  }

  return apiResponse.body.data;
}

module.exports = {
  getAnalysis
};
