import type { HostState } from '../host/contracts.js';
import type { SeenCell } from '../client-contract/public.js';
/** Ordinary stationary-unit hit/Scout observations. Hero movement and Plague
 * have different retained presentation histories and are handled separately.
 * This adapter never projects an unobserved cell or a canonical unit handle. */
export declare function stationaryDisclosure(h: HostState, base: SeenCell[]): SeenCell[];
