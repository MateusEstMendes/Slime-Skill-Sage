import React, { useRef, useState } from "react";
import { Divider } from "./Ornaments.jsx";

const tabs = ["Visão geral", "Missões", "Habilidades"];
export function NavigationShowcase() {
  const [active, setActive] = useState(0);
  const refs = useRef([]);
  function keys(event, index) {
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % 3
        : event.key === "ArrowLeft"
          ? (index + 2) % 3
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? 2
              : null;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    refs.current[next]?.focus();
  }
  return (
    <div className="stack">
      <nav className="breadcrumb" aria-label="Caminho atual">
        <ol>
          <li>
            <a href="#top">Sistema</a>
          </li>
          <li>
            <a href="#cards">Projetos</a>
          </li>
          <li aria-current="page">Mapa de estudo</li>
        </ol>
      </nav>
      <nav className="ornate-menu" aria-label="Menu de exemplo">
        <a href="#cards">Ficha</a>
        <span aria-hidden="true">◇</span>
        <a href="#inventory">Inventário</a>
        <span aria-hidden="true">◇</span>
        <a href="#feedback">Avisos</a>
      </nav>
      <Divider compact />
      <div className="rpg-tabs" role="tablist" aria-label="Conteúdo de exemplo">
        {tabs.map((label, index) => (
          <button
            key={label}
            role="tab"
            id={`demo-tab-${index}`}
            aria-controls={`demo-panel-${index}`}
            aria-selected={active === index}
            tabIndex={active === index ? 0 : -1}
            ref={(node) => {
              refs.current[index] = node;
            }}
            onClick={() => setActive(index)}
            onKeyDown={(e) => keys(e, index)}
          >
            {label}
          </button>
        ))}
      </div>
      {tabs.map((label, index) => (
        <div
          className="tab-panel"
          key={label}
          role="tabpanel"
          id={`demo-panel-${index}`}
          aria-labelledby={`demo-tab-${index}`}
          hidden={active !== index}
          tabIndex="0"
        >
          {
            [
              "A próxima missão e o progresso da jornada ficam reunidos aqui.",
              "Missões disponíveis e concluídas têm estados legíveis e ações diretas.",
              "A maestria de cada habilidade é apresentada como um inventário consultável.",
            ][index]
          }
        </div>
      ))}
      <p className="help">
        Nas abas, use as setas, Home e End. Menus e caminhos usam Tab.
      </p>
    </div>
  );
}
