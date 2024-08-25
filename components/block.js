polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  sample: Ember.computed.alias('details.sample'),
  quota: Ember.computed.alias('details.quota'),
  activeTab: 'overview',
  vtiLoading: false,
  errorMessage: '',
  timezone: Ember.computed('Intl', function () {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }),
  verdictColorClass: Ember.computed('sample.sample_verdict', function () {
    const verdict = this.get('sample.sample_verdict');
    if (verdict === 'malicious') {
      return 'red';
    } else if (verdict === 'suspicious') {
      return 'yellow';
    } else if (verdict === 'clean') {
      return 'green';
    } else {
      return 'gray';
    }
  }),
  actions: {
    changeTab: function (tabName) {
      this.set('activeTab', tabName);

      if (
        tabName === 'summary' &&
        typeof this.get('details.vti') === 'undefined' &&
        !this.get('vtiLoading')
      ) {
        this.loadVti();
      }

      if (
        tabName === 'summary' &&
        typeof this.get('details.analysis') === 'undefined' &&
        !this.get('analysisLoading')
      ) {
        this.loadAnalysis();
      }

      if (
        tabName === 'summary' &&
        typeof this.get('details.relations') === 'undefined' &&
        !this.get('relationsLoading') &&
        this.get('sample.sample_child_relations') &&
        this.get('sample.sample_child_relations.length') > 0
      ) {
        if (this.get('sample.sample_child_relations')) {
          this.get('sample.sample_child_relations').forEach((relation, index) => {
            let color = this.getVerdictColor(relation.relation_child_sample_verdict);
            this.set(
              `sample.sample_child_relations.${index}.relation_child_sample_verdict_color`,
              color
            );
          });
        }
        this.loadRelations();
      }
    },
    copyText: function (text, showVariable) {
      this.copyTextToClipboard(text, showVariable);
    }
  },
  copyTextToClipboard: function (text, showVariable) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.set(showVariable, true);
      })
      .catch((err) => {})
      .finally(() => {
        setTimeout(() => {
          if (!this.isDestroyed) {
            this.set(showVariable, false);
          }
        }, 2000);
      });
  },
  onDetailsLoaded: function () {
    if (!this.isDestroyed) {
      this.set('onDetailsLoaded', true);
    }
  },
  loadVti: function () {
    this.set('loadingVti', true);
    const payload = {
      action: 'GET_VTI',
      sampleId: this.get('sample.sample_id')
    };
    this.sendIntegrationMessage(payload)
      .then((result) => {
        result.threat_indicators.forEach((indicator) => {
          if (indicator.score === 5) {
            indicator.scoreClass = 'five';
          } else if (indicator.score === 4) {
            indicator.scoreClass = 'four';
          } else if (indicator.score === 3) {
            indicator.scoreClass = 'three';
          } else if (indicator.score === 2) {
            indicator.scoreClass = 'two';
          } else if (indicator.score === 1) {
            indicator.scoreClass = 'one';
          } else {
            indicator.scoreClass = 'clean';
          }
        });
        this.set('details.vti', result);
      })
      .catch((err) => {
        console.error(err);
        this.set('errorMessage', JSON.stringify(err, null, 2));
      })
      .finally(() => {
        this.set('loadingVti', false);
      });
  },
  loadAnalysis: function () {
    this.set('loadingAnalysis', true);
    const payload = {
      action: 'GET_ANALYSIS',
      sampleId: this.get('sample.sample_id')
    };
    this.sendIntegrationMessage(payload)
      .then((result) => {
        result.forEach((analysis) => {
          const verdict = analysis.analysis_verdict;
          analysis.analysis_verdict_color = this.getVerdictColor(verdict);
        });

        this.set('details.analysis', result);
      })
      .catch((err) => {
        console.error(err);
        this.set('errorMessage', JSON.stringify(err, null, 2));
      })
      .finally(() => {
        this.set('loadingAnalysis', false);
      });
  },
  loadRelations: function () {
    this.set('loadingRelations', true);
    const payload = {
      action: 'GET_RELATIONS',
      relations: this.get('sample.sample_child_relations').map((relation) => {
        return {
          relationId: relation.relation_id,
          relationSampleId: relation.relation_child_sample_id
        };
      })
    };
    this.sendIntegrationMessage(payload)
      .then((result) => {
        this.set('details.relations', result);
      })
      .catch((err) => {
        console.error(err);
        this.set('errorMessage', JSON.stringify(err, null, 2));
      })
      .finally(() => {
        this.set('loadingRelations', false);
      });
  },
  getVerdictColor: function (verdict) {
    if (verdict === 'malicious') {
      return 'red';
    } else if (verdict === 'suspicious') {
      return 'yellow';
    } else if (verdict === 'clean') {
      return 'green';
    } else {
      return 'gray';
    }
  }
});
