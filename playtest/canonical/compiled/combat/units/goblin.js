import { shuffle } from '../rng.js';
export function goblinTargets(available, rng, pacing = false) { const candidates = [...available], count = Math.min(candidates.length, pacing ? Math.min(15, Math.max(5, Math.ceil(candidates.length * 0.066))) : Math.max(5, Math.ceil(candidates.length * 0.044))); shuffle(candidates, rng, 'goblin-shuffle'); return candidates.slice(0, count); }
