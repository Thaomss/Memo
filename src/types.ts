export type Denomination = { value:number; label:string; kind:'Billet'|'Pièce' };
export type CashComposition = Record<string,number>;
export type OperationType = 'ouverture'|'paiement espèces'|'paiement carte'|'paiement autre'|'encaissement direct'|'entrée de caisse'|'sortie de caisse'|'annulation';
export type CashOperation = { id:string; at:string; type:OperationType; amount:number; added:CashComposition; removed:CashComposition; comment?:string };
export type CountComparison = { value:number; theoretical:number; actual:number; quantityDifference:number; amountDifference:number };
export type CashSession = { status:'open'|'closed'; startedAt:string; endedAt?:string; initial:CashComposition; current:CashComposition; operations:CashOperation[]; actual?:CashComposition };
