/*
 * Copyright (c) 2024, Polarity.io, Inc.
 */
const polarityRequest = require('./polarity-request');
const { ApiRequestError } = require('./errors');
const { getLogger } = require('./logger');
const SUCCESS_CODES = [200];

async function getApiQuota(options) {
  const Logger = getLogger();

  const requestOptions = createRequestOptions(options);

  Logger.trace({ requestOptions }, 'Request Options');

  const apiResponse = await polarityRequest.request(requestOptions, options);

  Logger.trace({ apiResponse }, 'Get Quota API Response');

  if (!SUCCESS_CODES.includes(apiResponse.statusCode)) {
    throw new ApiRequestError(
      `Unexpected status code ${apiResponse.statusCode} received when fetching quota from VMRay API`,
      {
        statusCode: apiResponse.statusCode,
        requestOptions,
        responseBody: apiResponse.body
      }
    );
  }

  return apiResponse.body.data;
}

function createRequestOptions(options) {
  let requestOptions = {
    uri: `${options.url}/rest/api_key/quota`,
    method: 'GET'
  };
  return requestOptions;
}

module.exports = {
  getApiQuota
};
