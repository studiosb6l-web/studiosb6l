// Descriptive demand signal, not a forecast. Equal non-overlapping windows required.
export function demandSignal({verified,previous,current,windowDays,minimumCount=20}={}){
 if(verified!==true||![previous,current,windowDays,minimumCount].every(v=>Number.isSafeInteger(v)&&v>=0)||windowDays<1||windowDays>90||minimumCount<20||previous<minimumCount||current<minimumCount)return {status:'insufficient_data',change:null};
 const change=(current-previous)/previous;
 return {status:'observed',change,direction:change>=0.2?'rising':change<=-0.2?'falling':'stable',forecast:false};
}
