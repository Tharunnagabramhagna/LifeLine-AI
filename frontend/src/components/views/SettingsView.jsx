import React from 'react';

export default function SettingsView() {
  return (
    <div className="view-container">
      <div className="flex justify-between items-end mb-2">
        <h2 className="view-header mb-0">System Config</h2>
        <span className="text-red-500 font-mono tracking-widest text-sm animate-pulse">● SECURED</span>
      </div>

      <div className="anti-gravity-panel max-w-2xl p-8">
        
         <div className="flex justify-between items-center mb-8 pb-8 border-b border-white/5">
           <div>
             <h3 className="text-xl font-bold text-white mb-1">AI Routing Override</h3>
             <p className="text-gray-400 text-sm">Allow neural network to re-route incoming units automatically.</p>
           </div>
           {/* Custom CSS Toggle */}
           <div className="w-14 h-7 bg-red-500 rounded-full relative shadow-[0_0_15px_rgba(255,45,45,0.5)] cursor-pointer">
              <div className="w-6 h-6 bg-white rounded-full absolute right-0.5 top-0.5" />
           </div>
         </div>

         <div className="flex justify-between items-center mb-8 pb-8 border-b border-white/5">
           <div>
             <h3 className="text-xl font-bold text-white mb-1">Predictive Dispatching</h3>
             <p className="text-gray-400 text-sm">Station ambulances near predicted high-danger sectors.</p>
           </div>
           <div className="w-14 h-7 bg-gray-700/50 rounded-full relative cursor-pointer border border-white/10">
              <div className="w-6 h-6 bg-gray-400 rounded-full absolute left-0.5 top-0.5" />
           </div>
         </div>

         <div className="flex justify-between items-center">
           <div>
             <h3 className="text-xl font-bold text-red-500 mb-1">Emergency Lockdown</h3>
             <p className="text-gray-400 text-sm">Halt non-critical services immediately.</p>
           </div>
           <button className="px-6 py-2 bg-transparent text-red-500 border border-red-500/50 rounded-lg hover:bg-red-500 hover:text-white transition-all font-semibold">
             Execute Setup
           </button>
         </div>

      </div>
    </div>
  );
}
