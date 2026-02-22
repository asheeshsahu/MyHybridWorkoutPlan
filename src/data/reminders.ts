import { Reminder, MealDetail, MealOption } from '../types';

export const WORKOUT_REMINDER_IDS = ['preworkout', 'workout', 'postworkout', 'shake'];
export const EVENING_WORKOUT_REMINDER_IDS = ['preworkout_eve', 'workout_eve', 'postworkout_eve', 'dinner_eve'];

export const defaultReminders: Reminder[] = [
  { id: 'preworkout', title: 'Pre-Workout Fuel', time: '05:30', enabled: true, icon: '🍌' },
  { id: 'workout', title: 'Training Window', time: '06:00', enabled: true, icon: '🏋️' },
  { id: 'postworkout', title: 'Post-Workout: Egg Whites', time: '07:30', enabled: true, icon: '🥚' },
  { id: 'shake', title: 'The Big Breakfast: Muscle Shake', time: '08:15', enabled: true, icon: '🥤' },
  { id: 'lunch', title: 'Lunch: Chicken Curry + Dal', time: '13:30', enabled: true, icon: '🍗' },
  { id: 'snack', title: 'Snack: Paneer / Roasted Chana', time: '16:30', enabled: true, icon: '🧀' },
  { id: 'dinner', title: 'Dinner: Fish/Chicken + Sabzi', time: '20:30', enabled: true, icon: '🐟' },
  { id: 'sleep', title: 'Bedtime', time: '22:30', enabled: true, icon: '🌙' },
];

export const eveningReminders: Reminder[] = [
  { id: 'breakfast', title: 'Breakfast (Foundation)', time: '08:30', enabled: true, icon: '🍳' },
  { id: 'lunch', title: 'Lunch (Pre-Fuel)', time: '13:30', enabled: true, icon: '🍗' },
  { id: 'preworkout_eve', title: 'Pre-Workout Snack', time: '17:30', enabled: true, icon: '🍌' },
  { id: 'workout_eve', title: 'Evening Training Window', time: '18:00', enabled: true, icon: '🏋️' },
  { id: 'postworkout_eve', title: 'Post-Workout: Egg Whites', time: '19:45', enabled: true, icon: '🥚' },
  { id: 'dinner_eve', title: 'Recovery Feast (Meal + Shake)', time: '20:45', enabled: true, icon: '🍽️' },
  { id: 'sleep_eve', title: 'Bedtime', time: '23:00', enabled: true, icon: '🌙' },
];

// Morning rest day: walk + stretch in AM, meals per updated plan
export const restDayRemindersMorning: Reminder[] = [
  { id: 'recovery_walk', title: 'Casual Walk (20 min)', time: '07:30', enabled: true, icon: '🚶' },
  { id: 'recovery_stretch', title: 'Stretching / Foam Rolling', time: '08:15', enabled: true, icon: '🧘' },
  { id: 'breakfast_rest', title: 'Breakfast: 4 Egg Omelet + Veggies', time: '09:00', enabled: true, icon: '🍳' },
  { id: 'lunch', title: 'Lunch: Chicken/Paneer + Dal + 1 Roti', time: '13:30', enabled: true, icon: '🍗' },
  { id: 'snack', title: 'Snack: Sprouted Chana or 50g Paneer', time: '16:30', enabled: true, icon: '🧀' },
  { id: 'dinner', title: 'Dinner: Fish/Chicken + Double Salad (No Roti)', time: '20:00', enabled: true, icon: '🐟' },
  { id: 'sleep', title: 'Bedtime', time: '22:30', enabled: true, icon: '🌙' },
];

// Evening rest day: walk + stretch in PM, meals per updated plan
export const restDayRemindersEvening: Reminder[] = [
  { id: 'breakfast_rest', title: 'Breakfast: 4 Egg Omelet + Veggies', time: '09:00', enabled: true, icon: '🍳' },
  { id: 'lunch', title: 'Lunch: Chicken/Paneer + Dal + 1 Roti', time: '13:30', enabled: true, icon: '🍗' },
  { id: 'snack', title: 'Snack: Sprouted Chana or 50g Paneer', time: '16:30', enabled: true, icon: '🧀' },
  { id: 'recovery_walk', title: 'Casual Walk (20 min)', time: '18:00', enabled: true, icon: '🚶' },
  { id: 'recovery_stretch', title: 'Stretching / Foam Rolling', time: '18:30', enabled: true, icon: '🧘' },
  { id: 'dinner', title: 'Dinner: Fish/Chicken + Double Salad (No Roti)', time: '20:00', enabled: true, icon: '🐟' },
  { id: 'sleep', title: 'Bedtime', time: '23:00', enabled: true, icon: '🌙' },
];

