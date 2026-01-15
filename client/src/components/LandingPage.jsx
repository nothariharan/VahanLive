// client/src/components/LandingPage.jsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaMapMarkedAlt } from 'react-icons/fa';
import { MdGpsFixed } from "react-icons/md";
// Ensure this path is correct based on your folder structure
import customBusIcon from '../assets/image_3.png'

export default function LandingPage() {
  return (
    // FIX 1: Changed 'justify-center' to 'justify-start md:justify-center'
    // This prevents content from being cut off on small screens if it's too tall.
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-start md:justify-center relative overflow-x-hidden text-white py-4 md:py-0">
      
      {/* --- Animated Background Elements --- */}
      {/* Blue Blob */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="hidden md:block absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[60px] md:blur-[120px]" 
      />
      {/* Purple Blob */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          x: [0, -30, 0],
          y: [0, 50, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="hidden md:block absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[60px] md:blur-[120px]" 
      />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 md:opacity-20 brightness-100 mix-blend-overlay pointer-events-none"></div>

      {/* --- Main Content --- */}
      {/* FIX 2: Added 'mt-4 md:mt-0' to push content down slightly on mobile since we removed vertical centering */}
      <div className="z-10 text-center space-y-12 md:space-y-16 px-4 w-full max-w-7xl mt-4 md:mt-0">
        
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >

          <h1 className="text-5xl md:text-8xl tracking-tight mb-6 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">
            {/* Part 1: Vahan (Samarkan Font) */}
            <span 
                className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 py-2"
                style={{ fontFamily: "'Samarkan', sans-serif", letterSpacing: '2px' }}
            >
              Vahan
            </span>
            
            {/* Part 2: Live (Classic Classy Font) */}
            <span 
                className="font-light italic text-white/90"
                style={{ fontFamily: "'Playfair Display', serif" }} 
            >
              Live
            </span>
          </h1>

          <p className="font-serif italic text-slate-400 text-lg md:text-2xl font-light max-w-2xl mx-auto leading-relaxed tracking-wide">
            "The next generation of public transport monitoring. <br className="hidden md:block" />
            <span className="text-slate-300 block md:inline mt-2 md:mt-0">Real-time precision. Seamless connections.</span>"
          </p>
        </motion.div>

        {/* Action Cards Container */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center justify-center pb-8">
          
          {/* 1. Passenger Card */}
          {/* FIX 3: Added 'w-full md:w-auto flex justify-center' to Link so it holds the button correctly */}
          <Link to="/map" className="w-full md:w-auto flex justify-center">
            <motion.button
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05, translateY: -5 }}
              whileTap={{ scale: 0.95 }}
              // FIX 4: Added 'max-w-sm' to keep mobile buttons looking neat
              className="group relative w-full max-w-sm md:w-72 h-64 md:h-80 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:border-blue-500/50 transition-colors duration-500"
            >
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4 md:space-y-6">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <FaMapMarkedAlt className="text-3xl md:text-4xl text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2">I am a Passenger</h3>
                  <p className="text-sm text-slate-400 group-hover:text-blue-200 transition-colors px-4">
                    Track buses, find routes, and plan your journey live.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  Open Map <MdGpsFixed />
                </div>
              </div>
            </motion.button>
          </Link>

          {/* 2. Driver Card */}
          <Link to="/driver" className="w-full md:w-auto flex justify-center">
            <motion.button
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05, translateY: -5 }}
              whileTap={{ scale: 0.95 }}
              className="group relative w-full max-w-sm md:w-72 h-64 md:h-80 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:border-emerald-500/50 transition-colors duration-500"
            >
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4 md:space-y-6">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-500/10 rounded-full flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  
                  <img 
                    src={customBusIcon} 
                    alt="Bus and Plane Icon"
                    className="w-12 h-12 md:w-16 md:h-16 object-contain group-hover:scale-110 transition-transform duration-300" 
                  />

                </div>
                
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2">I am a Driver</h3>
                  <p className="text-sm text-slate-400 group-hover:text-emerald-200 transition-colors px-4">
                    Broadcast your live GPS location to passengers.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  Start Driving <MdGpsFixed />
                </div>
              </div>
            </motion.button>
          </Link>

        </div>
      </div>
    </div>
  );
}