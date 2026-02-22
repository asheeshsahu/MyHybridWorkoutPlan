import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { TOTAL_GLASSES, GLASS_SIZE } from '../constants';
import { styles } from '../styles';

interface HydrationCardProps {
  glasses: number;
  addWaterGlass: (count?: number) => void;
  removeWaterGlass: () => void;
}

export const HydrationCard: React.FC<HydrationCardProps> = ({ glasses, addWaterGlass, removeWaterGlass }) => {
  const progress = Math.min((glasses / TOTAL_GLASSES) * 100, 100);
  const liters = (glasses * GLASS_SIZE / 1000).toFixed(1);
  const remaining = ((TOTAL_GLASSES - glasses) * GLASS_SIZE / 1000).toFixed(1);

  return (
    <View style={styles.hydrationCard}>
      <View style={styles.hydrationHeader}>
        <Text style={styles.hydrationTitle}>💧 Daily Hydration</Text>
        <Text style={styles.hydrationSubtitle}>Goal: 4 Liters</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{liters}L / 4L</Text>
      </View>

      <View style={styles.glassCounter}>
        <TouchableOpacity style={styles.glassBtn} onPress={removeWaterGlass}>
          <Text style={styles.glassBtnText}>−</Text>
        </TouchableOpacity>
        <View style={styles.glassDisplay}>
          <Text style={styles.glassCount}>{glasses}</Text>
          <Text style={styles.glassLabel}>/ {TOTAL_GLASSES} glasses</Text>
        </View>
        <TouchableOpacity style={[styles.glassBtn, styles.glassBtnAdd]} onPress={addWaterGlass}>
          <Text style={[styles.glassBtnText, styles.glassBtnAddText]}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickAddRow}>
        <TouchableOpacity style={styles.quickAddBtn} onPress={() => addWaterGlass(1)}>
          <Text style={styles.quickAddText}>🥛 +250ml</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAddBtn} onPress={() => addWaterGlass(2)}>
          <Text style={styles.quickAddText}>🍶 +500ml</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAddBtn} onPress={() => addWaterGlass(4)}>
          <Text style={styles.quickAddText}>🫗 +1L</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.hydrationStatus}>
        <Text style={styles.hydrationStatusText}>
          {glasses >= TOTAL_GLASSES
            ? "🎉 Goal Complete! Great job staying hydrated!"
            : `${remaining}L remaining • Reminders every hour`}
        </Text>
      </View>
    </View>
  );
};
