// client/src/config.js

// When deployed, use your Render Backend.
// When testing locally, use localhost.

export const SOCKET_URL = import.meta.env.PROD 
  ? 'https://vahan-server-in2j.onrender.com' 
  : 'http://localhost:5000';

export const API_URL = import.meta.env.PROD 
  ? 'https://vahan-server-in2j.onrender.com' 
  : 'http://localhost:5000';