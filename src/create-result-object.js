const { getLogger } = require('./logger');
const xbytes = require('xbytes');
/**
 *
 * @param entities
 * @param apiResponse
 * @returns {*[]}
 */
const createResultObject = (entity, apiResponse, options) => {
  if (Array.isArray(apiResponse.data) && apiResponse.data.length > 0) {
    const sample = apiResponse.data[0];
    return {
      entity,
      data: {
        summary: createSummary(sample, options),
        details: {
          sample: {
            sample_filesize_human: xbytes(sample.sample_filesize),
            ...sample
          }
        }
      }
    };
  } else if (options.returnMisses) {
    return {
      entity,
      data: {
        summary: ['No Sample Found'],
        details: {
          noSampleExists: true
        }
      }
    };
  } else {
    return {
      entity,
      data: null
    };
  }
};

/**
 * Creates the Summary Tags (currently just tags for ports)
 * @param match
 * @returns {string[]}
 */
const createSummary = (sample, options) => {
  return [
    sample.sample_verdict
      ? sample.sample_verdict.charAt(0).toUpperCase() + sample.sample_verdict.slice(1)
      : 'Verdict Not Available'
  ];
};

module.exports = {
  createResultObject
};
