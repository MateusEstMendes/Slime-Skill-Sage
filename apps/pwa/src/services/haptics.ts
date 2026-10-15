/**
 * Haptic feedback utility using navigator.vibrate with safe fallbacks
 */

export const triggerHaptic = (pattern: number | number[] = 12): boolean => {
  if (typeof window !== "undefined" && typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      return navigator.vibrate(pattern);
    } catch {
      return false;
    }
  }
  return false;
};

export const hapticFeedback = {
  tap: () => triggerHaptic(10),
  success: () => triggerHaptic([25, 40, 25]),
  warning: () => triggerHaptic([35, 50]),
  error: () => triggerHaptic([50, 80, 50]),
};
