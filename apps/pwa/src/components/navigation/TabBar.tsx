import React from "react";
import { Compass, Layers, Sparkles, Activity, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { hapticFeedback } from "../../services/haptics";

export type SystemTabId = "home" | "projects" | "skills" | "status" | "gs";

export interface TabItem {
  id: SystemTabId;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  isSpecial?: boolean;
}

export const TABS: TabItem[] = [
  { id: "home", label: "Visão Geral", shortLabel: "Home", icon: Compass },
  { id: "projects", label: "Projetos", shortLabel: "Projetos", icon: Layers },
  { id: "gs", label: "Grande Sábio", shortLabel: "G.S", icon: Bot, isSpecial: true },
  { id: "skills", label: "Habilidades", shortLabel: "Skills", icon: Sparkles },
  { id: "status", label: "Status", shortLabel: "Status", icon: Activity },
];

export interface TabBarProps {
  activeTab: SystemTabId;
  onSelectTab: (tab: SystemTabId) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onSelectTab }) => {
  const handleTabClick = (tabId: SystemTabId) => {
    if (tabId !== activeTab) {
      hapticFeedback.tap();
      onSelectTab(tabId);
    }
  };

  return (
    <nav
      aria-label="Navegação do Sistema"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#070d1e]/95 backdrop-blur-lg border-t border-cyan-500/25 px-2 py-1.5 md:py-2 select-none shadow-[0_-5px_25px_rgba(0,0,0,0.6)]"
    >
      <div className="max-w-xl mx-auto flex items-center justify-around">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          if (tab.isSpecial) {
            // Grande Sábio (Central Hero Tab)
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                aria-label="Abrir Grande Sábio"
                data-testid={`tab-${tab.id}`}
                className="relative -top-3.5 flex flex-col items-center group focus:outline-none"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border ${
                    isActive
                      ? "bg-cyan-400 text-slate-950 border-cyan-300 shadow-[0_0_25px_rgba(0,240,255,0.8)] scale-110"
                      : "bg-[#0c1836] text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.25)] group-hover:scale-105 group-hover:border-cyan-300"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span
                  className={`text-[10px] font-mono tracking-wider font-bold mt-1 transition-colors ${
                    isActive ? "text-cyan-300" : "text-cyan-400/80 group-hover:text-cyan-300"
                  }`}
                >
                  {tab.shortLabel}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              data-testid={`tab-${tab.id}`}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-all duration-200 focus:outline-none ${
                isActive ? "text-cyan-300" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110 text-cyan-300" : ""}`} />
                {isActive && (
                  <motion.div
                    layoutId="activeTabGlow"
                    className="absolute -inset-1 rounded-full bg-cyan-400/20 filter blur-sm -z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </div>
              <span className={`text-[10px] font-mono tracking-wider mt-1 ${isActive ? "font-bold text-cyan-300" : ""}`}>
                {tab.shortLabel}
              </span>
              {isActive && (
                <div className="w-3 h-0.5 bg-cyan-400 rounded-full mt-0.5 shadow-[0_0_6px_rgba(0,240,255,0.9)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
