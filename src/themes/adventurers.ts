// themes/adventurers.ts — Ages 9-12: Exploration, Treasure, Quests
// Feel: Minecraft, Roblox, Nintendo — but premium, not blocky

export const ADVENTURER_THEME = {
  // Background gradient — deep ocean to twilight
  bgDeep: "#0a1628",
  bgMid: "#102440",
  bgSurface: "#1a3556",
  
  // Accents
  gold: "#FFD93D",
  coral: "#FF6B6B",
  mint: "#6BCB77",
  teal: "#4ECDC4",
  indigo: "#6C5CE7",
  skyBlue: "#74B9FF",
  
  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.6)",
  textTertiary: "rgba(255,255,255,0.35)",
  
  // Glass
  glassBg: "rgba(255,255,255,0.06)",
  glassBorder: "rgba(255,255,255,0.08)",
  glassShadow: "0 8px 32px rgba(0,0,0,0.25)",
  
  // Depths for parallax
  parallaxFar: 0.2,
  parallaxMid: 0.5,
  parallaxNear: 1.0,
  
  // Animation
  breathDuration: 18,  // seconds for world breathing
  mascotFloat: 4,      // seconds for mascot bob
  particleCount: 20,
  
  // Typography
  headingFont: "var(--font-playfair), Georgia, serif",
  bodyFont: "var(--font-inter), system-ui, sans-serif",
} as const;
