import React from 'react';

export default function SectionBackground({ activeSection }) {
  // Pure CSS alternatives implementing user's Framer concepts

  switch (activeSection) {
    case 'Dashboard':
      return (
        <div className="absolute inset-0 bg-black overflow-hidden z-0 pointer-events-none">
          <div className="absolute inset-0 bg-ai-core" />
          <div className="absolute inset-0 bg-ai-pulse" />
        </div>
      );

    case 'Ambulances':
      return (
        <div className="absolute inset-0 bg-black overflow-hidden z-0 pointer-events-none">
          <div className="absolute inset-0 bg-amb-grid" />
          <div className="absolute inset-0 bg-amb-move" />
        </div>
      );

    case 'Requests':
      return (
        <div className="absolute inset-0 bg-black overflow-hidden z-0 pointer-events-none">
          <div className="absolute inset-0 bg-req-flash" />
          <div className="absolute inset-0 bg-req-gradient" />
        </div>
      );

    case 'Analytics':
      return (
        <div className="absolute inset-0 bg-black overflow-hidden z-0 pointer-events-none">
          <div className="absolute inset-0 bg-analytics-gradient" />
          <div className="absolute inset-0 bg-analytics-lines" />
        </div>
      );

    case 'Settings':
      return (
        <div className="absolute inset-0 bg-black overflow-hidden z-0 pointer-events-none">
          <div className="absolute inset-0 bg-settings-gradient" />
          <div className="absolute inset-0 bg-settings-pulse" />
        </div>
      );

    default:
      return <div className="absolute inset-0 bg-black z-0 pointer-events-none" />;
  }
}
