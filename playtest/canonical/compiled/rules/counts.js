export function requiredCoreUnitCount(r) {
    return (r.inf || 0) + (r.cav || 0) + (r.archer || 0) + (r.monk || 0) + (r.castle || 0);
}
