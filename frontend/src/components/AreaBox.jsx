import { memo } from 'react';

// Memoized per evitare re-render inutili quando parent ri-renderizza
const AreaBox = memo(({ area, onPlay }) => {
  return (
    <div className="area-box">
      <h3>{area}</h3>
      <button onClick={onPlay}>Play</button>
    </div>
  );
});

AreaBox.displayName = 'AreaBox';

export default AreaBox;
