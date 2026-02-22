export const getReminderColor = (id: string): string => {
  switch (id) {
    case 'preworkout': return '#f59e0b';
    case 'workout': return '#7c3aed';
    case 'postworkout': return '#22c55e';
    case 'shake': return '#06b6d4';
    case 'lunch': return '#f97316';
    case 'snack': return '#eab308';
    case 'dinner': return '#ef4444';
    case 'sleep': return '#6366f1';
    case 'recovery_walk': return '#64748b';
    case 'recovery_stretch': return '#8b5cf6';
    case 'breakfast': return '#f59e0b';
    case 'breakfast_rest': return '#f59e0b';
    case 'preworkout_eve': return '#f59e0b';
    case 'workout_eve': return '#7c3aed';
    case 'postworkout_eve': return '#22c55e';
    case 'dinner_eve': return '#ef4444';
    case 'sleep_eve': return '#6366f1';
    default: return '#7c3aed';
  }
};

export const getNotificationBody = (id: string): string => {
  switch (id) {
    case 'preworkout': return '1 Banana + Black Coffee + 5 Soaked Almonds ☕';
    case 'workout': return 'Time to train! Hydrate with 500ml-1L water during session 💪';
    case 'postworkout': return '4-5 Boiled Egg Whites - immediate protein hit! 🥚';
    case 'shake': return 'Muscle Shake: Milk, Muesli, PB, Honey, Banana! 🥤';
    case 'lunch': return '150g Chicken Breast Curry + 2 Rotis + Dal + Dahi + Salad 🍗';
    case 'snack': return '100g Paneer cubes (sautéed) or Roasted Chana! 🧀';
    case 'dinner': return '150g Grilled Fish or Chicken + 1 Roti + Sabzi (Broccoli, Beans) 🐟';
    case 'sleep': return 'Wind down for quality sleep - in bed by 10:30 PM! 😴';
    case 'breakfast': return '3 Eggs (Bhurji/Omelet) + 2 Brown Bread + Nuts 🍳';
    case 'breakfast_rest': return '4 Egg Omelet + Veggies (No Bread) 🍳';
    case 'preworkout_eve': return '1 Banana + Black Coffee + 2-3 Dates ☕';
    case 'workout_eve': return 'Evening training! Hydrate with 1L water during session 💪';
    case 'postworkout_eve': return '4-5 Boiled Egg Whites - rapid protein! 🥚';
    case 'dinner_eve': return 'Recovery Feast: Fish/Chicken + Veggies + Muscle Shake! 🍽️';
    case 'sleep_eve': return 'Wind down - in bed by 11:00 PM! 😴';
    default: return 'HybridFit Reminder';
  }
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};
