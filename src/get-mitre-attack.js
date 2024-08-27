const polarityRequest = require('./polarity-request');
const { ApiRequestError } = require('./errors');
const { getLogger } = require('./logger');
const SUCCESS_CODES = [200];

const MITRE_TACTICS_TEMPLATE = {
  'Initial Access': [],
  Execution: [],
  Persistence: [],
  'Privelege Escalation': [],
  'Defense Evasion': [],
  'Credential Access': [],
  Discovery: [],
  'Lateral Movement': [],
  Collection: [],
  'Command and Control': [],
  Exfiltration: [],
  Impact: []
};

const MITRE_ATTACK_TACTICS_ORDER = [
  'Initial Access',
  'Execution',
  'Persistence',
  'Privelege Escalation',
  'Defense Evasion',
  'Credential Access',
  'Discovery',
  'Lateral Movement',
  'Collection',
  'Command and Control',
  'Exfiltration',
  'Impact'
];

async function getMitreAttack(sampleId, options) {
  const Logger = getLogger();

  const requestOptions = {
    uri: `${options.url}/rest/sample/${sampleId}/mitre_attack`,
    method: 'GET'
  };

  const apiResponse = await polarityRequest.request(requestOptions, options);

  Logger.trace({ requestOptions, apiResponse }, 'Get Mitre Attack Response');

  if (!SUCCESS_CODES.includes(apiResponse.statusCode)) {
    throw new ApiRequestError(
      `Unexpected status code ${apiResponse.statusCode} received when fetching Mitre Attack from VMRay API`,
      {
        statusCode: apiResponse.statusCode,
        requestOptions: apiResponse.requestOptions
      }
    );
  }

  // Reorganize MITRE Attack data to be grouped by the Mitre Tactic
  const mitreData = apiResponse.body.data.mitre_attack_techniques;
  const reformattedMitre = copyMitreTemplate();
  let techniqueCount = 0;
  mitreData.forEach((entry) => {
    techniqueCount++;
    entry.tactics.forEach((tactic) => {
      entry.max_threat_indicator_score = getMaxScore(entry.threat_indicators);
      entry.tactic = tactic;
      entry.max_threat_indicator_score_color_class = getMaxScoreColor(
        entry.max_threat_indicator_score
      );
      entry.threat_indicators.forEach((indicator) => {
        if (indicator.score === 5) {
          indicator.score_class = 'five';
        } else if (indicator.score === 4) {
          indicator.score_class = 'four';
        } else if (indicator.score === 3) {
          indicator.score_class = 'three';
        } else if (indicator.score === 2) {
          indicator.score_class = 'two';
        } else if (indicator.score === 1) {
          indicator.score_class = 'one';
        } else {
          indicator.score_class = 'clean';
        }
      });
      reformattedMitre[tactic].push(entry);
    });

    for(const tactic in reformattedMitre){
      reformattedMitre[tactic].sort((a, b) => {
        return b.max_threat_indicator_score - a.max_threat_indicator_score;
      });
    }
  });

  return {
    tacticsOrder: MITRE_ATTACK_TACTICS_ORDER,
    tactics: reformattedMitre,
    totalTechniques: techniqueCount
  };
}

function getMaxScoreColor(maxScore) {
  if (maxScore === 5) {
    return 'five';
  } else if (maxScore === 4) {
    return 'four';
  } else if (maxScore === 3) {
    return 'three';
  } else if (maxScore === 2) {
    return 'two';
  } else if (maxScore === 1) {
    return 'one';
  } else {
    return 'clean';
  }
}

function getMaxScore(threatIndicators) {
  let maxScore = 1;
  threatIndicators.forEach((threat) => {
    if (threat.score > maxScore) {
      maxScore = threat.score;
    }
  });
  return maxScore;
}

function copyMitreTemplate() {
  let copy = { ...MITRE_TACTICS_TEMPLATE };
  for (const key in copy) {
    copy[key] = [];
  }
  return copy;
}

module.exports = {
  getMitreAttack
};
