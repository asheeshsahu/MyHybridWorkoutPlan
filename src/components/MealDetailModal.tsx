import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Reminder, MealDetail, MealOption, DailyMacros, ReminderCompletionData } from '../types';
import { formatTime } from '../utils/time';
import { getReminderColor } from '../utils/helpers';
import { styles } from '../styles';

interface MealDetailModalProps {
  selectedReminder: Reminder | null;
  getDetail: (id: string) => MealDetail;
  getMealOptions: (id: string) => MealOption[];
  completionData: ReminderCompletionData;
  dailyMacros: DailyMacros;
  onClose: () => void;
  onMarkComplete: (id: string) => void;
}

export const MealDetailModal: React.FC<MealDetailModalProps> = ({
  selectedReminder, getDetail, getMealOptions, completionData, dailyMacros, onClose, onMarkComplete,
}) => {
  const isCompleted = (id: string) => !!completionData.completions[id];

  return (
    <Modal visible={selectedReminder !== null} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {selectedReminder && (() => {
              const detail = getDetail(selectedReminder.id);
              if (!detail) return null;
              const isWorkout = selectedReminder.id === 'workout';
              const sectionLabel = isWorkout ? 'TODAY\'S EXERCISES' : 'WHAT TO EAT';
              return (
                <>
                  <View style={styles.modalHeader}>
                    <View style={[styles.modalIconBadge, { backgroundColor: getReminderColor(selectedReminder.id) }]}>
                      <Text style={styles.modalIcon}>{selectedReminder.icon}</Text>
                    </View>
                    <View style={styles.modalHeaderText}>
                      <Text style={styles.modalTitle}>{detail.heading}</Text>
                      <Text style={styles.modalTime}>{formatTime(selectedReminder.time)}</Text>
                    </View>
                  </View>

                  <View style={styles.modalDivider} />

                  <Text style={styles.modalSectionLabel}>{sectionLabel}</Text>
                  {detail.items.map((item, i) => (
                    <View key={i} style={styles.modalItem}>
                      <Text style={styles.modalBullet}>•</Text>
                      <Text style={styles.modalItemText}>{item}</Text>
                    </View>
                  ))}

                  {detail.tip && (
                    <View style={styles.modalTipBox}>
                      <Text style={styles.modalTipLabel}>💡 TIP</Text>
                      <Text style={styles.modalTipText}>{detail.tip}</Text>
                    </View>
                  )}

                  {detail.vegAlternatives && (
                    <>
                      <Text style={styles.modalSectionLabel}>🥬 VEG ALTERNATIVES</Text>
                      {detail.vegAlternatives.map((alt, i) => (
                        <View key={i} style={styles.modalItem}>
                          <Text style={styles.modalBullet}>{i + 1}.</Text>
                          <Text style={styles.modalItemText}>{alt}</Text>
                        </View>
                      ))}
                    </>
                  )}
                </>
              );
            })()}

            {selectedReminder && !isCompleted(selectedReminder.id) && (
              <TouchableOpacity style={styles.modalCompleteBtn} onPress={() => onMarkComplete(selectedReminder.id)}>
                <Text style={styles.modalCompleteBtnText}>
                  {getMealOptions(selectedReminder.id).length > 0 ? '🍽️  What did you eat?' : '✓  Mark as Done'}
                </Text>
              </TouchableOpacity>
            )}

            {selectedReminder && isCompleted(selectedReminder.id) && (() => {
              const loggedMeal = dailyMacros.meals.find(m => m.reminderId === selectedReminder.id);
              return (
                <View style={styles.modalCompletedBadge}>
                  <Text style={styles.modalCompletedText}>
                    ✅ Done at {formatTime(completionData.completions[selectedReminder.id])}
                  </Text>
                  {loggedMeal && loggedMeal.macros.calories > 0 && (
                    <>
                      <Text style={styles.modalCompletedMeal}>{loggedMeal.option}</Text>
                      <View style={styles.modalMacroRow}>
                        <Text style={[styles.modalMacroChip, { color: '#f97316' }]}>{loggedMeal.macros.calories} cal</Text>
                        <Text style={[styles.modalMacroChip, { color: '#ef4444' }]}>{loggedMeal.macros.protein}g P</Text>
                        <Text style={[styles.modalMacroChip, { color: '#3b82f6' }]}>{loggedMeal.macros.carbs}g C</Text>
                        <Text style={[styles.modalMacroChip, { color: '#eab308' }]}>{loggedMeal.macros.fats}g F</Text>
                      </View>
                    </>
                  )}
                </View>
              );
            })()}

            <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
