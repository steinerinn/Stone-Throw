import type { HostConfiguration, HostState } from '../host/contracts.js';
import type { ClientTransport, Update } from '../client-contract/public.js';
/** Private authority factory. Only .client is passed to production presentation.
 * Persistence belongs to bootstrap/test authority, never a client remount payload. */
export declare function createLocalAuthority(config: HostConfiguration, checkpoint?: string, development?: boolean): Readonly<{
    client: ClientTransport;
    serializePrivate: () => string;
    dev?: Readonly<{
        inspect: () => Promise<HostState>;
        takeover: (enabled: boolean) => Promise<Update>;
        shoot: (cell: {
            x: number;
            y: number;
        }) => Promise<Update>;
    }>;
}>;
