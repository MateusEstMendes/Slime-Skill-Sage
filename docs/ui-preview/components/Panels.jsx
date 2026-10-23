import React, { useState } from "react";
import { Button, ProgressBar } from "./Controls.jsx";
import { Frame, FrameDecor, Medallion } from "./Ornaments.jsx";
import { Icon } from "./Icons.jsx";
import { BannerOutline } from "./BorderGeometry.jsx";

export function CharacterSheet() {
  return (
    <Frame className="character-sheet">
      <div className="sheet-identity">
        <Medallion label="Insígnia de Ari">
          <span className="avatar-initial">A</span>
        </Medallion>
        <div>
          <span className="eyebrow">Ficha do Escolhido</span>
          <h3>Ari, a Cartógrafa</h3>
          <p>Slime · Analista metódica IV</p>
          <span className="rpg-badge">Nível 07</span>
        </div>
      </div>
      <dl className="attributes">
        {[
          ["INT", 18],
          ["FOR", 9],
          ["DIS", 14],
          ["CRI", 12],
          ["SOC", 11],
        ].map(([name, value]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <ProgressBar label="Experiência" value={640} max={900} />
    </Frame>
  );
}

export function ArchBanner({ children }) {
  return (
    <div className="arch-banner">
      <BannerOutline />
      <div className="arch-banner__content">{children}</div>
    </div>
  );
}

export function CardsShowcase() {
  const [equipped, setEquipped] = useState(true);
  return (
    <div className="stack-lg">
      <div className="card-composition">
        <Frame className="record-card">
          <span className="eyebrow">Moldura retangular</span>
          <h3>Registro da jornada</h3>
          <p>
            O mapa de estudo está pronto. A próxima missão transforma as
            referências em um primeiro esboço.
          </p>
          <Button model="double" size="small">
            Abrir registro
          </Button>
        </Frame>
        <ArchBanner>
          <Icon name="crown" />
          <span className="eyebrow">Banner em arco</span>
          <h3>Primeiro Despertar</h3>
          <p>Uma nova etapa da jornada.</p>
        </ArchBanner>
      </div>
      <div className="two-columns">
        <Frame className="item-card">
          <div className="card-title">
            <Medallion>
              <Icon name="flask" />
            </Medallion>
            <div>
              <span className="eyebrow">Item · ferramenta</span>
              <h3>Essência de clareza</h3>
            </div>
          </div>
          <p>Notas e referências organizadas para a próxima missão.</p>
          <Button
            model="pill"
            size="small"
            aria-pressed={equipped}
            onClick={() => setEquipped(!equipped)}
          >
            {equipped ? "Equipado" : "Equipar item"}
          </Button>
        </Frame>
        <Frame className="mission-card">
          <span className="eyebrow">Missão 02 de 05</span>
          <h3>Mapear três referências</h3>
          <p>
            Registre o que cada referência resolve e o que pode ser descartado.
          </p>
          <div className="mission-meta">
            <span className="rpg-badge">Disponível</span>
            <strong>+40 XP</strong>
          </div>
          <Button model="cut" size="small">
            Consultar missão
          </Button>
        </Frame>
      </div>
      <CharacterSheet />
    </div>
  );
}

const skills = [
  {
    name: "Análise de dados",
    icon: "compass",
    grade: "Especial",
    description:
      "Encontra padrões e transforma observações em decisões claras.",
  },
  {
    name: "Escrita clara",
    icon: "book",
    grade: "Comum",
    description:
      "Organiza ideias para que sejam compreendidas na primeira leitura.",
  },
  {
    name: "Planejamento",
    icon: "shield",
    grade: "Extra",
    description: "Define caminhos, dependências e próximos passos executáveis.",
  },
  {
    name: "Pesquisa",
    icon: "flask",
    grade: "Comum",
    description: "Reúne evidências antes de escolher uma direção.",
  },
];

export function InventoryShowcase() {
  const [selected, setSelected] = useState(0);
  return (
    <div className="inventory-layout">
      <div className="inventory-grid" aria-label="Inventário de habilidades">
        {Array.from({ length: 8 }, (_, index) => (
          <button
            key={index}
            className="inventory-slot"
            disabled={index === 7}
            aria-pressed={selected === index}
            aria-label={
              index === 7
                ? "Slot bloqueado"
                : skills[index]
                  ? `${skills[index].name}, grau ${skills[index].grade}`
                  : `Slot vazio ${index + 1}`
            }
            onClick={() => setSelected(index)}
          >
            <FrameDecor variant="slot" />
            {skills[index] ? (
              <Icon name={skills[index].icon} />
            ) : (
              <span className="empty-slot" aria-hidden="true">
                ◇
              </span>
            )}
            <span>
              {index === 7 ? "Bloqueado" : (skills[index]?.name ?? "Vazio")}
            </span>
          </button>
        ))}
      </div>
      <Frame className="inventory-detail">
        <span className="eyebrow">Slot {selected + 1}</span>
        <h3>{skills[selected]?.name ?? "Slot vazio"}</h3>
        <p>
          {skills[selected]?.description ??
            "Este espaço ainda não contém uma habilidade."}
        </p>
        {skills[selected] && (
          <span className="rpg-badge">{skills[selected].grade}</span>
        )}
      </Frame>
    </div>
  );
}

export function MedallionsShowcase() {
  return (
    <div className="medallion-gallery">
      <div>
        <Medallion label="Moldura de avatar de Ari">
          <span className="avatar-initial">A</span>
        </Medallion>
        <p>Avatar</p>
      </div>
      <div>
        <Medallion label="Insígnia de classe">
          <Icon name="helmet" />
        </Medallion>
        <p>Insígnia de classe</p>
      </div>
      <div>
        <Medallion label="Conquista">
          <Icon name="chalice" />
        </Medallion>
        <p>Conquista</p>
      </div>
    </div>
  );
}
