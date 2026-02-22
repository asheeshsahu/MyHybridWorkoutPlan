import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { MealOption } from '../types';
import { fetchNutritionFromQuery } from '../utils/nutritionApi';
import { GROQ_API_KEY } from '../config/nutrition';
import { styles } from '../styles';

interface AddExtraMealModalProps {
  visible: boolean;
  onAdd: (meal: MealOption) => void;
  onClose: () => void;
}

export const AddExtraMealModal: React.FC<AddExtraMealModalProps> = ({
  visible, onAdd, onClose,
}) => {
  const [customQuery, setCustomQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchedOption, setFetchedOption] = useState<MealOption | null>(null);
  const [manualCal, setManualCal] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFats, setManualFats] = useState('');
  const [showManual, setShowManual] = useState(false);

  const resetCustom = () => {
    setCustomQuery('');
    setFetchedOption(null);
    setManualCal('');
    setManualProtein('');
    setManualCarbs('');
    setManualFats('');
    setShowManual(false);
  };

  const handleClose = () => {
    resetCustom();
    onClose();
  };

  const handleFetchMacros = async () => {
    const query = customQuery.trim();
    if (!query) return;

    if (GROQ_API_KEY) {
      setLoading(true);
      setFetchedOption(null);
      try {
        const result = await fetchNutritionFromQuery(query);
        if (result && result.macros.calories > 0) {
          setFetchedOption({ label: result.label, macros: result.macros });
        } else {
          setShowManual(true);
          Alert.alert(
            'No results',
            'API returned no nutrition data. Try: "3 eggs and 2 bread" or "1 cup rice and chicken". Enter manually below.'
          );
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setShowManual(true);
        Alert.alert('Lookup failed', `${msg}\n\nEnter macros manually below.`);
      } finally {
        setLoading(false);
      }
    } else {
      setShowManual(true);
    }
  };

  const handleAddManual = () => {
    const cal = parseInt(manualCal, 10) || 0;
    const protein = parseInt(manualProtein, 10) || 0;
    const carbs = parseInt(manualCarbs, 10) || 0;
    const fats = parseInt(manualFats, 10) || 0;
    if (cal === 0 && protein === 0 && carbs === 0 && fats === 0) {
      Alert.alert('Enter values', 'Add at least one macro value.');
      return;
    }
    setFetchedOption({
      label: customQuery.trim() || 'Custom meal',
      macros: { calories: cal, protein, carbs, fats },
    });
  };

  const handleConfirm = () => {
    if (fetchedOption) {
      onAdd(fetchedOption);
      handleClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add extra meal</Text>
          <Text style={styles.mealPickerSubtitle}>Track any extra food you ate today</Text>
          <View style={styles.modalDivider} />

          <ScrollView style={styles.mealPickerScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.customMealSection}>
              <Text style={styles.customMealLabel}>What did you eat?</Text>
              <TextInput
                style={styles.customMealInput}
                placeholder="e.g. 3 eggs and 2 bread, or 1 cup rice"
                placeholderTextColor="#64748b"
                value={customQuery}
                onChangeText={setCustomQuery}
                editable={!loading}
              />
              <TouchableOpacity
                style={[styles.customMealBtn, loading && { opacity: 0.6 }]}
                onPress={handleFetchMacros}
                disabled={loading || !customQuery.trim()}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.customMealBtnText}>🔍 Look up macros</Text>
                )}
              </TouchableOpacity>
              {!GROQ_API_KEY && (
                <Text style={[styles.customMealLabel, { marginTop: 4, fontSize: 11, color: '#64748b' }]}>
                  Add Groq API key in src/config/nutrition.ts
                </Text>
              )}
              {(showManual || !GROQ_API_KEY) && (
                <>
                  <Text style={[styles.customMealLabel, { marginTop: 16 }]}>Manual macros</Text>
                  <View style={styles.customMealRow}>
                    <TextInput style={styles.customMealField} placeholder="Cal" placeholderTextColor="#64748b" value={manualCal} onChangeText={setManualCal} keyboardType="numeric" />
                    <TextInput style={styles.customMealField} placeholder="P (g)" placeholderTextColor="#64748b" value={manualProtein} onChangeText={setManualProtein} keyboardType="numeric" />
                    <TextInput style={styles.customMealField} placeholder="C (g)" placeholderTextColor="#64748b" value={manualCarbs} onChangeText={setManualCarbs} keyboardType="numeric" />
                    <TextInput style={styles.customMealField} placeholder="F (g)" placeholderTextColor="#64748b" value={manualFats} onChangeText={setManualFats} keyboardType="numeric" />
                  </View>
                  <TouchableOpacity style={styles.customMealBtn} onPress={handleAddManual}>
                    <Text style={styles.customMealBtnText}>Add custom meal</Text>
                  </TouchableOpacity>
                </>
              )}
              {fetchedOption && (
                <TouchableOpacity style={[styles.mealOptionCard, { marginTop: 12, borderColor: '#7c3aed' }]} onPress={handleConfirm}>
                  <Text style={styles.mealOptionLabel}>✓ {fetchedOption.label}</Text>
                  <View style={styles.mealOptionMacros}>
                    <View style={[styles.macroChip, { backgroundColor: 'rgba(249,115,22,0.15)' }]}><Text style={[styles.macroChipText, { color: '#f97316' }]}>🔥 {fetchedOption.macros.calories}</Text></View>
                    <View style={[styles.macroChip, { backgroundColor: 'rgba(239,68,68,0.15)' }]}><Text style={[styles.macroChipText, { color: '#ef4444' }]}>P {fetchedOption.macros.protein}g</Text></View>
                    <View style={[styles.macroChip, { backgroundColor: 'rgba(59,130,246,0.15)' }]}><Text style={[styles.macroChipText, { color: '#3b82f6' }]}>C {fetchedOption.macros.carbs}g</Text></View>
                    <View style={[styles.macroChip, { backgroundColor: 'rgba(234,179,8,0.15)' }]}><Text style={[styles.macroChipText, { color: '#eab308' }]}>F {fetchedOption.macros.fats}g</Text></View>
                  </View>
                  <Text style={[styles.customMealLabel, { marginTop: 8, fontSize: 11 }]}>Tap to add to daily macros</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.modalCloseBtn} onPress={handleClose}>
            <Text style={styles.modalCloseBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
