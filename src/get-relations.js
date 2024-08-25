const async = require('async');
const polarityRequest = require('./polarity-request');
const { ApiRequestError } = require('./errors');
const { getLogger } = require('./logger');
const { searchSampleByHash } = require('./search-sample-by-hash');
const { createResultObject } = require('./create-result-object');
const SUCCESS_CODES = [200];
const MAX_TASKS_AT_A_TIME = 10;

async function getRelations(relations, options) {
  const Logger = getLogger();
  const tasks = [];
  const relationResults = {};

  relations.forEach((relation) => {
    tasks.push(async () => {
      const relationApiResponse = await polarityRequest.request(
        {
          uri: `${options.url}/rest/sample_relation/${relation.relationId}`
        },
        options
      );

      const sampleApiResponse = await polarityRequest.request(
        {
          uri: `${options.url}/rest/sample/${relation.relationSampleId}`
        },
        options
      );

      if (!SUCCESS_CODES.includes(relationApiResponse.statusCode)) {
        throw new ApiRequestError(
          `Unexpected status code ${apiResponse.statusCode} received when fetching Relation from VMRay API`,
          {
            statusCode: relationApiResponse.statusCode,
            requestOptions: relationApiResponse.requestOptions
          }
        );
      }

      if (!SUCCESS_CODES.includes(sampleApiResponse.statusCode)) {
        throw new ApiRequestError(
            `Unexpected status code ${sampleApiResponse.statusCode} received when fetching Relation Sample from VMRay API`,
            {
              statusCode: sampleApiResponse.statusCode,
              requestOptions: sampleApiResponse.requestOptions
            }
        );
      }

      Logger.trace({ sampleApiResponse, relationApiResponse }, 'Relation API Response');

      relationResults[relation.relationId] = {
        relation: relationApiResponse.body.data,
        sample: sampleApiResponse.body.data
      };
    });
  });

  await async.parallelLimit(tasks, MAX_TASKS_AT_A_TIME);

  return relationResults;
}

module.exports = {
  getRelations
};
