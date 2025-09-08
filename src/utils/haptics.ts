import { Platform, Vibration } from 'react-native';

/**
 * Triggers a subtle haptic/vibration feedback suitable for add-to-cart actions.
 * Uses the built-in Vibration API for cross-platform support.
 */
export const triggerAddToCartHaptic = (): void => {
  // Short, light pulse. iOS compresses short durations; Android respects exact ms.
  // Keep it subtle to avoid intrusive feedback.
  if (Platform.OS === 'android') {
    Vibration.vibrate(15);
  } else {
    // On iOS, very short durations can be ignored; a small pattern helps
    Vibration.vibrate([0, 10]);
  }
};

/**
 * Triggers a slightly stronger error/warning feedback.
 * Use when an action is blocked (e.g., user must login first).
 */
export const triggerErrorHaptic = (): void => {
  if (Platform.OS === 'android') {
    Vibration.vibrate(40);
  } else {
    // Small double pulse communicates a warning without being harsh
    Vibration.vibrate([0, 20, 60, 20]);
  }
};
