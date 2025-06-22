import { cn } from "@/lib/utils"

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  width?: number | string
  height?: number | string
  className?: string
}

export function Logo({ width = 40, height = 40, className, ...props }: LogoProps) {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("", className)}
      {...props}
    >
      {/* Background Circle with Gradient */}
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#4F46E5", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#7C3AED", stopOpacity: 1 }} />
        </linearGradient>
        
        {/* Pulse Animation */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
        </filter>
      </defs>

      {/* Main Circle */}
      <circle 
        cx="256" 
        cy="256" 
        r="248" 
        fill="url(#bgGradient)" 
        strokeWidth="16" 
        strokeOpacity="0.1" 
        stroke="white" 
      />

      {/* Status Dots */}
      <g transform="translate(256, 256)">
        {/* Outer Ring */}
        <circle 
          r="180" 
          fill="none" 
          stroke="rgba(255,255,255,0.15)" 
          strokeWidth="4" 
          strokeDasharray="4,8" 
        />
        
        {/* Activity Dots */}
        <g transform="rotate(-30)">
          <circle 
            cx="180" 
            cy="0" 
            r="12" 
            fill="#10B981" 
            filter="url(#glow)" 
            opacity="0.9" 
          />
        </g>
        <g transform="rotate(90)">
          <circle 
            cx="180" 
            cy="0" 
            r="12" 
            fill="#3B82F6" 
            filter="url(#glow)" 
            opacity="0.9" 
          />
        </g>
        <g transform="rotate(210)">
          <circle 
            cx="180" 
            cy="0" 
            r="12" 
            fill="#8B5CF6" 
            filter="url(#glow)" 
            opacity="0.9" 
          />
        </g>
      </g>

      {/* Code Activity Lines (Stylized "v" shape) */}
      <g transform="translate(256, 256) scale(0.8)">
        {/* Left Line */}
        <path 
          d="M-100,-50 L-20,100" 
          stroke="white" 
          strokeWidth="24" 
          strokeLinecap="round"
        />
        {/* Right Line */}
        <path 
          d="M100,-50 L20,100" 
          stroke="white" 
          strokeWidth="24" 
          strokeLinecap="round"
        />
      </g>

      {/* Central Dot */}
      <circle 
        cx="256" 
        cy="256" 
        r="16" 
        fill="white" 
        opacity="0.95" 
      />
    </svg>
  )
} 