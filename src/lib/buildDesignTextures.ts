import * as THREE from "three";

// ─── Position type ────────────────────────────────────────────────────────────
export interface DesignPosition {
  x: number; // -1 to 1  (0 = center)
  y: number; // -1 to 1  (0 = center)
}

function drawDesign(ctx: CanvasRenderingContext2D, w: number, h: number, opts: {
  text: string; font: string; textColor: string;
  textScale: number;
  textPos: DesignPosition;
  imgScale: number;
  imgPos: DesignPosition;
  uploadedImg: HTMLImageElement | null;
  showImg: boolean; showText: boolean;
}) {
  const { text, font, textColor, textScale, textPos, imgScale, imgPos, uploadedImg, showImg, showText } = opts;

  if (showImg && uploadedImg) {
    const imgSize = Math.round(w * 0.60 * imgScale);
    const cx = w / 2 + imgPos.x * (w * 0.38);
    const cy = h / 2 - imgPos.y * (h * 0.38);
    ctx.drawImage(uploadedImg, cx - imgSize / 2, cy - imgSize / 2, imgSize, imgSize);
  }

  if (showText && text.trim()) {
    const px = Math.round(80 * textScale);
    ctx.save();
    ctx.font = `700 ${px}px ${font}`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.25)"; ctx.shadowBlur = px * 0.1;
    ctx.fillStyle = textColor;
    const lines = text.split("\n");
    const lh = px * 1.22;
    const cx = w / 2 + textPos.x * (w * 0.38);
    const cy = h / 2 - textPos.y * (h * 0.38);
    const startY = cy - ((lines.length - 1) * lh) / 2;
    lines.forEach((l, i) => ctx.fillText(l, cx, startY + i * lh));
    ctx.restore();
  }
}

function makeTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = true;
  t.needsUpdate = true;
  return t;
}

export function buildDesignTextures(opts: {
  text: string;
  backText?: string;
  font: string; textColor: string;
  textScale: number;
  textPos: DesignPosition;
  textPosBack?: DesignPosition;
  imgScale: number;
  imgPos: DesignPosition;
  imgPosBack?: DesignPosition;
  uploadedImg: HTMLImageElement | null;
  uploadedImgBack?: HTMLImageElement | null;
  imgShowFront: boolean; imgShowBack: boolean;
  textShowFront: boolean; textShowBack: boolean;
}): { front: THREE.CanvasTexture; back: THREE.CanvasTexture } {
  const w = 1024, h = 1024;

  const frontText = opts.text;
  const backText  = opts.backText !== undefined ? opts.backText : opts.text;
  const backImg   = opts.uploadedImgBack !== undefined ? opts.uploadedImgBack : opts.uploadedImg;
  const textPosBack = opts.textPosBack ?? opts.textPos;
  const imgPosBack  = opts.imgPosBack  ?? opts.imgPos;

  const frontCanvas = document.createElement("canvas");
  frontCanvas.width = w; frontCanvas.height = h;
  const fCtx = frontCanvas.getContext("2d")!;
  fCtx.clearRect(0, 0, w, h);
  if (opts.imgShowFront || opts.textShowFront) {
    drawDesign(fCtx, w, h, {
      ...opts,
      text: frontText,
      textPos: opts.textPos,
      imgPos: opts.imgPos,
      uploadedImg: opts.uploadedImg,
      showImg: opts.imgShowFront,
      showText: opts.textShowFront,
    });
  }

  const backCanvas = document.createElement("canvas");
  backCanvas.width = w; backCanvas.height = h;
  const bCtx = backCanvas.getContext("2d")!;
  bCtx.clearRect(0, 0, w, h);
  if (opts.imgShowBack || opts.textShowBack) {
    drawDesign(bCtx, w, h, {
      ...opts,
      text: backText,
      textPos: textPosBack,
      imgPos: imgPosBack,
      uploadedImg: backImg,
      showImg: opts.imgShowBack && backImg !== null,
      showText: opts.textShowBack,
    });
  }

  return { front: makeTexture(frontCanvas), back: makeTexture(backCanvas) };
}
