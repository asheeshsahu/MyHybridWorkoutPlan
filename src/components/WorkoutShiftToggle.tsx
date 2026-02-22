import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';

export type WorkoutShift = 'morning' | 'evening';

interface WorkoutShiftToggleProps {
  shift: WorkoutShift;
  onShiftChange: (shift: WorkoutShift) => void;
  isRestDay: boolean;
}

export const WorkoutShiftToggle: React.FC<WorkoutShiftToggleProps> = ({
  shift,
  onShiftChange,
  isRestDay,
}) => {
  return (
    <View style={styles.shiftToggleContainer}>
      <Text style={styles.shiftToggleLabel}>
        {isRestDay ? "Next Workout Plan" : "Today's Plan"}
      </Text>
      <View style={styles.shiftToggleRow}>
        <TouchableOpacity
          style={[styles.shiftToggleButton, shift === 'morning' && styles.shiftToggleActive]}
          onPress={() => onShiftChange('morning')}
        >
          <Text style={[styles.shiftToggleText, shift === 'morning' && styles.shiftToggleTextActive]}>
            🌅 Morning
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.shiftToggleButton, shift === 'evening' && styles.shiftToggleActive]}
          onPress={() => onShiftChange('evening')}
        >
          <Text style={[styles.shiftToggleText, shift === 'evening' && styles.shiftToggleTextActive]}>
            🌙 Evening
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
