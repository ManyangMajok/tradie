import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { client } from '@tradify/shared';

export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function registerAndroidChannels() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('leads', {
    name: 'New Leads',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#9C5FE8',
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync('jobs', {
    name: 'Job Updates',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync('account', {
    name: 'Account & Billing',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function registerPushToken() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  try {
    const token = await Notifications.getExpoPushTokenAsync();
    await client.post('/api/v1/auth/register-device', {
      push_token: token.data,
      platform: Platform.OS,
    });
  } catch {
    // Non-fatal — app works without push token
  }
}
