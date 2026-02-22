import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles';

interface StatsGridProps {
  weekStreak: number;
  completed: number;
  rate: number;
  streak: number;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ weekStreak, completed, rate, streak }) => (
  <>
    <Text style={styles.sectionTitle}>📊 Your Progress</Text>
    <View style={styles.statsGrid}>
      <View style={styles.statCard}>
        <Text style={[styles.statValue, { color: '#7c3aed' }]}>{weekStreak}</Text>
        <Text style={styles.statLabel}>Week Streak</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={[styles.statValue, { color: '#f97316' }]}>{completed}</Text>
        <Text style={styles.statLabel}>Workouts Done</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={[styles.statValue, { color: '#10b981' }]}>{rate}%</Text>
        <Text style={styles.statLabel}>Completion Rate</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={[styles.statValue, { color: '#06b6d4' }]}>{streak}</Text>
        <Text style={styles.statLabel}>Current Streak</Text>
      </View>
    </View>
  </>
);
