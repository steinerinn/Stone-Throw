import type { HostState, HostCommand, ShotAudit } from './contracts.js';
export declare function shotAudit(h: HostState, c: Extract<HostCommand, {
    kind: 'shoot';
}>): ShotAudit;
