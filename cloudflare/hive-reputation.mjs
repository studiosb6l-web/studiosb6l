// Aggregate only verified, consented, undisputed transaction feedback.
export function reputationSummary(records,subject){
 if(!Array.isArray(records)||typeof subject!=='string'||!subject)return {status:'insufficient_data',count:0,rating:null};
 const seen=new Set(),ratings=[];
 for(const r of records){
 if(!r||r.subject!==subject||r.verified!==true||r.consent!==true||r.disputed!==false||typeof r.transactionId!=='string'||!r.transactionId||seen.has(r.transactionId)||!Number.isInteger(r.rating)||r.rating<1||r.rating>5)continue;
 seen.add(r.transactionId);ratings.push(r.rating);
 }
 return {status:ratings.length>=5?'measured':'insufficient_data',count:ratings.length,rating:ratings.length>=5?ratings.reduce((a,b)=>a+b,0)/ratings.length:null};
}
