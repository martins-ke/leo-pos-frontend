export default function LeoMark({ className = '' }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Universal Bluish Monogram Gradient */}
        <linearGradient id="leoPillarBlue" x1="12" y1="6" x2="22" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#E0F2FE" />
          <stop offset="100%" stopColor="#BAE6FD" />
        </linearGradient>

        {/* Speed Base Sweep */}
        <linearGradient id="leoBaseBlue" x1="14" y1="32" x2="41" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#7DD3FC" />
        </linearGradient>

        {/* Electric Light-Blue Accent ("Leo" = Today / Real-Time Pulse) */}
        <linearGradient id="leoDotCyan" x1="29" y1="7" x2="39" y2="17" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="50%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#00D2FF" />
        </linearGradient>

        {/* Smooth Subtle Glow Filter */}
        <filter id="leoDotGlow" x="25" y="3" width="20" height="20" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Vertical Backbone of 'L' */}
      <path
        d="M12 8C12 6.89543 12.8954 6 14 6H20C21.1046 6 22 6.89543 22 8V32H14C12.8954 32 12 31.1046 12 30V8Z"
        fill="url(#leoPillarBlue)"
      />

      {/* Forward-Sweeping Base of 'L' (High Counter Speed & Today's Sales) */}
      <path
        d="M14 32H38C39.6569 32 41 33.3431 41 35C41 36.6569 39.6569 38 38 38H14C11.7909 38 10 36.2091 10 34V32H14Z"
        fill="url(#leoBaseBlue)"
      />

      {/* Aerodynamic Speed Slant */}
      <path
        d="M22 23L35 32H22V23Z"
        fill="#38BDF8"
        opacity="0.95"
      />

      {/* Pulse Dot ("Leo" = Today / Real-Time Sync) */}
      <circle
        cx="34"
        cy="12"
        r="4.25"
        fill="url(#leoDotCyan)"
        filter="url(#leoDotGlow)"
      />
    </svg>
  );
}
