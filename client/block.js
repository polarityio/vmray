'use strict';
polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  fromNetwork: Ember.computed.alias('details.fromNetwork'),
  toNetwork: Ember.computed.alias('details.toNetwork'),
  fromNetworkPaths: Ember.computed.alias('details.fromNetworkPaths'),
  toNetworkPaths: Ember.computed.alias('details.toNetworkPaths'),
  timezone: Ember.computed('Intl', function () {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }),
  activeTab: 'fromNetworkPaths',
  init() {
    this.set(
      'activeTab',
      this.fromNetworkPaths.length > 0 ? 'fromNetworkPaths' : 'toNetworkPaths'
    );

    this._super(...arguments);
  },
  actions: {
    changeTab: function (tabName) {
      this.set('activeTab', tabName);
    }
  }
});
