"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const ProgressLoader = ({ progress, height = '8px', barColor = 'bg-gray-300', fillColor = 'bg-green-500', className = '', }) => {
    // Clamp progress between 0 and 100
    const clampedProgress = Math.min(Math.max(progress, 0), 100);
    return (<div className={`relative w-full ${className}`}>
      {/* Progress Bar Container */}
      <div className={`relative w-full rounded-full overflow-hidden ${barColor}`} style={{ height }}>
        {/* Filled Progress */}
        <div className={`h-full rounded-full ${fillColor} transition-all duration-300 ease-out`} style={{ width: `${clampedProgress}%` }}/>
      </div>

      {/* Car Tracker */}
      <div className="absolute top-1/2 -translate-y-1/2 transition-all duration-300 ease-out" style={{ left: `calc(${clampedProgress}% - 24px)` }} // Adjust for car width
    >
        <svg width="48" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative">
          {/* Car Body */}
          <rect x="12" y="6" width="24" height="12" rx="2" fill="#000"/>
          {/* Wheels */}
          <circle cx="18" cy="18" r="3" fill="#333"/>
          <circle cx="30" cy="18" r="3" fill="#333"/>
          {/* Window */}
          <rect x="24" y="8" width="8" height="4" rx="1" fill="#666"/>
          {/* Flames */}
          <g className="animate-flame">
            <path d="M8 12C8 10.5 6.5 9 4 9C1.5 9 0 10.5 0 12C0 13.5 1.5 15 4 15C6.5 15 8 13.5 8 12Z" fill="#FF4500"/>
            <path d="M6 12C6 11 5 10 3 10C1 10 0 11 0 12C0 13 1 14 3 14C5 14 6 13 6 12Z" fill="#FFA500"/>
          </g>
        </svg>
      </div>

      {/* CSS for Flame Animation */}
      <style jsx>{`
        @keyframes flame {
          0% {
            transform: scale(1) translateX(0);
            opacity: 1;
          }
          50% {
            transform: scale(1.2) translateX(-2px);
            opacity: 0.8;
          }
          100% {
            transform: scale(1) translateX(0);
            opacity: 1;
          }
        }
        .animate-flame {
          animation: flame 0.3s ease-in-out infinite alternate;
        }
      `}</style>
    </div>);
};
exports.default = ProgressLoader;
