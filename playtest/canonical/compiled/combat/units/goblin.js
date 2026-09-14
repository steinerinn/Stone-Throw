import { shuffle } from '../rng.js';
export function goblinTargets(available, rng) { const candidates = [...available], count = Math.min(candidates.length, Math.max(5, Math.ceil(candidates.length * 0.044))); shuffle(candidates, rng, 'goblin-shuffle'); return candidates.slice(0, count); }
