import type { HostConfiguration, HostState } from '../host/contracts.js';
import type { Request, Update, PresentationFrame } from '../client-contract/public.js';
/** Private authority factory. Only .client is passed to production presentation.
 * Persistence belongs to bootstrap/test authority, never a client remount payload. */
export declare function createLocalAuthority(config: HostConfiguration, checkpoint?: string, development?: boolean): Readonly<{
    client: Readonly<{
        read: (after?: number) => Promise<Update>;
        dispatch: (raw: Request, onPlayerFrame?: (frame: PresentationFrame) => Promise<void>) => Promise<Update>;
    }>;
    serializePrivate: () => string;
    dispatchWithProgress: (request: Request, notify: (frame: PresentationFrame) => Promise<void>) => Promise<Update>;
    dev?: Readonly<{
        inspect: () => Promise<HostState>;
        takeover: (enabled: boolean) => Promise<Update>;
        shoot: (cell: {
            x: number;
            y: number;
        }) => Promise<Update>;
    }>;
}>;
