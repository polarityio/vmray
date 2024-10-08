/*
 * Copyright (c) 2024, Polarity.io, Inc.
 */
const polarityRequest = require('./polarity-request');
const { ApiRequestError } = require('./errors');
const { getLogger } = require('./logger');
const SUCCESS_CODES = [200];

async function getIndicators(sampleId, options) {
  const Logger = getLogger();

  const requestOptions = {
    uri: `${options.url}/rest/sample/${sampleId}/iocs`,
    method: 'GET'
  };

  const apiResponse = await polarityRequest.request(requestOptions, options);

  Logger.trace({ requestOptions, apiResponse }, 'Get Indicators Response');

  if (!SUCCESS_CODES.includes(apiResponse.statusCode)) {
    throw new ApiRequestError(
      `Unexpected status code ${apiResponse.statusCode} received when fetching Indicators from VMRay API`,
      {
        statusCode: apiResponse.statusCode,
        requestOptions,
        responseBody: apiResponse.body
      }
    );
  }

  if (apiResponse.body.data && apiResponse.body.data.iocs && hasIocs(apiResponse.body.data.iocs)) {
    return apiResponse.body.data.iocs;
  } else {
    return null;
  }
}

function hasIocs(iocs){
  const keys = Object.keys(iocs);
  for(let i=0; i<keys.length; i++){
    if(iocs[keys[i]].length > 0){
      return true;
    }
  }
  return false;
}

module.exports = {
  getIndicators
};
