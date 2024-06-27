const { map } = require('lodash/fp');

const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { requestsInParallel } = require('../request');

const { MAX_PAGE_SIZE } = require('../constants');

const getNetworkPaths = async (entities, options) => {
  const Logger = getLogger();

  try {
    const toNetworkPathsRequests = ['bothToAndFrom', 'toIp'].includes(
      options.signalSourceQueryType.value
    )
      ? map(
          (entity) => ({
            resultId: entity.value,
            route: `networks/${options.networkIdNumber}/paths`,
            qs: {
              srcIp: entity.value,
              dstIp: options.signalSourceIPAddress,
              maxResults: MAX_PAGE_SIZE,
              includeNetworkFunctions: true
            },
            options
          }),
          entities
        )
      : [];

    const fromNetworkPathsRequests = ['bothToAndFrom', 'fromIp'].includes(
      options.signalSourceQueryType.value
    )
      ? map(
          (entity) => ({
            resultId: entity.value,
            route: `networks/${options.networkIdNumber}/paths`,
            qs: {
              srcIp: options.signalSourceIPAddress,
              dstIp: entity.value,
              maxResults: MAX_PAGE_SIZE,
              includeNetworkFunctions: true
            },
            options
          }),
          entities
        )
      : [];

    const [fromNetworkPaths, toNetworkPaths] = await Promise.all([
      requestsInParallel(fromNetworkPathsRequests, 'body'),
      requestsInParallel(toNetworkPathsRequests, 'body')
    ]);

    return {
      fromNetworkPaths,
      toNetworkPaths
    };
  } catch (error) {
    const err = parseErrorToReadableJson(error);
    Logger.error(
      {
        formattedError: err,
        error
      },
      'Getting Network Paths Failed'
    );
    throw error;
  }
};

module.exports = getNetworkPaths;
