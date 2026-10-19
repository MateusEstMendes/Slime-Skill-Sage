import React, { useState, useEffect } from "react";
import { authStorage } from "../services/authStorage";
import { logger } from "../services/logger";
import { SettingsModal } from "./SettingsModal";
import { DevPanel } from "./DevPanel";
import { SystemHeader } from "./system/SystemHeader";
import { TabBar, type SystemTabId } from "./navigation/TabBar";
import { HomeView } from "./views/HomeView";
import { ProjectsView } from "./projects/ProjectsView";
import { SkillsView } from "./views/SkillsView";
import { StatusView } from "./views/StatusView";
import { GsChatView } from "./views/GsChatView";
import { WorldVoiceModal } from "./system/WorldVoiceModal";
import { PendingTasksToast } from "./system/PendingTasksToast";
import { OnboardingFlow } from "./onboarding/OnboardingFlow";
import { gameService } from "../services/gameService";

interface HomeScreenProps {
  onDisconnect: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onDisconnect }) => {
  const [activeTab, setActiveTab] = useState<SystemTabId>("home");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);
  const [isOnboardingRequired, setIsOnboardingRequired] = useState(false);
  const [hunterName, setHunterName] = useState("Rimuru Tempest");

  useEffect(() => {
    void logger.info("game", "Interface principal do Sistema carregada");
    let isMounted = true;

    const checkOnboardingStatus = async () => {
      try {
        const profile = await gameService.getProfile();
        if (isMounted) {
          setHunterName(profile.name);
          setIsOnboardingRequired(profile.onboarding_done === false);
        }
      } catch {
        // Ignora erro
      }
    };

    void checkOnboardingStatus();

    const unsubscribe = gameService.subscribeToGameEvents((event) => {
      if (event.type === "ONBOARDING_RESET") {
        setIsDevPanelOpen(false);
        setIsOnboardingRequired(true);
      } else if (event.type === "ONBOARDING_COMPLETED") {
        setHunterName(event.payload.name);
        setIsOnboardingRequired(false);
        setActiveTab("gs");
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleLogout = () => {
    authStorage.clearAll();
    onDisconnect();
  };

  const handleNavigateToProjects = (projectId?: string) => {
    setSelectedProjectId(projectId || null);
    setActiveTab("projects");
  };

  const tabTitles: Record<SystemTabId, string> = {
    home: "Visão Geral",
    projects: "Diretrizes & Missões",
    skills: "Árvore de Habilidades",
    status: "Atributos do Escolhido",
    gs: "Grande Sábio (G.S)",
  };

  if (isOnboardingRequired) {
    return (
      <OnboardingFlow
        initialHunterName={hunterName}
        onComplete={() => {
          setIsOnboardingRequired(false);
          setActiveTab("gs");
        }}
      />
    );
  }

  const isGsTab = activeTab === "gs";

  return (
    <div
      className={`w-full bg-transparent text-[#f3e5cc] flex flex-col font-sans select-none ${
        isGsTab ? "h-[100dvh] overflow-hidden" : "min-h-screen pb-24 md:pb-28"
      }`}
    >
      {/* System Sticky Header */}
      <SystemHeader
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDevPanel={() => setIsDevPanelOpen(true)}
        onLogout={handleLogout}
        activeTabTitle={tabTitles[activeTab]}
      />

      {/* Main Content Area - Preserved DOM tabs without remounting flicker */}
      <main
        className={
          isGsTab
            ? "flex-1 min-h-0 flex flex-col overflow-hidden max-w-4xl w-full mx-auto px-4 pt-3 pb-24 md:px-6 md:pt-4 md:pb-28"
            : "flex-1 max-w-4xl w-full mx-auto p-4 md:p-6"
        }
      >
        <div
          role="tabpanel"
          aria-hidden={activeTab !== "home"}
          className={activeTab === "home" ? "block" : "hidden"}
        >
          <HomeView
            onNavigateToProjects={handleNavigateToProjects}
            onNavigateToGs={() => setActiveTab("gs")}
          />
        </div>

        <div
          role="tabpanel"
          aria-hidden={activeTab !== "projects"}
          className={activeTab === "projects" ? "block" : "hidden"}
        >
          <ProjectsView
            initialProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
            isActive={activeTab === "projects"}
          />
        </div>

        <div
          role="tabpanel"
          aria-hidden={activeTab !== "skills"}
          className={activeTab === "skills" ? "block" : "hidden"}
        >
          <SkillsView isActive={activeTab === "skills"} />
        </div>

        <div
          role="tabpanel"
          aria-hidden={activeTab !== "status"}
          className={activeTab === "status" ? "block" : "hidden"}
        >
          <StatusView isActive={activeTab === "status"} />
        </div>

        <div
          role="tabpanel"
          aria-hidden={activeTab !== "gs"}
          className={
            activeTab === "gs"
              ? "flex-1 min-h-0 flex flex-col overflow-hidden"
              : "hidden"
          }
        >
          <GsChatView />
        </div>
      </main>

      {/* Bottom 5-Tab Navigation Bar */}
      <TabBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab !== "projects") {
            setSelectedProjectId(null);
          }
          setActiveTab(tab);
        }}
      />

      {/* System Settings & Dev Panel Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenDevPanel={() => {
          setIsSettingsOpen(false);
          setIsDevPanelOpen(true);
        }}
      />

      <DevPanel
        isOpen={isDevPanelOpen}
        onClose={() => setIsDevPanelOpen(false)}
      />

      {/* Proactive Pending Tasks Toast */}
      <PendingTasksToast onNavigateToProjects={() => handleNavigateToProjects()} />

      {/* World Voice System Modal */}
      <WorldVoiceModal />
    </div>
  );
};
