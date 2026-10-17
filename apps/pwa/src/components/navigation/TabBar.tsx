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
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#050b18]/95 backdrop-blur-lg border-t border-[#c89b55]/55 px-2 py-1.5 md:py-2 select-none shadow-[0_-8px_30px_rgba(0,0,0,0.85)]"
    >
      {/* Ornamental top highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#fde047]/65 to-transparent pointer-events-none" />

      <div className="max-w-xl mx-auto flex items-center justify-around">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          if (tab.isSpecial) {
            // Grande Sábio (Central Hero Tab with Esoteric Magic Circle Medallion)
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                aria-label="Abrir Grande Sábio"
                data-testid={`tab-${tab.id}`}
                className="relative -top-3.5 flex flex-col items-center group focus:outline-none"
              >
                <div
                  className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                    isActive
                      ? "bg-gradient-to-b from-[#e8b974] via-[#c89b55] to-[#8a5a1d] text-[#050811] border-[#fde047] shadow-[0_0_28px_rgba(223,168,108,0.85)] scale-110"
                      : "bg-[#081329] text-[#dfa86c] border-[#c89b55]/80 shadow-[0_0_16px_rgba(223,168,108,0.3)] group-hover:scale-105 group-hover:border-[#fde047]"
                  }`}
                >
                  {/* Concentric Magic Circle SVG */}
                  <svg
                    viewBox="0 0 48 48"
                    className={`absolute inset-0 w-full h-full pointer-events-none ${
                      isActive ? "text-[#050811]/40" : "text-[#dfa86c]/35"
                    }`}
                  >
                    <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" />
                    <polygon points="24,6 40,33 8,33" fill="none" stroke="currentColor" strokeWidth="0.6" />
                    <polygon points="24,42 40,15 8,15" fill="none" stroke="currentColor" strokeWidth="0.6" />
                  </svg>
                  <Icon className="w-6 h-6 relative z-10" />
                </div>
                <span
                  className={`text-[10px] font-fantasy tracking-widest font-bold mt-1 transition-colors ${
                    isActive ? "text-[#fde047]" : "text-[#dfa86c]/90 group-hover:text-[#fde047]"
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
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 transition-all duration-200 focus:outline-none ${
                isActive ? "text-[#fde047]" : "text-[#a39171] hover:text-[#f3e5cc]"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110 text-[#fde047]" : ""}`} />
                {isActive && (
                  <motion.div
                    layoutId="activeTabGlow"
                    className="absolute -inset-1.5 rounded-full bg-[#dfa86c]/25 filter blur-sm -z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </div>
              <span className={`text-[10px] font-fantasy tracking-wider mt-1 uppercase ${isActive ? "font-bold text-[#fde047]" : ""}`}>
                {tab.shortLabel}
              </span>
              {isActive && (
                <div className="w-1.5 h-1.5 rotate-45 bg-[#fde047] mt-0.5 shadow-[0_0_8px_rgba(253,224,71,0.95)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
