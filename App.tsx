import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const { width } = Dimensions.get('window');

// Constants
const DAILY_WATER_GOAL = 4000; // 4 liters in ml
const GLASS_SIZE = 250; // 250ml per glass
const TOTAL_GLASSES = DAILY_WATER_GOAL / GLASS_SIZE; // 16 glasses

// Hydration reminder schedule (hours)
const HYDRATION_HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

// Workout Plan Data
const workoutPlan: Record<number, WorkoutDay> = {
  0: { type: 'rest', name: 'Rest Day', exercises: [] },
  1: { type: 'gym', name: 'Upper Body', exercises: ['Incline DB Press 3×10', 'Weighted Pull-ups 3×Max', 'DB Lateral Raises 4×20', 'DB Bicep Curls 3×12'] },
  2: { type: 'athletic', name: 'Power & Speed', exercises: ['KB/DB Swings 4×20', 'Box Jumps 4×5', 'Walking Lunges 3×24', '100m Sprints ×5'] },
  3: { type: 'gym', name: 'Lower Body', exercises: ['Back Squat 3×8', 'Romanian DL 3×12', 'Leg Extension 3×15', 'Calf Raises 4×15'] },
  4: { type: 'athletic', name: 'Engine Day', exercises: ['Skipping 10min', '3km Brisk Run', 'Burpees 3×15', 'Core Plank 3×1min'] },
  5: { type: 'gym', name: 'Full Body', exercises: ['Weighted Dips 3×12', 'Seated Rows 3×12', 'Overhead Press 3×10', 'Hanging Leg Raises 3×15'] },
  6: { type: 'rest', name: 'Rest Day', exercises: [] },
};

interface WorkoutDay {
  type: 'gym' | 'athletic' | 'rest';
  name: string;
  exercises: string[];
}

interface Reminder {
  id: string;
  title: string;
  time: string;
  enabled: boolean;
  icon: string;
}

interface HydrationData {
  date: string;
  glasses: number;
  lastReminderHour: number;
}

const defaultReminders: Reminder[] = [
  // Morning Routine
  { id: 'wake', title: 'Wake Up', time: '05:15', enabled: true, icon: '⏰' },
  { id: 'preworkout', title: 'Pre-Workout: Banana + Coffee', time: '05:30', enabled: true, icon: '🍌' },
  { id: 'workout', title: 'Morning Workout', time: '06:00', enabled: true, icon: '🏋️' },
  
  // Post-Workout Nutrition
  { id: 'postworkout', title: 'Post-Workout: 4 Egg Whites', time: '07:30', enabled: true, icon: '🥚' },
  { id: 'shake', title: 'Recovery Shake', time: '08:15', enabled: true, icon: '🥤' },
  
  // Main Meals
  { id: 'lunch', title: 'Lunch: Chicken + Dal + Roti', time: '13:30', enabled: true, icon: '🍗' },
  { id: 'snack', title: 'Snack: Paneer / Moong Salad', time: '16:30', enabled: true, icon: '🧀' },
  { id: 'dinner', title: 'Dinner: Fish + Roti + Sabzi', time: '20:30', enabled: true, icon: '🐟' },
  
  // Recovery
  { id: 'sleep', title: 'Bedtime', time: '22:30', enabled: true, icon: '🌙' },
];

