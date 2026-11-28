import {financePolicy,quotaPolicy} from './finance-policy.mjs';
import {planHiveJobs} from './hive-priority-policy.mjs';
import {evaluateEngine} from './hive-evaluation.mjs';
// Advisory snapshot only. Never executes jobs or authorizes spending.
export function assessHive({ledger,quota,jobs,metrics}={}) {
 const budget=financePolicy(ledger);
 const ready=ledger?.verified===true && ledger?.stopped===false && quota?.verified===true && quota?.stopped===false && [ledger.netRevenueCents,ledger.freeCashCents,ledger.committedCents,ledger.spentCents].every(v=>Number.isSafeInteger(v)&&v>=0) && quotaPolicy({...quota,requested:0}).allowed;
 return {ready,budget, candidates:ready?planHiveJobs({...quota,jobs}):[], evaluation:evaluateEngine(metrics), executionAuthorized:false};
}
