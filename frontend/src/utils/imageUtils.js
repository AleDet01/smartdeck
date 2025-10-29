const IMAGE_TOPICS = [
  'abstract', 'geometry', 'minimal', 'gradient', 'pattern', 'texture',
  'landscape', 'mountains', 'desert', 'forest', 'aerial', 'sea', 'ice', 'mist', 'dunes'
];

const GRADIENTS = [
  ['#dbeafe', '#bfdbfe'], // soft blue
  ['#e2e8f0', '#cbd5e1'], // slate/gray
  ['#fde68a', '#f59e0b'], // warm yellow
  ['#e9d5ff', '#c4b5fd'], // purple tint
  ['#ccfbf1', '#5eead4'], // teal
  ['#fee2e2', '#fecaca'], // soft red
  ['#dcfce7', '#86efac']  // green
];

export const makeConceptImageUrl = (name, idx) => {
  const topic = IMAGE_TOPICS[(name.length + idx) % IMAGE_TOPICS.length];
  return `https://source.unsplash.com/600x400/?${encodeURIComponent(topic)},minimal`;
};

export const makeGradientDataUrl = (idx = 0) => {
  const [c1, c2] = GRADIENTS[idx % GRADIENTS.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='${c1}'/><stop offset='100%' stop-color='${c2}'/></linearGradient></defs><rect width='600' height='400' fill='url(#g)'/></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
};
