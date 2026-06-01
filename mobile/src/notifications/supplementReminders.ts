// ============================================================
// Supplement reminders — local (on-device) notifications, Section 12.
// Local notifications need no push entitlement, so they work on the free
// Apple account. Schedules one daily repeating notification per time slot,
// grouping supplements that share a time (e.g. D3 + Omega-3 + creatine at the
// midday meal) into a single reminder.
// ============================================================

import * as Notifications from 'expo-notifications';
import { SUPPLEMENT_SCHEDULE } from '@/data/supplements';

// Show reminders even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permission, then (re)schedule a daily repeating reminder
 * for each supplement time slot. Cancels existing schedules first to avoid
 * duplicates. Returns true if permission was granted and reminders are set.
 */
export async function scheduleSupplementReminders(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;

  await Notifications.cancelAllScheduledNotificationsAsync();

  // Group supplements sharing a reminder time into one notification.
  const slots = new Map<string, { hour: number; minute: number; names: string[] }>();
  for (const s of SUPPLEMENT_SCHEDULE) {
    const key = `${s.reminderHour}:${s.reminderMinute}`;
    const slot = slots.get(key) ?? { hour: s.reminderHour, minute: s.reminderMinute, names: [] };
    slot.names.push(s.name);
    slots.set(key, slot);
  }

  for (const slot of slots.values()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Supplement reminder',
        body: `Time to take: ${slot.names.join(', ')}`,
      },
      trigger: { hour: slot.hour, minute: slot.minute, repeats: true },
    });
  }
  return true;
}

/** Cancel all scheduled supplement reminders. */
export async function cancelSupplementReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
