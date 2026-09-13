export function createNormalPolicy(env: any, nextRandom: any): {
    target: () => any;
    plagueTarget: () => any;
    catapult: (avoidCastleCells?: null, avoidVolleyOrigins?: null) => any;
    catapultRoll: (cells: any, protectedCells?: Set<any>) => any;
    scout: (count: any) => void;
    protectedCells: () => Set<any>;
};
