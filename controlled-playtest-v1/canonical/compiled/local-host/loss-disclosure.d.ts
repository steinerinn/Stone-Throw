import type { HostState } from '../host/contracts.js';
import type { LossReveal } from '../client-contract/public.js';
/** Legacy revealEnemyBoardOnLoss, issued by authority only after normal defeat.
 * This is not a client-selectable reveal mode. Already-shot cells stay under
 * their existing combat disclosure; hidden identities never cross this boundary. */
export declare function lossDisclosure(h: HostState): LossReveal[];
