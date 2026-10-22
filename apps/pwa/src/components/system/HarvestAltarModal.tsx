import React, { useState, useEffect } from "react";
import { Sparkles, Flame, Mic, MicOff, Check, X, ShieldAlert, Award, ArrowRight, Zap } from "lucide-react";
import type { Skill } from "@slime-sage/shared";
import { checkSkillSynergy, generateDeterministicFusion, type SkillSynergyResult, type OfflineFusionProposal } from "@slime-sage/game";
import { gameService } from "../../services/gameService";
import { GildedCorners } from "./GildedCorners";
import { SystemButton } from "./SystemButton";
import { SystemInput, SystemTextarea } from "./SystemFormControls";
import { ManaThreadsSvg, type ManaConnection } from "./ManaThreadsSvg";
import { hapticFeedback } from "../../services/haptics";

export interface HarvestAltarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (fusedSkill: Skill) => void;
}

export const HarvestAltarModal: React.FC<HarvestAltarModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedA, setSelectedA] = useState<Skill | null>(null);
  const [selectedB, setSelectedB] = useState<Skill | null>(null);

  // Synergy detection result
  const [synergy, setSynergy] = useState<SkillSynergyResult | null>(null);
  const [proposal, setProposal] = useState<OfflineFusionProposal | null>(null);

  // Step: 1 = Selection & Synergy, 2 = GS Inquisition (Pills & Voice), 3 = Confirmation
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Inquisition Form state
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fusedName, setFusedName] = useState<string>("");
  const [fusedDesc, setFusedDesc] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      void loadSkills();
      setSelectedA(null);
      setSelectedB(null);
      setSynergy(null);
      setProposal(null);
      setStep(1);
      setAnswers({});
      setFusedName("");
      setFusedDesc("");
    }
  }, [isOpen]);

  const loadSkills = async () => {
    try {
      const all = await gameService.getSkills();
      setSkills(all);
    } catch {
      // Ignore
    }
  };

  // Recompute synergy whenever pair changes
  useEffect(() => {
    if (selectedA && selectedB) {
      const syn = checkSkillSynergy(selectedA, selectedB);
      setSynergy(syn);
      const prop = generateDeterministicFusion(selectedA, selectedB, syn);
      setProposal(prop);
      setFusedName(prop.suggestedName);
      setFusedDesc(prop.suggestedDescription);
      // Pre-select first pill for convenience
      const initialAnswers: Record<string, string> = {};
      prop.questions.forEach((q) => {
        initialAnswers[q.id] = q.options[0] || "";
      });
      setAnswers(initialAnswers);
    } else {
      setSynergy(null);
      setProposal(null);
    }
  }, [selectedA, selectedB]);

  // Speech-to-Text handler
  const handleToggleVoiceInput = () => {
    interface SpeechRecognitionInstance {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      onstart: (() => void) | null;
      onend: (() => void) | null;
      onerror: (() => void) | null;
      onresult: ((event: { results: Array<Array<{ transcript: string }>> }) => void) | null;
      start: () => void;
    }

    interface WindowWithSpeech {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    }

    const win = window as unknown as WindowWithSpeech;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Reconhecimento de voz não suportado neste navegador.");
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "pt-BR";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);

      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          setFusedName((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const handleSelectPill = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
    hapticFeedback.tap();
  };

  const handleExecuteFusion = async () => {
    if (!selectedA || !selectedB || !synergy || !proposal) return;

    try {
      setIsSubmitting(true);
      const finalSkill = await gameService.fuseSkills({
        skillAId: selectedA.id,
        skillBId: selectedB.id,
        newName: fusedName.trim() || proposal.suggestedName,
        newDescription: fusedDesc.trim() || proposal.suggestedDescription,
        targetTier: synergy.targetTier,
        domain: synergy.suggestedArchetype,
      });

      onSuccess?.(finalSkill);
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao consagrar fusão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const connections: ManaConnection[] =
    selectedA && selectedB && synergy
      ? [
          {
            id: "conn-altar",
            fromX: 80,
            fromY: 100,
            toX: 240,
            toY: 100,
            score: synergy.synergyScore,
            affinity: synergy.affinityType,
          },
        ]
      : [];

  return (
    <div
      data-testid="harvest-altar-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/90 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-[#040814] border-2 border-[#dfa86c] rounded-none shadow-[0_0_60px_rgba(223,168,108,0.4)] p-5 md:p-7 overflow-hidden my-8">
        <GildedCorners size="md" color="#dfa86c" diamondColor="#fde047" glow={true} withRunes={true} />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-[#c5b08f] hover:text-[#fde047] p-1.5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1 relative z-10 mb-4">
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#fde047] uppercase tracking-widest">
            <Flame className="w-4 h-4 text-[#dfa86c]" />
            <span>FESTIVAL DA COLHEITA // RITO DE TRANSMUTAÇÃO</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-fantasy text-[#f8ecd5] tracking-wider uppercase">
            ALTAR DE SACRIFÍCIO E FUSÃO
          </h2>
          <p className="text-xs text-[#c5b08f] font-mono">
            Sacrifique duas habilidades afins para forjar uma manifestação superior permanente.
          </p>
        </div>

        {/* STEP 1: SELECT SKILLS & CHECK DETERMINISTIC SYNERGY */}
        {step === 1 && (
          <div className="space-y-4 relative z-10">
            {/* Summoning Circles (Slots) */}
            <div className="relative p-4 bg-[#060e20]/90 border border-[#dfa86c]/50 flex flex-col md:flex-row items-center justify-around gap-4 overflow-hidden">
              <ManaThreadsSvg connections={connections} width="100%" height={160} />

              {/* Slot A */}
              <div
                className={`relative z-10 w-full md:w-5/12 p-3 border rounded-none flex flex-col items-center justify-center text-center transition-all min-h-[110px] ${
                  selectedA
                    ? "bg-[#261a08]/90 border-[#fde047] text-[#f8ecd5] shadow-[0_0_15px_rgba(253,224,71,0.2)]"
                    : "bg-[#040814]/70 border-dashed border-[#966422]/70 text-[#c5b08f]"
                }`}
              >
                <div className="text-[10px] font-fantasy uppercase tracking-wider text-[#dfa86c] mb-1">
                  [Círculo Alfa]
                </div>
                {selectedA ? (
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-[#fde047]">{selectedA.name}</div>
                    <div className="text-[10px] font-mono text-[#c5b08f] uppercase">
                      Grau {selectedA.tier} · {selectedA.mastery} pts
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedA(null)}
                      className="text-[10px] text-red-400 hover:underline pt-1"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-mono">Toque em uma habilidade abaixo</span>
                )}
              </div>

              {/* Center Rune Sigil */}
              <div className="relative z-10 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-[#120d06] border border-[#dfa86c] flex items-center justify-center text-[#fde047] shadow-[0_0_12px_#dfa86c]">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>

              {/* Slot B */}
              <div
                className={`relative z-10 w-full md:w-5/12 p-3 border rounded-none flex flex-col items-center justify-center text-center transition-all min-h-[110px] ${
                  selectedB
                    ? "bg-[#261a08]/90 border-[#fde047] text-[#f8ecd5] shadow-[0_0_15px_rgba(253,224,71,0.2)]"
                    : "bg-[#040814]/70 border-dashed border-[#966422]/70 text-[#c5b08f]"
                }`}
              >
                <div className="text-[10px] font-fantasy uppercase tracking-wider text-[#dfa86c] mb-1">
                  [Círculo Beta]
                </div>
                {selectedB ? (
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-[#fde047]">{selectedB.name}</div>
                    <div className="text-[10px] font-mono text-[#c5b08f] uppercase">
                      Grau {selectedB.tier} · {selectedB.mastery} pts
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedB(null)}
                      className="text-[10px] text-red-400 hover:underline pt-1"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-mono">Toque em uma segunda habilidade</span>
                )}
              </div>
            </div>

            {/* Synergy Result Card */}
            {synergy && (
              <div
                className={`p-3.5 border rounded-none font-mono text-xs space-y-1.5 ${
                  synergy.isCompatible
                    ? "bg-[#261a08]/90 border-[#fde047] text-[#f8ecd5]"
                    : "bg-red-950/40 border-red-500/50 text-red-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-fantasy font-bold uppercase tracking-wider text-[#fde047]">
                    Sinergia Arcana: {synergy.synergyScore}% ({synergy.affinityType})
                  </span>
                  <span className="text-purple-300 font-bold uppercase">
                    Destino: Grau {synergy.targetTier}
                  </span>
                </div>
                <p className="font-sans text-[11px] text-[#c5b08f]">{synergy.reason}</p>
              </div>
            )}

            {/* Hunter Skills Picker Grid */}
            <div className="space-y-2">
              <label className="text-xs font-fantasy uppercase text-[#dfa86c] tracking-wider">
                Selecione as Habilidades do Inventário:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {skills.map((s) => {
                  const isSelectedA = selectedA?.id === s.id;
                  const isSelectedB = selectedB?.id === s.id;
                  const isSelected = isSelectedA || isSelectedB;

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        if (isSelectedA) setSelectedA(null);
                        else if (isSelectedB) setSelectedB(null);
                        else if (!selectedA) setSelectedA(s);
                        else if (!selectedB) setSelectedB(s);
                        else setSelectedB(s);
                      }}
                      className={`p-2.5 border rounded-none text-left transition-all flex items-center justify-between text-xs font-mono ${
                        isSelected
                          ? "bg-[#261a08] border-[#fde047] text-[#fde047]"
                          : "bg-[#060e20]/80 border-[#966422]/50 text-[#c5b08f] hover:border-[#dfa86c]"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-[#f8ecd5]">{s.name}</div>
                        <div className="text-[10px] text-[#a39171] uppercase">
                          {s.area_id} · Grau {s.tier} · {s.mastery} pts
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#fde047] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Next Button */}
            <div className="pt-3 border-t border-[#966422]/40 flex justify-end">
              <SystemButton
                variant="primary"
                size="sm"
                onClick={() => setStep(2)}
                disabled={!selectedA || !selectedB || !synergy?.isCompatible}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Prosseguir para Inquisição da G.S
              </SystemButton>
            </div>
          </div>
        )}

        {/* STEP 2: INQUISITION WITH 1-TOUCH CHIP PILLS AND SPEECH-TO-TEXT */}
        {step === 2 && proposal && (
          <div className="space-y-4 relative z-10 font-mono text-xs">
            <div className="p-3 bg-[#120d06]/90 border border-[#dfa86c]/60 space-y-1">
              <div className="text-[11px] font-fantasy uppercase text-[#fde047] tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Interrogação Canônica da Grande Sábio</span>
              </div>
              <p className="font-sans text-[11px] text-[#c5b08f]">
                Responda com as Pílulas Rápidas de 1 toque ou personalize por voz para orientar a transmutação.
              </p>
            </div>

            {/* Quick-choice Pills */}
            <div className="space-y-3">
              {proposal.questions.map((q) => (
                <div key={q.id} className="space-y-1.5">
                  <div className="text-[#f8ecd5] font-fantasy font-bold uppercase">{q.question}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {q.options.map((opt) => {
                      const isSelected = answers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleSelectPill(q.id, opt)}
                          className={`px-3 py-1.5 border rounded-none text-xs transition-all ${
                            isSelected
                              ? "bg-[#261a08] border-[#fde047] text-[#fde047] shadow-[0_0_10px_rgba(253,224,71,0.25)]"
                              : "bg-[#060e20] border-[#966422]/50 text-[#c5b08f] hover:border-[#dfa86c]"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Skill Name with Voice Input Button */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-fantasy uppercase text-[#dfa86c] flex items-center justify-between">
                <span>Nome Consagrado da Nova Habilidade:</span>
                <span className="text-[10px] text-[#a39171] font-mono">1 toque no microfone para ditar</span>
              </label>

              <div className="flex gap-2">
                <SystemInput
                  value={fusedName}
                  onChange={(e) => setFusedName(e.target.value)}
                  placeholder="Nome épico sugerido pela G.S..."
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={handleToggleVoiceInput}
                  title="Digitação por voz (Speech-to-Text)"
                  className={`px-3 py-2 border rounded-none transition-colors shrink-0 flex items-center justify-center ${
                    isRecording
                      ? "bg-red-950 border-red-500 text-red-200 animate-pulse"
                      : "bg-[#060e20] border-[#966422] text-[#dfa86c] hover:border-[#fde047]"
                  }`}
                >
                  {isRecording ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Description / Lore */}
            <div className="space-y-1">
              <label className="text-xs font-fantasy uppercase text-[#dfa86c]">Lore / Diretriz Mágica:</label>
              <SystemTextarea
                rows={2}
                value={fusedDesc}
                onChange={(e) => setFusedDesc(e.target.value)}
                placeholder="Descrição da fusão..."
              />
            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t border-[#966422]/40 flex justify-between">
              <SystemButton variant="ghost" size="sm" onClick={() => setStep(1)}>
                Voltar
              </SystemButton>
              <SystemButton
                variant="primary"
                size="sm"
                onClick={() => setStep(3)}
                disabled={!fusedName.trim()}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Avançar para o Desafio de Provação
              </SystemButton>
            </div>
          </div>
        )}

        {/* STEP 3: CHALLENGE & FINAL SACRIFICE SEAL */}
        {step === 3 && proposal && selectedA && selectedB && (
          <div className="space-y-4 relative z-10 font-mono text-xs">
            <div className="p-4 bg-[#261a08]/90 border border-[#fde047] space-y-2 text-[#f8ecd5]">
              <div className="flex items-center gap-2 font-bold font-fantasy text-sm uppercase text-[#fde047]">
                <Award className="w-5 h-5 text-[#fde047]" />
                <span>Desafio Autodeclarado de Transmutação</span>
              </div>
              <p className="font-sans text-xs text-[#c5b08f]">{proposal.challengeDescription}</p>

              <div className="pt-2 border-t border-[#966422]/60 flex items-center gap-2 text-xs text-[#fde047]">
                <Zap className="w-4 h-4 text-[#dfa86c]" />
                <span>Âncora de Telemetria: {proposal.focusAnchorMinutes} minutos no Modo Foco</span>
              </div>
            </div>

            <div className="p-3 bg-red-950/40 border border-red-500/50 text-red-200 space-y-1 font-sans text-xs">
              <div className="flex items-center gap-1.5 font-bold font-fantasy text-red-300 uppercase">
                <ShieldAlert className="w-4 h-4" />
                <span>Aviso Sagrado de Sacrifício</span>
              </div>
              <p>
                Ao selar este rito, as habilidades <strong>{selectedA.name}</strong> e{" "}
                <strong>{selectedB.name}</strong> serão permanentemente transmutadas e substituídas pela nova
                habilidade <strong>{fusedName}</strong> de grau{" "}
                <span className="uppercase text-[#fde047]">{synergy?.targetTier}</span>.
              </p>
            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t border-[#966422]/40 flex justify-between">
              <SystemButton variant="ghost" size="sm" onClick={() => setStep(2)}>
                Ajustar Respostas
              </SystemButton>
              <SystemButton
                variant="primary"
                size="sm"
                onClick={handleExecuteFusion}
                disabled={isSubmitting}
                icon={<Flame className="w-4 h-4 text-[#fde047]" />}
              >
                {isSubmitting ? "Consagrando Fusão..." : "Consagrar Fusão no Altar"}
              </SystemButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
