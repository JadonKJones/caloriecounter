import { supabase } from './supabaseClient';

export const nutritionService = {
  // Logic to retrieve or "self-heal" the user profile
  async fetchProfile(user) {
    let { data, error } = await supabase
      .from('profiles')
      .select('full_name, calorie_goal, protein_goal, carbs_goal, fat_goal')
      .eq('id', user.id)
      .maybeSingle();

    if (!data && !error) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert([{ 
          id: user.id, 
          full_name: user.user_metadata?.full_name || 'J J', 
          calorie_goal: 2000 
        }])
        .select().single();
      data = newProfile;
    }
    return { data, error };
  },

  // Complex date-filtering and reduction logic for daily logs
  async fetchTotals(userId, date) {
    const { data, error } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', `${date}T00:00:00`)
      .lte('created_at', `${date}T23:59:59`);

    if (error) return { error };

    const totals = data.reduce((acc, log) => {
      const cals = Number(log.total_calories) || 0;
      const mealType = log.meal?.toLowerCase() || 'snack';
      acc.globalCals += cals;
      acc.protein += (Number(log.total_protein) || 0);
      acc.carbs += (Number(log.total_carbs) || 0);
      acc.fat += (Number(log.total_fat) || 0);
      if (acc.meals[mealType] !== undefined) acc.meals[mealType] += cals;
      else acc.meals.snack += cals;
      return acc;
    }, {
      globalCals: 0, protein: 0, carbs: 0, fat: 0,
      meals: { breakfast: 0, lunch: 0, dinner: 0, snack: 0 }
    });

    return { totals, allLogs: data };
  },

  async deleteLog(logId) {
    return await supabase.from('nutrition_logs').delete().eq('id', logId);
  }
};