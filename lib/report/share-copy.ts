/** No personal report URLs, names, birth information or chart positions in the default share output. */
export const STORY_PUBLIC_URL="https://lovora.ai.studio/";
type Input={language:"en"|"hi";includeTheme:boolean;theme:string;demo:boolean};
export function buildShareCopy({language,includeTheme,theme,demo}:Input){
 const hi=language==="hi";
 // Sharing an interpretation requires explicit opt-in. Keep the excerpt short for the image.
 const safeTheme=!demo&&includeTheme?theme.replace(/[\r\n<>]/g," ").trim().slice(0,110):"";
 return {
  title:hi?"मेरी प्रेम कहानी":"My Love Story",
  subtitle:hi?"सितारों की ज़ुबानी":"Written in the stars",
  footer:hi?"वैदिक ज्योतिष · व्यक्तिगत चिंतन":"Traditional Vedic astrology · For reflection",
  theme:safeTheme,
  message:demo?"Explore an illustrative LOVORA reading.":"I explored my love story with LOVORA ✦",
  demo
 };
}
