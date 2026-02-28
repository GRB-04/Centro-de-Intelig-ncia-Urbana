import { useState } from "react";
import { Plus, BarChart2, Map, List, Activity, LogOut } from "lucide-react";
import { Header } from "./components/Header";
import { MetricsPanel } from "./components/MetricsPanel";
import { IssueList } from "./components/IssueList";
import { MapView } from "./components/MapView";
import { ReportModal } from "./components/ReportModal";
import { Issue } from "./data/issues";
import { supabase } from "../lib/supabase";

type View = "split" | "list" | "map";

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [view, setView] = useState<View>("split");

  const bg = darkMode ? "#121212" : "#F5F7FA";
  const textColor = darkMode ? "#FFFFFF" : "#1D1D1F";
  const mutedColor = darkMode ? "#666" : "#9CA3AF";
  const borderColor = darkMode ? "#2a2a2a" : "#E8ECF0";

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{
        backgroundColor: bg,
        color: textColor,
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Header */}
      <div className="relative">
        <Header
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((d) => !d)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Logout (canto superior direito, discreto) */}
        <button
          onClick={handleLogout}
          className="absolute right-4 top-4 md:right-6 md:top-5 flex items-center gap-2 px-3 h-9 rounded-xl text-xs transition-all"
          style={{
            backgroundColor: darkMode ? "#1E1E1E" : "#FFFFFF",
            border: `1px solid ${borderColor}`,
            color: mutedColor,
            boxShadow: darkMode ? "none" : "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-4 md:px-6 py-5 gap-5">
        {/* Metrics Panel */}
        <MetricsPanel darkMode={darkMode} />

        {/* View Switcher + Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={14} color="#1565C0" />
            <span
              className="text-xs uppercase tracking-widest"
              style={{ color: mutedColor, letterSpacing: "0.08em" }}
            >
              Gestão de Ocorrências
            </span>
          </div>

          <div className="flex gap-1">
            {([
              { id: "split", icon: <BarChart2 size={13} />, label: "Dividido" },
              { id: "list", icon: <List size={13} />, label: "Lista" },
              { id: "map", icon: <Map size={13} />, label: "Mapa" },
            ] as const).map(({ id, icon, label }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className="flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs transition-all"
                style={{
                  backgroundColor:
                    view === id ? "#1565C0" : darkMode ? "#1E1E1E" : "#FFFFFF",
                  border: `1px solid ${
                    view === id ? "#1565C0" : borderColor
                  }`,
                  color: view === id ? "#fff" : mutedColor,
                  fontWeight: view === id ? 600 : 400,
                  boxShadow:
                    view === id
                      ? "none"
                      : darkMode
                      ? "none"
                      : "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Grid */}
        <div
          className={`flex-1 gap-4 ${
            view === "split"
              ? "grid grid-cols-1 lg:grid-cols-[420px_1fr]"
              : "flex"
          }`}
          style={{ minHeight: "calc(100vh - 380px)" }}
        >
          {/* Issue List */}
          {(view === "split" || view === "list") && (
            <div
              className="rounded-2xl p-4 flex flex-col"
              style={{
                backgroundColor: darkMode ? "#1E1E1E" : "#FFFFFF",
                border: `1px solid ${darkMode ? "#2a2a2a" : "#EEF1F5"}`,
                boxShadow: darkMode
                  ? "0 0 0 1px rgba(255,255,255,0.03)"
                  : "0 2px 8px rgba(0,0,0,0.05)",
                minHeight: view === "list" ? "60vh" : "500px",
                flex: view === "list" ? 1 : undefined,
                overflow: "hidden",
              }}
            >
              <IssueList
                darkMode={darkMode}
                searchQuery={searchQuery}
                onSelectIssue={(issue) => setSelectedIssue(issue)}
                selectedIssueId={selectedIssue?.id ?? null}
              />
            </div>
          )}

          {/* Map View */}
          {(view === "split" || view === "map") && (
            <div
              style={{
                flex: view === "map" ? 1 : undefined,
                minHeight: view === "split" ? "500px" : "60vh",
              }}
            >
              <MapView
                darkMode={darkMode}
                selectedIssue={selectedIssue}
                onSelectIssue={setSelectedIssue}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <footer
          className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 pb-4"
          style={{ borderTop: `1px solid ${borderColor}` }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: mutedColor }}>
              © 2026 Belém Urban Intelligence Center
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: darkMode ? "#1a2a1a" : "#F0FAF0",
                color: "#2E7D32",
              }}
            >
              Projeto Acadêmico – Beta
            </span>
          </div>
          <div className="flex items-center gap-4">
            {["Sobre", "API", "Privacidade", "Contato"].map((link) => (
              <button key={link} className="text-xs" style={{ color: mutedColor }}>
                {link}
              </button>
            ))}
          </div>
        </footer>
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowReportModal(true)}
        className="fixed bottom-6 right-6 flex items-center gap-2 h-12 px-5 rounded-2xl z-40 transition-all"
        style={{
          backgroundColor: darkMode ? "#FFFFFF" : "#1D1D1F",
          color: darkMode ? "#1D1D1F" : "#FFFFFF",
          boxShadow: darkMode
            ? "0 4px 20px rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.3)"
            : "0 4px 20px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)",
          fontWeight: 600,
        }}
      >
        <Plus size={18} strokeWidth={2.5} />
        <span className="text-sm">Reportar Ocorrência</span>
      </button>

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal darkMode={darkMode} onClose={() => setShowReportModal(false)} />
      )}
    </div>
  );
}