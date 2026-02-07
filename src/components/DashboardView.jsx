import CircularProgress from './CircularProgress'

export default function DashboardView({ profile, calories, macros, mealTotals, selectedDate, onDateChange, onMenuClick, onMealClick }) {
  const remaining = calories.budget - calories.food;
  const progressPercentage = Math.min((calories.food / calories.budget) * 100, 100);

  const displayDate = new Date(selectedDate + "T12:00:00").toLocaleDateString('en-US', {
    month: 'short', day: 'numeric'
  });

  return (
    <div className="dashboard-container">
      <div className="top-bar">
        <span style={{ fontWeight: 'bold' }}>Hi, {profile.full_name?.split(' ')[0] || 'J J'}</span>
        <div className="date-nav">
          <span className="arrow" onClick={() => onDateChange(-1)}>◀</span>
          <span className="date-text">{displayDate}</span>
          <span className="arrow" onClick={() => onDateChange(1)}>▶</span>
        </div>
        <span onClick={onMenuClick} style={{ cursor: 'pointer', fontSize: '1.5rem' }}>☰</span>
      </div>

      {/* Main Grid: Circle on left, Meals on right */}
      <div className="stats-grid main-focus">
        <div className="main-circle-area">
          <div className="budget-text">Budget</div>
          <div className="budget-number">{calories.budget}</div>
          <div style={{ position: 'relative', width: '140px', height: '140px' }}>
            <CircularProgress percentage={progressPercentage} color="#32d74b" />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', width: '100%' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{remaining}</div>
              <div style={{ fontSize: '0.9rem', color: '#888' }}>left</div>
            </div>
          </div>
        </div>

        <div className="stat-column meals-column">
          {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(mealName => (
            <div key={mealName} className="mini-stat" onClick={() => onMealClick(mealName)} style={{ cursor: 'pointer' }}>
              <label>{mealName}</label>
              <div className="value" style={{ color: '#0a84ff' }}>{mealTotals[mealName.toLowerCase()] || 0}</div>
            </div>
          ))}
        </div>

        {/* Macros spanning the full width underneath */}
        <div className="macros-section">
          <NutrientBar label="Protein" current={macros.protein.current} target={macros.protein.target} color="#32d74b" />
          <NutrientBar label="Carbs" current={macros.carbs.current} target={macros.carbs.target} color="#0a84ff" />
          <NutrientBar label="Fat" current={macros.fat.current} target={macros.fat.target} color="#ff453a" />
        </div>
      </div>
    </div>
  )
}

function NutrientBar({ label, current, target, color }) {
  const percent = Math.min((current / (target || 1)) * 100, 100);
  return (
    <div className="nutrient-row">
      <div style={{ width: '60px' }}>{label}</div>
      <div className="progress-bar-bg">
        <div className="progress-bar-fill" style={{ width: `${percent}%`, backgroundColor: color }}></div>
      </div>
      <div style={{ width: '80px', textAlign: 'right', fontSize: '0.8rem', color: '#888' }}>
        {current} / {target}g
      </div>
    </div>
  )
}
