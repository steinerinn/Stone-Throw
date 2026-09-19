// Temporary, request-local numeric diagnostics. No host, token, body or credentials retained.
import {AsyncLocalStorage} from 'node:async_hooks';
export const metricsContext=new AsyncLocalStorage();
export function metric(name,ms,count=1){const m=metricsContext.getStore();if(!m)return;const v=m[name]??={ms:0,count:0};v.ms+=ms;v.count+=count;}
export function measured(name,fn){if(!metricsContext.getStore())return fn();const t=performance.now();try{return fn();}finally{metric(name,performance.now()-t);}}
export async function measuredAsync(name,fn){if(!metricsContext.getStore())return fn();const t=performance.now();try{return await fn();}finally{metric(name,performance.now()-t);}}
