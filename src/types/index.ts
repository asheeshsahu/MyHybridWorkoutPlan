export interface WorkoutDay {
  type: 'gym' | 'athletic' | 'rest';
  name: string;
  exercises: string[];
}

export interface Reminder {
  id: string;
  title: string;
  time: string;
  enabled: boolean;
  icon: string;
}

export interface HydrationData {
  date: string;
  glasses: number;
  lastReminderHour: number;
}

export interface ReminderCompletionData {
  date: string;
  completions: Record<string, string>;
  adjustedTimes: Record<string, string>;
}

export interface MacroInfo {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface MealOption {
  label: string;
  macros: MacroInfo;
}

export interface DailyMacros {
  date: string;
  consumed: MacroInfo;
  meals: MealEntry[];
}

export interface MealEntry {
  reminderId: string;
  option: string;
  macros: MacroInfo;
  time: string;
}

export interface MealDetail {
  heading: string;
  items: string[];
  tip?: string;
  vegAlternatives?: string[];
}

export interface WeekDay {
  name: string;
  num: number;
  dateKey: string;
  workout: WorkoutDay;
  isToday: boolean;
  isCompleted: boolean;
  isRest: boolean;
}
