import { useState, useEffect } from 'react'
import { supabase } from './services/supabaseClient'
import Auth from './Auth'
import SettingsView from './components/SettingsView'
import SearchView from './components/SearchView'
import DashboardView from './components/DashboardView'
import './App.css'

export default function App() {
  const [session, setSession] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [activeMealLogs, setActiveMealLogs] = useState(null);

  // 1. Unified State
  const [profile, setProfile] = useState({ full_name: '', calorie_goal: 2000 });
  const [calories, setCalories] = useState({ budget: 2000, food: 0, exercise: 0 });
  const [mealTotals, setMealTotals] = useState({ breakfast: 0, lunch: 0, dinner: 0, snack: 0 });
  const [allDayLogs, setAllDayLogs] = useState([]);
  const [macros, setMacros] = useState({
    protein: { current: 0, target: 150 },
    carbs: { current: 0, target: 200 },
    fat: { current: 0, target: 70 }
  });

  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));

  const fetchProfile = async (user) => {
    let { data } = await supabase
      .from('profiles')
      .select('full_name, calorie_goal, protein_goal, carbs_goal, fat_goal')
      .eq('id', user.id)
      .maybeSingle();

    if (!data) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert([{ id: user.id, full_name: user.user_metadata?.full_name || 'J J', calorie_goal: 2000 }])
        .select().single();
      if (newProfile) data = newProfile;
    }

    if (data) {
      setProfile(data);
      setCalories(prev => ({ ...prev, budget: data.calorie_goal }));
      setMacros(prev => ({
        protein: { ...prev.protein, target: data.protein_goal || 150 },
        carbs: { ...prev.carbs, target: data.carbs_goal || 200 },
        fat: { ...prev.fat, target: data.fat_goal || 70 }
      }));
    }
  };

  const fetchTotals = async (user, date) => {
    const { data } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', `${date}T00:00:00`)
      .lte('created_at', `${date}T23:59:59`);

    if (data) {
      setAllDayLogs(data);
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

      setCalories(prev => ({ ...prev, food: Math.round(totals.globalCals) }));
      setMealTotals(totals.meals);
      setMacros(prev => ({
        ...prev,
        protein: { ...prev.protein, current: Math.round(totals.protein) },
        carbs: { ...prev.carbs, current: Math.round(totals.carbs) },
        fat: { ...prev.fat, current: Math.round(totals.fat) }
      }));
    }
  };

  const deleteLog = async (logId) => {
    const { error } = await supabase.from('nutrition_logs').delete().eq('id', logId);
    if (!error) {
      fetchTotals(session.user, selectedDate);
      if (activeMealLogs) {
        setActiveMealLogs(prev => ({
          ...prev,
          logs: prev.logs.filter(l => l.id !== logId)
        }));
      }
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user);
        fetchTotals(session.user, selectedDate);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user);
        fetchTotals(session.user, selectedDate);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session && currentScreen === 'dashboard') {
      fetchTotals(session.user, selectedDate);
    }
  }, [selectedDate, currentScreen, session]);

  if (!session) return <Auth />

  const openMealHistory = (mealName) => {
    const filtered = allDayLogs.filter(log => log.meal?.toLowerCase() === mealName.toLowerCase());
    setActiveMealLogs({ name: mealName, logs: filtered });
  };

  return (
    <div className="app-shell">
      {currentScreen === 'dashboard' && (
        <>
          <DashboardView
            profile={profile}
            calories={calories}
            macros={macros}
            mealTotals={mealTotals}
            selectedDate={selectedDate}
            onDateChange={(days) => {
              const current = new Date(selectedDate + "T12:00:00");
              current.setDate(current.getDate() + days);
              setSelectedDate(current.toLocaleDateString('en-CA'));
            }}
            onMenuClick={() => setCurrentScreen('settings')}
            onMealClick={openMealHistory}
          />

          {activeMealLogs && (
            <div className="meal-history-overlay" onClick={() => setActiveMealLogs(null)}>
              <div className="meal-history-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{activeMealLogs.name}</h2>
                  <button className="close-btn" onClick={() => setActiveMealLogs(null)}>✕</button>
                </div>

                <div className="modal-body">
                  {activeMealLogs.logs.length === 0 ? (
                    <p className="empty-text">Nothing logged for this meal.</p>
                  ) : (
                    activeMealLogs.logs.map(log => (
                      <div key={log.id} className="history-item">
                        <div className="history-info">
                          <div className="food-name">{log.product_name}</div>
                          <div className="food-macros">
                            {log.total_protein}g P • {log.total_carbs}g C • {log.total_fat}g F
                          </div>
                        </div>
                        <div className="history-actions">
                          <span className="cal-text">{log.total_calories}</span>
                          <button
                            className="delete-icon"
                            onClick={() => deleteLog(log.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {currentScreen === 'search' && (
        <SearchView userId={session.user.id} onBack={() => setCurrentScreen('dashboard')} />
      )}

      {currentScreen === 'settings' && (
        <SettingsView
          profile={profile}
          onBack={() => setCurrentScreen('dashboard')}
          onProfileUpdate={() => fetchProfile(session.user)}
        />
      )}

      <div className="bottom-nav">
        <div className={`nav-item ${currentScreen === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentScreen('dashboard')}>Dashboard</div>
        <div className="add-button" onClick={() => setCurrentScreen('search')}>+</div>
        <div className="nav-item" onClick={() => supabase.auth.signOut()}>Logout</div>
      </div>
    </div>
  );
}




