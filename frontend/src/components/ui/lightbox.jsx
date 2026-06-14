import { X } from "lucide-react";
import { useEffect } from "react";

const Lightbox = ({ src, onClose }) => {
  useEffect(() => {
    if (!src) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 size-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
        onClick={onClose}
      >
        <X className="size-5" />
      </button>
      <img
        src={src}
        alt="Full size"
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export default Lightbox;
