import React, { useEffect, useRef, useState } from "react";
import { Button } from "./Controls.jsx";
import { Frame } from "./Ornaments.jsx";

export function FeedbackShowcase() {
  const dialog = useRef();
  const trigger = useRef();
  const [toast, setToast] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const escape = (e) => {
      if (e.key === "Escape") setDismissed(true);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  const close = () => dialog.current?.close();
  return (
    <div className="stack">
      <div className="inline-actions">
        <Button
          model="plaque"
          ref={trigger}
          onClick={() => dialog.current?.showModal()}
        >
          Abrir decreto
        </Button>
        <Button model="double" onClick={() => setToast(true)}>
          Mostrar aviso
        </Button>
        <span
          className={`tooltip-wrap ${dismissed ? "tooltip-wrap--dismissed" : ""}`}
          onMouseEnter={() => setDismissed(false)}
        >
          <button
            type="button"
            className="help-button"
            aria-label="Ajuda sobre experiência"
            aria-describedby={dismissed ? undefined : "xp-tooltip"}
            onFocus={() => setDismissed(false)}
          >
            ?
          </button>
          <span className="rpg-tooltip" role="tooltip" id="xp-tooltip">
            Concluir missões concede XP e registra progresso.
          </span>
        </span>
      </div>
      <div className="inline-actions">
        <span className="rpg-badge">Disponível</span>
        <span className="rpg-badge">Concluída ✓</span>
        <span className="rpg-badge">Bloqueada</span>
      </div>
      {toast && (
        <Frame as="div" className="toast" role="status">
          <div>
            <strong>Missão adicionada.</strong>
            <p>A próxima etapa já está disponível na sua jornada.</p>
          </div>
          <button
            type="button"
            className="text-button"
            onClick={() => setToast(false)}
            aria-label="Fechar aviso"
          >
            Fechar
          </button>
        </Frame>
      )}
      <dialog
        className="rpg-dialog"
        ref={dialog}
        aria-labelledby="decree-title"
        onClose={() => trigger.current?.focus()}
      >
        <Frame as="div">
          <span className="eyebrow">Decreto do Sistema</span>
          <h3 id="decree-title">Concluir esta missão?</h3>
          <p>O avanço ficará registrado no histórico da jornada.</p>
          <div className="inline-actions">
            <Button model="plaque" onClick={close}>
              Confirmar
            </Button>
            <button className="text-button" onClick={close}>
              Cancelar
            </button>
          </div>
        </Frame>
      </dialog>
    </div>
  );
}
