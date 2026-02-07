import { useState } from 'react'

export default function SettingsView({ profile, onBack, onProfileUpdate }) {
  const splits = {
    balanced: { name: 'Balanced (40/30/30)', p: 0.30, c: 0.40, f: 0.30 },
    highProtein: { name: 'High Protein (35/45/20)', p: 0.45, c: 0.35, f: 0.20 },
    keto: { name: 'Keto (5/25/70)', p: 0.25, c: 0.05, f: 0.70 },
    lowFat: { name: 'Low Fat (50/25/25)', p: 0.25, c: 0.50, f: 0.25 }
  };
  const [formData, setFormData] = useState({ ...profile });
  const [selectedSplit, setSelectedSplit] = useState('balanced');
  const [saving, setSaving] = useState(false);

  const applySplit = (splitKey, calories) => {
    const s = splits[splitKey];
    const cals = calories || formData.calorie_goal;
    setFormData(prev => ({
      ...prev,
      calorie_goal: cals,
      protein_goal: Math.round((cals * s.p) / 4),
      carbs_goal: Math.round((cals * s.c) / 4),
      fat_goal: Math.round((cals * s.f) / 9)
    }));
    setSelectedSplit(splitKey);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('profiles').update(formData).eq('id', user.id);
    if (!error) {
      alert("Goals updated!");
      onProfileUpdate();
      onBack();
    } else {
      alert(error.message);
    }
    setSaving(false);
  };

  return (
    <div className="dashboard-container" style={{ backgroundColor: '#000', minHeight: '100vh' }}>
      <div className="top-bar">
        <span onClick={onBack} style={{ cursor: 'pointer', color: '#32d74b' }}>✕ Cancel</span>
        <span style={{ fontWeight: 'bold' }}>Settings</span>
        <button onClick={handleSave} style={{ background: 'none', border: 'none', color: '#32d74b', fontWeight: 'bold', fontSize: '1rem' }}>{saving ? '...' : 'Save'}</button>
      </div>
      <div style={{ padding: '20px' }}>
        <div className="input-group">
          <label style={{ color: '#888', fontSize: '0.75rem', fontWeight: 'bold' }}>FULL NAME</label>
          <input className="auth-input" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
        </div>
        <div className="input-group" style={{ marginTop: '20px' }}>
          <label style={{ color: '#888', fontSize: '0.75rem', fontWeight: 'bold' }}>DAILY CALORIE GOAL</label>
          <input type="number" className="auth-input" value={formData.calorie_goal} onChange={(e) => {
            const newCals = parseInt(e.target.value) || 0;
            setFormData({ ...formData, calorie_goal: newCals });
            applySplit(selectedSplit, newCals);
          }} />
        </div>
        <div className="input-group" style={{ marginTop: '25px' }}>
          <label style={{ color: '#888', fontSize: '0.75rem', fontWeight: 'bold' }}>MACRO SPLIT</label>
          <select className="auth-input" value={selectedSplit} onChange={(e) => applySplit(e.target.value)}>
            {Object.keys(splits).map(key => <option key={key} value={key}>{splits[key].name}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '20px', textAlign: 'center' }}>
          <div style={{ background: '#1c1c1e', padding: '10px', borderRadius: '10px' }}><div style={{ color: '#32d74b', fontWeight: 'bold' }}>{formData.protein_goal}g</div><div style={{ fontSize: '0.6rem', color: '#888' }}>PROTEIN</div></div>
          <div style={{ background: '#1c1c1e', padding: '10px', borderRadius: '10px' }}><div style={{ color: '#bf5af2', fontWeight: 'bold' }}>{formData.carbs_goal}g</div><div style={{ fontSize: '0.6rem', color: '#888' }}>CARBS</div></div>
          <div style={{ background: '#1c1c1e', padding: '10px', borderRadius: '10px' }}><div style={{ color: '#ff9f0a', fontWeight: 'bold' }}>{formData.fat_goal}g</div><div style={{ fontSize: '0.6rem', color: '#888' }}>FAT</div></div>
        </div>
      </div>
    </div>
  );
}
