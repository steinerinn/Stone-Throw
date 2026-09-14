/** Exact-key, JSON-only runtime validation. Unknown fields fail closed. */
type S = {
    kind: 'str' | 'num' | 'bool' | 'null';
} | {
    kind: 'enum';
    values: readonly unknown[];
} | {
    kind: 'array';
    item: S;
} | {
    kind: 'object';
    fields: Record<string, S>;
} | {
    kind: 'dict';
    item: S;
} | {
    kind: 'union';
    items: S[];
};
export declare const stateSchema: S;
export declare const projectionSchema: S;
export declare function validate(schema: S, value: unknown, path?: string, ancestors?: Set<object>): void;
export {};
