const fs = require('fs');
const crypto = require('crypto');
const url = require('url');

const request = require('postman-request');
const { getLogger } = require('./logger');
const { NetworkError, RetryRequestError } = require('./errors');

const {
  request: { ca, cert, key, passphrase, rejectUnauthorized, proxy }
} = require('../config/config.js');

const _configFieldIsValid = (field) => typeof field === 'string' && field.length > 0;

const defaults = {
  ...(_configFieldIsValid(ca) && { ca: fs.readFileSync(ca) }),
  ...(_configFieldIsValid(cert) && { cert: fs.readFileSync(cert) }),
  ...(_configFieldIsValid(key) && { key: fs.readFileSync }),
  ...(_configFieldIsValid(passphrase) && { passphrase }),
  ...(_configFieldIsValid(proxy) && { proxy }),
  ...(typeof rejectUnauthorized === 'boolean' && { rejectUnauthorized }),
  json: true
};

/**
 *
 */
class PolarityRequest {
  constructor() {
    this.requestWithDefaults = request.defaults(defaults);
  }

  async request(requestOptions, userOptions) {
    return new Promise(async (resolve, reject) => {
      if (!requestOptions.headers) {
        requestOptions.headers = {};
      }

      requestOptions.headers.Authorization = `api_key ${userOptions.apiKey}`;
      requestOptions.headers['User-Agent'] = 'Polarity';

      this.requestWithDefaults(requestOptions, (err, response) => {
        if (err) {
          return reject(
            new NetworkError('Unable to complete network request', {
              cause: err,
              requestOptions
            })
          );
        }

        if (response.statusCode === 429) {
          return reject(
            new RetryRequestError('limit', {
              requestOptions,
              responseBody: response.body
            })
          );
        }
        resolve(response);
      });
    });
  }
}

module.exports = new PolarityRequest();
