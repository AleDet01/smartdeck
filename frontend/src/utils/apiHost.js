
const API_HOST =
  process.env.REACT_APP_API_HOST ||
  (process.env.NODE_ENV !== 'production' 
    ? 'http://localhost:5000' 
    : 'https://smartdeck.onrender.com');

export default API_HOST;
