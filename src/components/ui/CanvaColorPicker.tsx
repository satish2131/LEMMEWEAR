"use client";
import { useRef, useState, useEffect, useCallback } from "react";

// ─── Colour math helpers ──────────────────────────────────────────────────────

function hsvToHex(h: number, s: number, v: number): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    const val = v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    return Math.round(val * 255);
  };
  const r = f(5), g = f(3), b = f(1);
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

function hexToHsv(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return [0, 1, 1];
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  const s = max === 0 ? 0 : d / max;
  return [h, s, max];
}

function isValidHex(hex: string) {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CanvaColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  swatches: { name: string; hex: string }[];
  label?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CanvaColorPicker({
  value,
  onChange,
  swatches,
  label,
}: CanvaColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [hue, setHue] = useState(0);
  const [sat, setSat] = useState(1);
  const [bri, setBri] = useState(1);
  const [hexInput, setHexInput] = useState(value.toUpperCase());

  const sbRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const draggingSB = useRef(false);
  const draggingHue = useRef(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync from external value
  useEffect(() => {
    if (isValidHex(value)) {
      const [h, s, v] = hexToHsv(value);
      setHue(h);
      setSat(s);
      setBri(v);
      setHexInput(value.toUpperCase());
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const emitColor = useCallback(
    (h: number, s: number, v: number) => {
      const hex = hsvToHex(h, s, v);
      onChange(hex);
      setHexInput(hex.toUpperCase());
    },
    [onChange]
  );

  // ── Saturation/Brightness canvas drag ──────────────────────────────────────

  const getSBFromEvent = useCallback((e: MouseEvent | React.MouseEvent) => {
    const el = sbRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const newSat = x;
    const newBri = 1 - y;
    setSat(newSat);
    setBri(newBri);
    emitColor(hue, newSat, newBri);
  }, [hue, emitColor]);

  const onSBMouseDown = (e: React.MouseEvent) => {
    draggingSB.current = true;
    getSBFromEvent(e);
  };

  useEffect(() => {
    const move = (e: MouseEvent) => { if (draggingSB.current) getSBFromEvent(e); };
    const up = () => { draggingSB.current = false; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [getSBFromEvent]);

  // ── Hue slider drag ─────────────────────────────────────────────────────────

  const getHueFromEvent = useCallback((e: MouseEvent | React.MouseEvent) => {
    const el = hueRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newHue = x * 360;
    setHue(newHue);
    emitColor(newHue, sat, bri);
  }, [sat, bri, emitColor]);

  const onHueMouseDown = (e: React.MouseEvent) => {
    draggingHue.current = true;
    getHueFromEvent(e);
  };

  useEffect(() => {
    const move = (e: MouseEvent) => { if (draggingHue.current) getHueFromEvent(e); };
    const up = () => { draggingHue.current = false; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [getHueFromEvent]);

  // ── Hex input ───────────────────────────────────────────────────────────────

  const handleHexInput = (raw: string) => {
    const v = raw.startsWith("#") ? raw : `#${raw}`;
    setHexInput(v.toUpperCase());
    if (isValidHex(v)) {
      onChange(v);
      const [h, s, b] = hexToHsv(v);
      setHue(h); setSat(s); setBri(b);
    }
  };

  // ── Derived values ──────────────────────────────────────────────────────────

  const pureHue = hsvToHex(hue, 1, 1);
  const sbThumbX = sat * 100;
  const sbThumbY = (1 - bri) * 100;
  const hueThumbX = (hue / 360) * 100;
  const isLight = (hex: string) => {
    const c = hex.replace("#", "");
    if (c.length !== 6) return false;
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 180;
  };

  return (
    <div className="relative">
      {label && (
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          {label}
        </p>
      )}

      {/* ── Swatch row ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Rainbow + button */}
        <button
          onClick={() => setOpen((o) => !o)}
          title="Open color picker"
          aria-label="Open color picker"
          className="relative h-9 w-9 rounded-full shrink-0 flex items-center justify-center overflow-hidden border-2 hover:scale-110 transition-transform"
          style={{
            background: "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)",
            borderColor: open ? value : "transparent",
            boxShadow: open ? `0 0 0 2px white, 0 0 0 4px ${value}` : undefined,
          }}
        >
          <span className="h-5 w-5 rounded-full bg-white/90 flex items-center justify-center text-black font-bold text-base leading-none select-none">
            +
          </span>
        </button>

        {/* Palette swatches */}
        {swatches.map((c) => {
          const selected = value.toLowerCase() === c.hex.toLowerCase();
          const light = isLight(c.hex);
          return (
            <button
              key={c.hex}
              onClick={() => onChange(c.hex)}
              title={c.name}
              aria-label={c.name}
              className="relative h-9 w-9 rounded-full shrink-0 transition-transform hover:scale-110"
              style={{
                backgroundColor: c.hex,
                border: light ? "1.5px solid #d1d5db" : "none",
                boxShadow: selected
                  ? `0 0 0 2.5px white, 0 0 0 4.5px ${light ? "#a855f7" : c.hex}`
                  : undefined,
              }}
            />
          );
        })}
      </div>

      {/* ── Popover ── */}
      {open && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-12 z-50 w-72 rounded-2xl border border-border bg-card shadow-xl overflow-hidden"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
        >
          {/* Saturation / Brightness canvas */}
          <div
            ref={sbRef}
            onMouseDown={onSBMouseDown}
            className="relative w-full cursor-crosshair select-none"
            style={{ height: 120 }}
          >
            {/* Base hue */}
            <div className="absolute inset-0" style={{ backgroundColor: pureHue }} />
            {/* White gradient left→right */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to right, #fff 0%, transparent 100%)" }}
            />
            {/* Black gradient top→bottom */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to bottom, transparent 0%, #000 100%)" }}
            />
            {/* Thumb */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${sbThumbX}%`,
                top: `${sbThumbY}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div
                className="h-5 w-5 rounded-full border-2 border-white shadow-md"
                style={{ backgroundColor: value }}
              />
            </div>
          </div>

          <div className="px-4 pt-3 pb-4 space-y-3">
            {/* Hue slider */}
            <div
              ref={hueRef}
              onMouseDown={onHueMouseDown}
              className="relative h-4 rounded-full cursor-pointer select-none"
              style={{
                background:
                  "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
              }}
            >
              <div
                className="absolute top-1/2 pointer-events-none"
                style={{
                  left: `${hueThumbX}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  className="h-5 w-5 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: pureHue }}
                />
              </div>
            </div>

            {/* Hex input row */}
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
              <div
                className="h-6 w-6 rounded-full shrink-0 border border-border"
                style={{ backgroundColor: value }}
              />
              <input
                type="text"
                value={hexInput}
                onChange={(e) => handleHexInput(e.target.value)}
                className="flex-1 bg-transparent text-sm font-mono uppercase focus:outline-none"
                maxLength={7}
                spellCheck={false}
              />
            </div>

            {/* Recent / extra swatches */}
            <div className="flex gap-2 flex-wrap pt-1">
              {swatches.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => { onChange(c.hex); setOpen(false); }}
                  title={c.name}
                  className="h-7 w-7 rounded-full border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
