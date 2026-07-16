/**
 * A crop rectangle expressed as fractions (0..1) of the SOURCE image's natural
 * dimensions; `x`/`y` is the top-left corner.
 *
 * Ephemeral editor state — deliberately NEVER persisted. The chosen crop is
 * baked into the uploaded bytes, so nothing downstream needs to know it existed.
 *
 * Fractions rather than pixels because the editor works on a preview rendered at
 * neither the natural nor the device-pixel size; fractions are invariant to all
 * of them and convert to pixels in exactly one place (the drawImage call).
 *
 * Invariant: (width * naturalWidth) / (height * naturalHeight) === target ratio.
 * Note this is NOT width / height — fraction-space ratio is not pixel-space
 * ratio, and confusing the two mis-frames every non-matching source.
 */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The largest centred rect of `aspectRatio` (width / height) that fits inside a
 * naturalWidth x naturalHeight image. Reproduces the historical implicit centre
 * crop exactly, so an author who never touches the editor gets byte-identical
 * output to before.
 */
export function centreRect(
  naturalWidth: number,
  naturalHeight: number,
  aspectRatio: number,
): CropRect {
  const sourceRatio = naturalWidth / naturalHeight;
  if (sourceRatio > aspectRatio) {
    // Too wide — keep full height, trim the sides.
    const width = aspectRatio / sourceRatio;
    return { x: (1 - width) / 2, y: 0, width, height: 1 };
  }
  if (sourceRatio < aspectRatio) {
    // Too tall — keep full width, trim top and bottom.
    const height = sourceRatio / aspectRatio;
    return { x: 0, y: (1 - height) / 2, width: 1, height };
  }
  return { x: 0, y: 0, width: 1, height: 1 };
}
