import { useEffect, useMemo, useRef, useState } from 'react';
import { X, ZoomIn, Check, Loader2 } from 'lucide-react';

type Props = {
  open: boolean;
  src: string | null;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void | Promise<void>;
  uploading?: boolean;
};

const BOX = 240; // crop preview box size in px

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function AvatarCropModal({ open, src, onCancel, onConfirm, uploading }: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setNatural(null);
  }, [open, src]);

  const baseScale = useMemo(() => {
    if (!natural) return 1;
    return Math.max(BOX / natural.w, BOX / natural.h);
  }, [natural]);

  const scale = baseScale * zoom;
  const scaledW = natural ? natural.w * scale : 0;
  const scaledH = natural ? natural.h * scale : 0;

  // keep image covering the crop box
  const clampedOffset = useMemo(() => {
    if (!natural) return offset;
    const minX = (BOX - scaledW) / 2;
    const maxX = (scaledW - BOX) / 2;
    const minY = (BOX - scaledH) / 2;
    const maxY = (scaledH - BOX) / 2;
    return {
      x: clamp(offset.x, minX, maxX),
      y: clamp(offset.y, minY, maxY)
    };
  }, [offset, natural, scaledW, scaledH]);

  useEffect(() => {
    // update offset if clamped differs
    if (!natural) return;
    if (clampedOffset.x !== offset.x || clampedOffset.y !== offset.y) setOffset(clampedOffset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampedOffset.x, clampedOffset.y, natural, scale]);

  if (!open || !src) return null;

  const imgLeft = (BOX - scaledW) / 2 + clampedOffset.x;
  const imgTop = (BOX - scaledH) / 2 + clampedOffset.y;

  const exportCropped = async () => {
    if (!natural || !imgRef.current) return;
    const imageEl = imgRef.current;

    // region in source image corresponding to crop box
    const sx = (0 - imgLeft) / scale;
    const sy = (0 - imgTop) / scale;
    const sSize = BOX / scale;

    const canvas = document.createElement('canvas');
    const outSize = 512;
    canvas.width = outSize;
    canvas.height = outSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      imageEl,
      sx,
      sy,
      sSize,
      sSize,
      0,
      0,
      outSize,
      outSize
    );

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92)
    );
    if (!blob) return;
    await onConfirm(blob);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (uploading) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ x: e.clientX, y: e.clientY, ox: clampedOffset.x, oy: clampedOffset.y });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag || uploading) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    setOffset({ x: drag.ox + dx, y: drag.oy + dy });
  };

  const onPointerUp = () => {
    setDrag(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <p className="text-slate-900">Avatarni tahrirlash</p>
            <p className="text-slate-500">Suratni tortib joylashtir, zoomni sozla</p>
          </div>
          <button
            onClick={onCancel}
            disabled={!!uploading}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <div className="mx-auto relative" style={{ width: BOX, height: BOX }}>
            <div
              className="absolute inset-0 rounded-full overflow-hidden bg-slate-100 border border-slate-200"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{ touchAction: 'none', cursor: uploading ? 'not-allowed' : 'grab' }}
            >
              <img
                ref={imgRef}
                src={src}
                alt="Avatar crop"
                onLoad={(e) => {
                  const el = e.currentTarget;
                  setNatural({ w: el.naturalWidth, h: el.naturalHeight });
                }}
                className="absolute select-none"
                draggable={false}
                style={{
                  width: scaledW,
                  height: scaledH,
                  left: imgLeft,
                  top: imgTop
                }}
              />

              {/* subtle ring like instagram */}
              <div className="absolute inset-0 pointer-events-none ring-2 ring-white/80" />
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center gap-3">
              <ZoomIn className="w-5 h-5 text-slate-600" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                disabled={!!uploading}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-200 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={!!uploading}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Bekor qilish
          </button>
          <button
            onClick={exportCropped}
            disabled={!!uploading}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg disabled:opacity-60 flex items-center gap-2"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {uploading ? 'Yuklanyapti...' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  );
}
