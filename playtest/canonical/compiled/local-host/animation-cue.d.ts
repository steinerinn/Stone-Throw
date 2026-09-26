import type { HostState } from '../host/contracts.js';
import type { InternalRuleEvent } from '../combat/contracts.js';
import type { Side, Cell } from '../client-contract/public.js';
export interface AnimationCue {
    targetSeat?: number;
    level?: number;
    pulseId?: string;
    ownerPlayerId?: string;
    kind: 'revolt' | 'double-plague' | 'enemy-shot' | 'catapult' | 'wizard' | 'archer' | 'goblin' | 'demon' | 'dragon' | 'assassin';
    side: Side;
    ownerSide: Side;
    origin: Cell;
    cell: Cell;
    group: number;
    step?: number;
}
/** Only resolved, publicly observable impact sites and the public reaction origin.
 * No planned random targets, private unit IDs or hidden geometry leave this adapter. */
export declare function animationCue(h: HostState, events: InternalRuleEvent[], groups: Map<string, number>): AnimationCue | undefined;
/** Attach only the public cause of an already-visible impact; never identity/geometry/RNG. */
export declare function impactSources(events: import('../client-contract/public.js').PublicEvent[], delta: InternalRuleEvent[], selfBoard: string, opponentBoard: string): import("../client-contract/public.js").PublicEvent[];
