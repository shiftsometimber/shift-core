// Applies to new treatment orders only, with a separately disclosed assessment fee.
// Existing orders retain their agreed refund terms. This module makes no payments.
export const assessmentFeePolicy={version:'treatment-assessment/2026-11-04',basisPoints:1000};
export function assessmentFeeQuote(treatmentTotalPence){
 if(!Number.isSafeInteger(treatmentTotalPence)||treatmentTotalPence<0)throw Error('invalid_treatment_total');
 const feePence=Math.floor(treatmentTotalPence/10);
 return {policyVersion:assessmentFeePolicy.version,treatmentTotalPence,feePence,declinedRefundPence:treatmentTotalPence-feePence};
}
export function assessmentDeclineRefund(order,{assessmentCompleted=false}={}){
 const total=order.treatmentTotalPence;
 const quote=assessmentFeeQuote(total);
 const applies=order.feePolicyVersion===assessmentFeePolicy.version&&order.feeAccepted===true&&assessmentCompleted===true;
 return {...quote,feeRetainedPence:applies?quote.feePence:0,refundPence:applies?quote.declinedRefundPence:total};
}
