export const RANDOM_PICKER_ENTRIES_KEY =
  "@expense_tracker:random_picker_entries";

export function drawRandomEntries<T>(
  entries: T[],
  winnerCount: number,
  allowDuplicates = false,
  random: () => number = Math.random,
): T[] {
  if (entries.length === 0 || winnerCount <= 0) return [];

  if (allowDuplicates) {
    return Array.from(
      { length: winnerCount },
      () => entries[Math.floor(random() * entries.length)],
    );
  }

  const shuffled = [...entries];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled.slice(0, Math.min(winnerCount, shuffled.length));
}

export function getWheelRotationTarget(
  currentRotation: number,
  selectedIndex: number,
  entryCount: number,
  fullTurns = 5,
): number {
  if (entryCount <= 0) return currentRotation;
  const segmentAngle = 360 / entryCount;
  const selectedCenter = -90 + (selectedIndex + 0.5) * segmentAngle;
  const currentRemainder = ((currentRotation % 360) + 360) % 360;
  const pointerAdjustment =
    (((-90 - selectedCenter - currentRemainder) % 360) + 360) % 360;
  return currentRotation + 360 * fullTurns + pointerAdjustment;
}
