import type { CashSession } from '../types';
const KEY='caisse-flemme-session-v1';
export const loadSession=():CashSession|null=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}};
export const saveSession=(s:CashSession|null)=>s?localStorage.setItem(KEY,JSON.stringify(s)):localStorage.removeItem(KEY);
