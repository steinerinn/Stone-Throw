import type { ResolutionContext } from '../combat/contracts.js';
import type { NormalMemory } from './normal-policy.js';
import type { HostExecution } from '../host/lifecycle.js';
export interface DemonRuneBatch {
    boardId: string;
    runes: {
        cell: {
            x: number;
            y: number;
        };
        glyph: string;
        rotation: number;
    }[];
}
/** Authorized Stage 10 exception. Legacy visual order is row ascending X,
 * then column ascending Y, deduplicated by the ritual's rune map. Combat's
 * column-first impact order is deliberately not reused here. */
export declare function reserveNormalDemonRunes(ctx: ResolutionContext, memory: NormalMemory): void;
export declare const normalExecution: (memory: NormalMemory) => HostExecution;