// Legacy export for backward compatibility; defaults to morning
export const restDayReminders: Reminder[] = restDayRemindersMorning;

export const mealDetails: Record<string, MealDetail> = {
  preworkout: {
    heading: 'Pre-Workout Fuel',
    items: ['1 Banana', '1 Cup Black Coffee', '5 Soaked Almonds'],
    tip: 'Light & fast-digesting to fuel your training without feeling heavy.',
  },
  workout: {
    heading: 'Training Window',
    items: [],
    tip: 'Prioritize form over heavy weight. Stay consistent.',
  },
  postworkout: {
    heading: 'Post-Workout (Phase 1)',
    items: ['4–5 Boiled Egg Whites'],
    tip: 'Immediate protein hit for muscle recovery. Eat within 15 mins of finishing.',
  },
  shake: {
    heading: 'The Big Breakfast – Muscle Shake',
    items: ['300ml Milk', '½ Cup Muesli', '1–2 tbsp Peanut Butter', '1 Large Banana', '1 tbsp Honey'],
    tip: 'Mass builder for a 5\'11" frame. High calorie focus. Consume right after egg whites.',
  },
  lunch: {
    heading: 'Lunch (Foundation Meal)',
    items: ['150g Chicken Breast Curry', '2 Rotis', '1 Bowl Thick Dal', '1 Bowl Dahi', 'Salad on the side'],
    tip: 'Biggest meal of the day. Don\'t skip the dahi — great for gut health.',
    vegAlternatives: [
      '100g Soya Chunk Curry + Dal (~55g Protein)',
      '150g Paneer Bhurji + Dal + Dahi (~45g Protein)',
      '1 Bowl Chole + Greek Yogurt (~35g Protein)',
      '2 Moong Dal Chillas + 50g Paneer (~30g Protein)',
    ],
  },
  snack: {
    heading: 'Evening Snack',
    items: ['100g Paneer cubes (sautéed)', 'OR Handful of Roasted Chana'],
    tip: 'Quick protein to bridge lunch and dinner. Keep it simple.',
  },
  dinner: {
    heading: 'Dinner (Muscle Repair)',
    items: ['150g Grilled Fish or Chicken', '1 Roti', 'Mixed Sabzi (Broccoli, Beans)'],
    tip: 'Lighter than lunch. Focus on lean protein and fiber-rich veggies.',
    vegAlternatives: [
      '200g Firm Tofu Stir-Fry + Broccoli/Peppers (~36g Protein)',
      '150g Paneer Tikka (Grilled) + Salad (~30g Protein)',
      '80g Soya Chunks sautéed with Garlic/Onion (~40g Protein)',
      '2 Besan Chillas + Paneer on the side (~28g Protein)',
    ],
  },
  sleep: {
    heading: 'Bedtime Routine',
    items: ['In bed by 10:30 PM', 'No screens 30 mins before sleep', 'Muscles grow during rest!'],
    tip: 'Rest day nutrition: Skip morning shake, cut Roti/Rice by 50%, focus on protein & fiber.',
  },
};

