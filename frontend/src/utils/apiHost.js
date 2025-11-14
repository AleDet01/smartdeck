// API Host configuration with custom domain support
const API_HOST = 
  process.env.REACT_APP_API_HOST || 
  (process.env.NODE_ENV === 'production' 
    ? (process.env.REACT_APP_CUSTOM_API_DOMAIN || 'https://smartdeck.onrender.com')
    : 'http://localhost:5000');

export default API_HOST;
