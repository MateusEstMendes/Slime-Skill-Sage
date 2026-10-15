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

interface HomeScreenProps {
  onDisconnect: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onDisconnect }) => {
  const [activeTab, setActiveTab] = useState<SystemTabId>("home");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);

  useEffect(() => {
    void logger.info("game", "Interface principal do Sistema carregada");
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
    status: "Atributos do Caçador",
    gs: "Grande Sábio (G.S)",
  };

  return (
    <div className="min-h-screen w-full bg-[#050811] text-slate-100 flex flex-col font-sans select-none pb-24 md:pb-28">
      {/* System Sticky Header */}
      <SystemHeader
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDevPanel={() => setIsDevPanelOpen(true)}
        onLogout={handleLogout}
        activeTabTitle={tabTitles[activeTab]}
      />

      {/* Main Content Area - Preserved DOM tabs without remounting flicker */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6">
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
          />
        </div>

        <div
          role="tabpanel"
          aria-hidden={activeTab !== "skills"}
          className={activeTab === "skills" ? "block" : "hidden"}
        >
          <SkillsView />
        </div>

        <div
          role="tabpanel"
          aria-hidden={activeTab !== "status"}
          className={activeTab === "status" ? "block" : "hidden"}
        >
          <StatusView />
        </div>

        <div
          role="tabpanel"
          aria-hidden={activeTab !== "gs"}
          className={activeTab === "gs" ? "block" : "hidden"}
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
    </div>
  );
};