export const eveningMealDetails: Record<string, MealDetail> = {
  breakfast: {
    heading: 'Breakfast (Foundation)',
    items: ['3 Whole Eggs (Bhurji/Omelet)', '2 Brown Bread slices', 'Handful of nuts'],
    tip: 'Solid foundation for the day. Keeps you fueled until lunch.',
  },
  lunch: {
    heading: 'Lunch (Pre-Fuel)',
    items: ['150g Chicken Breast Curry', '2 Rotis', '1 Bowl Thick Dal', '1 Bowl Dahi', 'Salad'],
    tip: 'Pre-fuel for evening training. Don\'t skip the dahi — great for gut health.',
    vegAlternatives: [
      '100g Soya Chunk Curry + Dal (~55g Protein)',
      '150g Paneer Bhurji + Dal + Dahi (~40g Protein)',
      '2 Large Moong Dal Chillas + 50g Paneer (~30g Protein)',
      '1.5 Bowls Kala Chana Curry + Salad (~25g Protein)',
    ],
  },
  preworkout_eve: {
    heading: 'Pre-Workout Snack',
    items: ['1 Banana', '1 Cup Black Coffee', '2-3 Dates'],
    tip: 'Light & fast-digesting to fuel evening training without feeling heavy.',
  },
  workout_eve: {
    heading: 'Evening Training Window',
    items: [],
    tip: 'Intensity priority. Hydrate with 1L water.',
  },
  postworkout_eve: {
    heading: 'Immediate Recovery',
    items: ['4-5 Boiled Egg Whites'],
    tip: 'Rapid protein hit for muscle recovery. Eat within 15 mins of finishing.',
  },
  dinner_eve: {
    heading: 'The Recovery Feast',
    items: ['150g Grilled Fish/Chicken', '1 Roti', 'Mixed Veggies', 'The Muscle Shake: Milk, Muesli, PB, Honey, Banana'],
    tip: 'Meal + shake together. Your primary mass builder — take with dinner.',
    vegAlternatives: [
      '80g Soya Keema + Mixed Veggies (~42g Protein)',
      '200g Grilled Tofu + Broccoli & Peppers (~36g Protein)',
      '250g Greek Yogurt Bowl + Walnuts/Seeds (~28g Protein)',
      '2 Besan Chillas + 50g Paneer (~26g Protein)',
    ],
  },
  sleep_eve: {
    heading: 'Bedtime Routine',
    items: ['In bed by 11:00 PM', 'No screens 30 mins before sleep', 'Muscles grow during rest!'],
    tip: 'Evening shift: Sleep by 11 PM. Rest day: Skip shake, cut carbs 50%, 20 min walk + stretch.',
  },
};

export const restDayMealDetails: Record<string, MealDetail> = {
  breakfast_rest: {
    heading: 'Breakfast (Rest Day)',
    items: ['4 Egg Omelet + Veggies', 'No Bread'],
    tip: 'High protein, low carb. No shake on rest day — keep total Rotis to max 1 for the day.',
  },
  recovery_walk: {
    heading: 'Casual Walk',
    items: ['20 minutes at easy pace', 'Outdoor walk preferred', 'Aids active recovery & digestion'],
    tip: 'Light movement helps blood flow and reduces soreness. No intense effort needed.',
  },
  recovery_stretch: {
    heading: 'Static Stretching / Foam Rolling',
    items: ['10 minutes of full body stretching', 'Focus on tight areas (hips, hamstrings, shoulders)', 'Foam roll quads, IT band, and upper back'],
    tip: 'Improves flexibility and speeds up recovery between training days.',
  },
  lunch: {
    heading: 'Lunch (Rest Day)',
    items: ['150g Chicken or Paneer', '1 Bowl Thick Dal', '1 Roti', 'Salad'],
    tip: 'Max 1 Roti for the day. Focus on high protein and fiber.',
    vegAlternatives: [
      '150g Paneer + Dal + 1 Roti + Salad (~45g Protein)',
      '100g Soya Chunk Curry + Dal + 1 Roti (~55g Protein)',
      '1 Bowl Chole + Greek Yogurt + 1 Roti (~35g Protein)',
    ],
  },
  snack: {
    heading: 'Afternoon Snack',
    items: ['Handful of Sprouted Chana', 'OR 50g Paneer'],
    tip: 'Light protein to bridge lunch and dinner. Low carb.',
  },
  dinner: {
    heading: 'Dinner (Rest Day)',
    items: ['150g Grilled Fish or Chicken', 'Double Salad (No Roti)'],
    tip: 'No Roti at dinner. Load up on veggies and lean protein. Max 1 Roti total for the day.',
    vegAlternatives: [
      '200g Tofu Stir-Fry + Broccoli/Peppers (~36g Protein)',
      '150g Paneer Tikka (Grilled) + Large Salad (~30g Protein)',
      '80g Soya Chunks sautéed with Veggies (~40g Protein)',
    ],
  },
  sleep: {
    heading: 'Bedtime Routine',
    items: ['In bed by 10:30 PM', 'No screens 30 mins before sleep', 'Muscles grow during rest!'],
    tip: 'Quality sleep is even more important on rest days — this is when muscles rebuild.',
  },
};

