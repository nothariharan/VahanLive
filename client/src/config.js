// client/src/config.js

// If we are in Production (Vercel), use the live backend URL.
// If we are in Development (Local), use localhost.
export const SOCKET_URL = import.meta.env.PROD 
  ? 'https://vahan-server.onrender.com' 
  : 'http://127.0.0.1:5000';

export const API_URL = import.meta.env.PROD 
  ? 'https://vahan-server.onrender.com' 
  : 'http://127.0.0.1:5000';