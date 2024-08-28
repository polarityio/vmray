/*
 * Copyright (c) 2024, Polarity.io, Inc.
 */
const polarityRequest = require('./polarity-request');
const { ApiRequestError } = require('./errors');
const { getLogger } = require('./logger');
const SUCCESS_CODES = [200];

async function searchSampleByHash(entity, options) {
  const Logger = getLogger();

  const requestOptions = createRequestOptions(entity, options);

  Logger.trace({ requestOptions }, 'Request Options');

  const apiResponse = await polarityRequest.request(requestOptions, options);

  Logger.trace({ apiResponse }, 'Lookup API Response');

  if (!SUCCESS_CODES.includes(apiResponse.statusCode)) {
    throw new ApiRequestError(
      `Unexpected status code ${apiResponse.statusCode} received when making request to the VMRay API`,
      {
        statusCode: apiResponse.statusCode,
        requestOptions,
        responseBody: apiResponse.body
      }
    );
  }

  return apiResponse.body;
}

function createRequestOptions(entity, options) {
  let requestOptions = {
    uri: `${options.url}/rest/sample/${getHashType(entity)}/${entity.value}`,
    method: 'GET'
  };
  
  return requestOptions;
}

function getHashType(entity) {
  if (entity.isMD5) {
    return 'md5';
  }
  if (entity.isSHA1) {
    return 'sha1';
  }
  if (entity.isSHA256) {
    return 'sha256';
  }
}

module.exports = {
  searchSampleByHash
};