export const mealOptionsData: Record<string, MealOption[]> = {
  preworkout: [
    { label: 'Banana + Coffee + 5 Almonds', macros: { calories: 149, protein: 3, carbs: 29, fats: 4 } },
    { label: 'Banana + Coffee only', macros: { calories: 107, protein: 1, carbs: 27, fats: 0 } },
  ],
  workout: [
    { label: 'Workout completed', macros: { calories: 0, protein: 0, carbs: 0, fats: 0 } },
  ],
  postworkout: [
    { label: '5 Boiled Egg Whites', macros: { calories: 85, protein: 18, carbs: 1, fats: 0 } },
    { label: '4 Boiled Egg Whites', macros: { calories: 68, protein: 14, carbs: 1, fats: 0 } },
    { label: '3 Whole Boiled Eggs', macros: { calories: 210, protein: 18, carbs: 2, fats: 14 } },
  ],
  shake: [
    { label: 'Full Muscle Shake (Milk, Muesli, PB, Banana, Honey)', macros: { calories: 706, protein: 21, carbs: 104, fats: 25 } },
    { label: 'Light Shake (Milk, Banana, Honey)', macros: { calories: 355, protein: 11, carbs: 59, fats: 10 } },
  ],
  lunch: [
    { label: '150g Chicken Curry + 2 Roti + Dal + Dahi + Salad', macros: { calories: 836, protein: 72, carbs: 87, fats: 20 } },
    { label: '100g Soya Chunk Curry + Dal + 2 Roti', macros: { calories: 620, protein: 55, carbs: 72, fats: 10 } },
    { label: '150g Paneer Bhurji + Dal + Dahi + 2 Roti', macros: { calories: 740, protein: 45, carbs: 68, fats: 30 } },
    { label: '1 Bowl Chole + Greek Yogurt + 2 Roti', macros: { calories: 530, protein: 35, carbs: 70, fats: 12 } },
    { label: '2 Moong Dal Chillas + 50g Paneer', macros: { calories: 460, protein: 30, carbs: 42, fats: 18 } },
  ],
  snack: [
    { label: '100g Paneer cubes (sautéed)', macros: { calories: 321, protein: 21, carbs: 3, fats: 25 } },
    { label: 'Handful of Roasted Chana (~50g)', macros: { calories: 185, protein: 10, carbs: 30, fats: 3 } },
    { label: '100g Paneer + Roasted Chana', macros: { calories: 506, protein: 31, carbs: 33, fats: 28 } },
  ],
  dinner: [
    { label: '150g Grilled Fish + 1 Roti + Sabzi', macros: { calories: 359, protein: 46, carbs: 31, fats: 5 } },
    { label: '150g Grilled Chicken + 1 Roti + Sabzi', macros: { calories: 412, protein: 52, carbs: 31, fats: 7 } },
    { label: '200g Tofu Stir-Fry + Broccoli/Peppers', macros: { calories: 350, protein: 36, carbs: 15, fats: 18 } },
    { label: '150g Paneer Tikka (Grilled) + Salad', macros: { calories: 380, protein: 30, carbs: 8, fats: 26 } },
    { label: '80g Soya Chunks sautéed + Sabzi', macros: { calories: 320, protein: 40, carbs: 22, fats: 6 } },
    { label: '2 Besan Chillas + Paneer', macros: { calories: 400, protein: 28, carbs: 30, fats: 20 } },
  ],
  sleep: [],
};

