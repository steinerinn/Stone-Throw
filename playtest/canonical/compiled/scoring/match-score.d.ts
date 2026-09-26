export declare const SCORE_VERSION = "MATCH_SCORE_V1";
export declare function rational(n?: number, d?: number): {
    n: string;
    d: string;
};
export declare const add: (a: any, b: any) => {
    n: string;
    d: string;
};
export declare const numeric: (a: any) => number;
export declare const completed: (p: any) => boolean;
export declare function scorePlacements(d: any, facts: any): any;
export declare function calculateScores(d: any, facts: any, { expectedEvents }?: {
    expectedEvents?: any;
}): {
    scores: any;
    faction: {
        qualifying: boolean;
        playerUnits: number;
        aiUnits: number;
        reason: null;
    };
};
export declare function scoreCareer(scores: any): {
    exactTotal: {
        n: string;
        d: string;
    };
    lifetimeTotalScore: number;
    scoredMatchCount: any;
    highestMatchScore: number | null;
    thousandPlusCount: number;
};
