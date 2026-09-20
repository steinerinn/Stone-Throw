import type { ResolutionContext, InternalRuleEvent } from './contracts.js';
/** Private statistical facts only: no randomness, clocks, writes to combat state or public projection. */
export declare function statisticalFacts(ctx: ResolutionContext, event: InternalRuleEvent): Record<string, unknown>;
