export function estimateWalkingEtaSeconds(distanceMeters: number, mode: 'walking' | 'accessible') {
  const metersPerSecond = mode === 'accessible' ? 0.95 : 1.25;
  return Math.max(30, Math.round(distanceMeters / metersPerSecond));
}
