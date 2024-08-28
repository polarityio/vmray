module.exports = {
  name: 'VMRay',
  acronym: 'VMR',
  description:
    'Lookup VMRay Sample information by hash and check local files for existing Samples in VMRay.',
  entityTypes: ['MD5', 'SHA1', 'SHA256'],
  styles: ['./styles/styles.less'],
  defaultColor: 'light-blue',
  onDemandOnly: true,
  block: {
    component: {
      file: './components/block.js'
    },
    template: {
      file: './templates/block.hbs'
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
      name: 'VMRay URL',
      description:
        'The base URL of your hosted or Cloud based VMRay instance including the schema (i.e., https://).  For example, "https://us.cloud.vmray.com" or "https://eu.cloud.vmray.com".',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'apiKey',
      name: 'API Key',
      description: 'A valid VMRay API Key',
      default: '',
      type: 'password',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'returnMisses',
      name: 'Return result when no sample is found',
      description: 'If checked, the integration will return a result even when no Sample could be found for the given hash.',
      default: true,
      type: 'boolean',
      userCanEdit: false,
      adminOnly: true
    }
  ]
};
