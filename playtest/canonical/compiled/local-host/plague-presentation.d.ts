import type { HostState } from '../host/contracts.js';
export declare function publicPlagueActive(h: HostState, boards?: ReadonlySet<string>): boolean;
export declare function resolvedStoryPlagueTargets(h: HostState): import("../model.js").PlayerId[];
