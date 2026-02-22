import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, ScrollView, StatusBar, Alert, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import {
  Reminder, HydrationData, ReminderCompletionData,
  MacroInfo, MealOption, DailyMacros, MealDetail, WorkoutDay, WeekDay,
} from './src/types';
import { TOTAL_GLASSES, GLASS_SIZE, HYDRATION_HOURS } from './src/constants';
import { workoutPlan, getWorkoutForDay } from './src/data/workoutPlan';
import {
  defaultReminders, restDayRemindersMorning, restDayRemindersEvening, eveningReminders,
  mealDetails, restDayMealDetails, eveningMealDetails,
  mealOptionsData, restDayMealOptions, eveningMealOptions,
} from './src/data/reminders';
import { timeToMinutes, minutesToTime, getTodayKey, getCurrentTime, isPastTime } from './src/utils/time';
import { getNotificationBody } from './src/utils/helpers';
import {
  Header, HydrationCard, TodayWorkout, FollowupCard,
  WeekGrid, RemindersList, MealDetailModal, MealPickerModal,
  MacroTracker, StatsGrid, WorkoutShiftToggle, DayScheduleModal,
  EndOfDayWorkoutModal, SplashScreen,
} from './src/components';
import type { WorkoutShift } from './src/components/WorkoutShiftToggle';
import { styles } from './src/styles';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  // ── State ──
  const [completedDays, setCompletedDays] = useState<Record<string, boolean>>({});
  const [reminders, setReminders] = useState<Reminder[]>(defaultReminders);
  const [showFollowup, setShowFollowup] = useState(false);
  const [yesterdayWorkout, setYesterdayWorkout] = useState<WorkoutDay | null>(null);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [showMealPicker, setShowMealPicker] = useState(false);
  const [pendingCompleteId, setPendingCompleteId] = useState<string | null>(null);
  const [dailyMacros, setDailyMacros] = useState<DailyMacros>({
    date: getTodayKey(), consumed: { calories: 0, protein: 0, carbs: 0, fats: 0 }, meals: [],
  });
  const [completionData, setCompletionData] = useState<ReminderCompletionData>({
    date: getTodayKey(), completions: {}, adjustedTimes: {},
  });
  const [hydration, setHydration] = useState<HydrationData>({
    date: getTodayKey(), glasses: 0, lastReminderHour: 5,
  });
  const [workoutShift, setWorkoutShiftState] = useState<WorkoutShift>('morning');
  const [selectedScheduleDay, setSelectedScheduleDay] = useState<WeekDay | null>(null);
  const [scheduleDayReminders, setScheduleDayReminders] = useState<Reminder[]>([]);
  const [scheduleDayShift, setScheduleDayShift] = useState<WorkoutShift>('morning');
  const [scheduleOffset, setScheduleOffset] = useState(0);
  const [showEndOfDayModal, setShowEndOfDayModal] = useState(false);
  const [endOfDayStep, setEndOfDayStep] = useState<1 | 2>(1);
  const [endOfDayWorkout, setEndOfDayWorkout] = useState<WorkoutDay | null>(null);
  const endOfDayOffsetRef = useRef(0);
  const [showSplash, setShowSplash] = useState(true);

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const isRestDay = getWorkoutForDay(new Date().getDay(), scheduleOffset).type === 'rest';

  const setWorkoutShift = useCallback(async (shift: WorkoutShift) => {
    setWorkoutShiftState(shift);
    await AsyncStorage.setItem(`workoutShift_${getTodayKey()}`, shift);
  }, []);

  // Auto-switch: morning → evening if not done in time
  // Workout days: workout not done by 10 AM
  // Rest days: walk + stretch not done by 09 AM (breakfast)
  useEffect(() => {
    const checkAutoSwitch = async () => {
      const saved = await AsyncStorage.getItem(`workoutShift_${getTodayKey()}`);
      const currentShift = saved === 'evening' ? 'evening' : 'morning';
      if (currentShift !== 'morning') return;

      if (isRestDay) {
        if (!isPastTime('09:00')) return;
        const walkDone = completionData.completions['recovery_walk'];
        const stretchDone = completionData.completions['recovery_stretch'];
        if (walkDone || stretchDone) return;
      } else {
        if (!isPastTime('10:00')) return;
        const workoutCompleted = completionData.completions['workout'];
        if (workoutCompleted) return;
      }

      setWorkoutShiftState('evening');
      await AsyncStorage.setItem(`workoutShift_${getTodayKey()}`, 'evening');
    };
    checkAutoSwitch();
  }, [isRestDay, completionData.completions['workout'], completionData.completions['recovery_walk'], completionData.completions['recovery_stretch']]);

  // ── Lifecycle ──
  useEffect(() => {
    loadData();
    registerForPushNotifications();
    checkFollowup();
    scheduleHydrationReminders();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      if (notification.request.content.data?.type === 'hydration') {
        checkAndScheduleCatchupReminder();
      }
    });
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      if (response.notification.request.content.data?.type === 'hydration') {
        addWaterGlass();
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  useEffect(() => {
    const today = getTodayKey();
    if (completionData.date !== today) {
      const reset: ReminderCompletionData = { date: today, completions: {}, adjustedTimes: {} };
      setCompletionData(reset);
      AsyncStorage.setItem('reminderCompletions', JSON.stringify(reset));
      AsyncStorage.getItem(`workoutShift_${today}`).then(saved => {
        if (saved === 'morning' || saved === 'evening') setWorkoutShiftState(saved);
        else setWorkoutShiftState('morning');
      });
    }
  }, [completionData.date]);

  useEffect(() => {
    const today = getTodayKey();
    if (hydration.date !== today) {
      const reset = { date: today, glasses: 0, lastReminderHour: 5 };
      setHydration(reset);
      AsyncStorage.setItem('hydration', JSON.stringify(reset));
      scheduleHydrationReminders();
    }
  }, [hydration.date]);

  // ── Data Loading ──
  const loadData = async () => {
    try {
      const today = getTodayKey();
      const [savedDays, savedReminders, savedHydration, savedCompletions, savedMacros, savedShift, savedOffset] = await Promise.all([
        AsyncStorage.getItem('completedDays'),
        AsyncStorage.getItem('reminders'),
        AsyncStorage.getItem('hydration'),
        AsyncStorage.getItem('reminderCompletions'),
        AsyncStorage.getItem('dailyMacros'),
        AsyncStorage.getItem(`workoutShift_${today}`),
        AsyncStorage.getItem('scheduleOffset'),
      ]);

      if (savedDays) setCompletedDays(JSON.parse(savedDays));

      if (savedReminders) {
        const parsed = JSON.parse(savedReminders);
        if (parsed.length !== defaultReminders.length) {
          setReminders(defaultReminders);
          await AsyncStorage.setItem('reminders', JSON.stringify(defaultReminders));
        } else {
          setReminders(parsed);
        }
      } else {
        await AsyncStorage.setItem('reminders', JSON.stringify(defaultReminders));
      }

      if (savedHydration) {
        const parsed = JSON.parse(savedHydration);
        if (parsed.date === today) setHydration(parsed);
        else {
          const reset = { date: today, glasses: 0, lastReminderHour: 5 };
          setHydration(reset);
          await AsyncStorage.setItem('hydration', JSON.stringify(reset));
        }
      }

      if (savedCompletions) {
        const parsed = JSON.parse(savedCompletions);
        if (parsed.date === today) setCompletionData(parsed);
        else {
          const reset: ReminderCompletionData = { date: today, completions: {}, adjustedTimes: {} };
          setCompletionData(reset);
          await AsyncStorage.setItem('reminderCompletions', JSON.stringify(reset));
        }
      }

      if (savedMacros) {
        const parsed = JSON.parse(savedMacros);
        if (parsed.date === today) setDailyMacros(parsed);
        else {
          const reset: DailyMacros = { date: today, consumed: { calories: 0, protein: 0, carbs: 0, fats: 0 }, meals: [] };
          setDailyMacros(reset);
          await AsyncStorage.setItem('dailyMacros', JSON.stringify(reset));
        }
      }

      if (savedShift === 'morning' || savedShift === 'evening') setWorkoutShiftState(savedShift);

      const offset = savedOffset ? parseInt(savedOffset, 10) : 0;
      if (!isNaN(offset) && offset >= 0) setScheduleOffset(offset);
    } catch (e) {
      console.log('Error loading data:', e);
    }
  };

  // ── Notifications ──
  const registerForPushNotifications = async () => {
    if (!Device.isDevice) { console.log('Must use physical device for Push Notifications'); return; }
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') console.log('Failed to get push notification permissions');
  };

  const scheduleHydrationReminders = async () => {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.content.data?.type === 'hydration') await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
    const currentHour = new Date().getHours();
    for (const hour of HYDRATION_HOURS.filter(h => h > currentHour)) {
      const glassesNeeded = Math.ceil((hour - 5) * (TOTAL_GLASSES / 16));
      await Notifications.scheduleNotificationAsync({
        content: { title: '💧 Hydration Check', body: getHydrationMessage(glassesNeeded), sound: true, data: { type: 'hydration', expectedGlasses: glassesNeeded } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0 },
      });
    }
    for (const hour of HYDRATION_HOURS) {
      await Notifications.scheduleNotificationAsync({
        content: { title: '💧 Time to Hydrate!', body: 'Drink a glass of water to stay on track for 4L today! 🚰', sound: true, data: { type: 'hydration' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0 },
      });
    }
  };

  const getHydrationMessage = (expectedGlasses: number): string => {
    const remaining = TOTAL_GLASSES - hydration.glasses;
    const litersRemaining = (remaining * GLASS_SIZE / 1000).toFixed(1);
    if (hydration.glasses >= TOTAL_GLASSES) return "🎉 Amazing! You've hit your 4L goal today!";
    if (hydration.glasses >= expectedGlasses) return `Great progress! ${remaining} glasses (${litersRemaining}L) to go! 💪`;
    return `You're ${expectedGlasses - hydration.glasses} glasses behind! Drink up now! 🚨`;
  };

  const checkAndScheduleCatchupReminder = async () => {
    const currentHour = new Date().getHours();
    const expectedGlasses = Math.ceil((currentHour - 5) * (TOTAL_GLASSES / 16));
    if (hydration.glasses < expectedGlasses && hydration.glasses < TOTAL_GLASSES) {
      await Notifications.scheduleNotificationAsync({
        content: { title: '⚠️ Catch-up Reminder!', body: `You're behind on water! Drink ${expectedGlasses - hydration.glasses} glasses now to catch up!`, sound: true, data: { type: 'hydration', catchup: true } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 30 * 60 },
      });
    }
  };

  // ── Hydration ──
  const saveHydration = async (data: HydrationData) => { setHydration(data); await AsyncStorage.setItem('hydration', JSON.stringify(data)); };

  const addWaterGlass = async (count: number = 1) => {
    if (hydration.glasses >= TOTAL_GLASSES) { Alert.alert('🎉 Goal Complete!', "You've already hit your 4L goal today!"); return; }
    const toAdd = Math.min(count, TOTAL_GLASSES - hydration.glasses);
    if (toAdd <= 0) return;
    const newGlasses = hydration.glasses + toAdd;
    await saveHydration({ ...hydration, glasses: newGlasses });
    const remaining = TOTAL_GLASSES - newGlasses;
    if (newGlasses >= TOTAL_GLASSES) {
      Alert.alert('🎉 Goal Complete!', "Awesome! You've hit your 4L water goal today!");
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const n of scheduled) { if (n.content.data?.type === 'hydration') await Notifications.cancelScheduledNotificationAsync(n.identifier); }
    } else {
      const mlLabel = toAdd === 1 ? '+250ml' : `+${toAdd * 250}ml`;
      Alert.alert(`💧 ${mlLabel}`, `${remaining} glasses (${(remaining * GLASS_SIZE / 1000).toFixed(1)}L) remaining`);
    }
  };

  const removeWaterGlass = async () => {
    if (hydration.glasses <= 0) return;
    await saveHydration({ ...hydration, glasses: hydration.glasses - 1 });
  };

  // ── Reminder Completion & Macros ──
  const getActiveMealOptions = (id: string): MealOption[] => {
    if (isRestDay) return restDayMealOptions[id] || [];
    if (workoutShift === 'evening') return eveningMealOptions[id] || [];
    return mealOptionsData[id] || [];
  };

  const markReminderComplete = (id: string) => {
    const options = getActiveMealOptions(id);
    if (options.length > 0) {
      setSelectedReminder(null);
      setPendingCompleteId(id);
      setTimeout(() => setShowMealPicker(true), 300);
    } else {
      finalizeCompletion(id, null);
    }
  };

  const finalizeCompletion = async (id: string, selectedMeal: MealOption | null) => {
    const currentTime = getCurrentTime();
    const sourceReminders = isRestDay ? (workoutShift === 'evening' ? restDayRemindersEvening : restDayRemindersMorning) : (workoutShift === 'evening' ? eveningReminders : reminders);
    const order = sourceReminders.map(r => r.id);
    const scheduledTime = completionData.adjustedTimes[id] || sourceReminders.find(r => r.id === id)?.time || '00:00';
    const shiftMinutes = timeToMinutes(currentTime) - timeToMinutes(scheduledTime);
    const currentIndex = order.indexOf(id);
    const newAdjustedTimes = { ...completionData.adjustedTimes };
    const newCompletions = { ...completionData.completions, [id]: currentTime };

    for (let i = currentIndex + 1; i < order.length; i++) {
      const nextId = order[i];
      if (newCompletions[nextId]) continue;
      const baseTime = newAdjustedTimes[nextId] || sourceReminders.find(r => r.id === nextId)?.time || '00:00';
      newAdjustedTimes[nextId] = minutesToTime(timeToMinutes(baseTime) + shiftMinutes);
    }

    const updatedCompletion: ReminderCompletionData = { ...completionData, completions: newCompletions, adjustedTimes: newAdjustedTimes };
    setCompletionData(updatedCompletion);
    await AsyncStorage.setItem('reminderCompletions', JSON.stringify(updatedCompletion));

    if (selectedMeal && selectedMeal.macros.calories > 0) {
      const newMeals = [...dailyMacros.meals, { reminderId: id, option: selectedMeal.label, macros: selectedMeal.macros, time: currentTime }];
      const newConsumed: MacroInfo = {
        calories: dailyMacros.consumed.calories + selectedMeal.macros.calories,
        protein: dailyMacros.consumed.protein + selectedMeal.macros.protein,
        carbs: dailyMacros.consumed.carbs + selectedMeal.macros.carbs,
        fats: dailyMacros.consumed.fats + selectedMeal.macros.fats,
      };
      const updatedMacros: DailyMacros = { ...dailyMacros, consumed: newConsumed, meals: newMeals };
      setDailyMacros(updatedMacros);
      await AsyncStorage.setItem('dailyMacros', JSON.stringify(updatedMacros));
    }

    setSelectedReminder(null);
    setShowMealPicker(false);
    setPendingCompleteId(null);

    const shiftLabel = shiftMinutes === 0 ? 'Right on schedule!'
      : shiftMinutes > 0 ? `${shiftMinutes} min late — upcoming reminders shifted forward`
      : `${Math.abs(shiftMinutes)} min early — upcoming reminders shifted earlier`;
    const macroMsg = selectedMeal && selectedMeal.macros.calories > 0
      ? `\n+${selectedMeal.macros.calories} cal | ${selectedMeal.macros.protein}g P | ${selectedMeal.macros.carbs}g C | ${selectedMeal.macros.fats}g F` : '';
    Alert.alert('✅ Done!', shiftLabel + macroMsg);
  };

  const getSourceReminders = () => isRestDay ? (workoutShift === 'evening' ? restDayRemindersEvening : restDayRemindersMorning) : (workoutShift === 'evening' ? eveningReminders : reminders);

  const undoReminderComplete = async (id: string) => {
    const sourceReminders = getSourceReminders();
    const order = sourceReminders.map(r => r.id);
    const newCompletions = { ...completionData.completions };
    delete newCompletions[id];
    const newAdjustedTimes: Record<string, string> = {};
    let cumulativeShift = 0;
    for (const remId of order) {
      if (newCompletions[remId]) {
        cumulativeShift = timeToMinutes(newCompletions[remId]) - timeToMinutes(sourceReminders.find(r => r.id === remId)?.time || '00:00');
      } else if (cumulativeShift !== 0) {
        newAdjustedTimes[remId] = minutesToTime(timeToMinutes(sourceReminders.find(r => r.id === remId)?.time || '00:00') + cumulativeShift);
      }
    }
    const updated: ReminderCompletionData = { ...completionData, completions: newCompletions, adjustedTimes: newAdjustedTimes };
    setCompletionData(updated);
    await AsyncStorage.setItem('reminderCompletions', JSON.stringify(updated));

    const updatedMeals = dailyMacros.meals.filter(m => m.reminderId !== id);
    const newConsumed = updatedMeals.reduce((acc, m) => ({
      calories: acc.calories + m.macros.calories, protein: acc.protein + m.macros.protein,
      carbs: acc.carbs + m.macros.carbs, fats: acc.fats + m.macros.fats,
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
    const updatedMacros: DailyMacros = { ...dailyMacros, consumed: newConsumed, meals: updatedMeals };
    setDailyMacros(updatedMacros);
    await AsyncStorage.setItem('dailyMacros', JSON.stringify(updatedMacros));
  };

  // ── Workout Detail ──
  const getDetailForReminder = useCallback((id: string): MealDetail => {
    if (id === 'workout' || id === 'workout_eve') {
      const todayPlan = getWorkoutForDay(new Date().getDay(), scheduleOffset);
      if (todayPlan.type === 'rest') {
        return {
          heading: 'Rest Day',
          items: ['No training today — recover & rebuild', '20 min casual walk', '10 min static stretching or foam rolling', 'Skip the morning shake', 'Cut Roti/Rice by 50%', 'Focus on high protein & fiber veggies'],
          tip: 'Muscles grow during rest. Stay hydrated with 4L water and get to bed by 10:30 PM.',
        };
      }
      const typeLabel = todayPlan.type === 'gym' ? '🏋️ GYM' : '⚡ ATHLETIC';
      const sessionLabel = id === 'workout_eve' ? ' (Evening Session)' : '';
      return {
        heading: `${typeLabel} — ${todayPlan.name}${sessionLabel}`,
        items: [...todayPlan.exercises, 'Hydrate with 1L water during session', '2-min Dead Hang post-gym'],
        tip: todayPlan.type === 'gym'
          ? 'Hypertrophy focus — controlled reps, full range of motion. Prioritize form over heavy weight.'
          : 'Athletic focus — explosive power and conditioning. Push max effort on sprints.',
      };
    }
    if (isRestDay && restDayMealDetails[id]) return restDayMealDetails[id];
    if (workoutShift === 'evening' && eveningMealDetails[id]) return eveningMealDetails[id];
    return mealDetails[id] || { heading: id, items: [], tip: '' };
  }, [isRestDay, workoutShift]);

  // ── Week & Stats ──
  const saveCompletedDays = async (days: Record<string, boolean>) => { setCompletedDays(days); await AsyncStorage.setItem('completedDays', JSON.stringify(days)); };

  // ── End of day: ask if workout done; if No, offer to reschedule (fixed modal after 9 PM) ──
  const END_OF_DAY_HOUR = 21; // 9 PM
  const checkEndOfDayWorkout = useCallback(async () => {
    const now = new Date();
    if (now.getHours() < END_OF_DAY_HOUR) return;
    const today = getTodayKey();
    const asked = await AsyncStorage.getItem(`workoutCheckAsked_${today}`);
    if (asked === 'true') return;

    const [savedOffset, savedCompletions] = await Promise.all([
      AsyncStorage.getItem('scheduleOffset'),
      AsyncStorage.getItem('reminderCompletions'),
    ]);
    const offset = savedOffset ? parseInt(savedOffset, 10) : 0;
    const todayWorkoutCheck = getWorkoutForDay(now.getDay(), isNaN(offset) ? 0 : offset);
    if (todayWorkoutCheck.type === 'rest') return;

    let completions: { date?: string; completions?: Record<string, string> } = {};
    try {
      completions = savedCompletions ? JSON.parse(savedCompletions) : {};
    } catch {
      return;
    }
    if (completions.date !== today) return;
    const workoutDone = completions.completions?.['workout'] || completions.completions?.['workout_eve'];
    if (workoutDone) return;

    await AsyncStorage.setItem(`workoutCheckAsked_${today}`, 'true');
    endOfDayOffsetRef.current = offset;
    setEndOfDayWorkout(todayWorkoutCheck);
    setEndOfDayStep(1);
    setShowEndOfDayModal(true);
  }, []);

  const handleEndOfDayYes = useCallback(async () => {
    const today = getTodayKey();
    const saved = await AsyncStorage.getItem('completedDays');
    const days = saved ? JSON.parse(saved) : {};
    await saveCompletedDays({ ...days, [today]: true });
    setShowEndOfDayModal(false);
  }, [saveCompletedDays]);

  const handleEndOfDayNo = useCallback(() => setEndOfDayStep(2), []);

  const handleRescheduleYes = useCallback(async () => {
    const newOffset = (endOfDayOffsetRef.current + 1) % 7;
    setScheduleOffset(newOffset);
    await AsyncStorage.setItem('scheduleOffset', String(newOffset));
    setShowEndOfDayModal(false);
    Alert.alert('✓ Rescheduled', 'Your workout has been moved to tomorrow.');
  }, []);

  const handleRescheduleNo = useCallback(() => setShowEndOfDayModal(false), []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkEndOfDayWorkout();
    });
    const t = setTimeout(checkEndOfDayWorkout, 2000);
    return () => { sub.remove(); clearTimeout(t); };
  }, [checkEndOfDayWorkout]);

  const checkFollowup = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const workout = getWorkoutForDay(yesterday.getDay(), scheduleOffset);
    if (workout.type !== 'rest' && completedDays[yesterday.toISOString().split('T')[0]] === undefined) {
      setYesterdayWorkout(workout);
      setShowFollowup(true);
    }
  };

  const recordFollowup = async (completed: boolean) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await saveCompletedDays({ ...completedDays, [yesterday.toISOString().split('T')[0]]: completed });
    setShowFollowup(false);
    Alert.alert(completed ? '🔥 Great Work!' : '💪 No Worries!', completed ? 'Keep up the momentum!' : 'Stay consistent, you got this!');
  };

  const addExtraMeal = useCallback(async (meal: MealOption) => {
    const currentTime = getCurrentTime();
    const newMeals = [...dailyMacros.meals, { reminderId: 'extra', option: meal.label, macros: meal.macros, time: currentTime }];
    const newConsumed: MacroInfo = {
      calories: dailyMacros.consumed.calories + meal.macros.calories,
      protein: dailyMacros.consumed.protein + meal.macros.protein,
      carbs: dailyMacros.consumed.carbs + meal.macros.carbs,
      fats: dailyMacros.consumed.fats + meal.macros.fats,
    };
    const updatedMacros: DailyMacros = { ...dailyMacros, consumed: newConsumed, meals: newMeals };
    setDailyMacros(updatedMacros);
    await AsyncStorage.setItem('dailyMacros', JSON.stringify(updatedMacros));
  }, [dailyMacros]);

  const deleteExtraMeal = useCallback(async (index: number) => {
    const meal = dailyMacros.meals[index];
    if (!meal || meal.reminderId !== 'extra') return;
    const updatedMeals = dailyMacros.meals.filter((_, i) => i !== index);
    const newConsumed = updatedMeals.reduce((acc, m) => ({
      calories: acc.calories + m.macros.calories, protein: acc.protein + m.macros.protein,
      carbs: acc.carbs + m.macros.carbs, fats: acc.fats + m.macros.fats,
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
    const updatedMacros: DailyMacros = { ...dailyMacros, consumed: newConsumed, meals: updatedMeals };
    setDailyMacros(updatedMacros);
    await AsyncStorage.setItem('dailyMacros', JSON.stringify(updatedMacros));
  }, [dailyMacros]);

  const toggleDayCompletion = async (dateKey: string) => {
    if (dateKey > getTodayKey()) return;
    await saveCompletedDays({ ...completedDays, [dateKey]: !completedDays[dateKey] });
  };

  const handleDayPress = useCallback(async (day: WeekDay) => {
    setSelectedScheduleDay(day);
    if (day.isRest) {
      const saved = await AsyncStorage.getItem(`workoutShift_${day.dateKey}`);
      const shift = saved === 'evening' ? 'evening' : 'morning';
      setScheduleDayShift(shift);
      setScheduleDayReminders(shift === 'evening' ? restDayRemindersEvening : restDayRemindersMorning);
    } else {
      const saved = await AsyncStorage.getItem(`workoutShift_${day.dateKey}`);
      const shift = saved === 'evening' ? 'evening' : 'morning';
      setScheduleDayShift(shift);
      setScheduleDayReminders(shift === 'evening' ? eveningReminders : defaultReminders);
    }
  }, []);

  const handleScheduleShiftChange = useCallback(async (shift: WorkoutShift) => {
    if (!selectedScheduleDay?.dateKey) return;
    setScheduleDayShift(shift);
    if (selectedScheduleDay.isRest) {
      setScheduleDayReminders(shift === 'evening' ? restDayRemindersEvening : restDayRemindersMorning);
    } else {
      setScheduleDayReminders(shift === 'evening' ? eveningReminders : defaultReminders);
    }
    await AsyncStorage.setItem(`workoutShift_${selectedScheduleDay.dateKey}`, shift);
    if (selectedScheduleDay.dateKey === getTodayKey()) setWorkoutShiftState(shift);
  }, [selectedScheduleDay]);

  const getWeekDays = (): WeekDay[] => {
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      const workout = getWorkoutForDay(i, scheduleOffset);
      return { name: dayNames[i], num: date.getDate(), dateKey, workout, isToday: i === currentDay, isCompleted: completedDays[dateKey], isRest: workout.type === 'rest' };
    });
  };

  const getStats = () => {
    const completed = Object.values(completedDays).filter(v => v).length;
    const total = Math.max(Object.keys(completedDays).length, 1);
    const rate = Math.round((completed / total) * 100);
    let streak = 0;
    let checkDate = new Date();
    while (streak < 100) {
      const dateKey = checkDate.toISOString().split('T')[0];
      const dayWorkout = getWorkoutForDay(checkDate.getDay(), scheduleOffset);
      if (dayWorkout.type === 'rest') { checkDate.setDate(checkDate.getDate() - 1); continue; }
      if (completedDays[dateKey]) { streak++; checkDate.setDate(checkDate.getDate() - 1); } else break;
    }
    return { completed, rate, streak, weekStreak: Math.floor(streak / 5) };
  };

  // ── Derived ──
  const todayWorkout = getWorkoutForDay(new Date().getDay(), scheduleOffset);
  const activeReminders = isRestDay ? (workoutShift === 'evening' ? restDayRemindersEvening : restDayRemindersMorning) : (workoutShift === 'evening' ? eveningReminders : reminders);
  const activeReminderOrder = activeReminders.map(r => r.id);
  const weekDays = getWeekDays();
  const stats = getStats();

  // ── Render ──
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f23" />
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Header reminders={activeReminders} scheduleHydrationReminders={scheduleHydrationReminders} />
          <WorkoutShiftToggle shift={workoutShift} onShiftChange={setWorkoutShift} isRestDay={isRestDay} />
          <HydrationCard glasses={hydration.glasses} addWaterGlass={addWaterGlass} removeWaterGlass={removeWaterGlass} />
          <TodayWorkout workout={todayWorkout} />
          {showFollowup && yesterdayWorkout && <FollowupCard workout={yesterdayWorkout} onRecord={recordFollowup} />}
          <WeekGrid weekDays={weekDays} onDayPress={handleDayPress} />
          <RemindersList
            reminders={activeReminders}
            completionData={completionData}
            isRestDay={isRestDay}
            onSelectReminder={setSelectedReminder}
            onMarkComplete={markReminderComplete}
            onUndoComplete={undoReminderComplete}
          />

          <DayScheduleModal
            visible={!!selectedScheduleDay}
            day={selectedScheduleDay ? { ...selectedScheduleDay, isCompleted: !!completedDays[selectedScheduleDay.dateKey] } : null}
            reminders={scheduleDayReminders}
            shift={scheduleDayShift}
            onShiftChange={handleScheduleShiftChange}
            onClose={() => setSelectedScheduleDay(null)}
            onToggleComplete={toggleDayCompletion}
            isPastOrToday={selectedScheduleDay ? selectedScheduleDay.dateKey <= getTodayKey() : false}
          />
          <MealDetailModal
            selectedReminder={selectedReminder}
            getDetail={getDetailForReminder}
            getMealOptions={getActiveMealOptions}
            completionData={completionData}
            dailyMacros={dailyMacros}
            onClose={() => setSelectedReminder(null)}
            onMarkComplete={markReminderComplete}
          />
          <MealPickerModal
            visible={showMealPicker}
            pendingId={pendingCompleteId}
            options={pendingCompleteId ? getActiveMealOptions(pendingCompleteId) : []}
            onSelect={(id, option) => finalizeCompletion(id, option)}
            onClose={() => { setShowMealPicker(false); setPendingCompleteId(null); }}
          />

          <EndOfDayWorkoutModal
            visible={showEndOfDayModal}
            workout={endOfDayWorkout}
            step={endOfDayStep}
            onYes={handleEndOfDayYes}
            onNo={handleEndOfDayNo}
            onRescheduleYes={handleRescheduleYes}
            onRescheduleNo={handleRescheduleNo}
          />

          <MacroTracker dailyMacros={dailyMacros} onAddExtraMeal={addExtraMeal} onDeleteExtraMeal={deleteExtraMeal} />
          <StatsGrid {...stats} />
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
