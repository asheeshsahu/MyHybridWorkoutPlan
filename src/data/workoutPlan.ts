import { WorkoutDay } from '../types';

export const workoutPlan: Record<number, WorkoutDay> = {
  0: { type: 'rest', name: 'Rest Day', exercises: [] },
  1: { type: 'gym', name: 'Upper Focus', exercises: ['Incline DB Press 3×10', 'Weighted Pull-ups 3×Max', 'DB Lateral Raises 4×20', 'DB Bicep Curls 3×12'] },
  2: { type: 'athletic', name: 'Power & Rear Delts', exercises: ['KB/DB Swings 4×20', 'Box Jumps 4×5', 'Face Pulls 3×20', '100m Sprints ×5'] },
  3: { type: 'gym', name: 'Lower Focus', exercises: ['Back Squat 3×8', 'Romanian DL 3×12', 'Leg Extension 3×15', 'Seated Calf Raises 4×15'] },
  4: { type: 'athletic', name: 'Engine & Core', exercises: ['Skipping 10min', '3km Brisk Run', 'Burpees 3×15', 'Plank 3×1min'] },
  5: { type: 'gym', name: 'Symmetry', exercises: ['Weighted Dips 3×12', 'Seated Rows 3×12', 'Overhead Press 3×10', 'Hanging Leg Raises 3×15'] },
  6: { type: 'rest', name: 'Rest Day', exercises: [] },
};

/** Get workout for a day of week (0–6) with optional schedule offset (shifts plan by N days) */
export const getWorkoutForDay = (dayOfWeek: number, offset: number = 0): WorkoutDay => {
  const idx = (dayOfWeek - (offset % 7) + 7) % 7;
  return workoutPlan[idx];
};
