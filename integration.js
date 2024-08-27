'use strict';

const async = require('async');

const { setLogger } = require('./src/logger');
const { parseErrorToReadableJSON, ApiRequestError } = require('./src/errors');
const { createResultObject } = require('./src/create-result-object');
const { searchSampleByHash } = require('./src/search-sample-by-hash');
const { getApiQuota } = require('./src/get-api-quota');
const { getVti } = require('./src/get-vti');
const { getAnalysis } = require('./src/get-analysis');
const { getRelations } = require('./src/get-relations');
const { getMitreAttack } = require('./src/get-mitre-attack');
const { getIndicators } = require('./src/get-indicators');

const MAX_TASKS_AT_A_TIME = 5;

let Logger = null;

const startup = (logger) => {
  Logger = logger;
  setLogger(Logger);
};

const doLookup = async (entities, options, cb) => {
  Logger.trace({ entities }, 'doLookup');

  let lookupResults = [];
  const tasks = [];

  entities.forEach((entity) => {
    tasks.push(async () => {
      const sampleDetails = await searchSampleByHash(entity, options);
      const sampleResultObject = createResultObject(entity, sampleDetails, options);
      lookupResults.push(sampleResultObject);
    });
  });

  try {
    await async.parallelLimit(tasks, MAX_TASKS_AT_A_TIME);
  } catch (error) {
    const errorAsPojo = parseErrorToReadableJSON(error);
    Logger.error({ error: errorAsPojo }, 'Error in doLookup');
    return cb(errorAsPojo);
  }

  Logger.trace({ lookupResults }, 'Lookup Results');
  cb(null, lookupResults);
};

async function onDetails(resultObject, options, cb) {
  try {
    const quota = await getApiQuota(options);
    resultObject.data.details.quota = quota;
    cb(null, resultObject.data);
  } catch (error) {
    const errorAsPojo = parseErrorToReadableJSON(error);
    Logger.error({ error: errorAsPojo }, 'Error in fetching quota');
    return cb(errorAsPojo);
  }
}

async function onMessage(payload, options, cb) {
  Logger.info({ payload }, 'onMessage');
  switch (payload.action) {
    case 'GET_SAMPLE_BY_SHA256':
      try {
        const sampleResponse = await searchSampleByHash(
          {
            value: payload.sha256,
            isSHA256: true
          },
          options
        );
        Logger.info({ sampleResponse }, 'Get Sample by SHA256 Data');
        if (Array.isArray(sampleResponse.data) && sampleResponse.data.length > 0) {
          const sample = sampleResponse.data[0];
          cb(null, sample);
        } else {
          cb(null, {
            noResults: true
          });
        }
      } catch (error) {
        const errorAsPojo = parseErrorToReadableJSON(error);
        Logger.error({ error: errorAsPojo }, 'Error in fetching Sample by SHA256');
        return cb(errorAsPojo);
      }
      break;
    case 'GET_VTI':
      try {
        const vti = await getVti(payload.sampleId, options);
        Logger.trace({ vti }, 'VTI Data');
        cb(null, vti);
      } catch (error) {
        const errorAsPojo = parseErrorToReadableJSON(error);
        Logger.error({ error: errorAsPojo }, 'Error in fetching VTIs');
        return cb(errorAsPojo);
      }
      break;
    case 'GET_ANALYSIS':
      try {
        const analysis = await getAnalysis(payload.sampleId, options);
        Logger.trace({ analysis }, 'Analysis Data');
        cb(null, analysis);
      } catch (error) {
        const errorAsPojo = parseErrorToReadableJSON(error);
        Logger.error({ error: errorAsPojo }, 'Error in fetching Analysis');
        return cb(errorAsPojo);
      }
      break;
    case 'GET_RELATIONS':
      try {
        const relations = await getRelations(payload.relations, options);
        Logger.trace({ relations }, 'Relations Data');
        cb(null, relations);
      } catch (error) {
        const errorAsPojo = parseErrorToReadableJSON(error);
        Logger.error({ error: errorAsPojo }, 'Error in fetching Relation');
        return cb(errorAsPojo);
      }
      break;
    case 'GET_MITRE_ATTACK':
      try {
        const mitreAttack = await getMitreAttack(payload.sampleId, options);
        Logger.info({ mitreAttack }, 'Mitre Attack Data');
        cb(null, mitreAttack);
      } catch (error) {
        const errorAsPojo = parseErrorToReadableJSON(error);
        Logger.error({ error: errorAsPojo }, 'Error in fetching Analysis');
        return cb(errorAsPojo);
      }
      break;
    case 'GET_INDICATORS':
      try {
        const indicators = await getIndicators(payload.sampleId, options);
        Logger.trace({ indicators }, 'Indicators');
        cb(null, indicators);
      } catch (error) {
        const errorAsPojo = parseErrorToReadableJSON(error);
        Logger.error({ error: errorAsPojo }, 'Error in fetching Analysis');
        return cb(errorAsPojo);
      }
      break;
  }
}

function validateOptions(userOptions, cb) {
  let errors = [];

  if (
    typeof userOptions.apiKey.value !== 'string' ||
    (typeof userOptions.apiKey.value === 'string' &&
      userOptions.apiKey.value.length === 0)
  ) {
    errors.push({
      key: 'apiKey',
      message: 'You must provide a valid VMRay API key'
    });
  }

  cb(null, errors);
}

module.exports = {
  startup,
  doLookup,
  validateOptions,
  onDetails,
  onMessage
};
