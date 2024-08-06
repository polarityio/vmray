module.exports = {
  name: 'VMRay',
  acronym: 'VMR',
  description: 'TODO',
  entityTypes: ['IPv4', 'IPv6', 'email', 'url', 'hash'],
  styles: ['./client/styles.less'],
  defaultColor: 'light-blue',
  onDemandOnly: true,
  block: {
    component: {
      file: './client/block.js'
    },
    template: {
      file: './client/block.hbs'
    }
  },
  request: {
    cert: '',
    key: '',
    passphrase: '',
    ca: '',
    proxy: ''
  },
  logging: {
    level: 'info'
  },
  options: [
    {
      key: 'url',
      name: 'VMRay API URL',
      description: 'The base URL of the VMRay API including the schema (i.e., https://)',
      default: 'https://fwd.app',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'apiKey',
      name: 'API Key',
      description: 'TODO',
      default: '',
      type: 'password',
      userCanEdit: false,
      adminOnly: true
    },

    {
      key: 'apiKeyQuotaPeriod',
      name: 'API Key Quota Period',
      description: 'Specify the Quota Period you set for this API key.',
      default: {
        value: 'daily',
        display: 'Daily'
      },
      type: 'select',
      options: [
        {
          value: 'daily',
          display: 'Daily'
        },
        {
          value: 'monthly',
          display: 'Monthly'
        }
      ],
      multiple: false,
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'apiKeyQuotaLimit',
      name: 'API Key Quota Limit',
      description: 'Specify the Quota Limit you set for this API key.',
      default: 0,
      type: 'number',
      userCanEdit: true,
      adminOnly: false
    }
  ]
};
