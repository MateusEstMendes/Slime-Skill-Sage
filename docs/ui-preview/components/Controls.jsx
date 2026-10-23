import React, { useState } from "react";
import { ButtonOutline } from "./BorderGeometry.jsx";

const buttonLabels = {
  plaque: "Placa ornamental",
  pill: "Pílula",
  double: "Linha dupla",
  cut: "Placa recortada",
};

export function Button({
  model = "plaque",
  size = "medium",
  children,
  className = "",
  demoState,
  ...props
}) {
  return (
    <button
      className={`rpg-button rpg-button--${model} rpg-button--${size} ${className}`}
      data-demo-state={demoState}
      {...props}
    >
      <ButtonOutline model={model} />
      <span className="rpg-button__label">{children}</span>
    </button>
  );
}

export function ButtonsShowcase() {
  const [model, setModel] = useState("plaque");
  return (
    <div className="stack-lg">
      <div className="button-models">
        {Object.entries(buttonLabels).map(([key, title]) => (
          <div className="button-model" key={key}>
            <h3>{title}</h3>
            <div className="button-sizes">
              <Button model={key} size="small">
                Pequeno
              </Button>
              <Button model={key}>Médio</Button>
              <Button model={key} size="large">
                Grande
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="state-examples">
        <label className="field-label" htmlFor="button-model">
          Modelo para conferir os estados
        </label>
        <select
          id="button-model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          {Object.entries(buttonLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <div className="state-strip">
          {["Normal", "Hover", "Foco", "Ativo", "Desabilitado"].map(
            (label, index) => (
              <div key={label}>
                <Button
                  model={model}
                  demoState={
                    ["normal", "hover", "focus", "active", "disabled"][index]
                  }
                  disabled={index === 4}
                  aria-pressed={index === 3 ? true : undefined}
                >
                  {label}
                </Button>
                <small>{label}</small>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

export function ProgressBar({ label, value, max = 100, animated = false }) {
  return (
    <div className={`resource-bar ${animated ? "resource-bar--animated" : ""}`}>
      <div className="resource-bar__heading">
        <strong>{label}</strong>
        <span>
          {value} / {max}
        </span>
      </div>
      <div
        className="diamond-track"
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin="0"
        aria-valuemax={max}
      >
        <div
          className="diamond-track__fill"
          style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        />
        <span className="diamond-track__marks" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} />
          ))}
        </span>
      </div>
    </div>
  );
}

export function BarsShowcase() {
  const [xp, setXp] = useState(62);
  return (
    <div className="stack">
      <ProgressBar label="HP · Vitalidade" value={84} />
      <ProgressBar label="XP · Próximo nível" value={xp} animated />
      <ProgressBar label="Mana · Reserva" value={38} max={60} />
      <div className="inline-actions">
        <Button
          size="small"
          onClick={() => setXp(Math.min(xp + 12, 100))}
          disabled={xp === 100}
        >
          Ganhar 12 XP
        </Button>
        <button className="text-button" onClick={() => setXp(26)}>
          Reiniciar XP
        </button>
      </div>
      <p className="help">
        Apenas a barra de XP anima. HP e mana são exemplos visuais para esta
        vitrine.
      </p>
    </div>
  );
}

function RangeInput({
  id,
  value,
  onChange,
  label,
  disabled = false,
  ...props
}) {
  return (
    <input
      id={id}
      type="range"
      min="0"
      max="100"
      value={value}
      onChange={onChange}
      aria-label={label}
      disabled={disabled}
      {...props}
    />
  );
}

export function SlidersShowcase() {
  const [value, setValue] = useState(45);
  const [range, setRange] = useState([20, 75]);
  return (
    <div className="two-columns">
      <div className="field">
        <label htmlFor="single-range">
          Intensidade da missão <strong>{value}%</strong>
        </label>
        <div className="range-control">
          <div className="range-track">
            <span style={{ width: `${value}%` }} />
          </div>
          <RangeInput
            id="single-range"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
        </div>
        <p className="help">Arraste o losango ou use as setas.</p>
      </div>
      <fieldset className="field">
        <legend>
          Faixa de XP{" "}
          <strong>
            {range[0]}–{range[1]} XP
          </strong>
        </legend>
        <div className="range-control range-control--dual">
          <div className="range-track">
            <span
              style={{ left: `${range[0]}%`, width: `${range[1] - range[0]}%` }}
            />
          </div>
          <RangeInput
            id="range-min"
            label="XP mínimo"
            value={range[0]}
            onChange={(e) =>
              setRange([
                Math.min(Number(e.target.value), range[1] - 1),
                range[1],
              ])
            }
            aria-valuetext={`${range[0]} XP, mínimo`}
          />
          <RangeInput
            id="range-max"
            label="XP máximo"
            value={range[1]}
            onChange={(e) =>
              setRange([
                range[0],
                Math.max(Number(e.target.value), range[0] + 1),
              ])
            }
            aria-valuetext={`${range[1]} XP, máximo`}
          />
        </div>
        <div className="range-labels">
          <label htmlFor="range-min">Mínimo: {range[0]}</label>
          <label htmlFor="range-max">Máximo: {range[1]}</label>
        </div>
        <p className="help">Cada losango recebe foco separadamente pelo Tab.</p>
      </fieldset>
      <div className="field">
        <label htmlFor="disabled-range">Meta bloqueada</label>
        <div className="range-control is-disabled">
          <div className="range-track">
            <span style={{ width: "40%" }} />
          </div>
          <RangeInput id="disabled-range" value={40} disabled />
        </div>
      </div>
    </div>
  );
}

export function FormShowcase() {
  const [notice, setNotice] = useState("");
  return (
    <form
      className="form-grid"
      onSubmit={(e) => {
        e.preventDefault();
        setNotice("Missão preparada para sua aprovação.");
      }}
    >
      <div className="field">
        <label htmlFor="quest-title">Nome da missão</label>
        <input
          id="quest-title"
          name="title"
          placeholder="Ex.: concluir o mapa de estudo"
          required
        />
        <small className="help">
          Descreva uma ação que possa ser concluída.
        </small>
      </div>
      <div className="field">
        <label htmlFor="quest-area">Atributo associado</label>
        <select id="quest-area" defaultValue="int">
          <option value="int">Inteligência</option>
          <option value="dis">Disciplina</option>
          <option value="cri">Criatividade</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="quest-locked">Campo desabilitado</label>
        <input
          id="quest-locked"
          value="Desbloqueado no nível 10"
          disabled
          readOnly
        />
      </div>
      <label className="choice">
        <input type="checkbox" defaultChecked />
        <span>Registrar no histórico da jornada</span>
      </label>
      <label className="choice toggle">
        <input type="checkbox" role="switch" defaultChecked />
        <span className="toggle-track" aria-hidden="true" />
        <span>Avisar quando estiver disponível</span>
      </label>
      <fieldset className="radio-group">
        <legend>Ritmo da missão</legend>
        <label className="choice">
          <input type="radio" name="pace" defaultChecked />
          Constante
        </label>
        <label className="choice">
          <input type="radio" name="pace" />
          Intenso
        </label>
      </fieldset>
      <fieldset className="disabled-controls" disabled>
        <legend>Exemplos desabilitados</legend>
        <div className="field">
          <label htmlFor="disabled-select">Destino bloqueado</label>
          <select id="disabled-select" defaultValue="locked">
            <option value="locked">Disponível no próximo nível</option>
          </select>
        </div>
        <label className="choice">
          <input type="checkbox" defaultChecked />
          Registro indisponível
        </label>
        <label className="choice toggle">
          <input type="checkbox" role="switch" defaultChecked />
          <span className="toggle-track" aria-hidden="true" />
          <span>Lembrete indisponível</span>
        </label>
        <label className="choice">
          <input type="radio" name="disabled-pace" defaultChecked />
          Ritmo bloqueado
        </label>
      </fieldset>
      <div className="inline-actions form-actions">
        <Button model="cut" type="submit">
          Preparar missão
        </Button>
        <p role="status">{notice}</p>
      </div>
    </form>
  );
}
