import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Reminder, ReminderCompletionData } from '../types';
import { formatTime } from '../utils/time';
import { getReminderColor } from '../utils/helpers';
import { styles } from '../styles';

interface RemindersListProps {
  reminders: Reminder[];
  completionData: ReminderCompletionData;
  isRestDay: boolean;
  onSelectReminder: (reminder: Reminder) => void;
  onMarkComplete: (id: string) => void;
  onUndoComplete: (id: string) => void;
}

export const RemindersList: React.FC<RemindersListProps> = ({
  reminders, completionData, isRestDay, onSelectReminder, onMarkComplete, onUndoComplete,
}) => {
  const isCompleted = (id: string) => !!completionData.completions[id];
  const getDisplayTime = (reminder: Reminder) => completionData.adjustedTimes[reminder.id] || reminder.time;

  return (
    <>
      <Text style={styles.sectionTitle}>⏰ {isRestDay ? 'Rest Day Schedule' : 'Daily Reminders'}</Text>
      <View style={styles.remindersSection}>
        {isRestDay && (
          <View style={styles.restDayBanner}>
            <Text style={styles.restDayBannerIcon}>💤</Text>
            <View style={styles.restDayBannerContent}>
              <Text style={styles.restDayBannerTitle}>Rest Day Adjustments Active</Text>
              <Text style={styles.restDayBannerText}>No workout • Skip shake • ½ Roti at lunch • No Roti at dinner</Text>
            </View>
          </View>
        )}
        <View style={[styles.reminderCard, styles.hydrationReminderCard]}>
          <View style={[styles.reminderIcon, { backgroundColor: '#3b82f6' }]}>
            <Text style={styles.reminderIconText}>💧</Text>
          </View>
          <View style={styles.reminderContent}>
            <Text style={styles.reminderTitle}>Hydration Reminders</Text>
            <Text style={styles.reminderTime}>Every hour 6AM - 9PM</Text>
          </View>
          <View style={styles.alwaysOnBadge}>
            <Text style={styles.alwaysOnText}>ALWAYS ON</Text>
          </View>
        </View>

        {reminders.map((reminder) => {
          const completed = isCompleted(reminder.id);
          const displayTime = getDisplayTime(reminder);
          const isAdjusted = !!completionData.adjustedTimes[reminder.id] && !completed;
          return (
            <View key={reminder.id} style={[styles.reminderCard, completed && styles.reminderCardCompleted]}>
              <Pressable
                style={[styles.completionCircle, completed && styles.completionCircleDone]}
                onPress={() => completed ? onUndoComplete(reminder.id) : onMarkComplete(reminder.id)}
                hitSlop={8}
              >
                {completed && <Text style={styles.completionCheck}>✓</Text>}
              </Pressable>

              <Pressable style={styles.reminderPressArea} onPress={() => onSelectReminder(reminder)}>
                <View style={[styles.reminderIcon, { backgroundColor: getReminderColor(reminder.id), opacity: completed ? 0.5 : 1 }]}>
                  <Text style={styles.reminderIconText}>{reminder.icon}</Text>
                </View>
                <View style={styles.reminderContent}>
                  <Text style={[styles.reminderTitle, completed && styles.reminderTitleCompleted]}>{reminder.title}</Text>
                  <View style={styles.reminderMeta}>
                    <Text style={[styles.reminderTime, isAdjusted && styles.reminderTimeAdjusted]}>
                      {formatTime(displayTime)}{isAdjusted ? ' (adjusted)' : ''}
                    </Text>
                    {completed ? (
                      <Text style={styles.reminderDoneAt}>Done at {formatTime(completionData.completions[reminder.id])}</Text>
                    ) : (
                      <Text style={styles.reminderTap}>Tap for details →</Text>
                    )}
                  </View>
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </>
  );
};
