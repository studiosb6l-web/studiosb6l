const amounts=Object.freeze({PRO:Object.freeze({month:499,year:4990}),PRO_BUSINESS:Object.freeze({month:999,year:9990})});
// Provider price must be retrieved through a trusted authenticated adapter.
export function verifiedRecurringPrice(price,mapping){
 if(!price||!mapping||typeof price.id!=='string'||!Object.hasOwn(mapping,price.id))return null;
 const target=mapping[price.id];
 if(!target||!Object.hasOwn(amounts,target.plan)||!Object.hasOwn(amounts[target.plan],target.interval))return null;
 if(price.active!==true||price.currency!=='eur'||price.type!=='recurring'||price.recurring?.interval!==target.interval||price.recurring?.interval_count!==1||price.unit_amount!==amounts[target.plan][target.interval])return null;
 return {plan:target.plan,interval:target.interval,amount:price.unit_amount};
}
