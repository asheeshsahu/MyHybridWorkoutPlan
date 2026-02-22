import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Reminder } from '../types';
import { getGreeting, getNotificationBody } from '../utils/helpers';
import { styles } from '../styles';

interface HeaderProps {
  reminders: Reminder[];
  scheduleHydrationReminders: () => Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({ reminders, scheduleHydrationReminders }) => {
  const scheduleAllReminders = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const reminder of reminders.filter(r => r.enabled)) {
      const [hours, minutes] = reminder.time.split(':').map(Number);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${reminder.icon} ${reminder.title}`,
          body: getNotificationBody(reminder.id),
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        },
      });
    }
    await scheduleHydrationReminders();
    Alert.alert('✅ Reminders Set!', 'Daily notifications scheduled including hydration reminders every hour!');
  };

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.appTitle}>HybridFit</Text>
      </View>
      <TouchableOpacity style={styles.notifButton} onPress={scheduleAllReminders}>
        <Text style={styles.notifIcon}>🔔</Text>
      </TouchableOpacity>
    </View>
  );
};
