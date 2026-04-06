import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function StartScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStart = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-4 relative overflow-hidden">
      {/* Cinematic Background elements (same as AuthPage for consistency) */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0" />
      
      <div className="bg-white/10 backdrop-blur-lg p-10 rounded-3xl shadow-2xl w-full max-w-lg text-center border border-white/10 relative z-10 transition-all hover:border-red-500/30">
        <div className="text-6xl mb-6 animate-bounce">🚑</div>
        <h1 className="text-5xl font-black text-white mb-2 tracking-tighter">
          LifeLine <span className="text-red-500">AI</span>
        </h1>
        <p className="text-gray-400 text-lg mb-10 font-medium uppercase tracking-widest opacity-80">
          Emergency Response System
        </p>

        <button
          onClick={handleStart}
          className="group relative inline-flex items-center justify-center px-10 py-4 font-bold text-white transition-all duration-200 bg-red-500 font-pj rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 hover:bg-red-600 active:scale-95 shadow-lg shadow-red-500/20"
        >
          <span className="mr-3 text-xl">▶</span>
          Start Simulation
        </button>

        <div className="mt-8 pt-8 border-t border-white/5">
          <p className="text-[10px] text-gray-500 font-mono tracking-[0.3em]">
            SYSTEM ONLINE // SECURE ACCESS GRANTED
          </p>
        </div>
      </div>
    </div>
  );
}
