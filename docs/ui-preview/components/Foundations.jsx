import React, { useEffect, useState } from "react";
import { Icon, iconNames } from "./Icons.jsx";
import { Divider } from "./Ornaments.jsx";

const palette = [
  ["Ouro das linhas", "--color-gold"],
  ["Azul-marinho", "--color-bg"],
  ["Superfície", "--color-surface"],
  ["Brilho azul", "--color-blue"],
  ["Texto de destaque", "--color-title"],
  ["Texto corrido", "--color-text"],
  ["Estrelas", "--color-star"],
];
const readColors = () =>
  palette.map(([, token]) =>
    getComputedStyle(document.documentElement)
      .getPropertyValue(token)
      .trim()
      .toUpperCase(),
  );

export function Foundations() {
  const [hex, setHex] = useState(readColors);
  useEffect(() => {
    const observer = new MutationObserver(() =>
      requestAnimationFrame(() => setHex(readColors())),
    );
    observer.observe(document.head, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return (
    <div className="stack-lg">
      <div className="foundations-grid">
        <div>
          <h3>Paleta da referência</h3>
          <ul className="swatch-list">
            {palette.map(([name, token], index) => (
              <li key={token}>
                <span
                  className="swatch"
                  style={{ backgroundColor: `var(${token})` }}
                />
                <span>{name}</span>
                <code>{hex[index]}</code>
              </li>
            ))}
          </ul>
        </div>
        <div className="type-samples">
          <span className="eyebrow">Cinzel · títulos e botões</span>
          <h3>O despertar de uma jornada</h3>
          <span className="eyebrow">Source Sans 3 · texto e controles</span>
          <p>
            Missões são ações concretas. A ficha reúne nível, atributos e
            habilidades. Ornamentos permanecem nas bordas e deixam o conteúdo
            respirar.
          </p>
          <p>
            <strong>INT 18</strong> · Nível 07 · Missão disponível
          </p>
          <p className="help">
            Corpo de 17 px. Ornamentos de uma única cor metálica. Todo texto
            operacional usa a fonte limpa.
          </p>
        </div>
      </div>
      <div>
        <h3>Ícones originais</h3>
        <div className="icon-catalog">
          {Object.entries(iconNames).map(([key, label]) => (
            <div key={key}>
              <Icon name={key} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3>Divisórias de seção</h3>
        <Divider />
        <Divider compact />
        <p className="help">
          Linhas flexíveis e centros fixos: a largura muda sem esticar a
          ornamentação.
        </p>
      </div>
    </div>
  );
}
