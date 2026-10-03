import fs from 'node:fs';
export const persistenceContract=Object.freeze(JSON.parse(fs.readFileSync(new URL('../persistence-contract.json',import.meta.url),'utf8')));
export const stateVersion=persistenceContract.state;

export const readableStateVersion=v=>v===undefined||v===stateVersion||v==='chainsiege-state-v1';
