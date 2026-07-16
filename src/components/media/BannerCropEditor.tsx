import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { CropRect } from './crop-rect.js';

export interface BannerCropEditorProps {
  /** Object URL of the selected file. A blob: URL is same-origin, so the crop
   *  can later be baked to a canvas without tainting it. */
  src: string;
  /** Target aspect ratio, width / height. */
  aspect: number;
  /** Fires whenever the author settles on a rect. Fractions of natural size. */
  onCropChange: (rect: CropRect) => void;
}

/** Zoom ceiling. Past ~3x a 1920px-wide master visibly softens. */
const MAX_ZOOM = 3;

/**
 * Pan/zoom frame for choosing what a banner shows.
 *
 * The frame is locked to the ratio the banner actually renders at, so this is
 * WYSIWYG — unlike LinkedIn, whose editor crops to a ratio its own renderer
 * never uses (it recommends 4:1 and renders 5.836:1, silently eating ~31% of
 * the height).
 *
 * Emits crop PARAMETERS only; the bake happens later in fitImage. Nothing here
 * touches a canvas.
 */
export function BannerCropEditor({ src, aspect, onCropChange }: BannerCropEditorProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  /**
   * Back to the default framing: fully zoomed out and centred, which is the
   * same frame the implicit centre crop would have produced. A reset, not a
   * commit — the author stays in the editor and can keep adjusting.
   */
  const resetFrame = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  const isDefaultFrame = zoom === 1 && crop.x === 0 && crop.y === 0;

  const handleCropComplete = useCallback(
    (area: { x: number; y: number; width: number; height: number }) => {
      // react-easy-crop reports percentages of the image (0..100). Normalise to
      // fractions: they survive any later resize, unlike pixels, which would
      // force every consumer to carry the divisor around.
      onCropChange({
        x: area.x / 100,
        y: area.y / 100,
        width: area.width / 100,
        height: area.height / 100,
      });
    },
    [onCropChange],
  );

  return (
    <div className="space-y-2">
      <div
        className="relative w-full aspect-[3/1] bg-neutral-100 dark:bg-white/5 rounded-lg overflow-hidden"
        data-testid="crop-frame"
      >
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          maxZoom={MAX_ZOOM}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
          showGrid={false}
          // The library's computed minZoom is what stops empty space entering
          // the frame — the position clamp alone does not, since it is built on
          // Math.abs and flips once the media is smaller than the frame.
          objectFit="cover"
        />
      </div>
      <div className="flex items-center gap-3">
        <label className="flex flex-1 items-center gap-2 text-xs text-neutral-500 dark:text-white/45">
          Zoom
          <input
            type="range"
            aria-label="Zoom"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1"
          />
        </label>
        <button
          type="button"
          onClick={resetFrame}
          disabled={isDefaultFrame}
          className="text-xs text-neutral-700 dark:text-white/70 underline-offset-2 hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-default"
        >
          Reset
        </button>
      </div>
      <div className="text-[10px] text-neutral-500 dark:text-white/45">
        Drag to reposition. This is exactly how the banner will appear everywhere.
      </div>
    </div>
  );
}
