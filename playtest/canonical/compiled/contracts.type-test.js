function contracts(full, publicView, unit, player) {
    // @ts-expect-error Full state is not a public response.
    const unsafe = full;
    // @ts-expect-error Public responses do not carry private AI.
    publicView.privateAi;
    // @ts-expect-error Unit and player IDs are distinct.
    const wrong = unit;
    // @ts-expect-error Player IDs cannot identify units.
    const bad = player;
    return [unsafe, wrong, bad];
}
void contracts;
export {};
