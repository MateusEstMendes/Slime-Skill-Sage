import React, { useLayoutEffect, useRef, useState } from "react";

// O desenho usa os pixels reais do componente: só os trechos retos se alongam.
// Cada perímetro é um path fechado, sem emendas entre borda CSS e ponta SVG.
function useOutlineSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 300, height: 56 });
  useLayoutEffect(() => {
    const svg = ref.current;
    const measure = () => {
      const { width, height } = svg.getBoundingClientRect();
      if (!width || !height) return;
      setSize((previous) =>
        Math.abs(previous.width - width) < 0.01 &&
        Math.abs(previous.height - height) < 0.01
          ? previous
          : { width, height },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);
  return { ref, ...size };
}

function Outline({ children, className = "", geometry }) {
  return (
    <svg
      ref={geometry.ref}
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      className={`continuous-outline ${className}`}
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function diamond(x, y, radius) {
  return `M${x - radius} ${y} ${x} ${y - radius} ${x + radius} ${y} ${x} ${y + radius}Z`;
}

export function ButtonOutline({ model }) {
  const geometry = useOutlineSize();
  const w = geometry.width;
  const s = geometry.height / 56;
  const y = (value) => value * s;
  const cy = y(28);
  let outer;
  let inner;
  let details;

  if (model === "plaque") {
    outer = `M${y(19)} ${y(5)}H${w - y(19)}Q${w - y(18)} ${y(15)} ${w - y(5)} ${cy}Q${w - y(18)} ${y(41)} ${w - y(19)} ${y(51)}H${y(19)}Q${y(18)} ${y(41)} ${y(5)} ${cy}Q${y(18)} ${y(15)} ${y(19)} ${y(5)}Z`;
    inner = `M${y(22)} ${y(9)}H${w - y(22)}Q${w - y(20)} ${y(19)} ${w - y(10)} ${cy}Q${w - y(20)} ${y(37)} ${w - y(22)} ${y(47)}H${y(22)}Q${y(20)} ${y(37)} ${y(10)} ${cy}Q${y(20)} ${y(19)} ${y(22)} ${y(9)}Z`;
    details = (
      <path
        d={`${diamond(y(5), cy, y(5))}${diamond(w - y(5), cy, y(5))}${diamond(w / 2, y(5), y(3))}`}
        fill="currentColor"
        stroke="none"
      />
    );
  } else if (model === "pill" || model === "double") {
    const double = model === "double";
    const x = y(double ? 24 : 27);
    const top = y(double ? 8 : 5);
    const bottom = geometry.height - top;
    const radius = (bottom - top) / 2;
    const offset = y(4);
    outer = `M${x} ${top}H${w - x}A${radius} ${radius} 0 0 1 ${w - x} ${bottom}H${x}A${radius} ${radius} 0 0 1 ${x} ${top}Z`;
    inner = `M${x} ${top + offset}H${w - x}A${radius - offset} ${radius - offset} 0 0 1 ${w - x} ${bottom - offset}H${x}A${radius - offset} ${radius - offset} 0 0 1 ${x} ${top + offset}Z`;
    if (double) {
      details = (
        <path
          d={`${diamond(w / 2, top, y(2.5))}${diamond(w / 2, bottom, y(2.5))}`}
          fill="currentColor"
          stroke="none"
        />
      );
    } else {
      // Os crescentes começam e terminam exatamente no arco externo.
      const edge = x - Math.sqrt(radius * radius - y(18) * y(18));
      details = (
        <>
          <path
            d={`M${edge} ${y(10)}Q${y(1)} ${cy} ${edge} ${y(46)}M${w - edge} ${y(10)}Q${w - y(1)} ${cy} ${w - edge} ${y(46)}`}
          />
          <path
            d={`${diamond(y(4), cy, y(4))}${diamond(w - y(4), cy, y(4))}`}
            fill="currentColor"
            stroke="none"
          />
        </>
      );
    }
  } else {
    const cut = (a, b, c, d) =>
      `M${y(a)} ${y(b)}H${w - y(a)}V${y(c)}H${w - y(d)}V${geometry.height - y(c)}H${w - y(a)}V${geometry.height - y(b)}H${y(a)}V${geometry.height - y(c)}H${y(d)}V${y(c)}H${y(a)}Z`;
    outer = cut(12, 5, 12, 5);
    inner = cut(16, 9, 16, 9);
    details = (
      <>
        <path
          d={`M${y(25)} ${y(5)}L${y(29)} ${y(1)} ${y(33)} ${y(5)}M${w - y(25)} ${y(5)}L${w - y(29)} ${y(1)} ${w - y(33)} ${y(5)}M${y(25)} ${y(51)}L${y(29)} ${y(55)} ${y(33)} ${y(51)}M${w - y(25)} ${y(51)}L${w - y(29)} ${y(55)} ${w - y(33)} ${y(51)}`}
        />
        <path
          d={`${diamond(y(5), cy, y(4))}${diamond(w - y(5), cy, y(4))}`}
          fill="currentColor"
          stroke="none"
        />
      </>
    );
  }

  return (
    <Outline geometry={geometry} className="button-outline">
      <path d={outer} className="outline-outer button-outline__surface" />
      <path d={inner} className="outline-inner" />
      {details}
    </Outline>
  );
}

function rectangle(w, h, inset, radius) {
  return `M${inset + radius} ${inset}H${w - inset - radius}Q${w - inset} ${inset} ${w - inset} ${inset + radius}V${h - inset - radius}Q${w - inset} ${h - inset} ${w - inset - radius} ${h - inset}H${inset + radius}Q${inset} ${h - inset} ${inset} ${h - inset - radius}V${inset + radius}Q${inset} ${inset} ${inset + radius} ${inset}Z`;
}

function Finial({ x, y, bottom = false, scale = 1, className = "" }) {
  return (
    <g
      className={className}
      transform={`translate(${x} ${y}) scale(${scale} ${bottom ? -scale : scale})`}
    >
      <path d="M-40 0H-21Q-9 0-7-5L0-13 7-5Q9 0 21 0H40M0-13V-7" />
      <path d="M0-7 3-3 0 1-3-3Z" fill="currentColor" />
    </g>
  );
}

export function FrameOutline({ variant = "rect" }) {
  const geometry = useOutlineSize();
  const { width: w, height: h } = geometry;
  const slot = variant === "slot";
  return (
    <Outline geometry={geometry} className="frame-outline">
      <path d={rectangle(w, h, 1, 6)} className="outline-outer" />
      <path
        d={rectangle(w, h, 6, 4)}
        className="outline-inner frame-outline__inner"
      />
      {[
        ``,
        `translate(${w} 0) scale(-1 1)`,
        `translate(${w} ${h}) scale(-1 -1)`,
        `translate(0 ${h}) scale(1 -1)`,
      ].map((transform, index) => (
        <g key={index} transform={transform || undefined}>
          <path d="M1 18 8 11 14 1" />
          <path d="M1 26 12 18 22 1" className="ornament-secondary" />
          <path d="M1 8 8 1 6 8Z" fill="currentColor" stroke="none" />
        </g>
      ))}
      <Finial x={w / 2} y={1} scale={slot ? 0.4 : 1} />
      <Finial
        x={w / 2}
        y={h - 1}
        scale={slot ? 0.4 : 1}
        bottom
        className="frame-outline__bottom"
      />
    </Outline>
  );
}

function arch(w, h, inset) {
  const cx = w / 2;
  const rx = cx - inset;
  const ry = Math.min(92, h * 0.22) - inset;
  const bottom = h - inset;
  const shoulder = bottom - ry;
  const k = 0.55228475;
  return `M${inset} ${inset}H${w - inset}V${shoulder}C${w - inset} ${shoulder + ry * k} ${cx + rx * k} ${bottom} ${cx} ${bottom}C${cx - rx * k} ${bottom} ${inset} ${shoulder + ry * k} ${inset} ${shoulder}Z`;
}

export function BannerOutline() {
  const geometry = useOutlineSize();
  const { width: w, height: h } = geometry;
  return (
    <Outline geometry={geometry} className="banner-outline">
      <path
        d={arch(w, h, 1)}
        className="outline-outer banner-outline__surface"
      />
      <path d={arch(w, h, 6)} className="outline-inner" />
      <Finial x={w / 2} y={1} />
      <path d={diamond(w / 2, h - 1, 5)} fill="currentColor" />
    </Outline>
  );
}

export function DividerOutline({ compact }) {
  const geometry = useOutlineSize();
  const w = geometry.width;
  const cy = geometry.height / 2;
  const cx = w / 2;
  const s = compact ? 0.65 : 1;
  return (
    <Outline geometry={geometry} className="divider-outline">
      <path
        d={`M1 ${cy}H${cx - 25 * s}L${cx - 13 * s} ${cy - 7 * s} ${cx} ${cy} ${cx + 13 * s} ${cy - 7 * s} ${cx + 25 * s} ${cy}H${w - 1}M${cx - 25 * s} ${cy}L${cx - 13 * s} ${cy + 7 * s} ${cx} ${cy} ${cx + 13 * s} ${cy + 7 * s} ${cx + 25 * s} ${cy}M${cx} ${cy - 11 * s}V${cy + 11 * s}`}
      />
      <path
        d={`${diamond(2, cy, 2)}${diamond(w - 2, cy, 2)}${diamond(cx, cy, 4 * s)}`}
        fill="currentColor"
        stroke="none"
      />
    </Outline>
  );
}
