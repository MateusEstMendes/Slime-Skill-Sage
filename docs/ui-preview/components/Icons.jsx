import React from "react";

// Desenhos originais, em uma única malha de 48 unidades e no mesmo peso de traço.
const drawings = {
  flask: (
    <>
      <path d="M18 6h12M20 6v12L10 35q-3 7 5 7h18q8 0 5-7L28 18V6" />
      <path d="M16 30h16l5 8H11z" />
      <path d="m23 23 3 4M17 34h2" />
    </>
  ),
  chalice: (
    <>
      <path d="M13 7h22v9q0 13-11 15-11-2-11-15zM13 10H7v7q0 7 9 8M35 10h6v7q0 7-9 8M24 31v9M16 42h16M20 38h8" />
      <path d="m24 12 3 7-3 5-3-5z" />
    </>
  ),
  helmet: (
    <>
      <path d="m24 5 13 8 2 22-9 8V25l-6 4-6-4v18l-9-8 2-22z" />
      <path d="m11 16 13 8 13-8M24 5v12M15 13l9 5 9-5" />
    </>
  ),
  crown: (
    <>
      <path d="m7 15 9 8 8-16 8 16 9-8-5 23H12zM12 38h24M14 43h20" />
      <path d="m24 22 4 7-4 4-4-4z" />
    </>
  ),
  sword: (
    <>
      <path d="m31 6 9-1-1 9-18 18-7-7zM10 23l15 15M8 39l7-7M5 42l6-1-5-5z" />
      <path d="m18 28 17-17" />
    </>
  ),
  shield: (
    <>
      <path d="m24 5 15 7v13q0 11-15 18Q9 36 9 25V12z" />
      <path d="m24 11 9 5v9q0 7-9 12-9-5-9-12v-9zM24 11v26" />
    </>
  ),
  book: (
    <>
      <path d="M24 13q-9-7-18-4v30q10-3 18 4 8-7 18-4V9q-9-3-18 4zM24 13v30" />
      <path d="m11 17 8 2M11 24l8 2M29 19l8-2M29 26l8-2" />
    </>
  ),
  compass: (
    <>
      <circle cx="24" cy="24" r="17" />
      <path d="M24 3v5M24 40v5M3 24h5M40 24h5m-9-12-7 17-17 7 7-17z" />
      <path d="m19 19 10 10" />
    </>
  ),
};

export const iconNames = {
  flask: "Frasco",
  chalice: "Taça",
  helmet: "Elmo",
  crown: "Coroa",
  sword: "Espada",
  shield: "Escudo",
  book: "Grimório",
  compass: "Bússola",
};

export function Icon({ name = "compass", className = "", title, ...props }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={`rpg-icon ${className}`}
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeLinecap="round"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {drawings[name]}
    </svg>
  );
}
