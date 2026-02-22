import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { WorkoutDay } from '../types';
import { styles } from '../styles';

interface TodayWorkoutProps {
  workout: WorkoutDay;
}

export const TodayWorkout: React.FC<TodayWorkoutProps> = ({ workout }) => (
  <View style={[styles.todayCard, workout.type === 'rest' && styles.restCard]}>
    <Text style={styles.todayLabel}>TODAY'S WORKOUT</Text>
    <Text style={styles.todayWorkout}>
      {workout.type === 'rest' ? '🛋️ ' : workout.type === 'gym' ? '🏋️ ' : '⚡ '}
      {workout.name}
    </Text>
    <View style={styles.exerciseTags}>
      {workout.type !== 'rest' ? (
        workout.exercises.slice(0, 4).map((ex, i) => (
          <View key={i} style={styles.exerciseTag}>
            <Text style={styles.exerciseTagText}>{ex.split(' ')[0]}</Text>
          </View>
        ))
      ) : (
        ['Sleep well', 'Stay hydrated', 'Light stretching'].map((item, i) => (
          <View key={i} style={styles.exerciseTag}>
            <Text style={styles.exerciseTagText}>{item}</Text>
          </View>
        ))
      )}
    </View>
    <TouchableOpacity
      style={styles.startButton}
      onPress={() => Alert.alert('💪 Let\'s Go!', `Starting ${workout.name}`)}
    >
      <Text style={styles.startButtonText}>
        {workout.type === 'rest' ? 'Enjoy Your Rest!' : 'Start Workout'}
      </Text>
    </TouchableOpacity>
  </View>
);
