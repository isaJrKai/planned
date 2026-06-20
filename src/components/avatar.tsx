"use client";

// ============================================================================
// AVATAR — displays + allows uploading a profile photo
// ============================================================================
// Falls back to initials (first letter of name) on the avatarColor background
// when no photo is set. Click triggers a hidden file input. Image is resized
// to max 256x256 via canvas, then stored as base64 JPEG in the store.
// ============================================================================

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";

interface AvatarProps {
  name: string;
  color: string;
  photo?: string;
  size?: number;            // pixel size, default 36
  showUploadButton?: boolean; // default false — only shown in profile editors
  onUpload?: (dataUrl: string) => void;
  onRemove?: () => void;
  className?: string;
}

export function Avatar({
  name,
  color,
  photo,
  size = 36,
  showUploadButton = false,
  onUpload,
  onRemove,
  className = "",
}: AvatarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const dataUrl = await resizeImage(file, 256, 256);
      onUpload?.(dataUrl);
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const initials = name.charAt(0).toUpperCase();

  return (
    <div
      className={`relative halo-glow shrink-0 ${className}`}
      style={{
        ["--halo-color" as any]: color,
        width: size,
        height: size,
      }}
    >
      {/* Photo or initials */}
      <div
        className="rounded-full flex items-center justify-center overflow-hidden font-editorial"
        style={{
          width: size,
          height: size,
          background: color,
          color: "var(--background)",
          fontSize: size * 0.4,
          border: "1px solid var(--hairline-strong)",
        }}
      >
        {photo ? (
          <img
            src={photo}
            alt={name}
            className="w-full h-full object-cover"
            style={{ display: "block" }}
          />
        ) : (
          initials
        )}
      </div>

      {/* Upload button overlay */}
      {showUploadButton && (
        <>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
            style={{
              background: "rgba(0,0,0,0.55)",
              color: "var(--chart-5)",
            }}
            aria-label="Upload photo"
            title="Upload photo"
          >
            <Camera className="h-4 w-4" />
          </button>

          {photo && onRemove && (
            <button
              onClick={onRemove}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center btn-outline"
              style={{ background: "var(--background)" }}
              aria-label="Remove photo"
              title="Remove photo"
            >
              <X className="h-3 w-3" />
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = ""; // allow re-uploading the same file
            }}
          />
        </>
      )}
    </div>
  );
}

// Resize image via canvas. Returns JPEG data URL at the requested max size.
async function resizeImage(file: File, maxW: number, maxH: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxW) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          }
        } else {
          if (height > maxH) {
            width = Math.round((width * maxH) / height);
            height = maxH;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
