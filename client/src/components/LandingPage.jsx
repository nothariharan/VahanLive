// client/src/components/LandingPage.jsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900" />
      
      <div className="z-10 text-center space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
            Transport Tracker
          </h1>
          <p className="text-slate-400 text-xl">Real-time public transport monitoring system</p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
          {/* Passenger Button */}
          <Link to="/map">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-8 py-4 bg-blue-600 rounded-xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 skew-x-12" />
              <div className="flex flex-col items-center">
                <span className="text-4xl mb-2">🗺️</span>
                <span className="text-white font-bold text-xl">I am a Passenger</span>
                <span className="text-blue-200 text-sm">View Live Map</span>
              </div>
            </motion.button>
          </Link>

          {/* Driver Button */}
          <Link to="/driver">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-8 py-4 bg-emerald-600 rounded-xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 skew-x-12" />
              <div className="flex flex-col items-center">
                <span className="text-4xl mb-2">🚌</span>
                <span className="text-white font-bold text-xl">I am a Driver</span>
                <span className="text-emerald-200 text-sm">Broadcast Location</span>
              </div>
            </motion.button>
          </Link>
        </div>
      </div>
    </div>
  );
}