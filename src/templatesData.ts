export interface SubtitleTemplate {
  id: string;
  name: string;
  description: string;
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large' | 'auto';
  fontColor: string;
  position: 'top' | 'center' | 'bottom';
  outline: boolean | string;
  animation: string;
  wordHighlight: 'none' | 'yellow_pop' | 'blue_neon' | 'yellow_karaoke' | 'green_neon' | 'blue_glow' | 'gold_glow';
  isPremium: boolean;
  background?: string;
  suitableFor: string[];
}

export const SUBTITLE_TEMPLATES: SubtitleTemplate[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Subtitle sederhana dan profesional.",
    fontFamily: "Poppins",
    fontSize: "medium",
    fontColor: "white",
    position: "bottom",
    outline: true,
    animation: "Fade In",
    wordHighlight: "none",
    isPremium: false,
    suitableFor: ["YouTube", "Tutorial", "Podcast"]
  },
  {
    id: "tiktok_viral",
    name: "TikTok Viral",
    description: "Subtitle besar ala video viral.",
    fontFamily: "Montserrat",
    fontSize: "large",
    fontColor: "white",
    position: "center",
    outline: "thick-black",
    animation: "Pop",
    wordHighlight: "yellow_pop",
    isPremium: true,
    suitableFor: ["TikTok", "Shorts", "Viral Video"]
  },
  {
    id: "reels_creator",
    name: "Reels Creator",
    description: "Modern dan elegan.",
    fontFamily: "Poppins",
    fontSize: "medium",
    fontColor: "white",
    position: "bottom",
    outline: "bg-trans-dark",
    animation: "Slide Up",
    wordHighlight: "blue_neon",
    isPremium: true,
    suitableFor: ["Instagram Reels", "Shorts", "Vlog"]
  },
  {
    id: "documentary",
    name: "Documentary",
    description: "Gaya film dokumenter.",
    fontFamily: "Roboto",
    fontSize: "small",
    fontColor: "white",
    position: "bottom",
    outline: false,
    animation: "Fade",
    wordHighlight: "none",
    isPremium: false,
    suitableFor: ["Dokumenter", "Film Pendek", "Edukasi"]
  },
  {
    id: "karaoke",
    name: "Karaoke",
    description: "Setiap kata mengikuti suara secara real-time.",
    fontFamily: "Poppins",
    fontSize: "large",
    fontColor: "white",
    position: "center",
    outline: true,
    animation: "Karaoke Progress",
    wordHighlight: "yellow_karaoke",
    isPremium: true,
    suitableFor: ["Musik video", "Karaoke", "Lagu"]
  },
  {
    id: "gaming",
    name: "Gaming",
    description: "Untuk video game dan livestream.",
    fontFamily: "Orbitron",
    fontSize: "large",
    fontColor: "white",
    position: "bottom",
    outline: "neon-purple",
    animation: "Bounce",
    wordHighlight: "green_neon",
    isPremium: true,
    suitableFor: ["Twitch Highlight", "Gameplay", "Streaming"]
  },
  {
    id: "ai_story",
    name: "AI Story",
    description: "Untuk video misteri, luar angkasa, dan cerita AI.",
    fontFamily: "Cinzel",
    fontSize: "medium",
    fontColor: "white",
    position: "bottom",
    outline: "bg-trans-black-30",
    animation: "Glow Fade",
    wordHighlight: "blue_neon",
    isPremium: true,
    suitableFor: ["Misteri", "Cerita AI", "Luar Angkasa"]
  },
  {
    id: "cinematic",
    name: "Cinematic",
    description: "Gaya trailer film layar lebar.",
    fontFamily: "Bebas Neue",
    fontSize: "large",
    fontColor: "white",
    position: "bottom",
    outline: "shadow-gold",
    animation: "Zoom In",
    wordHighlight: "gold_glow",
    isPremium: true,
    suitableFor: ["Cinematic Vibe", "Teaser", "Trailer"]
  }
];
