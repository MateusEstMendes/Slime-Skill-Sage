import React from "react";
import { DividerOutline, FrameOutline } from "./BorderGeometry.jsx";

export function Crest({ className = "" }) {
  return (
    <svg
      className={`crest ${className}`}
      viewBox="0 0 80 20"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path d="M1 14h18q12 0 14-5l7-8 7 8q2 5 14 5h18M19 14l10-3 5 5 6-5 6 5 5-5 10 3" />
      <path d="m40 5 3 6-3 5-3-5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Divider({ compact = false }) {
  return (
    <div
      className={`ornamental-divider ${compact ? "ornamental-divider--compact" : ""}`}
      aria-hidden="true"
    >
      <DividerOutline compact={compact} />
    </div>
  );
}

export function FrameDecor({ variant = "rect" }) {
  return (
    <div className={`frame-decor frame-decor--${variant}`} aria-hidden="true">
      <FrameOutline variant={variant} />
    </div>
  );
}

export function Frame({
  as: Tag = "article",
  variant = "rect",
  className = "",
  children,
  ...props
}) {
  return (
    <Tag
      className={`ornate-frame ornate-frame--${variant} ${className}`}
      {...props}
    >
      <FrameDecor variant={variant} />
      <div className="frame-content">{children}</div>
    </Tag>
  );
}

export function Medallion({ children, className = "", label }) {
  return (
    <div
      className={`medallion ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      <svg
        className="medallion__ring"
        viewBox="0 0 120 120"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <circle cx="60" cy="60" r="51" />
        <circle cx="60" cy="60" r="46" />
        <path d="M60 3 66 9 60 15 54 9zM111 54l6 6-6 6-6-6zM60 105l6 6-6 6-6-6zM9 54l6 6-6 6-6-6z" />
        <path d="M18 29q10-16 28-20M74 9q18 4 28 20M102 91q-10 16-28 20M46 111q-18-4-28-20" />
      </svg>
      <div className="medallion__content">{children}</div>
    </div>
  );
}

export function MagicCircle({ className = "" }) {
  return (
    <svg
      viewBox="0 0 300 300"
      className={`magic-circle ${className}`}
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <circle cx="150" cy="150" r="143" />
      <circle cx="150" cy="150" r="135" />
      <circle cx="150" cy="150" r="111" />
      <path d="m150 25 108 187H42zM150 275 42 88h216zM150 7v28M150 265v28M7 150h28M265 150h28" />
      <path d="m150 67 72 42v83l-72 41-72-41v-83z" />
      <circle cx="150" cy="150" r="51" />
      {Array.from({ length: 12 }, (_, i) => (
        <path
          key={i}
          transform={`rotate(${i * 30} 150 150)`}
          d="m150 9 3 7-3 7-3-7z"
        />
      ))}
    </svg>
  );
}
