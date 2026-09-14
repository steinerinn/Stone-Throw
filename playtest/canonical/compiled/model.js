export function id(value) {
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,95}$/.test(value) || ['__proto__', 'constructor', 'prototype'].includes(value))
        throw Error('Invalid identifier');
    return value;
}
