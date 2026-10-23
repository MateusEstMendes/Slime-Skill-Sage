import React, { useState } from "react";
import { Button, ProgressBar } from "./Controls.jsx";
import {
  Frame,
  FrameDecor,
  Medallion,
  MagicCircle,
  Divider,
} from "./Ornaments.jsx";
import { Icon, iconNames } from "./Icons.jsx";
import { ArchBanner } from "./Panels.jsx";

const families = [
  ["buttons", "Quatro botões"],
  ["frames", "Molduras e slots"],
  ["circles", "Medalhões e círculos"],
  ["bars", "Barras e divisórias"],
  ["icons", "Ícones"],
];

export function Comparison() {
  const [family, setFamily] = useState("buttons");
  return (
    <div className="stack">
      <p>
        A imagem integral aparece somente nesta seção de comparação. As
        recriações ao lado são SVG e CSS originais.
      </p>
      <div
        className="comparison-choices"
        role="group"
        aria-label="Família para comparação"
      >
        {families.map(([key, label]) => (
          <button
            key={key}
            className="text-button"
            aria-pressed={family === key}
            onClick={() => setFamily(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="comparison-layout">
        <figure className="reference-figure">
          <a href="/reference-design.png" target="_blank" rel="noreferrer">
            <img
              src="/reference-design.png"
              width="970"
              height="560"
              loading="lazy"
              decoding="async"
              alt="Referência integral Dark Fantasy UI Elements: quatro botões, ícones dourados, molduras, círculos mágicos e barras sobre azul-marinho. Contém a marca d’água original do banco de imagens."
            />
          </a>
          <figcaption>
            Referência original · clique para ampliar a imagem integral.
          </figcaption>
        </figure>
        <div className="comparison-recreation">
          <span className="eyebrow">
            Recriação · {families.find(([key]) => key === family)?.[1]}
          </span>
          {family === "buttons" && (
            <div className="comparison-buttons">
              {[
                ["plaque", "Placa com pontas"],
                ["pill", "Pílula"],
                ["double", "Linha dupla"],
                ["cut", "Retangular recortado"],
              ].map(([model, label]) => (
                <Button key={model} model={model}>
                  {label}
                </Button>
              ))}
            </div>
          )}
          {family === "frames" && (
            <div className="comparison-frames">
              <Frame>
                <h3>Moldura retangular</h3>
                <p>Cantos fixos, campo escuro.</p>
              </Frame>
              <ArchBanner>
                <Icon name="crown" />
                <h3>Banner em arco</h3>
              </ArchBanner>
              <div className="comparison-slot">
                <FrameDecor variant="slot" />
                <Icon name="flask" />
              </div>
            </div>
          )}
          {family === "circles" && (
            <div className="comparison-circles">
              <Medallion>
                <Icon name="helmet" />
              </Medallion>
              <MagicCircle />
            </div>
          )}
          {family === "bars" && (
            <div className="stack-lg">
              <ProgressBar label="XP" value={65} />
              <Divider />
              <Divider compact />
            </div>
          )}
          {family === "icons" && (
            <div className="icon-catalog">
              {Object.entries(iconNames).map(([key, name]) => (
                <div key={key}>
                  <Icon name={key} />
                  <span>{name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
