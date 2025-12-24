"use client";

import { createContext, useContext, useState, type ReactNode, useEffect } from "react";
import { type Client } from "@/lib/api";

interface ClientContextType {
  activeClient: Client | null;
  setActiveClient: (client: Client | null) => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [activeClient, setActiveClient] = useState<Client | null>(null);

  // Optional: Persist to localStorage
  useEffect(() => {
    const stored = localStorage.getItem("activeClient");
    if (stored) {
      try {
        setActiveClient(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored client context", e);
      }
    }
  }, []);

  const setClient = (client: Client | null) => {
      setActiveClient(client);
      if (client) {
          localStorage.setItem("activeClient", JSON.stringify(client));
      } else {
          localStorage.removeItem("activeClient");
      }
  };

  return (
    <ClientContext.Provider value={{ activeClient, setActiveClient: setClient }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClientContext() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error("useClientContext must be used within a ClientProvider");
  }
  return context;
}
