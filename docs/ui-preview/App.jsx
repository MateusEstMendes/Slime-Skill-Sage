import React from "react";
import {
  ButtonsShowcase,
  BarsShowcase,
  SlidersShowcase,
  FormShowcase,
} from "./components/Controls.jsx";
import {
  CardsShowcase,
  InventoryShowcase,
  MedallionsShowcase,
} from "./components/Panels.jsx";
import { Roulette, Dice } from "./components/GameWidgets.jsx";
import { NavigationShowcase } from "./components/Navigation.jsx";
import { FeedbackShowcase } from "./components/Feedback.jsx";
import { Foundations } from "./components/Foundations.jsx";
import { Comparison } from "./components/Comparison.jsx";
import { Divider, Crest } from "./components/Ornaments.jsx";

const sections = [
  [
    "buttons",
    "Botões",
    "Quatro silhuetas da referência, com miolos flexíveis e extremidades fixas.",
    ButtonsShowcase,
  ],
  [
    "cards",
    "Molduras e registros",
    "Retângulos, banners em arco e fichas com ornamentos nas bordas.",
    CardsShowcase,
  ],
  [
    "inventory",
    "Inventário",
    "Slots de habilidades com seleção e detalhes legíveis.",
    InventoryShowcase,
  ],
  [
    "medallions",
    "Medalhões",
    "Anéis, marcas cardeais e espaços para avatar ou insígnia.",
    MedallionsShowcase,
  ],
  [
    "chance",
    "Rituais de sorteio",
    "Círculo mágico geométrico, roleta e dado.",
    null,
  ],
  [
    "bars",
    "Recursos",
    "Trilhos finos, preenchimento sólido e marcadores em losango.",
    BarsShowcase,
  ],
  [
    "sliders",
    "Ajuste de valores",
    "Marcadores em losango e valores sempre visíveis.",
    SlidersShowcase,
  ],
  [
    "forms",
    "Preparar missão",
    "Uma fonte limpa para campos, instruções e escolhas.",
    FormShowcase,
  ],
  [
    "navigation",
    "Navegação",
    "Abas, menu e caminho com divisórias ornamentais.",
    NavigationShowcase,
  ],
  [
    "feedback",
    "Decretos e avisos",
    "Confirmações e estados que deixam o conteúdo no centro.",
    FeedbackShowcase,
  ],
  [
    "foundations",
    "Fundamentos",
    "Paleta, duas fontes, ícones originais e divisórias.",
    Foundations,
  ],
  [
    "comparison",
    "Comparação",
    "A referência integral ao lado das famílias recriadas.",
    Comparison,
  ],
];

export default function App() {
  return (
    <div className="preview-page" id="top">
      <a className="skip-link" href="#buttons">
        Ir para os componentes
      </a>
      <div className="page-atmosphere" aria-hidden="true" />
      <div className="page-stars" aria-hidden="true">
        {Array.from({ length: 38 }, (_, index) => (
          <i
            key={index}
            style={{
              left: `${(index * 47 + 7) % 100}%`,
              top: `${(index * 29 + 3) % 100}%`,
              animationDelay: `calc(var(--duration-star) * ${-(index % 7) / 7})`,
            }}
          />
        ))}
      </div>
      <div className="page-content">
        <header className="page-header">
          <Crest />
          <p className="eyebrow">Slime Sage · Estudo de interface II</p>
          <h1>O Sistema desperta</h1>
          <p className="page-intro">
            Molduras douradas, campos escuros e geometria arcana. Uma nova
            vitrine inspirada no pack Dark Fantasy UI Elements.
          </p>
          <Divider />
          <nav className="chapter-menu" aria-label="Índice do catálogo">
            <a href="#buttons">Componentes</a>
            <span aria-hidden="true">◇</span>
            <a href="#foundations">Fundamentos</a>
            <span aria-hidden="true">◇</span>
            <a href="#comparison">Comparação</a>
          </nav>
        </header>
        <main>
          {sections.map(([id, title, description, Component], index) => (
            <section
              key={id}
              id={id}
              className="catalog-section"
              aria-labelledby={`${id}-title`}
            >
              <div className="section-heading">
                <span className="section-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 id={`${id}-title`}>{title}</h2>
                  <p>{description}</p>
                </div>
              </div>
              <div className="section-content">
                {id === "chance" ? (
                  <div className="two-columns">
                    <Roulette />
                    <Dice />
                  </div>
                ) : (
                  <Component />
                )}
              </div>
              {index !== sections.length - 1 && <Divider />}
            </section>
          ))}
        </main>
        <footer className="page-footer">
          <Crest />
          <p>Slime Sage · Catálogo de componentes para avaliação</p>
          <a href="#top">Voltar ao início</a>
        </footer>
      </div>
    </div>
  );
}
