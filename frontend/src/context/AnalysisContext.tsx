import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface AnalysisContextType {
  latestAnalysis: any;
  setLatestAnalysis: (data: any) => void;
  analysisHistory: any[];
}

const AnalysisContext = createContext<
  AnalysisContextType | undefined
>(undefined);

export function AnalysisProvider({
  children,
}: {
  children: ReactNode;
}) {
 const [analysisHistory, setAnalysisHistory] = useState<any[]>(
  () => {
    try {
      return JSON.parse(
        localStorage.getItem("codeguardian_history") || "[]"
      );
    } catch {
      return [];
    }
  }
);

const [latestAnalysis, setLatestAnalysisState] =
  useState<any>(() => {
    return analysisHistory.length > 0
      ? analysisHistory[0]
      : null;
  });

  useEffect(() => {
    localStorage.setItem(
      "codeguardian_history",
      JSON.stringify(analysisHistory)
    );
  }, [analysisHistory]);

  function setLatestAnalysis(data: any) {
    setLatestAnalysisState(data);

    setAnalysisHistory((previous) => [
      data,
      ...previous,
    ].slice(0, 50));
  }

  return (
    <AnalysisContext.Provider
      value={{
        latestAnalysis,
        setLatestAnalysis,
        analysisHistory,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);

  if (!context) {
    throw new Error(
      "useAnalysis must be used inside AnalysisProvider"
    );
  }

  return context;
}