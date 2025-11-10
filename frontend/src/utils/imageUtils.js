// Mappa tematiche specifiche per argomenti comuni
const TOPIC_KEYWORDS = {
  // Scienze
  'fisica': 'physics,laboratory,science,atoms',
  'chimica': 'chemistry,molecules,laboratory,science',
  'biologia': 'biology,cells,nature,microscope',
  'scienze': 'science,laboratory,research,education',
  'anatomia': 'anatomy,medical,body,biology',
  
  // Geografia
  'geografia': 'geography,maps,world,globe',
  'capitali': 'cities,architecture,urban,skyline',
  'europa': 'europe,architecture,travel,culture',
  'mondo': 'world,global,earth,map',
  
  // Storia e Cultura
  'storia': 'history,ancient,culture,monuments',
  'arte': 'art,museum,paintings,sculpture',
  'letteratura': 'books,library,literature,reading',
  'filosofia': 'philosophy,thinking,books,wisdom',
  
  // Tecnologia
  'informatica': 'technology,computer,coding,digital',
  'programmazione': 'coding,programming,software,technology',
  'reti': 'network,technology,connections,digital',
  'database': 'data,technology,servers,digital',
  'web': 'web,internet,technology,digital',
  'devops': 'technology,servers,cloud,infrastructure',
  'aws': 'cloud,technology,servers,infrastructure',
  'cloud': 'cloud,technology,servers,digital',
  
  // Matematica
  'matematica': 'mathematics,geometry,numbers,equations',
  'geometria': 'geometry,shapes,mathematics,patterns',
  'algebra': 'mathematics,equations,numbers,abstract',
  
  // Lingue
  'inglese': 'english,language,books,communication',
  'italiano': 'italian,language,books,culture',
  'spagnolo': 'spanish,language,books,culture',
  'francese': 'french,language,books,culture',
  
  // Business
  'economia': 'economy,business,finance,growth',
  'marketing': 'marketing,business,advertising,digital',
  'finanza': 'finance,money,business,investment',
  
  // Default fallbacks
  'default': 'education,learning,study,knowledge'
};

const GRADIENTS = [
  ['#667eea', '#764ba2'], // purple-blue gradient
  ['#f093fb', '#f5576c'], // pink-red gradient
  ['#4facfe', '#00f2fe'], // cyan gradient
  ['#43e97b', '#38f9d7'], // green-teal gradient
  ['#fa709a', '#fee140'], // pink-yellow gradient
  ['#30cfd0', '#330867'], // teal-purple gradient
  ['#a8edea', '#fed6e3'], // pastel gradient
  ['#ff9a56', '#ff6a88'], // orange-pink gradient
  ['#ffecd2', '#fcb69f'], // peach gradient
  ['#e0c3fc', '#8ec5fc']  // lavender-blue gradient
];

const findBestTopic = (name) => {
  const normalized = name.toLowerCase().trim();
  
  // Cerca corrispondenza esatta
  for (const [key, topic] of Object.entries(TOPIC_KEYWORDS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return topic;
    }
  }
  
  // Default fallback
  return TOPIC_KEYWORDS.default;
};

export const makeConceptImageUrl = (name, idx) => {
  const topic = findBestTopic(name);
  return `https://source.unsplash.com/800x600/?${encodeURIComponent(topic)}`;
};

export const makeGradientDataUrl = (idx = 0) => {
  const [c1, c2] = GRADIENTS[idx % GRADIENTS.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='${c1}'/><stop offset='100%' stop-color='${c2}'/></linearGradient><filter id='noise'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter></defs><rect width='800' height='600' fill='url(#g)'/><rect width='800' height='600' opacity='0.15' filter='url(#noise)'/></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
};
