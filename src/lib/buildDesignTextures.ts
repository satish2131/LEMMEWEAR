import * as THREE from "three";

function drawDesign(ctx: CanvasRenderingContext2D, w: number, h: number, opts: {
  text: string; font: string; textColor: string;
  textScale: number; textPosY: number;
  imgScale: number; imgPosY: number;
  uploadedImg: HTMLImageElement | null;
  showImg: boolean; showText: boolean;
}) {
  const { text, font, textColor, textScale, textPosY, imgScale, imgPosY, uploadedImg, showImg, showText } = opts;

  if (showImg && uploadedImg) {
    const imgSize = Math.round(w * 0.60 * imgScale);
    ctx.drawImage(uploadedImg, w / 2 - imgSize / 2, h / 2 + imgPosY * 250 - imgSize / 2, imgSize, imgSize);
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
    const baseY = (showImg && uploadedImg)
      ? h / 2 + textPosY * 250 + Math.round(w * 0.30 * imgScale)
      : h / 2 + textPosY * 250;
    const startY = baseY - ((lines.length - 1) * lh) / 2;
    lines.forEach((l, i) => ctx.fillText(l, w / 2, startY + i * lh));
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
  text: string; font: string; textColor: string;
  textScale: number; textPosY: number;
  imgScale: number; imgPosY: number;
  uploadedImg: HTMLImageElement | null;
  // image placement
  imgShowFront: boolean; imgShowBack: boolean;
  // text placement
  textShowFront: boolean; textShowBack: boolean;
}): { front: THREE.CanvasTexture; back: THREE.CanvasTexture } {
  const w = 1024, h = 1024;

  const frontCanvas = document.createElement("canvas");
  frontCanvas.width = w; frontCanvas.height = h;
  const fCtx = frontCanvas.getContext("2d")!;
  fCtx.clearRect(0, 0, w, h);
  if (opts.imgShowFront || opts.textShowFront) {
    drawDesign(fCtx, w, h, { ...opts, showImg: opts.imgShowFront, showText: opts.textShowFront });
  }

  const backCanvas = document.createElement("canvas");
  backCanvas.width = w; backCanvas.height = h;
  const bCtx = backCanvas.getContext("2d")!;
  bCtx.clearRect(0, 0, w, h);
  if (opts.imgShowBack || opts.textShowBack) {
    drawDesign(bCtx, w, h, { ...opts, showImg: opts.imgShowBack, showText: opts.textShowBack });
  }

  return { front: makeTexture(frontCanvas), back: makeTexture(backCanvas) };
}
