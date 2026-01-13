// client/src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import your pages
import LandingPage from './components/LandingPage';
import PassengerDashboard from './components/PassengerDashboard';
import DriverDashboard from './components/DriverDashboard'; // Ensure you created this from the previous step

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The Landing Page is now the default (/) */}
        <Route path="/" element={<LandingPage />} />
        
        {/* The Map logic is moved here */}
        <Route path="/map" element={<PassengerDashboard />} />
        
        {/* The Driver logic is here */}
        <Route path="/driver" element={<DriverDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;