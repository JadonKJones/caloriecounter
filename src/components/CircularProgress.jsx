function CircularProgress({ percentage, color }) {
  const strokeDasharray = 283;
  const offset = strokeDasharray - (percentage / 100) * strokeDasharray;

  return (
    <svg width="120" height="120" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="transparent" stroke="#333" strokeWidth="10" />
      <circle
        cx="50" cy="50" r="45"
        fill="transparent"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        transform="rotate(-90 50 50)" 
      />
      {/* DELETED THE TEXT TAG THAT WAS HERE */}
    </svg>
  );
}

export default CircularProgress;