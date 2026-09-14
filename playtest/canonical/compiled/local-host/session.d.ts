import type { HostConfiguration } from '../host/contracts.js';
import type { ClientTransport, Request, PresentationFrame } from '../client-contract/public.js';
/** Bootstrap-owned battle handoff. The renderer receives only client.
 * Configuration is not a public intent or a writable global capability.
 * Replacing a battle preserves the private entropy stream and increments the
 * public battle epoch so delayed commands cannot target the replacement. */
export declare function createLocalSession(config: HostConfiguration, checkpoint?: string, development?: boolean): Readonly<{
    client: ClientTransport;
    dispatchWithProgress: (request: Request, notify: (frame: PresentationFrame) => Promise<void>) => Promise<import("../client-contract/public.js").Update>;
    serializePrivate: () => Promise<string>;
    configure: (next: HostConfiguration) => Promise<import("../client-contract/public.js").Update>;
    dev?: Readonly<{
        inspect: () => Promise<import("../host/contracts.js").HostState>;
        takeover: (enabled: boolean) => Promise<import("../client-contract/public.js").Update>;
        shoot: (cell: {
            x: number;
            y: number;
        }) => Promise<import("../client-contract/public.js").Update>;
    }>;
}>;