export const eveningMealOptions: Record<string, MealOption[]> = {
  breakfast: [
    { label: '3 Eggs Bhurji + 2 Brown Bread + Nuts', macros: { calories: 420, protein: 24, carbs: 35, fats: 20 } },
    { label: '3 Eggs Omelet + 2 Brown Bread + Nuts', macros: { calories: 410, protein: 23, carbs: 34, fats: 19 } },
  ],
  lunch: [
    { label: '150g Chicken Curry + 2 Roti + Dal + Dahi + Salad', macros: { calories: 836, protein: 72, carbs: 87, fats: 20 } },
    { label: '100g Soya Chunk Curry + Dal + 2 Roti', macros: { calories: 620, protein: 55, carbs: 72, fats: 10 } },
    { label: '150g Paneer Bhurji + Dal + Dahi + 2 Roti', macros: { calories: 740, protein: 45, carbs: 68, fats: 30 } },
    { label: '2 Moong Dal Chillas + 50g Paneer', macros: { calories: 460, protein: 30, carbs: 42, fats: 18 } },
  ],
  preworkout_eve: [
    { label: 'Banana + Coffee + 2-3 Dates', macros: { calories: 180, protein: 2, carbs: 42, fats: 1 } },
    { label: 'Banana + Coffee only', macros: { calories: 107, protein: 1, carbs: 27, fats: 0 } },
  ],
  workout_eve: [
    { label: 'Workout completed', macros: { calories: 0, protein: 0, carbs: 0, fats: 0 } },
  ],
  postworkout_eve: [
    { label: '5 Boiled Egg Whites', macros: { calories: 85, protein: 18, carbs: 1, fats: 0 } },
    { label: '4 Boiled Egg Whites', macros: { calories: 68, protein: 14, carbs: 1, fats: 0 } },
  ],
  dinner_eve: [
    { label: '150g Fish/Chicken + 1 Roti + Veggies + Muscle Shake', macros: { calories: 850, protein: 67, carbs: 95, fats: 30 } },
    { label: '150g Fish/Chicken + Veggies + Muscle Shake (No Roti)', macros: { calories: 720, protein: 62, carbs: 64, fats: 28 } },
    { label: '80g Soya Keema + Veggies + Shake', macros: { calories: 680, protein: 58, carbs: 75, fats: 22 } },
    { label: '200g Tofu + Veggies + Shake', macros: { calories: 750, protein: 57, carbs: 79, fats: 28 } },
  ],
  sleep_eve: [],
};

export const restDayMealOptions: Record<string, MealOption[]> = {
  breakfast_rest: [
    { label: '4 Egg Omelet + Veggies (No Bread)', macros: { calories: 280, protein: 24, carbs: 6, fats: 18 } },
    { label: '4 Egg Bhurji + Veggies (No Bread)', macros: { calories: 290, protein: 25, carbs: 7, fats: 19 } },
  ],
  recovery_walk: [
    { label: '20 min walk completed', macros: { calories: 0, protein: 0, carbs: 0, fats: 0 } },
  ],
  recovery_stretch: [
    { label: 'Stretching / Foam rolling done', macros: { calories: 0, protein: 0, carbs: 0, fats: 0 } },
  ],
  lunch: [
    { label: '150g Chicken/Paneer + Dal + 1 Roti + Salad', macros: { calories: 550, protein: 55, carbs: 42, fats: 16 } },
    { label: '100g Soya Chunk Curry + Dal (No Roti)', macros: { calories: 420, protein: 50, carbs: 30, fats: 8 } },
    { label: '150g Paneer Bhurji + Dal + Salad (No Roti)', macros: { calories: 530, protein: 40, carbs: 25, fats: 28 } },
    { label: '1 Bowl Chole + Greek Yogurt (No Roti)', macros: { calories: 350, protein: 30, carbs: 35, fats: 10 } },
  ],
  snack: [
    { label: '100g Paneer cubes (sautéed)', macros: { calories: 321, protein: 21, carbs: 3, fats: 25 } },
    { label: 'Handful of Roasted Chana (~50g)', macros: { calories: 185, protein: 10, carbs: 30, fats: 3 } },
  ],
  dinner: [
    { label: '150g Grilled Fish + Sabzi Only (No Roti)', macros: { calories: 255, protein: 43, carbs: 10, fats: 4 } },
    { label: '150g Grilled Chicken + Sabzi Only (No Roti)', macros: { calories: 308, protein: 49, carbs: 10, fats: 6 } },
    { label: '200g Tofu Stir-Fry + Veggies', macros: { calories: 350, protein: 36, carbs: 15, fats: 18 } },
    { label: '150g Paneer Tikka + Large Salad', macros: { calories: 380, protein: 30, carbs: 8, fats: 26 } },
  ],
  sleep: [],
};
