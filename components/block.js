polarity.export = PolarityComponent.extend({
  polarityx: Ember.inject.service('polarityx'),
  windowService: Ember.inject.service('window'),
  searchData: Ember.inject.service('searchData'),
  details: Ember.computed.alias('block.data.details'),
  sample: Ember.computed.alias('details.sample'),
  quota: Ember.computed.alias('details.quota'),
  fileCheckResults: Ember.computed.alias('block._state.fileCheckResults'),
  activeTab: 'overview',
  vtiLoading: false,
  errorMessage: '',
  timezone: Ember.computed('Intl', function () {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }),
  verdictColorClass: Ember.computed('sample.sample_verdict', function () {
    const verdict = this.get('sample.sample_verdict');
    return this.getVerdictColorClass(verdict);
  }),
  init: function () {
    let array = new Uint32Array(5);
    this.set('uniqueIdPrefix', window.crypto.getRandomValues(array).join(''));
    if (!this.get('block._state')) {
      this.set('block._state', {});
      this.set('block._state.fileCheckResults', Ember.A());
    }
    this._super(...arguments);
  },
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
            let color = this.getVerdictColorClass(relation.relation_child_sample_verdict);
            this.set(
              `sample.sample_child_relations.${index}.relation_child_sample_verdict_color`,
              color
            );
          });
        }
        this.loadRelations();
      }

      if (
        tabName === 'mitreAttack' &&
        typeof this.get('details.mitreAttack') === 'undefined' &&
        !this.get('mitreAttackLoading')
      ) {
        this.loadMitreAttack();
      }

      if (
        tabName === 'indicators' &&
        typeof this.get('details.indicators') === 'undefined' &&
        !this.get('indicatorsLoading')
      ) {
        this.loadIndicators();
      }
    },
    copyText: function (text, showVariable) {
      this.copyTextToClipboard(text, showVariable);
    },
    cancelDefault: function (e) {
      this.cancelDefaultEvent(e);
    },
    getSampleByFile: function (event) {
      this.cancelDefaultEvent(event);

      let file;
      if (event.datatransfer && event.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        let item = [...event.dataTransfer.items][0];
        // If dropped items aren't files, reject them
        if (item.kind === 'file') {
          file = item.getAsFile();
        }
      } else if (event.dataTransfer && event.dataTransfer.files) {
        // Use DataTransfer interface to access the file(s)
        file = [...event.dataTransfer.files][0];
      } else if (event && event.target && event.target.files && event.target.files[0]) {
        file = event.target.files[0];
      }

      this.set('onDragOver', false);

      this.hashFile(file).then((sha256) => {
        this.getSampleBySha256(sha256, file);
      });
    },
    runOnDemandLookup: function (searchString) {
      if (this.windowService.isClientWindow) {
        //Trigger Search in Polarity Desktop Client
        this.polarityx.requestOnDemandLookup(searchString);
      } else {
        //Trigger Search in Web UI
        this.searchData.getSearchResults(searchString);
      }
    }
  },
  cancelDefaultEvent(event) {
    event.preventDefault();
    event.stopPropagation();
    return false;
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
          analysis.analysis_verdict_color = this.getVerdictColorClass(verdict);
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
  loadMitreAttack: function () {
    this.set('mitreAttackLoading', true);
    const payload = {
      action: 'GET_MITRE_ATTACK',
      sampleId: this.get('sample.sample_id')
    };
    this.sendIntegrationMessage(payload)
      .then((result) => {
        this.set('details.mitreAttack', result);
      })
      .catch((err) => {
        console.error(err);
        this.set('errorMessage', JSON.stringify(err, null, 2));
      })
      .finally(() => {
        this.set('mitreAttackLoading', false);
      });
  },
  loadIndicators: function () {
    this.set('indicatorsLoading', true);
    const payload = {
      action: 'GET_INDICATORS',
      sampleId: this.get('sample.sample_id')
    };
    this.sendIntegrationMessage(payload)
      .then((result) => {
        this.set('details.indicators', result);
      })
      .catch((err) => {
        console.error(err);
        this.set('errorMessage', JSON.stringify(err, null, 2));
      })
      .finally(() => {
        this.set('indicatorsLoading', false);
      });
  },
  getSampleBySha256: function (sha256, file) {
    this.set('loadingFileCheckSample', true);
    const payload = {
      action: 'GET_SAMPLE_BY_SHA256',
      sha256
    };
    this.sendIntegrationMessage(payload)
      .then((result) => {
        if (!result.noResults) {
          result.sample_verdict_color = this.getVerdictColorClass(result.sample_verdict);
        }

        this.get('block._state.fileCheckResults').unshiftObject({
          fileSize: file.size,
          fileName: file.name,
          sha256,
          sample: result.noResults ? null : result
        });
      })
      .catch((err) => {
        console.error(err);
        this.set('errorMessage', JSON.stringify(err, null, 2));
      })
      .finally(() => {
        this.set('loadingFileCheckSample', false);
      });
  },
  hashFile: function (file) {
    return this.readBinaryFile(file)
      .then((result) => {
        result = new Uint8Array(result);
        return window.crypto.subtle.digest('SHA-256', result);
      })
      .then((result) => {
        result = new Uint8Array(result);
        const resultHex = this.Uint8ArrayToHexString(result);
        return resultHex;
      });
  },
  readBinaryFile: function (file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => {
        resolve(fr.result);
      };
      fr.readAsArrayBuffer(file);
    });
  },
  Uint8ArrayToHexString: function (ui8array) {
    let hexString = '',
      h;
    for (let i = 0; i < ui8array.length; i++) {
      h = ui8array[i].toString(16);
      if (h.length === 1) {
        h = '0' + h;
      }
      hexString += h;
    }
    let p = Math.pow(2, Math.ceil(Math.log2(hexString.length)));
    hexString = hexString.padStart(p, '0');
    return hexString;
  },
  getVerdictColorClass: function (verdict) {
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
