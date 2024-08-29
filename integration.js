'use strict';

const async = require('async');

const { setLogger } = require('./src/logger');
const { RetryRequestError } = require('./src/errors');
const { createResultObject, createRetryObject } = require('./src/create-result-object');
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
      try {
        const sampleDetails = await searchSampleByHash(entity, options);
        const sampleResultObject = createResultObject(entity, sampleDetails, options);
        lookupResults.push(sampleResultObject);
      } catch (requestError) {
        if (requestError instanceof RetryRequestError) {
          return lookupResults.push(createRetryObject(entity, 'DO_LOOKUP', {}, options));
        } else {
          throw requestError;
        }
      }
    });
  });

  try {
    await async.parallelLimit(tasks, MAX_TASKS_AT_A_TIME);
  } catch (error) {
    return cb(error);
  }

  Logger.trace({ lookupResults }, 'Lookup Results');
  cb(null, lookupResults);
};

async function onMessage(payload, options, cb) {
  Logger.trace({ payload }, 'onMessage payload');
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
        Logger.trace({ sampleResponse }, 'Get Sample by SHA256 Data');
        if (Array.isArray(sampleResponse.data) && sampleResponse.data.length > 0) {
          const sample = sampleResponse.data[0];
          cb(null, sample);
        } else {
          cb(null, {
            noResults: true
          });
        }
      } catch (error) {
        if (error instanceof RetryRequestError) {
          return cb(null, {
            isRetryError: true
          });
        }
        return cb(error);
      }
      break;
    case 'GET_VTI':
      try {
        const vti = await getVti(payload.sampleId, options);
        Logger.trace({ vti }, 'VTI Data');
        cb(null, vti);
      } catch (error) {
        if (error instanceof RetryRequestError) {
          return cb(null, {
            isRetryError: true
          });
        }
        return cb(error);
      }
      break;
    case 'GET_ANALYSIS':
      try {
        const analysis = await getAnalysis(payload.sampleId, options);
        Logger.trace({ analysis }, 'Analysis Data');
        cb(null, analysis);
      } catch (error) {
        if (error instanceof RetryRequestError) {
          return cb(null, {
            isRetryError: true
          });
        }
        return cb(error);
      }
      break;
    case 'GET_RELATIONS':
      try {
        const relations = await getRelations(payload.relations, options);
        Logger.trace({ relations }, 'Relations Data');
        cb(null, relations);
      } catch (error) {
        if (error instanceof RetryRequestError) {
          return cb(null, {
            isRetryError: true
          });
        }
        return cb(error);
      }
      break;
    case 'GET_MITRE_ATTACK':
      try {
        const mitreAttack = await getMitreAttack(payload.sampleId, options);
        Logger.trace({ mitreAttack }, 'Mitre ATT&CK Data');
        cb(null, mitreAttack);
      } catch (error) {
        if (error instanceof RetryRequestError) {
          return cb(null, {
            isRetryError: true
          });
        }
        return cb(error);
      }
      break;
    case 'GET_INDICATORS':
      try {
        const indicators = await getIndicators(payload.sampleId, options);
        Logger.trace({ indicators }, 'Indicators');
        cb(null, indicators);
      } catch (error) {
        if (error instanceof RetryRequestError) {
          return cb(null, {
            isRetryError: true
          });
        }
        return cb(error);
      }
      break;
    case 'GET_QUOTA':
      try {
        const quota = await getApiQuota(options);
        Logger.trace({ quota }, 'Quota');
        cb(null, quota);
      } catch (error) {
        if (error instanceof RetryRequestError) {
          return cb(null, {
            isRetryError: true
          });
        }
        return cb(error);
      }
      break;
    case 'DO_LOOKUP':
      await doLookup([payload.entity], options, (err, lookupResults) => {
        Logger.trace({ lookupResults }, 'lookupResults');
        cb(err, lookupResults.length > 0 ? lookupResults[0] : []);
      });
  }
}

function validateOptions(userOptions, cb) {
  let errors = [];

  if (
    typeof userOptions.url.value !== 'string' ||
    (typeof userOptions.url.value === 'string' && userOptions.url.value.length === 0)
  ) {
    errors.push({
      key: 'url',
      message: 'You must provide a valid VMRay API URL'
    });
  }

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
  onMessage
};
