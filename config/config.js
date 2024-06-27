module.exports = {
  name: 'VMRay',
  acronym: 'VMR',
  description: 'TODO',
  entityTypes: ['IPv4', 'IPv6'],
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
      key: 'username',
      name: 'Username',
      description: 'Your Username Credential',
      default: '',
      type: 'password',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'password',
      name: 'Password',
      description: 'Your Password Credential',
      default: '',
      type: 'password',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'networkIdNumber',
      name: 'Network ID Number',
      description:
        'The 6-digit Network ID Number associated with the network you want to search your IPs on. (Found in Dashboard URL https://...?networkId=######)',
      default: '',
      type: 'text',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'snapshotIdNumber',
      name: 'Snapshot ID Number',
      description:
        'The 6-digit Snapshot ID Number associated with the network you want to search your IPs on. (Found in Dashboard URL https://...&snapshotId=######)',
      default: '',
      type: 'text',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'signalSourceQueryType',
      name: 'Signal Source Query Type',
      description:
        'When Querying IP Addresses, this determines if your search Network Paths Query is either To, From, or Both in relation to your Searched IP.',
      default: {
        value: 'bothToAndFrom',
        display: 'Signal both To and From Searched IP'
      },
      type: 'select',
      options: [
        {
          value: 'bothToAndFrom',
          display: 'Signal both To and From Searched IP'
        },
        {
          value: 'fromIp',
          display: 'Signal From Searched IP'
        },
        {
          value: 'toIp',
          display: 'Signal To Searched IP'
        }
      ],
      multiple: false,
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'signalSourceIPAddress',
      name: 'Signal Source IP Address',
      description:
        'The IP Address you search other IP Addresses both to and from. Default `0.0.0.0/0` (i.e. Any Network Traffic)',
      default: '0.0.0.0/0',
      type: 'text',
      userCanEdit: true,
      adminOnly: false
    }
  ]
};