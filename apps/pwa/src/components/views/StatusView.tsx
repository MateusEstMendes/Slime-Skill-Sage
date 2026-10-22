import React, { useState, useEffect, useCallback } from "react";
import { SystemPanel } from "../system/SystemPanel";
import { SystemBadge } from "../system/SystemBadge";
import { SystemModal } from "../system/SystemModal";
import { GildedCorners } from "../system/GildedCorners";
import {
  BASE_AREAS,
  type Profile,
  type AreaCode,
  type XpEvent,
  type Class,
  type ClassChallenge,
} from "@slime-sage/shared";
import {
  getAttributeRank,
  type AttributesMap,
  createEmptyAttributes,
  calculateLevelFromTotalXp,
  calculateDynamicAttributeCeiling,
  type LedgerAuditResult,
  checkClassEligibility,
  generateDeterministicChallenge,
  CLASS_TIER_CONFIG,
} from "@slime-sage/game";
import { gameService } from "../../services/gameService";
import { classRepository } from "../../services/classRepository";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Crown,
  Award,
  Sparkles,
  Check,
} from "lucide-react";
import { SystemButton } from "../system/SystemButton";
import { AttributesRadarChart } from "../status/AttributesRadarChart";

export interface StatusViewProps {
  isActive?: boolean;
}

