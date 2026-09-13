export function createNormalPolicy(env:Record<string,unknown>,random:()=>number):{
 target:()=>string|null;plagueTarget:()=>string|null;
 catapult:(avoid:string[],origins:string[])=>string|null;
 catapultRoll:(cells:string[],protectedCells:Set<string>)=>string|null;
 scout:(count:number)=>void;protectedCells:()=>Set<string>;
};
