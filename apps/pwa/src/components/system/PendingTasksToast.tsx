import React, { useEffect, useState } from "react";
import { localDb } from "../../services/db";
import { gsVoiceService } from "../../services/gsVoiceService";
import { GildedCorners } from "./GildedCorners";
import { Volume2, VolumeX, X, AlertCircle } from "lucide-react";
import type { Mission, Project } from "@slime-sage/shared";

interface PendingTasksToastProps {
  onNavigateToProjects?: () => void;
}

export const PendingTasksToast: React.FC<PendingTasksToastProps> = ({
  onNavigateToProjects,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [pendingMissionsCount, setPendingMissionsCount] = useState(0);
  const [activeProjectsCount, setActiveProjectsCount] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkPendingTasks = async () => {
      try {
        // Verifica se o usuário desabilitou o toast nas configurações
        const disabled = await localDb.getKv<boolean>("settings_disable_pending_toast");
        if (disabled) return;

        // Verifica se já dispensou nos últimos 30 minutos nesta sessão
        const lastDismiss = sessionStorage.getItem("gs_pending_toast_dismissed");
        if (lastDismiss) return;

        const allMissions = await localDb.getAll<Mission>("mission");
        const allProjects = await localDb.getAll<Project>("project");

        const availableMissions = allMissions.filter(
          (m) => m.status === "disponivel" && !m.deleted_at,
        );
        const activeProjects = allProjects.filter(
          (p) => p.status === "ativo" && !p.deleted_at,
        );

        if (isMounted && availableMissions.length > 0) {
          setPendingMissionsCount(availableMissions.length);
          setActiveProjectsCount(activeProjects.length);
          setIsVisible(true);

          // Verifica se autoplay está configurado
          const autoPlay = await localDb.getKv<boolean>("settings_auto_play_voice");
          if (autoPlay) {
            const speechText = `Aviso do Sistema: Existem ${availableMissions.length} missões táticas aguardando sua resolução em ${activeProjects.length} projetos ativos. Priorize seu foco, Caçador.`;
            void gsVoiceService.speakWithGs(speechText);
          }
        }
      } catch (err) {
        console.warn("[PendingTasksToast] Erro ao verificar pendências:", err);
      }
    };

    void checkPendingTasks();

    const unsubscribe = gsVoiceService.subscribe((speaking) => {
      if (isMounted) setIsSpeaking(speaking);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  if (!isVisible || pendingMissionsCount === 0) {
    return null;
  }

  const handleSpeak = () => {
    if (isSpeaking) {
      gsVoiceService.stopCurrentSpeech();
    } else {
      const speechText = `Aviso do Sistema: Existem ${pendingMissionsCount} missões táticas aguardando sua resolução em ${activeProjectsCount} projetos ativos. Priorize seu foco, Caçador.`;
      void gsVoiceService.speakWithGs(speechText);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem("gs_pending_toast_dismissed", String(Date.now()));
    gsVoiceService.stopCurrentSpeech();
    setIsVisible(false);
  };

  return (
    <div className="fixed bottom-20 right-4 left-4 md:left-auto md:right-6 md:w-96 z-40 animate-fade-in">
      <div className="relative p-3.5 bg-[#050a18]/95 border border-[#dfa86c]/70 rounded-none shadow-[0_0_25px_rgba(223,168,108,0.2)] text-[#f8ecd5] space-y-2.5 backdrop-blur-md">
        <GildedCorners size="xs" color="#dfa86c" diamondColor="#fde047" withInnerFrame={false} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rotate-45 bg-[#fde047] animate-ping" />
            <span className="font-fantasy text-xs font-bold text-[#fde047] tracking-wider uppercase flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-[#dfa86c]" />
              <span>AVISO DA G.S // PENDÊNCIAS</span>
            </span>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Dispensar aviso de pendências"
            className="text-[#c5b08f] hover:text-[#fde047] transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#c5b08f] font-sans leading-relaxed">
          Existem <strong className="text-[#fde047]">{pendingMissionsCount} missões disponíveis</strong> aguardando sua resolução em{" "}
          <strong className="text-[#f8ecd5]">{activeProjectsCount} projetos ativos</strong>.
        </p>

        <div className="flex items-center justify-between pt-1 gap-2 border-t border-[#dfa86c]/20">
          <button
            onClick={handleSpeak}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono border transition-all ${
              isSpeaking
                ? "border-[#fde047] bg-[#fde047]/20 text-[#fde047] animate-pulse"
                : "border-[#dfa86c]/40 bg-[#dfa86c]/10 text-[#dfa86c] hover:border-[#dfa86c] hover:bg-[#dfa86c]/20"
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>Interromper</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Ouvir Mensagem</span>
              </>
            )}
          </button>

          {onNavigateToProjects && (
            <button
              onClick={() => {
                handleDismiss();
                onNavigateToProjects();
              }}
              className="text-xs font-mono text-[#00f3ff] hover:underline"
            >
              Abrir Projetos →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
