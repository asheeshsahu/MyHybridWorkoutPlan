import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { DailyMacros, MacroInfo, MealOption, MealEntry } from '../types';
import { DAILY_MACRO_GOALS } from '../constants';
import { formatTime } from '../utils/time';
import { styles } from '../styles';
import { AddExtraMealModal } from './AddExtraMealModal';

const MACRO_BARS: { key: keyof MacroInfo; label: string; color: string; unit: string }[] = [
  { key: 'protein', label: 'Protein', color: '#ef4444', unit: 'g' },
  { key: 'carbs', label: 'Carbs', color: '#3b82f6', unit: 'g' },
  { key: 'fats', label: 'Fats', color: '#eab308', unit: 'g' },
];

interface MacroTrackerProps {
  dailyMacros: DailyMacros;
  onAddExtraMeal?: (meal: MealOption) => void;
  onDeleteExtraMeal?: (index: number) => void;
}

export const MacroTracker: React.FC<MacroTrackerProps> = ({ dailyMacros, onAddExtraMeal, onDeleteExtraMeal }) => {
  const [showAddExtraModal, setShowAddExtraModal] = useState(false);
  const calPct = Math.min((dailyMacros.consumed.calories / DAILY_MACRO_GOALS.calories) * 100, 100);

  return (
    <>
      <Text style={styles.sectionTitle}>🥩 Daily Macros</Text>
      <View style={styles.macroTrackerCard}>
        <View style={styles.macroCalorieHeader}>
          <Text style={styles.macroCalorieValue}>{dailyMacros.consumed.calories}</Text>
          <Text style={styles.macroCalorieLabel}>/ {DAILY_MACRO_GOALS.calories} cal</Text>
        </View>
        <View style={styles.macroProgressBar}>
          <View style={[styles.macroProgressFill, {
            width: `${calPct}%`,
            backgroundColor: dailyMacros.consumed.calories > DAILY_MACRO_GOALS.calories ? '#ef4444' : '#f97316',
          }]} />
        </View>

        <View style={styles.macroBreakdown}>
          {MACRO_BARS.map((macro) => {
            const consumed = dailyMacros.consumed[macro.key];
            const goal = DAILY_MACRO_GOALS[macro.key];
            const pct = Math.min((consumed / goal) * 100, 100);
            return (
              <View key={macro.key} style={styles.macroColumn}>
                <Text style={[styles.macroValue, { color: macro.color }]}>{consumed}{macro.unit}</Text>
                <View style={styles.macroMiniBar}>
                  <View style={[styles.macroMiniFill, { width: `${pct}%`, backgroundColor: macro.color }]} />
                </View>
                <Text style={styles.macroGoalText}>{goal}{macro.unit}</Text>
                <Text style={styles.macroLabel}>{macro.label}</Text>
              </View>
            );
          })}
        </View>

        {dailyMacros.meals.length > 0 && (
          <View style={styles.macroMealsLog}>
            <Text style={styles.macroMealsTitle}>TODAY'S MEALS</Text>
            {dailyMacros.meals.map((meal: MealEntry, i: number) => (
              <View key={i} style={[styles.macroMealRow, { alignItems: 'center' }]}>
                <Text style={styles.macroMealTime}>{formatTime(meal.time)}</Text>
                <Text style={[styles.macroMealLabel, { flex: 1 }]} numberOfLines={1}>{meal.option}</Text>
                <Text style={styles.macroMealCal}>{meal.macros.calories} cal</Text>
                {meal.reminderId === 'extra' && onDeleteExtraMeal && (
                  <TouchableOpacity
                    onPress={() => onDeleteExtraMeal(i)}
                    style={{ marginLeft: 8, padding: 6 }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={{ fontSize: 16, color: '#ef4444' }}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {onAddExtraMeal && (
          <TouchableOpacity
            style={[styles.customMealBtn, { marginTop: dailyMacros.meals.length > 0 ? 16 : 0 }]}
            onPress={() => setShowAddExtraModal(true)}
          >
            <Text style={styles.customMealBtnText}>+ Add extra meal</Text>
          </TouchableOpacity>
        )}
      </View>

      <AddExtraMealModal
        visible={showAddExtraModal}
        onAdd={(meal) => {
          onAddExtraMeal?.(meal);
          setShowAddExtraModal(false);
        }}
        onClose={() => setShowAddExtraModal(false)}
      />
    </>
  );
};
