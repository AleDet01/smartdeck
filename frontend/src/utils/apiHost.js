
const API_HOST =
  process.env.REACT_APP_API_HOST ||
  (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : '');

export default API_HOST;
