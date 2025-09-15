export default function AreaBox({ area, onPlay }) {
  return (
    <div className="area-box">
      <h3>{area}</h3>
      <button onClick={onPlay}>Play</button>
    </div>
  );
}
