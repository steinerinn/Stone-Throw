import type { DemonRuneBatch } from './demon-entropy.js';
import type { HostState } from '../host/contracts.js';
export interface NormalMemory {
    gaveUp?: true;
    resultMessage?: string;
    demonRunes?: DemonRuneBatch[];
    knownHits: string[];
    castleHits: string[];
    scoutKnowledge: [string, string][];
    heroHunt: string[];
    eventCursor: number;
    scoutQueue: string[];
}
export declare const emptyNormalMemory: () => NormalMemory;
/** Private normal-browser policy; not the Stage 9 Auto Match policy. */
export declare function normalPolicy(h: HostState, memory: NormalMemory): {
    target: (plagueAware: boolean) => string | null;
    catapult: (avoid: string[], origins: string[]) => string | null;
    roll: (cells: string[], protect?: boolean) => string | null;
    scout: (count: number) => string[];
};