export default function App() {
  const [completedDays, setCompletedDays] = useState<Record<string, boolean>>({});
  const [reminders, setReminders] = useState<Reminder[]>(defaultReminders);
  const [showFollowup, setShowFollowup] = useState(false);
  const [yesterdayWorkout, setYesterdayWorkout] = useState<WorkoutDay | null>(null);
  const [hydration, setHydration] = useState<HydrationData>({
    date: new Date().toISOString().split('T')[0],
    glasses: 0,
    lastReminderHour: 5,
  });
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    loadData();
    registerForPushNotifications();
    checkFollowup();
    scheduleHydrationReminders();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // Check if it's a hydration reminder and user hasn't completed goal
      const data = notification.request.content.data;
      if (data?.type === 'hydration') {
        checkAndScheduleCatchupReminder();
      }
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.type === 'hydration') {
        // User tapped on hydration notification - add a glass
        addWaterGlass();
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Reset hydration daily
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (hydration.date !== today) {
      const newHydration = {
        date: today,
        glasses: 0,
        lastReminderHour: 5,
      };
      setHydration(newHydration);
      AsyncStorage.setItem('hydration', JSON.stringify(newHydration));
      scheduleHydrationReminders();
    }
  }, [hydration.date]);

  const loadData = async () => {
    try {
      const savedDays = await AsyncStorage.getItem('completedDays');
      const savedReminders = await AsyncStorage.getItem('reminders');
      const savedHydration = await AsyncStorage.getItem('hydration');
      
      if (savedDays) setCompletedDays(JSON.parse(savedDays));
      
      // Check if reminders need to be reset (new reminders added)
      if (savedReminders) {
        const parsedReminders = JSON.parse(savedReminders);
        // Reset to defaults if the number of reminders has changed
        if (parsedReminders.length !== defaultReminders.length) {
          setReminders(defaultReminders);
          await AsyncStorage.setItem('reminders', JSON.stringify(defaultReminders));
        } else {
          setReminders(parsedReminders);
        }
      } else {
        // No saved reminders, use defaults
        await AsyncStorage.setItem('reminders', JSON.stringify(defaultReminders));
      }
      
      if (savedHydration) {
        const hydrationData = JSON.parse(savedHydration);
        const today = new Date().toISOString().split('T')[0];
        // Reset if it's a new day
        if (hydrationData.date === today) {
          setHydration(hydrationData);
        } else {
          const newHydration = { date: today, glasses: 0, lastReminderHour: 5 };
          setHydration(newHydration);
          await AsyncStorage.setItem('hydration', JSON.stringify(newHydration));
        }
      }
    } catch (e) {
      console.log('Error loading data:', e);
    }
  };

  const saveCompletedDays = async (days: Record<string, boolean>) => {
    setCompletedDays(days);
    await AsyncStorage.setItem('completedDays', JSON.stringify(days));
  };

  const saveHydration = async (data: HydrationData) => {
    setHydration(data);
    await AsyncStorage.setItem('hydration', JSON.stringify(data));
  };

  const registerForPushNotifications = async () => {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push notification permissions');
      return;
    }
  };

  const scheduleHydrationReminders = async () => {
    // Cancel existing hydration reminders
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.type === 'hydration') {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    // Schedule reminders for remaining hours today
    const currentHour = new Date().getHours();
    const remainingHours = HYDRATION_HOURS.filter(h => h > currentHour);
    
    for (const hour of remainingHours) {
      const glassesNeeded = Math.ceil((hour - 5) * (TOTAL_GLASSES / 16)); // Expected glasses by this hour
      const progressMessage = getHydrationMessage(glassesNeeded);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💧 Hydration Check',
          body: progressMessage,
          sound: true,
          data: { type: 'hydration', expectedGlasses: glassesNeeded },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hour,
          minute: 0,
        },
      });
    }

    // Also schedule for tomorrow's full day
    for (const hour of HYDRATION_HOURS) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💧 Time to Hydrate!',
          body: 'Drink a glass of water to stay on track for 4L today! 🚰',
          sound: true,
          data: { type: 'hydration' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hour,
          minute: 0,
        },
      });
    }
  };

  const getHydrationMessage = (expectedGlasses: number): string => {
    const current = hydration.glasses;
    const remaining = TOTAL_GLASSES - current;
    const litersRemaining = (remaining * GLASS_SIZE / 1000).toFixed(1);
    
    if (current >= TOTAL_GLASSES) {
      return "🎉 Amazing! You've hit your 4L goal today!";
    } else if (current >= expectedGlasses) {
      return `Great progress! ${remaining} glasses (${litersRemaining}L) to go! 💪`;
    } else {
      const behind = expectedGlasses - current;
      return `You're ${behind} glasses behind! Drink up now! 🚨`;
    }
  };

  const checkAndScheduleCatchupReminder = async () => {
    const currentHour = new Date().getHours();
    const expectedGlasses = Math.ceil((currentHour - 5) * (TOTAL_GLASSES / 16));
    
    // If behind schedule, add a catch-up reminder in 30 minutes
    if (hydration.glasses < expectedGlasses && hydration.glasses < TOTAL_GLASSES) {
      const catchupTime = new Date();
      catchupTime.setMinutes(catchupTime.getMinutes() + 30);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Catch-up Reminder!',
          body: `You're behind on water! Drink ${expectedGlasses - hydration.glasses} glasses now to catch up!`,
          sound: true,
          data: { type: 'hydration', catchup: true },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 30 * 60, // 30 minutes
        },
      });
    }
  };

  const addWaterGlass = async () => {
    if (hydration.glasses >= TOTAL_GLASSES) {
      Alert.alert('🎉 Goal Complete!', "You've already hit your 4L goal today!");
      return;
    }

    const newGlasses = hydration.glasses + 1;
    const newHydration = { ...hydration, glasses: newGlasses };
    await saveHydration(newHydration);

    const remaining = TOTAL_GLASSES - newGlasses;
    const litersRemaining = (remaining * GLASS_SIZE / 1000).toFixed(1);

    if (newGlasses >= TOTAL_GLASSES) {
      Alert.alert('🎉 Goal Complete!', "Awesome! You've hit your 4L water goal today!");
      // Cancel remaining hydration reminders for today
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notif of scheduled) {
        if (notif.content.data?.type === 'hydration') {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
      }
    } else {
      Alert.alert('💧 +250ml', `${remaining} glasses (${litersRemaining}L) remaining`);
    }
  };

  const removeWaterGlass = async () => {
    if (hydration.glasses <= 0) return;
    
    const newGlasses = hydration.glasses - 1;
    const newHydration = { ...hydration, glasses: newGlasses };
    await saveHydration(newHydration);
  };

  const scheduleReminder = async (reminder: Reminder) => {
    if (!reminder.enabled) return;

    const [hours, minutes] = reminder.time.split(':').map(Number);
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${reminder.icon} ${reminder.title}`,
        body: getNotificationBody(reminder.id),
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
    });
  };

  const getNotificationBody = (id: string): string => {
    switch (id) {
      // Morning routine
      case 'wake': return "Rise and shine! Time to start your day strong 🌅";
      case 'preworkout': return "Grab a banana and coffee for pre-workout energy! ☕";
      case 'workout': return "Time to crush your workout! 💪";
      
      // Post-workout nutrition
      case 'postworkout': return "Eat 4 boiled egg whites for muscle recovery! 🥚";
      case 'shake': return "Blend your recovery shake: Milk, Muesli, PB, Banana, Honey! 🥤";
      
      // Main meals
      case 'lunch': return "150g Chicken + Dal + 2 Roti + Dahi - fuel up! 🍗";
      case 'snack': return "100g Paneer cubes or Moong Salad time! 🧀";
      case 'dinner': return "150g Fish + 1 Roti + Mixed Sabzi for recovery! 🐟";
      
      // Recovery
      case 'sleep': return "Wind down for quality sleep - muscles grow during rest! 😴";
      
      default: return "HybridFit Reminder";
    }
  };

  const toggleReminder = async (id: string) => {
    const updated = reminders.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    setReminders(updated);
    await AsyncStorage.setItem('reminders', JSON.stringify(updated));
    
    // Reschedule notifications (excluding hydration which is always on)
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.type !== 'hydration') {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
    for (const reminder of updated.filter(r => r.enabled)) {
      await scheduleReminder(reminder);
    }
  };

  const checkFollowup = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split('T')[0];
    const workout = workoutPlan[yesterday.getDay()];
    
    if (workout.type !== 'rest' && completedDays[yesterdayKey] === undefined) {
      setYesterdayWorkout(workout);
      setShowFollowup(true);
    }
  };

  const recordFollowup = async (completed: boolean) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split('T')[0];
    
    const updated = { ...completedDays, [yesterdayKey]: completed };
    await saveCompletedDays(updated);
    setShowFollowup(false);
    
    Alert.alert(
      completed ? '🔥 Great Work!' : '💪 No Worries!',
      completed ? 'Keep up the momentum!' : 'Stay consistent, you got this!'
    );
  };

  const toggleDayCompletion = async (dateKey: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (dateKey > today) {
      Alert.alert('Oops!', "Can't mark future days!");
      return;
    }
    
    const updated = { ...completedDays, [dateKey]: !completedDays[dateKey] };
    await saveCompletedDays(updated);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getWeekDays = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);

    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      const workout = workoutPlan[i];
      
      days.push({
        name: dayNames[i],
        num: date.getDate(),
        dateKey,
        workout,
        isToday: i === currentDay,
        isCompleted: completedDays[dateKey],
        isRest: workout.type === 'rest',
      });
    }
    return days;
  };

  const getStats = () => {
    const completed = Object.values(completedDays).filter(v => v).length;
    const total = Math.max(Object.keys(completedDays).length, 1);
    const rate = Math.round((completed / total) * 100);
    
    let streak = 0;
    let checkDate = new Date();
    while (streak < 100) {
      const dateKey = checkDate.toISOString().split('T')[0];
      const dayWorkout = workoutPlan[checkDate.getDay()];
      
      if (dayWorkout.type === 'rest') {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }
      
      if (completedDays[dateKey]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return { completed, rate, streak, weekStreak: Math.floor(streak / 5) };
  };

  const getHydrationProgress = () => {
    const progress = (hydration.glasses / TOTAL_GLASSES) * 100;
    const liters = (hydration.glasses * GLASS_SIZE / 1000).toFixed(1);
    const remaining = ((TOTAL_GLASSES - hydration.glasses) * GLASS_SIZE / 1000).toFixed(1);
    return { progress: Math.min(progress, 100), liters, remaining, glasses: hydration.glasses };
  };

  const todayWorkout = workoutPlan[new Date().getDay()];
  const weekDays = getWeekDays();
  const stats = getStats();
  const hydrationProgress = getHydrationProgress();

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f23" />
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.appTitle}>HybridFit</Text>
            </View>
            <TouchableOpacity 
              style={styles.notifButton}
              onPress={async () => {
                await Notifications.cancelAllScheduledNotificationsAsync();
                for (const reminder of reminders.filter(r => r.enabled)) {
                  await scheduleReminder(reminder);
                }
                await scheduleHydrationReminders();
                Alert.alert('✅ Reminders Set!', 'Daily notifications scheduled including hydration reminders every hour!');
              }}
            >
              <Text style={styles.notifIcon}>🔔</Text>
            </TouchableOpacity>
          </View>

          {/* Hydration Tracker Card */}
          <View style={styles.hydrationCard}>
            <View style={styles.hydrationHeader}>
              <Text style={styles.hydrationTitle}>💧 Daily Hydration</Text>
              <Text style={styles.hydrationSubtitle}>Goal: 4 Liters</Text>
            </View>
            
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${hydrationProgress.progress}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {hydrationProgress.liters}L / 4L
              </Text>
            </View>

            {/* Glass Counter */}
            <View style={styles.glassCounter}>
              <TouchableOpacity 
                style={styles.glassBtn}
                onPress={removeWaterGlass}
              >
                <Text style={styles.glassBtnText}>−</Text>
              </TouchableOpacity>
              
              <View style={styles.glassDisplay}>
                <Text style={styles.glassCount}>{hydrationProgress.glasses}</Text>
                <Text style={styles.glassLabel}>/ {TOTAL_GLASSES} glasses</Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.glassBtn, styles.glassBtnAdd]}
                onPress={addWaterGlass}
              >
                <Text style={[styles.glassBtnText, styles.glassBtnAddText]}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Add Buttons */}
            <View style={styles.quickAddRow}>
              <TouchableOpacity 
                style={styles.quickAddBtn}
                onPress={addWaterGlass}
              >
                <Text style={styles.quickAddText}>🥛 +250ml</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickAddBtn}
                onPress={async () => {
                  for (let i = 0; i < 2; i++) {
                    if (hydration.glasses + i < TOTAL_GLASSES) {
                      await addWaterGlass();
                    }
                  }
                }}
              >
                <Text style={styles.quickAddText}>🍶 +500ml</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickAddBtn}
                onPress={async () => {
                  for (let i = 0; i < 4; i++) {
                    if (hydration.glasses + i < TOTAL_GLASSES) {
                      await addWaterGlass();
                    }
                  }
                }}
              >
                <Text style={styles.quickAddText}>🫗 +1L</Text>
              </TouchableOpacity>
            </View>

            {/* Status Message */}
            <View style={styles.hydrationStatus}>
              <Text style={styles.hydrationStatusText}>
                {hydrationProgress.glasses >= TOTAL_GLASSES 
                  ? "🎉 Goal Complete! Great job staying hydrated!"
                  : `${hydrationProgress.remaining}L remaining • Reminders every hour`}
              </Text>
            </View>
          </View>

          {/* Today's Card */}
          <View style={[styles.todayCard, todayWorkout.type === 'rest' && styles.restCard]}>
            <Text style={styles.todayLabel}>TODAY'S WORKOUT</Text>
            <Text style={styles.todayWorkout}>
              {todayWorkout.type === 'rest' ? '🛋️ ' : todayWorkout.type === 'gym' ? '🏋️ ' : '⚡ '}
              {todayWorkout.name}
            </Text>
            <View style={styles.exerciseTags}>
              {todayWorkout.type !== 'rest' ? (
                todayWorkout.exercises.slice(0, 4).map((ex, i) => (
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
              onPress={() => Alert.alert('💪 Let\'s Go!', `Starting ${todayWorkout.name}`)}
            >
              <Text style={styles.startButtonText}>
                {todayWorkout.type === 'rest' ? 'Enjoy Your Rest!' : 'Start Workout'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Followup Card */}
          {showFollowup && yesterdayWorkout && (
            <View style={styles.followupCard}>
              <Text style={styles.followupTitle}>
                Did you complete yesterday's {yesterdayWorkout.name}?
              </Text>
              <View style={styles.followupButtons}>
                <TouchableOpacity 
                  style={[styles.followupBtn, styles.yesBtn]}
                  onPress={() => recordFollowup(true)}
                >
                  <Text style={styles.yesBtnText}>✓ Yes!</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.followupBtn, styles.noBtn]}
                  onPress={() => recordFollowup(false)}
                >
                  <Text style={styles.noBtnText}>✗ Missed it</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Week Grid */}
          <Text style={styles.sectionTitle}>📅 This Week</Text>
          <View style={styles.weekGrid}>
            {weekDays.map((day, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.dayCard,
                  day.isToday && styles.todayDayCard,
                  day.isCompleted && styles.completedDayCard,
                  day.isRest && styles.restDayCard,
                ]}
                onPress={() => toggleDayCompletion(day.dateKey)}
              >
                <Text style={styles.dayName}>{day.name}</Text>
                <Text style={styles.dayNum}>{day.num}</Text>
                <View style={[
                  styles.dayType,
                  day.isRest && styles.restDayType,
                  day.isCompleted && styles.completedDayType,
                ]}>
                  <Text style={[
                    styles.dayTypeText,
                    day.isRest && styles.restDayTypeText,
                    day.isCompleted && styles.completedDayTypeText,
                  ]}>
                    {day.isRest ? 'Rest' : day.workout.type === 'gym' ? 'Gym' : 'Athletic'}
                  </Text>
                </View>
                {day.isCompleted && <Text style={styles.checkIcon}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>

          {/* Reminders */}
          <Text style={styles.sectionTitle}>⏰ Daily Reminders</Text>
          <View style={styles.remindersSection}>
            {/* Hydration Reminder - Always On */}
            <View style={[styles.reminderCard, styles.hydrationReminderCard]}>
              <View style={[styles.reminderIcon, { backgroundColor: '#3b82f6' }]}>
                <Text style={styles.reminderIconText}>💧</Text>
              </View>
              <View style={styles.reminderContent}>
                <Text style={styles.reminderTitle}>Hydration Reminders</Text>
                <Text style={styles.reminderTime}>Every hour 6AM - 9PM</Text>
              </View>
              <View style={[styles.alwaysOnBadge]}>
                <Text style={styles.alwaysOnText}>ALWAYS ON</Text>
              </View>
            </View>

            {reminders.map((reminder) => (
              <View key={reminder.id} style={styles.reminderCard}>
                <View style={[styles.reminderIcon, { backgroundColor: getReminderColor(reminder.id) }]}>
                  <Text style={styles.reminderIconText}>{reminder.icon}</Text>
                </View>
                <View style={styles.reminderContent}>
                  <Text style={styles.reminderTitle}>{reminder.title}</Text>
                  <Text style={styles.reminderTime}>{formatTime(reminder.time)}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggle, reminder.enabled && styles.toggleEnabled]}
                  onPress={() => toggleReminder(reminder.id)}
                >
                  <View style={[styles.toggleKnob, reminder.enabled && styles.toggleKnobEnabled]} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Stats */}
          <Text style={styles.sectionTitle}>📊 Your Progress</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#7c3aed' }]}>{stats.weekStreak}</Text>
              <Text style={styles.statLabel}>Week Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#f97316' }]}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Workouts Done</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.rate}%</Text>
              <Text style={styles.statLabel}>Completion Rate</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#06b6d4' }]}>{stats.streak}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const getReminderColor = (id: string): string => {
  switch (id) {
    // Morning routine - Purple/Indigo tones
    case 'wake': return '#8b5cf6';
    case 'preworkout': return '#f59e0b';
    case 'workout': return '#7c3aed';
    
    // Post-workout nutrition - Green tones
    case 'postworkout': return '#22c55e';
    case 'shake': return '#06b6d4';
    
    // Main meals - Orange/Red tones
    case 'lunch': return '#f97316';
    case 'snack': return '#eab308';
    case 'dinner': return '#ef4444';
    
    // Recovery - Indigo
    case 'sleep': return '#6366f1';
    
    default: return '#7c3aed';
  }
};

const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#252547',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifIcon: {
    fontSize: 20,
  },
  
  // Hydration Card Styles
  hydrationCard: {
    backgroundColor: '#1e3a5f',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  hydrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  hydrationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  hydrationSubtitle: {
    fontSize: 14,
    color: '#93c5fd',
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#93c5fd',
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  glassCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  glassBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  glassBtnAdd: {
    backgroundColor: '#3b82f6',
  },
  glassBtnText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3b82f6',
  },
  glassBtnAddText: {
    color: '#fff',
  },
  glassDisplay: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  glassCount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  glassLabel: {
    fontSize: 14,
    color: '#93c5fd',
    marginTop: -4,
  },
  quickAddRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  quickAddBtn: {
    flex: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  quickAddText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#93c5fd',
  },
  hydrationStatus: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  hydrationStatusText: {
    fontSize: 13,
    color: '#93c5fd',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Other existing styles
  todayCard: {
    backgroundColor: '#7c3aed',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  restCard: {
    backgroundColor: '#374151',
  },
  todayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  todayWorkout: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  exerciseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  exerciseTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  exerciseTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  startButton: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7c3aed',
  },
  followupCard: {
    backgroundColor: '#252547',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  followupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  followupButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  followupBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  yesBtn: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: '#10b981',
  },
  yesBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10b981',
  },
  noBtn: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: '#ef4444',
  },
  noBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  dayCard: {
    width: (width - 56) / 7,
    backgroundColor: '#252547',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  todayDayCard: {
    borderColor: '#7c3aed',
    backgroundColor: 'rgba(124,58,237,0.2)',
  },
  completedDayCard: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: '#10b981',
  },
  restDayCard: {
    opacity: 0.5,
  },
  dayName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  dayNum: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginVertical: 4,
  },
  dayType: {
    backgroundColor: 'rgba(124,58,237,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  restDayType: {
    backgroundColor: 'rgba(100,116,139,0.3)',
  },
  completedDayType: {
    backgroundColor: 'rgba(16,185,129,0.3)',
  },
  dayTypeText: {
    fontSize: 7,
    fontWeight: '600',
    color: '#c4b5fd',
    textTransform: 'uppercase',
  },
  restDayTypeText: {
    color: '#64748b',
  },
  completedDayTypeText: {
    color: '#6ee7b7',
  },
  checkIcon: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 4,
  },
  remindersSection: {
    marginBottom: 28,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252547',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  hydrationReminderCard: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(30, 58, 95, 0.5)',
  },
  reminderIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  reminderIconText: {
    fontSize: 22,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  reminderTime: {
    fontSize: 13,
    color: '#94a3b8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  alwaysOnBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  alwaysOnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(100,116,139,0.3)',
    padding: 3,
  },
  toggleEnabled: {
    backgroundColor: '#10b981',
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
  },
  toggleKnobEnabled: {
    transform: [{ translateX: 20 }],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: '#252547',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
});
