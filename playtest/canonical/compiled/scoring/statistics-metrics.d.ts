export declare const METRICS: string[];
export declare function emptyMetrics(): {
    bestHitStreak: number;
    bestMissStreak: number;
    biggestChain: number;
};
export declare function summarizeMatch(descriptor: any, facts: any): {
    [k: string]: any;
};
export declare function reliabilityAccounting(previous: any, classification: any, matchId: any): any;
export declare function aggregate(previous: any, summary: any, matchId: any): any;
export declare const FUTURE_HALL_OF_FAME_FULL_GAMES = 10;
export declare const futureHallOfFameEligible: (aggregate: any) => boolean;
