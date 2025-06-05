export function EcotruckLogo({ className = "w-full h-auto" }: { className?: string }) {
  return (
    <svg 
      width="280" 
      height="65" 
      viewBox="0 0 280 65"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g fill="#FFD700">
        {/* Círculo e ondas no logo - parte esquerda */}
        <path d="M70 10C35 10 15 20 15 32.5S35 55 70 55c10 0 15-3 20-5 0 0 50 0 60 0 5 0 10-4 10-10V20c0-6-5-10-10-10H90c-5 2-10 0-20 0z" />
        
        {/* Texto ECOTRUCK */}
        <path d="M115 20h30v5h-25v10h20v5h-20v10h25v5h-30V20z" />
        <path d="M150 20h25c10 0 15 5 15 10s-5 10-15 10h-15v15h-10V20zm10 15h15c5 0 5-5 0-5h-15v5z" />
        <path d="M195 20h20c10 0 15 5 15 10 0 8-5 10-15 10h-10v15h-10V20zm10 15h10c5 0 5-5 0-5h-10v5z" />
        <path d="M240 20h-10v35h10V20z" />
        <path d="M245 20h30v5h-20v10h15v5h-15v10h20v5h-30V20z" />
      </g>
      {/* TM marca */}
      <text x="272" y="25" fill="#FFD700" fontSize="8" textAnchor="end">TM</text>
    </svg>
  );
}