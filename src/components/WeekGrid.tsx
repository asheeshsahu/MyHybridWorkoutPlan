import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { WeekDay } from '../types';
import { styles } from '../styles';

interface WeekGridProps {
  weekDays: WeekDay[];
  onDayPress: (day: WeekDay) => void;
}

export const WeekGrid: React.FC<WeekGridProps> = ({ weekDays, onDayPress }) => (
  <>
    <Text style={styles.sectionTitle}>📅 This Week</Text>
    <View style={styles.weekGrid}>
      {weekDays.map((day, i) => (
        <TouchableOpacity
          key={i}
          style={[
            styles.dayCard,
            day.isToday && styles.todayDayCard,
            day.isCompleted && styles.completedDayCard,
            day.isRest && styles.restDayCard,
          ]}
          onPress={() => onDayPress(day)}
        >
          <Text style={styles.dayName}>{day.name}</Text>
          <Text style={styles.dayNum}>{day.num}</Text>
          <View style={[
            styles.dayType,
            day.isRest && styles.restDayType,
            day.isCompleted && styles.completedDayType,
          ]}>
            <Text style={[
              styles.dayTypeText,
              day.isRest && styles.restDayTypeText,
              day.isCompleted && styles.completedDayTypeText,
            ]}>
              {day.isRest ? 'Rest' : day.workout.type === 'gym' ? 'Gym' : 'Athletic'}
            </Text>
          </View>
          {day.isCompleted && <Text style={styles.checkIcon}>✓</Text>}
        </TouchableOpacity>
      ))}
    </View>
  </>
);