export const StatusView: React.FC<StatusViewProps> = ({ isActive }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [attributes, setAttributes] = useState<AttributesMap>(createEmptyAttributes());
  const [auditResult, setAuditResult] = useState<LedgerAuditResult | null>(null);
  const [recentEvents, setRecentEvents] = useState<XpEvent[]>([]);
  const [unlockedClasses, setUnlockedClasses] = useState<Class[]>([]);
  const [highestClasses, setHighestClasses] = useState<Record<AreaCode, Class | null>>({
    INT: null,
    FOR: null,
    DIS: null,
    CRI: null,
    SOC: null,
  });
  const [activeChallenge, setActiveChallenge] = useState<ClassChallenge | null>(null);
  const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);
  const [isProcessingChallenge, setIsProcessingChallenge] = useState(false);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const isMountedRef = React.useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadStatusData = useCallback(async () => {
    try {
      setLoading(true);
      const [prof, attrs, audit, events, allUnlocked, activeCh] = await Promise.all([
        gameService.getProfile(),
        gameService.getAttributes(),
        gameService.auditLedger(),
        gameService.getLedgerEvents(10),
        classRepository.getAllUnlockedClasses(),
        classRepository.getActiveChallenge(),
      ]);

      const highestByArea: Record<AreaCode, Class | null> = {
        INT: null,
        FOR: null,
        DIS: null,
        CRI: null,
        SOC: null,
      };
      for (const area of BASE_AREAS) {
        highestByArea[area.code] = await classRepository.getHighestUnlockedClass(area.code);
      }

      if (isMountedRef.current) {
        setProfile(prof);
        setAttributes(attrs);
        setAuditResult(audit);
        setRecentEvents(events);
        setUnlockedClasses(allUnlocked);
        setHighestClasses(highestByArea);
        setActiveChallenge(activeCh);
      }
    } catch {
      // Ignora erro
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadStatusData();
    const unsubGame = gameService.subscribeToGameEvents(() => {
      void loadStatusData();
    });
    const unsubClass = classRepository.subscribe(() => {
      void loadStatusData();
    });
    return () => {
      unsubGame();
      unsubClass();
    };
  }, [loadStatusData]);

  useEffect(() => {
    if (isActive) {
      void loadStatusData();
    }
  }, [isActive, loadStatusData]);

  /**
   * Runs a challenge action with a shared processing flag and user-visible error handling.
   * Prevents unhandled promise rejections (e.g. invalid status transitions).
   */
  const runChallengeAction = async (action: () => Promise<void>) => {
    try {
      setIsProcessingChallenge(true);
      setChallengeError(null);
      await action();
      await loadStatusData();
    } catch (err) {
      console.error("Erro na provação de classe:", err);
      setChallengeError(
        err instanceof Error ? err.message : "Falha desconhecida ao processar a provação."
      );
    } finally {
      setIsProcessingChallenge(false);
    }
  };

  const handleRequestChallenge = async (areaId: AreaCode) => {
    const currentClass = highestClasses[areaId];
    const currentTier = currentClass?.tier ?? 1;
    const masteryVal = attributes[areaId] ?? 0;
    const eligibility = checkClassEligibility(areaId, currentTier, masteryVal);

    if (!eligibility.isEligible || !eligibility.nextTier) return;
    const nextTier = eligibility.nextTier;

    await runChallengeAction(async () => {
      const template = generateDeterministicChallenge(areaId, nextTier);
      const challenge = await classRepository.proposeChallenge({
        areaId,
        targetTier: nextTier,
        name_class: template.name_class,
        challenge_title: template.challenge_title,
        challenge_description: template.challenge_description,
      });
      await classRepository.acceptChallenge(challenge.id);
    });
  };

  const handleAcceptChallenge = (challengeId: string) =>
    runChallengeAction(async () => {
      await classRepository.acceptChallenge(challengeId);
    });

  const handleCompleteChallenge = (challengeId: string) =>
    runChallengeAction(async () => {
      await gameService.completeClassChallenge(challengeId, { autoEquipTitle: true });
    });

  const handleAbandonChallenge = (challengeId: string) =>
    runChallengeAction(async () => {
      await classRepository.abandonChallenge(challengeId);
    });

  const handleEquipTitle = async (title: string) => {
    try {
      await classRepository.equipTitle(title);
      setIsTitleModalOpen(false);
      await loadStatusData();
    } catch (err) {
      console.error("Erro ao equipar título:", err);
    }
  };

  const levelProgress = calculateLevelFromTotalXp(profile?.total_xp ?? 0);
  const totalAttributeScore = Object.values(attributes).reduce((acc, val) => acc + val, 0);
  const overallRank = getAttributeRank(totalAttributeScore);
  const maxStatValue = Math.max(0, ...Object.values(attributes).map((v) => Number(v) || 0));
  const dynamicCeiling = calculateDynamicAttributeCeiling(maxStatValue);

  return (
    <div className="space-y-6">
      {challengeError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 border border-red-500/50 bg-red-950/40 px-4 py-3 text-xs font-mono text-red-200"
        >
          <span>[SISTEMA // ERRO] {challengeError}</span>
          <button
            type="button"
            onClick={() => setChallengeError(null)}
            className="text-red-300 hover:text-red-100 uppercase tracking-wider"
            aria-label="Fechar aviso de erro"
          >
            Fechar
          </button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-fantasy text-[#f8ecd5] tracking-wider uppercase flex items-center gap-2">
            <Activity className="w-6 h-6 text-[#dfa86c]" />
            <span>PAINEL DE ATRIBUTOS // REGISTRO DO ESCOLHIDO</span>
          </h2>
          <p className="text-xs md:text-sm text-[#c5b08f] font-mono mt-0.5">
            Sincronização em tempo real com o Motor Puro e Ledger Imutável. Horizonte Ativo: {dynamicCeiling.toLocaleString()} pts.
          </p>
        </div>

        <SystemButton
          variant="ghost"
          size="sm"
          onClick={loadStatusData}
          disabled={loading}
          icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
        >
          Atualizar
        </SystemButton>
      </div>

      {/* Chosen Profile Header */}
      <SystemPanel
        title={`Escolhido: ${profile?.name ?? "Rimuru Tempest"}`}
        subtitle={`Raça: ${profile?.race ?? "Slime"} · Ameaça: ${profile?.rank_threat ?? "Classe Menor"} · ${overallRank.label} · Título: ${profile?.title ?? "Aspirante a Desperto"}`}
        glow
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2 text-center font-mono">
          <div className="relative p-3 bg-[#040814]/85 border border-[#c89b55]/45 overflow-hidden shadow-[inset_0_0_10px_rgba(223,168,108,0.04)]">
            <GildedCorners size="xs" withInnerFrame={false} />
            <div className="relative z-10 text-[10px] font-fantasy tracking-widest text-[#c5b08f] uppercase">Nível</div>
            <div className="relative z-10 text-xl font-bold font-fantasy text-[#fde047]">{levelProgress.level}</div>
          </div>
          <div className="relative p-3 bg-[#040814]/85 border border-[#c89b55]/45 overflow-hidden shadow-[inset_0_0_10px_rgba(223,168,108,0.04)]">
            <GildedCorners size="xs" withInnerFrame={false} />
            <div className="relative z-10 text-[10px] font-fantasy tracking-widest text-[#c5b08f] uppercase">Total XP</div>
            <div className="relative z-10 text-xl font-bold font-fantasy text-[#dfa86c]">{profile?.total_xp ?? 0}</div>
          </div>
          <div className="relative p-3 bg-[#040814]/85 border border-[#c89b55]/45 overflow-hidden shadow-[inset_0_0_10px_rgba(223,168,108,0.04)]">
            <GildedCorners size="xs" withInnerFrame={false} />
            <div className="relative z-10 text-[10px] font-fantasy tracking-widest text-[#c5b08f] uppercase">Streak Diário</div>
            <div className="relative z-10 text-xl font-bold font-fantasy text-amber-400">{profile?.streak_count ?? 0} dias</div>
          </div>
          <div className="relative p-3 bg-[#040814]/85 border border-[#c89b55]/45 overflow-hidden shadow-[inset_0_0_10px_rgba(223,168,108,0.04)]">
            <GildedCorners size="xs" withInnerFrame={false} />
            <div className="relative z-10 text-[10px] font-fantasy tracking-widest text-[#c5b08f] uppercase">Rank do Escolhido</div>
            <div className="relative z-10 text-xs font-bold font-fantasy text-emerald-400 mt-1 truncate" title={overallRank.label}>
              Tier {overallRank.tierRoman} [{overallRank.subGradeRoman}] · {overallRank.title}
            </div>
          </div>
        </div>

        {/* Level XP Bar */}
        <div className="space-y-1 mt-4 pt-3 border-t border-[#966422]/40 font-mono">
          <div className="flex justify-between text-[11px] text-[#c5b08f]">
            <span className="font-fantasy uppercase tracking-wider">XP para Nível {levelProgress.level + 1}</span>
            <span className="text-[#fde047] font-bold">
              {levelProgress.currentXp} / {levelProgress.xpForNextLevel} XP ({levelProgress.progressPercentage}%)
            </span>
          </div>
          <div className="w-full bg-[#040814] h-2.5 overflow-hidden border border-[#c89b55]/55 p-[1px]">
            <div
              className="bg-gradient-to-r from-[#966422] via-[#dfa86c] to-[#fde047] h-full transition-all duration-500 shadow-[0_0_10px_rgba(253,224,71,0.65)]"
              style={{ width: `${levelProgress.progressPercentage}%` }}
            />
          </div>
        </div>
      </SystemPanel>

      {/* Classes & Progression Section */}
      <SystemPanel
        title="Classes por Área & Título do Escolhido"
        subtitle="10 Patamares Canônicos de Maestria (1 a 50.000 pts · Escala do Escolhido I a X)"
        glow
      >
        <div className="space-y-4 my-2">
          {/* Active Equipped Title Bar */}
          <div className="relative p-3.5 bg-[#040814]/90 border border-[#dfa86c]/45 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[inset_0_0_12px_rgba(223,168,108,0.06)]">
            <GildedCorners size="xs" withInnerFrame={false} />
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-9 h-9 border border-[#fde047]/60 bg-[#1c1308] flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(253,224,71,0.3)]">
                <Crown className="w-5 h-5 text-[#fde047]" />
              </div>
              <div>
                <span className="text-[10px] font-fantasy uppercase tracking-widest text-[#c5b08f] block">
                  Título Principal Equipado
                </span>
                <span className="text-base font-fantasy font-bold text-[#fde047] tracking-wider">
                  {profile?.title || "Aspirante a Desperto"}
                </span>
              </div>
            </div>

            <SystemButton
              variant="secondary"
              size="sm"
              onClick={() => setIsTitleModalOpen(true)}
              className="relative z-10 shrink-0"
              icon={<Award className="w-3.5 h-3.5 text-[#dfa86c]" />}
            >
              Trocar Título Principal
            </SystemButton>
          </div>

          {/* Active Class Challenge Card */}
          {activeChallenge && (
            <div
              data-testid="active-challenge-card"
              className="relative p-4 bg-gradient-to-r from-[#1c1308] via-[#060e20] to-[#1c1308] border-2 border-[#fde047]/70 shadow-[0_0_25px_rgba(253,224,71,0.18)]"
            >
              <GildedCorners size="sm" color="#fde047" diamondColor="#dfa86c" withInnerFrame={false} />
              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#fde047] animate-pulse" />
                    <span className="text-xs font-fantasy font-bold tracking-wider uppercase text-[#fde047]">
                      {activeChallenge.status === "aceita"
                        ? "✦ PROVAÇÃO ATIVA EM ANDAMENTO ✦"
                        : "✦ PROVAÇÃO PROPOSTA PELA GRANDE SÁBIO ✦"}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 bg-[#dfa86c]/20 border border-[#dfa86c]/50 text-[#fde047] uppercase font-bold">
                    Tier {CLASS_TIER_CONFIG[activeChallenge.target_tier - 1]?.roman || activeChallenge.target_tier} · {activeChallenge.area_id}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-mono text-[#c5b08f]">
                    Ascensão Alvo:{" "}
                    <strong className="text-sm font-fantasy text-[#fde047] tracking-wide">
                      {activeChallenge.name_class}
                    </strong>
                  </div>
                  <div className="font-fantasy text-sm text-[#f8ecd5] font-semibold">
                    ✦ {activeChallenge.challenge_title}
                  </div>
                  <p className="font-mono text-xs text-[#c5b08f] leading-relaxed">
                    {activeChallenge.challenge_description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#dfa86c]/30 flex flex-wrap items-center justify-end gap-2">
                  {activeChallenge.status === "proposta" ? (
                    <>
                      <SystemButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAbandonChallenge(activeChallenge.id)}
                        disabled={isProcessingChallenge}
                      >
                        Recusar
                      </SystemButton>
                      <SystemButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleAcceptChallenge(activeChallenge.id)}
                        disabled={isProcessingChallenge}
                      >
                        Aceitar Provação
                      </SystemButton>
                    </>
                  ) : (
                    <>
                      <SystemButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAbandonChallenge(activeChallenge.id)}
                        disabled={isProcessingChallenge}
                      >
                        Desistir do Desafio
                      </SystemButton>
                      <SystemButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleCompleteChallenge(activeChallenge.id)}
                        disabled={isProcessingChallenge}
                        className="shadow-[0_0_15px_rgba(253,224,71,0.5)] font-bold text-black bg-gradient-to-r from-[#dfa86c] to-[#fde047]"
                      >
                        Consegui concluir o desafio!
                      </SystemButton>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5 Area Classes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {BASE_AREAS.map((area) => {
              const currentClass = highestClasses[area.code];
              const currentTier = currentClass?.tier ?? 1;
              const currentClassName = currentClass?.name ?? `Aprendiz de ${area.name}`;
              const masteryVal = attributes[area.code] ?? 0;
              const eligibility = checkClassEligibility(area.code, currentTier, masteryVal);

              const nextTierConfig = eligibility.nextTier
                ? CLASS_TIER_CONFIG[eligibility.nextTier - 1]
                : null;
              const prevTierReq = CLASS_TIER_CONFIG[currentTier - 1]?.minMastery ?? 0;
              const targetTierReq = nextTierConfig?.minMastery ?? 3000;
              const tierSpan = Math.max(1, targetTierReq - prevTierReq);
              const progressPct = eligibility.nextTier
                ? Math.min(100, Math.max(0, Math.round(((masteryVal - prevTierReq) / tierSpan) * 100)))
                : 100;

              const isChallengingThisArea =
                activeChallenge && activeChallenge.area_id === area.code;

              return (
                <div
                  key={area.id}
                  data-testid={`class-area-card-${area.code}`}
                  className="relative p-3 bg-[#060e20]/90 border border-[#c89b55]/45 flex flex-col justify-between gap-3 overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
                >
                  <GildedCorners size="xs" withInnerFrame={false} />
                  <div className="relative z-10 space-y-2">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <SystemBadge type="area" areaId={area.code} size="sm" />
                      <span className="text-[9px] font-fantasy font-bold px-1.5 py-0.5 bg-[#1c1308] text-[#fde047] border border-[#dfa86c]/60">
                        Tier {CLASS_TIER_CONFIG[currentTier - 1]?.roman || currentTier} · {CLASS_TIER_CONFIG[currentTier - 1]?.name}
                      </span>
                    </div>

                    <div>
                      <div
                        className="font-fantasy font-bold text-xs text-[#f8ecd5] truncate"
                        title={currentClassName}
                      >
                        {currentClassName}
                      </div>
                      <div className="text-[10px] text-[#c5b08f] font-mono mt-0.5">
                        Maestria: <strong className="text-[#fde047]">{masteryVal} pts</strong>
                      </div>
                    </div>

                    {/* Progress Bar towards Next Tier */}
                    <div className="space-y-1 font-mono text-[9px]">
                      <div className="flex justify-between text-[#c5b08f]">
                        <span className="truncate max-w-[120px]" title={eligibility.nextTier ? `Rumo a ${eligibility.nextTierFormatted || eligibility.nextTierName}` : "Ápice Atingido"}>
                          {eligibility.nextTier ? `Rumo a ${eligibility.nextTierFormatted || eligibility.nextTierName}` : "Ápice Atingido"}
                        </span>
                        <span>{eligibility.nextTier ? `${targetTierReq} pts` : "Max"}</span>
                      </div>
                      <div className="w-full bg-[#040814] h-1.5 overflow-hidden border border-[#c89b55]/40 p-[1px]">
                        <div
                          className="bg-gradient-to-r from-[#966422] to-[#fde047] h-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Eligibility Banner & Action */}
                  <div className="relative z-10 pt-2 border-t border-[#dfa86c]/20">
                    {eligibility.isEligible && !activeChallenge ? (
                      <div
                        data-testid={`eligibility-banner-${area.code}`}
                        className="p-2 bg-gradient-to-r from-[#dfa86c]/15 to-[#fde047]/20 border border-[#fde047]/60 space-y-1.5 text-center"
                      >
                        <div className="text-[10px] font-fantasy font-bold text-[#fde047] tracking-wider uppercase flex items-center justify-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#fde047]" />
                          <span>Elegível: {eligibility.nextTierFormatted || eligibility.nextTierName}!</span>
                        </div>
                        <SystemButton
                          variant="primary"
                          size="sm"
                          onClick={() => handleRequestChallenge(area.code)}
                          disabled={isProcessingChallenge}
                          className="w-full text-[10px] py-1"
                        >
                          Solicitar Desafio da G.S
                        </SystemButton>
                      </div>
                    ) : isChallengingThisArea ? (
                      <div className="text-[10px] font-mono text-center text-[#fde047] py-1 bg-[#dfa86c]/10 border border-[#dfa86c]/30">
                        Provação Ativa
                      </div>
                    ) : (
                      <div className="text-[10px] font-mono text-center text-[#a39171] py-1">
                        {eligibility.pointsRemaining > 0
                          ? `Faltam ${eligibility.pointsRemaining} pts`
                          : "Patamar Máximo"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SystemPanel>

      {/* Title Selection Modal */}
      <SystemModal
        isOpen={isTitleModalOpen}
        onClose={() => setIsTitleModalOpen(false)}
        title="TÍTULOS DISPONÍVEIS // ESCOLHIDO"
        subtitle="Selecione uma das suas classes desbloqueadas para equipar como Título Principal"
        icon={<Crown className="w-5 h-5 text-[#fde047]" />}
      >
        <div className="space-y-3 font-sans">
          <div className="text-xs font-mono text-[#c5b08f]">
            O título escolhido será proclamado pela Grande Sábio e exibido publicamente no seu registro.
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {unlockedClasses.map((cls) => {
              const isEquipped = profile?.title === cls.name;
              return (
                <div
                  key={cls.id}
                  className={`p-3 border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    isEquipped
                      ? "bg-[#1c1308] border-[#fde047] shadow-[0_0_12px_rgba(253,224,71,0.25)]"
                      : "bg-[#060e20]/80 border-[#dfa86c]/30 hover:border-[#dfa86c]/70 hover:bg-[#0b1329]"
                  }`}
                  onClick={() => handleEquipTitle(cls.name)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-fantasy font-bold text-xs text-[#f8ecd5]">
                        {cls.name}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#dfa86c]/20 border border-[#dfa86c]/40 text-[#fde047]">
                        Tier {CLASS_TIER_CONFIG[cls.tier - 1]?.roman || cls.tier} · {cls.area_id}
                      </span>
                    </div>
                    {cls.description && (
                      <p className="text-[11px] text-[#c5b08f] line-clamp-1 mt-0.5">
                        {cls.description}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    {isEquipped ? (
                      <span className="text-[10px] font-fantasy font-bold px-2 py-1 bg-[#dfa86c] text-black flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Equipado
                      </span>
                    ) : (
                      <SystemButton variant="ghost" size="sm" onClick={() => handleEquipTitle(cls.name)}>
                        Equipar
                      </SystemButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SystemModal>

      {/* Pentagon Radar Chart & Attributes Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Radar Chart Column */}
        <div className="lg:col-span-5 flex flex-col">
          <SystemPanel
            title="Diagrama de Atributos"
            subtitle="Radar Pentagonal dos 5 Atributos Primários"
            className="flex-1 flex flex-col items-center justify-center p-4"
          >
            <AttributesRadarChart
              attributes={attributes}
              size={290}
              className="my-2"
            />
          </SystemPanel>
        </div>

        {/* 5 Base Areas Attribute Cards Column */}
        <div className="lg:col-span-7 space-y-3">
          <h3 className="text-xs font-fantasy font-bold uppercase tracking-widest text-[#dfa86c]">
            Detalhamento de Maestria por Área
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {BASE_AREAS.map((area) => {
              const masteryVal = attributes[area.code as AreaCode] ?? 0;
              const rank = getAttributeRank(masteryVal, area.code as AreaCode);
              return (
                <div
                  key={area.id}
                  className="relative p-3 bg-[#060e20]/90 border border-[#c89b55]/45 flex items-center justify-between gap-2 min-w-0 overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
                >
                  <GildedCorners size="xs" withInnerFrame={false} />
                  <div className="relative z-10 space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <SystemBadge type="area" areaId={area.code} size="sm" className="shrink-0" />
                      <span className="text-[10px] font-fantasy font-bold px-1.5 py-0.5 bg-[#1c1308] text-[#fde047] border border-[#dfa86c]/60 shrink-0">
                        Tier {rank.tierRoman} [Grau {rank.subGradeRoman}]
                      </span>
                    </div>
                    <p className="text-[11px] text-[#c5b08f] font-sans mt-0.5 line-clamp-1 break-words [overflow-wrap:anywhere]" title={rank.label}>
                      {rank.label}
                    </p>
                  </div>
                  <div className="relative z-10 text-right font-mono shrink-0 pl-2">
                    <div className="text-sm text-[#fde047] font-bold">{masteryVal} pts</div>
                    <div className="text-[10px] text-[#a39171] font-fantasy">{rank.title}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ledger Audit Status Card */}
          {auditResult && (
            <div
              className={`relative p-3.5 border flex items-center justify-between font-mono text-xs overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.1)] ${
                auditResult.isConsistent
                  ? "bg-emerald-950/25 border-emerald-500/45 text-emerald-300"
                  : "bg-red-950/30 border-red-500/50 text-red-300"
              }`}
            >
              <GildedCorners
                size="xs"
                color={auditResult.isConsistent ? "#059669" : "#ef4444"}
                diamondColor={auditResult.isConsistent ? "#34d399" : "#f87171"}
                withInnerFrame={false}
              />
              <div className="relative z-10 flex items-center gap-2">
                {auditResult.isConsistent ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <div>
                  <span className="font-bold font-fantasy tracking-wide">
                    {auditResult.isConsistent
                      ? "Ledger Imutável 100% Íntegro"
                      : "Divergência Detectada no Ledger"}
                  </span>
                  <div className="text-[11px] text-[#c5b08f] mt-0.5">
                    Ledger: {auditResult.ledgerTotalXp} XP · Perfil: {auditResult.profileTotalXp} XP
                  </div>
                </div>
              </div>
              <div className="relative z-10 text-right text-[11px] text-[#c5b08f] font-fantasy hidden sm:block">
                Regra 2 (Ledger) Ativa
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ledger Recent Transactions Statement */}
      <SystemPanel
        title="Extrato Recente do Ledger // Auditoria Imutável"
        subtitle="Registro criptográfico das últimas 10 transações de XP e Maestria"
      >
        {recentEvents.length === 0 ? (
          <div className="p-6 text-center text-[#a39171] font-mono text-xs border border-dashed border-[#966422]/45 my-2">
            Nenhuma transação gravada no Ledger até o momento.
          </div>
        ) : (
          <div className="divide-y divide-[#966422]/30 font-mono text-xs my-2 overflow-x-auto">
            {recentEvents.map((ev) => {
              const isPositive = ev.xp_amount >= 0;
              const formattedDate = new Date(ev.created_at).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={ev.id}
                  className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-[#0b1630]/50 transition-colors min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`p-1.5 border shrink-0 ${
                        isPositive
                          ? "bg-[#1c1308]/90 border-[#dfa86c]/55 text-[#fde047]"
                          : "bg-red-950/60 border-red-500/40 text-red-400"
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="text-[#f8ecd5] font-semibold break-words [overflow-wrap:anywhere]">{ev.description}</span>
                        {ev.area_id && <SystemBadge type="area" areaId={ev.area_id} size="sm" className="shrink-0" />}
                      </div>
                      <div className="text-[11px] text-[#a39171] flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="shrink-0">{formattedDate}</span>
                        <span>·</span>
                        <span className="text-[#c5b08f] font-sans shrink-0">
                          {ev.entity_type === "mission" ? "Missão" : ev.entity_type}
                        </span>
                        {ev.mastery_amount !== 0 && (
                          <>
                            <span>·</span>
                            <span className="text-[#dfa86c] shrink-0">
                              {ev.mastery_amount > 0 ? `+${ev.mastery_amount}` : ev.mastery_amount} Maestria
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-3">
                    <span
                      className={`font-bold font-fantasy text-sm ${
                        isPositive ? "text-[#fde047]" : "text-red-400"
                      }`}
                    >
                      {isPositive ? `+${ev.xp_amount}` : ev.xp_amount} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SystemPanel>
    </div>
  );
};
