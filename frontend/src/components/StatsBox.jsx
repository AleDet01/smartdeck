export default function StatsBox({ title, value, description }) {
  return (
    <div className="stats-box">
      <div className="stats-box-title">{title}</div>
      <div className="stats-box-value">{value}</div>
      {description && <div className="stats-box-desc">{description}</div>}
    </div>
  );
}
