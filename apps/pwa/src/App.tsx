import React, { useState, useEffect } from "react";
import { authStorage } from "./services/authStorage";
import { TokenAuthScreen } from "./components/TokenAuthScreen";
import { HomeScreen } from "./components/HomeScreen";
import { SystemErrorBoundary } from "./components/SystemErrorBoundary";

export const AppContent: React.FC = () => {

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);

  useEffect(() => {
    const token = authStorage.getToken();
    if (token) {
      setIsAuthenticated(true);
    }
    setChecking(false);
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#050811] flex items-center justify-center text-cyan-400 font-mono text-sm">
        Carregando Sistema...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <TokenAuthScreen
        onSuccess={() => {
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <HomeScreen
      onDisconnect={() => {
        setIsAuthenticated(false);
      }}
    />
  );
};

export const App: React.FC = () => {
  return (
    <SystemErrorBoundary>
      <AppContent />
    </SystemErrorBoundary>
  );
};

export default App;

