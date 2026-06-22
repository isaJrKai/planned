// app/loading.tsx — route-transition fallback (minimal shimmer)
export default function Loading() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--background, #090C0A)", gap: "1rem" }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, overflow: "hidden", animation: "splash-fade-in 0.4s ease-out both" }}>
        <svg viewBox="0 0 1024 1024" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="loadingBg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0A4D5C"/><stop offset="100%" stopColor="#1A5C4D"/></linearGradient>
            <linearGradient id="loadingGold" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#E8D5A0"/><stop offset="50%" stopColor="#C9A84C"/><stop offset="100%" stopColor="#B8941F"/></linearGradient>
          </defs>
          <rect width="1024" height="1024" rx="228" ry="228" fill="url(#loadingBg)"/>
          <path d="M 512 280 L 512 560 L 270 620 L 250 540 Z" fill="url(#loadingGold)"/>
          <path d="M 512 280 L 512 560 L 754 620 L 774 540 Z" fill="url(#loadingGold)"/>
          <rect x="504" y="280" width="16" height="280" fill="url(#loadingGold)"/>
        </svg>
      </div>
      <div style={{ width: 80, height: 1.5, background: "rgba(201, 168, 76, 0.15)", borderRadius: 1, overflow: "hidden" }}>
        <div style={{ height: "100%", background: "linear-gradient(90deg, transparent, #C9A84C, transparent)", borderRadius: 1, animation: "loading-shimmer 1.2s ease-in-out infinite" }} />
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes splash-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes loading-shimmer { 0% { width: 0%; margin-left: 0%; } 50% { width: 60%; margin-left: 20%; } 100% { width: 0%; margin-left: 100%; } }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
      `}} />
    </div>
  );
}
