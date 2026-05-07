"use client";
import { useRef, useCallback, useEffect, useState } from "react";
import { DesignPosition } from "@/lib/buildDesignTextures";

interface Props {
  imgPos: DesignPosition;
  textPos: DesignPosition;
  hasImage: boolean;
  hasText: boolean;
  imgPosBack: DesignPosition;
  textPosBack: DesignPosition;
  hasImageBack: boolean;
  hasTextBack: boolean;
  side: "front" | "back";
  onImgPosChange: (p: DesignPosition) => void;
  onTextPosChange: (p: DesignPosition) => void;
  onImgPosBackChange: (p: DesignPosition) => void;
  onTextPosBackChange: (p: DesignPosition) => void;
}

const RANGE = 0.38;

function posToPercent(pos: DesignPosition) {
  return {
    x: 50 + pos.x * 100 * RANGE,
    y: 50 - pos.y * 100 * RANGE,
  };
}

function clientToPos(clientX: number, clientY: number, rect: DOMRect): DesignPosition {
  const xPct = (clientX - rect.left) / rect.width;
  const yPct = (clientY - rect.top) / rect.height;
  return {
    x: Math.max(-1, Math.min(1, (xPct - 0.5) / RANGE)),
    y: Math.max(-1, Math.min(1, -(yPct - 0.5) / RANGE)),
  };
}

export default function DesignDragOverlay({
  imgPos, textPos, hasImage, hasText,
  imgPosBack, textPosBack, hasImageBack, hasTextBack,
  side,
  onImgPosChange, onTextPosChange,
  onImgPosBackChange, onTextPosBackChange,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"img" | "text" | null>(null);

  // Which handle is currently selected (visible + draggable)
  const [selected, setSelected] = useState<"img" | "text" | null>(null);

  const isFront = side === "front";
  const currentImgPos  = isFront ? imgPos  : imgPosBack;
  const currentTextPos = isFront ? textPos : textPosBack;
  const showImg  = isFront ? hasImage  : hasImageBack;
  const showText = isFront ? hasText   : hasTextBack;
  const setImgPos  = isFront ? onImgPosChange  : onImgPosBackChange;
  const setTextPos = isFront ? onTextPosChange : onTextPosBackChange;

  // Deselect when the available content changes (e.g. image removed)
  useEffect(() => {
    if (selected === "img"  && !showImg)  setSelected(null);
    if (selected === "text" && !showText) setSelected(null);
  }, [showImg, showText, selected]);

  // Deselect when switching sides
  useEffect(() => { setSelected(null); }, [side]);

  const applyMove = useCallback((clientX: number, clientY: number) => {
    if (!dragging.current) return;
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pos = clientToPos(clientX, clientY, rect);
    if (dragging.current === "img")  setImgPos(pos);
    if (dragging.current === "text") setTextPos(pos);
  }, [setImgPos, setTextPos]);

  useEffect(() => {
    const onMove  = (e: MouseEvent) => applyMove(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => { e.preventDefault(); applyMove(e.touches[0].clientX, e.touches[0].clientY); };
    const onUp    = () => { dragging.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("touchmove", onTouch, { passive: false });
    window.addEventListener("touchend",  onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend",  onUp);
    };
  }, [applyMove]);

  // Click on the overlay background → deselect
  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only deselect if the click target is the overlay itself (not a handle)
    if (e.target === overlayRef.current) {
      setSelected(null);
    }
  };

  const startDrag = (type: "img" | "text", clientX: number, clientY: number) => {
    setSelected(type);
    dragging.current = type;
    applyMove(clientX, clientY);
  };

  const imgPct  = posToPercent(currentImgPos);
  const textPct = posToPercent(currentTextPos);

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 z-20 pointer-events-none"
      style={{ touchAction: "none" }}
      onClick={handleOverlayClick}
    >
      {/* Image handle — always show a ghost click zone, ring only when selected */}
      {showImg && (
        <ClickZone
          xPct={imgPct.x}
          yPct={imgPct.y}
          type="img"
          selected={selected === "img"}
          label="Image"
          color="#7c3aed"
          onSelect={(type, cx, cy) => startDrag(type, cx, cy)}
          onDeselect={() => setSelected(null)}
        />
      )}

      {/* Text handle */}
      {showText && (
        <ClickZone
          xPct={textPct.x}
          yPct={textPct.y}
          type="text"
          selected={selected === "text"}
          label="Text"
          color="#0ea5e9"
          onSelect={(type, cx, cy) => startDrag(type, cx, cy)}
          onDeselect={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ─── Click zone + handle ──────────────────────────────────────────────────────
function ClickZone({
  xPct, yPct, type, selected, label, color, onSelect, onDeselect,
}: {
  xPct: number;
  yPct: number;
  type: "img" | "text";
  selected: boolean;
  label: string;
  color: string;
  onSelect: (type: "img" | "text", cx: number, cy: number) => void;
  onDeselect: () => void;
}) {
  return (
    <div
      className="absolute pointer-events-auto select-none"
      style={{
        left: `${xPct}%`,
        top: `${yPct}%`,
        transform: "translate(-50%, -50%)",
        cursor: selected ? "grab" : "pointer",
        zIndex: 30,
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (selected) {
          // already selected — start drag
          onSelect(type, e.clientX, e.clientY);
        } else {
          // first click — just select, don't drag yet
          onSelect(type, e.clientX, e.clientY);
        }
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        onSelect(type, e.touches[0].clientX, e.touches[0].clientY);
      }}
    >
      {selected ? (
        /* ── Selected: full ring handle ── */
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: `2.5px dashed ${color}`,
              background: `${color}20`,
              backdropFilter: "blur(2px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 2px 12px ${color}55`,
            }}
          >
            <div style={{
              width: 9, height: 9, borderRadius: "50%",
              background: color,
              boxShadow: `0 0 0 2px white, 0 0 0 3.5px ${color}`,
            }} />
          </div>
          {/* Label */}
          <div style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginTop: 4,
            background: color,
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 99,
            whiteSpace: "nowrap",
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          }}>
            {label}
          </div>
        </div>
      ) : (
        /* ── Unselected: invisible hit area with tiny dot hint ── */
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Subtle dot so user can find it */}
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: `${color}60`,
            border: `1.5px solid ${color}`,
            boxShadow: `0 0 0 3px ${color}20`,
          }} />
        </div>
      )}
    </div>
  );
}
