import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { WorkoutDay } from '../types';
import { styles } from '../styles';

interface FollowupCardProps {
  workout: WorkoutDay;
  onRecord: (completed: boolean) => void;
}

export const FollowupCard: React.FC<FollowupCardProps> = ({ workout, onRecord }) => (
  <View style={styles.followupCard}>
    <Text style={styles.followupTitle}>
      Did you complete yesterday's {workout.name}?
    </Text>
    <View style={styles.followupButtons}>
      <TouchableOpacity style={[styles.followupBtn, styles.yesBtn]} onPress={() => onRecord(true)}>
        <Text style={styles.yesBtnText}>✓ Yes!</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.followupBtn, styles.noBtn]} onPress={() => onRecord(false)}>
        <Text style={styles.noBtnText}>✗ Missed it</Text>
      </TouchableOpacity>
    </View>
  </View>
);
