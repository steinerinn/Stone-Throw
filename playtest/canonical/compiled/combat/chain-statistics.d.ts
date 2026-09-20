import type { InternalRuleEvent } from './contracts.js';
/** Telemetry only: one count per processed attack cell, including misses and
 * repeated contacts. Announcements, damage and destruction events describe the
 * same processing and must not count it again. Unexecuted planned cells do not count. */
export declare function processedChainCells(event: Pick<InternalRuleEvent, 'kind' | 'cells'>): number;
