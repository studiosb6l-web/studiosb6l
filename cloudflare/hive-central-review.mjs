import {assessHive} from './hive-assessment.mjs';
import {eligibleOpportunities} from './hive-opportunity-quality.mjs';
import {businessMatches} from './hive-business-match.mjs';
import {retentionInsights} from './hive-retention.mjs';
import {demandSignal} from './hive-demand-signal.mjs';
import {screenInnovation} from './hive-innovation.mjs';
import {reputationSummary} from './hive-reputation.mjs';
import {reviewProposal} from './hive-negotiation.mjs';
import {translationPlan} from './hive-language.mjs';
import {marketGaps} from './hive-competitive.mjs';
import {healthTriage} from './hive-health.mjs';
// Internal advisory composition only. Never expose raw output to public clients.
export function reviewHive(input={}){
 const base={executionAuthorized:false};
 if(input.verified!==true||input.stopped!==false||!Number.isSafeInteger(input.now)||input.now<0)return {...base,status:'blocked'};
 const health=healthTriage({...input.health,stopped:false});
 if(health.status!=='healthy')return {...base,status:'review_required',health};
 const assessment=assessHive(input.assessment||{});
 if(assessment.ready!==true)return {...base,status:'review_required',health,assessment};
 return {...base,status:'advisory',health,assessment,
 opportunities:eligibleOpportunities(input.opportunities||[],input.now),
 matches:businessMatches(input.viewer,input.candidates,input.entitlement,input.now),
 retention:retentionInsights(input.retention),
 demand:demandSignal(input.demand),
 innovation:screenInnovation(input.innovation),
 reputation:reputationSummary(input.feedback,input.viewer?.id),
 proposal:reviewProposal(input.proposal,input.now),
 language:translationPlan({...input.language,stopped:false}),
 market:marketGaps(input.market,input.now)};
}

// Internal operational gateway: only explicitly supported free operations.
export async function authorizeHiveDiscovery(env, now=Date.now()) {
 if (!env?.DB || env.STOP_SERVICE !== 'false' || env.PREVIEW_ISOLATED === 'true' || env.DISCOVERY_ENABLED !== 'true') return false;
 const {reserveHiveQuota}=await import('./hive-quota-reservation.mjs');
 return reserveHiveQuota(env.DB,{service:'discovery-feed-requests',windowId:env.DISCOVERY_QUOTA_WINDOW,units:1,now});
}
