/**
 * Returns a random integer in the range [0, int).
 * Commonly used to pick a random element from an array by its length.
 */
export function randomIndex(int: number) {
    return Math.floor(Math.random() * int);
}

/**
 * Returns a random integer in the inclusive range [min, max].
 * Both bounds are rounded inward (ceil for min, floor for max) so
 * fractional inputs still produce an integer within the intended range.
 */
export function randomIntInclusive(min: number, max: number) {
    const low = Math.ceil(min);
    const high = Math.floor(max);
    return Math.floor(Math.random() * (high - low + 1)) + low;
}
