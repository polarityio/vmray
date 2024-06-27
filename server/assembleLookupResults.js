const { flow, get, size, map, some, omit } = require('lodash/fp');
const { getResultForThisEntity } = require('./dataTransformations');
const { MAX_PAGE_SIZE } = require('./constants');

const assembleLookupResults = (entities, fromNetworkPaths, toNetworkPaths, options) =>
  map((entity) => {
    const resultsForThisEntity = getResultsForThisEntity(
      entity,
      fromNetworkPaths,
      toNetworkPaths,
      options
    );

    const resultsFound = flow(
      omit(['fromNetwork', 'toNetwork']),
      some(size)
    )(resultsForThisEntity);

    const lookupResult = {
      entity,
      data: resultsFound
        ? {
            summary: createSummaryTags(resultsForThisEntity, options),
            details: resultsForThisEntity
          }
        : null
    };

    return lookupResult;
  }, entities);

const getResultsForThisEntity = (entity, fromNetworkPaths, toNetworkPaths, options) => {
  const fromNetwork = getResultForThisEntity(entity, fromNetworkPaths, true);
  const toNetwork = getResultForThisEntity(entity, toNetworkPaths, true);

  return {
    fromNetwork,
    toNetwork,
    fromNetworkPaths: get('info.paths', fromNetwork),
    toNetworkPaths: get('info.paths', toNetwork)
  };
};

const createSummaryTags = ({ fromNetworkPaths, toNetworkPaths }, options) =>
  []
    .concat(
      size(fromNetworkPaths)
        ? `From Paths: ${size(fromNetworkPaths)}${
            size(toNetworkPaths) === MAX_PAGE_SIZE ? '+' : ''
          }`
        : []
    )
    .concat(
      size(fromNetworkPaths)
        ? `To Paths: ${size(toNetworkPaths)}${
            size(toNetworkPaths) === MAX_PAGE_SIZE ? '+' : ''
          }`
        : []
    );

module.exports = assembleLookupResults;
