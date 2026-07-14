import type { CashComposition, CashOperation, CountComparison, Denomination } from '../types';

export const DENOMINATIONS:Denomination[] = [50000,20000,10000,5000,2000,1000,500,200,100,50,20,10,5,2,1].map(value=>({value,label:new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',minimumFractionDigits:value<100?2:0}).format(value/100),kind:value>=500?'Billet':'Pièce'}));
export const emptyComposition=():CashComposition=>Object.fromEntries(DENOMINATIONS.map(d=>[d.value,0]));
export const formatEuros=(cents:number)=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(cents/100);
export const parseCents=(raw:string):number|null=>{ const clean=raw.trim().replace(/\s/g,'').replace(',','.'); if(!/^\d+(\.\d{0,2})?$/.test(clean)) return null; return Math.round(Number(clean)*100); };
export const totalComposition=(c:CashComposition)=>DENOMINATIONS.reduce((sum,d)=>sum+(c[String(d.value)]||0)*d.value,0);
export const applyOperation=(base:CashComposition,added:CashComposition,removed:CashComposition)=>{ const next={...base}; for(const d of DENOMINATIONS){const k=String(d.value); const n=(next[k]||0)+(added[k]||0)-(removed[k]||0); if(n<0) throw new Error(`Quantité insuffisante pour ${d.label}`); next[k]=n;} return next; };
export const undoOperation=(base:CashComposition,op:CashOperation)=>applyOperation(base,op.removed,op.added);
export const compareCompositions=(theoretical:CashComposition,actual:CashComposition):CountComparison[]=>DENOMINATIONS.map(d=>{const t=theoretical[String(d.value)]||0,a=actual[String(d.value)]||0,q=a-t;return{value:d.value,theoretical:t,actual:a,quantityDifference:q,amountDifference:q*d.value}});
export function findChange(target:number,available:CashComposition):CashComposition|null {
  if(target<0)return null;
  if(target===0)return emptyComposition();
  if(totalComposition(available)<target)return null;
  const denoms=DENOMINATIONS.filter(d=>d.value<=target&&(available[String(d.value)]||0)>0);
  const suffix=denoms.map((_,i)=>denoms.slice(i).reduce((s,d)=>s+d.value*(available[String(d.value)]||0),0));
  const current=emptyComposition();
  let best:CashComposition|null=null;
  let bestCount=Infinity;
  function search(i:number,left:number,count:number){
    if(left===0){best={...current};bestCount=count;return;}
    if(i>=denoms.length||suffix[i]<left)return;
    const biggest=denoms[i].value;
    if(count+Math.ceil(left/biggest)>=bestCount)return;
    const d=denoms[i],key=String(d.value);
    const max=Math.min(available[key]||0,Math.floor(left/d.value),bestCount-count-1);
    for(let q=max;q>=0;q--){
      current[key]=q;
      search(i+1,left-q*d.value,count+q);
    }
    current[key]=0;
  }
  search(0,target,0);
  return best;
}
export const operationDetail=(op:CashOperation)=>{const parts:string[]=[];for(const d of DENOMINATIONS){const a=op.added[String(d.value)]||0,r=op.removed[String(d.value)]||0;if(a)parts.push(`+ ${d.label} × ${a}`);if(r)parts.push(`− ${d.label} × ${r}`);}return parts.join(' · ')};
