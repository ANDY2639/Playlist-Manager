"use client";

import { useEffect } from "react";
import YouTubePlayer from "./youtube-player";

type VideoModalProps = {
  open: boolean;
  onClose: () => void;
  videoId: string | null;
};

export default function VideoModal({ open, onClose, videoId }: VideoModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open || !videoId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl relative animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        <YouTubePlayer videoId={videoId} height={400} />
      </div>
    </div>
  );
}
