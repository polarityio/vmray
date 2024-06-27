const { validateStringOptions, validateUrlOption } = require('./utils');

const validateOptions = async (options, callback) => {
  const stringOptionsErrorMessages = {
    url: '* Required',
    username: '* Required',
    password: '* Required',
    networkIdNumber: '* Required',
    signalSourceIPAddress: '* Required'
  };

  const stringValidationErrors = validateStringOptions(
    stringOptionsErrorMessages,
    options
  );

  const urlValidationError = validateUrlOption(options, 'url');

  const errors = stringValidationErrors.concat(urlValidationError);

  callback(null, errors);
};

module.exports = validateOptions;
