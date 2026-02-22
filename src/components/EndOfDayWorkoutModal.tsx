import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { WorkoutDay } from '../types';
import { styles } from '../styles';

interface EndOfDayWorkoutModalProps {
  visible: boolean;
  workout: WorkoutDay | null;
  step: 1 | 2;
  onYes: () => void;
  onNo: () => void;
  onRescheduleYes: () => void;
  onRescheduleNo: () => void;
}

export const EndOfDayWorkoutModal: React.FC<EndOfDayWorkoutModalProps> = ({
  visible,
  workout,
  step,
  onYes,
  onNo,
  onRescheduleYes,
  onRescheduleNo,
}) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.modalOverlay, { justifyContent: 'center', padding: 24 }]}>
        <View style={[styles.modalContent, { marginHorizontal: 0 }]}>
          {step === 1 ? (
            <>
              <Text style={[styles.modalTitle, { marginBottom: 8 }]}>
                Did you do your workout today?
              </Text>
              <Text style={[styles.modalTime, { marginBottom: 24 }]}>
                You had {workout?.name} scheduled.
              </Text>
              <View style={styles.followupButtons}>
                <TouchableOpacity style={[styles.followupBtn, styles.yesBtn]} onPress={onYes}>
                  <Text style={styles.yesBtnText}>✓ Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.followupBtn, styles.noBtn]} onPress={onNo}>
                  <Text style={styles.noBtnText}>✗ No</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.modalTitle, { marginBottom: 8 }]}>
                Reschedule?
              </Text>
              <Text style={[styles.modalTime, { marginBottom: 24 }]}>
                Would you like to move today's workout to tomorrow?
              </Text>
              <View style={styles.followupButtons}>
                <TouchableOpacity style={[styles.followupBtn, styles.yesBtn]} onPress={onRescheduleYes}>
                  <Text style={styles.yesBtnText}>✓ Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.followupBtn, styles.noBtn]} onPress={onRescheduleNo}>
                  <Text style={styles.noBtnText}>✗ No</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};
