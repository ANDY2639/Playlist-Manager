import { useEffect, useRef } from "react";

type YouTubePlayerProps = {
  videoId: string | null;
  height?: number;
  width?: number | string;
  onReady?: () => void;
  onStateChange?: (state: number) => void;
};

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export default function YouTubePlayer({
  videoId,
  height = 360,
  width = "100%",
  onReady,
  onStateChange,
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!videoId) return;

    // Load API if not present
    const loadApi = () =>
      new Promise<void>((resolve) => {
        if (window.YT && window.YT.Player) return resolve();
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
        window.onYouTubeIframeAPIReady = () => resolve();
      });

    let mounted = true;

    loadApi().then(() => {
      if (!mounted) return;
      // Destroy existing
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
      }
      playerRef.current = new window.YT.Player(containerRef.current, {
        height,
        width,
        videoId,
        playerVars: {
          autoplay: 1,     // 🔥 Autoplay
          mute: 0,         // 🔥 Sound muted
          controls: 1,     // ❌ Ocultar controles
          disablekb: 1,    // ❌ Quitar teclado
          fs: 1,           // ❌ Sin fullscreen
          rel: 0,          // ❌ No videos sugeridos
          showinfo: 0,     // ❌ Ocultar info (deprecated pero funciona)
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => onReady?.(),
          onStateChange: (e: any) => onStateChange?.(e.data),
        },
      });
    });

    return () => {
      mounted = false;
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
      }
    };
  }, [videoId, height, width, onReady, onStateChange]);

  return <div ref={containerRef} aria-label="YouTube player" />;
}
