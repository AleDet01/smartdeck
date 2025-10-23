const API_HOST =
  process.env.REACT_APP_API_HOST ||
  (window.location.hostname === 'localhost' ? 'http://localhost:3000' : '');

export default API_HOST;
