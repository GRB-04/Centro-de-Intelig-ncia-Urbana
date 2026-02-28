import { useState } from "react";
import { ThumbsUp, MapPin, Calendar, Users, ChevronDown, Filter } from "lucide-react";
import { ISSUES, NEIGHBORHOODS, Issue } from "../data/issues";

interface IssueListProps {
  darkMode: boolean;
  searchQuery: string;
  onSelectIssue: (issue: Issue) => void;
  selectedIssueId: number | null;
}

type FilterTab = "all" | "critical" | "recurrent" | "most-voted";

const STATUS_CONFIG = {
  Open: { label: "Aberta", bg: "#FFF0F0", color: "#E53935", darkBg: "#2a1818" },
  "In Analysis": { label: "Em Análise", bg: "#FFF8E1", color: "#FF9800", darkBg: "#2a2010" },
  Forwarded: { label: "Encaminhada", bg: "#E3F0FF", color: "#1565C0", darkBg: "#0d1a2e" },
  Resolved: { label: "Resolvida", bg: "#F0FAF0", color: "#2E7D32", darkBg: "#1a2a1a" },
};

const SEVERITY_CONFIG = {
  critical: { color: "#E53935", label: "Crítico", width: "w-1" },
  high: { color: "#FF9800", label: "Alto", width: "w-1" },
  medium: { color: "#FFC107", label: "Médio", width: "w-1" },
  low: { color: "#4CAF50", label: "Baixo", width: "w-1" },
};

export function IssueList({ darkMode, searchQuery, onSelectIssue, selectedIssueId }: IssueListProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [neighborhood, setNeighborhood] = useState("Todos os Bairros");
  const [supportedIds, setSupportedIds] = useState<Set<number>>(new Set());

  const filtered = ISSUES.filter((issue) => {
    const matchesSearch =
      searchQuery === "" ||
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.neighborhood.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesNeighborhood =
      neighborhood === "Todos os Bairros" || issue.neighborhood === neighborhood;

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "critical" && issue.severity === "critical") ||
      (activeTab === "recurrent" && issue.isRecurrent) ||
      (activeTab === "most-voted" && issue.votes >= 150);

    return matchesSearch && matchesNeighborhood && matchesTab;
  });

  const handleSupport = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setSupportedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const tabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: "Todas" },
    { id: "critical", label: "Críticas" },
    { id: "recurrent", label: "Recorrentes" },
    { id: "most-voted", label: "Mais Votadas" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            className="text-base"
            style={{ color: darkMode ? "#FFFFFF" : "#1D1D1F", fontWeight: 700 }}
          >
            Ocorrências Recentes
          </h2>
          <p className="text-xs mt-0.5" style={{ color: darkMode ? "#666" : "#9CA3AF" }}>
            {filtered.length} ocorrência{filtered.length !== 1 ? "s" : ""} encontrada
            {filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 text-xs px-3 h-8 rounded-xl cursor-pointer"
          style={{
            backgroundColor: darkMode ? "#2a2a2a" : "#F5F7FA",
            border: `1px solid ${darkMode ? "#333" : "#E8ECF0"}`,
            color: darkMode ? "#aaa" : "#6B7280",
          }}
        >
          <Filter size={12} />
          <span>Filtros</span>
        </div>
      </div>

      {/* Tab Filters */}
      <div className="flex gap-1 mb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-3 h-8 rounded-xl text-xs transition-all"
            style={{
              backgroundColor:
                activeTab === tab.id
                  ? "#1565C0"
                  : darkMode
                  ? "#2a2a2a"
                  : "#F5F7FA",
              color: activeTab === tab.id ? "#fff" : darkMode ? "#888" : "#6B7280",
              fontWeight: activeTab === tab.id ? 600 : 400,
              border: `1px solid ${
                activeTab === tab.id
                  ? "#1565C0"
                  : darkMode
                  ? "#333"
                  : "#E8ECF0"
              }`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Neighborhood Dropdown */}
      <div className="mb-4 relative">
        <div
          className="flex items-center justify-between px-3 h-9 rounded-xl cursor-pointer"
          style={{
            backgroundColor: darkMode ? "#2a2a2a" : "#F5F7FA",
            border: `1px solid ${darkMode ? "#333" : "#E8ECF0"}`,
          }}
        >
          <div className="flex items-center gap-2">
            <MapPin size={13} color={darkMode ? "#888" : "#9CA3AF"} />
            <select
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="bg-transparent text-xs outline-none cursor-pointer flex-1"
              style={{ color: darkMode ? "#ccc" : "#4B5563" }}
            >
              {NEIGHBORHOODS.map((n) => (
                <option key={n} value={n} style={{ backgroundColor: darkMode ? "#1E1E1E" : "#fff" }}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <ChevronDown size={13} color={darkMode ? "#666" : "#9CA3AF"} />
        </div>
      </div>

      {/* Issue Cards */}
      <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1" style={{ scrollbarWidth: "thin" }}>
        {filtered.length === 0 && (
          <div
            className="text-center py-12 text-sm"
            style={{ color: darkMode ? "#555" : "#9CA3AF" }}
          >
            Nenhuma ocorrência encontrada
          </div>
        )}
        {filtered.map((issue) => {
          const statusCfg = STATUS_CONFIG[issue.status];
          const severityCfg = SEVERITY_CONFIG[issue.severity];
          const isSelected = selectedIssueId === issue.id;
          const isSupported = supportedIds.has(issue.id);

          return (
            <div
              key={issue.id}
              onClick={() => onSelectIssue(issue)}
              className="rounded-2xl overflow-hidden cursor-pointer transition-all"
              style={{
                backgroundColor: darkMode ? "#1E1E1E" : "#FFFFFF",
                border: `1px solid ${
                  isSelected
                    ? "#1565C0"
                    : darkMode
                    ? "#2a2a2a"
                    : "#EEF1F5"
                }`,
                boxShadow: isSelected
                  ? "0 0 0 2px rgba(21,101,192,0.2)"
                  : darkMode
                  ? "none"
                  : "0 2px 6px rgba(0,0,0,0.04)",
                transform: isSelected ? "translateX(2px)" : "none",
              }}
            >
              <div className="flex gap-0">
                {/* Severity stripe */}
                <div
                  className="w-1 shrink-0 rounded-l-2xl"
                  style={{ backgroundColor: severityCfg.color }}
                />

                {/* Thumbnail */}
                <div className="w-20 h-20 shrink-0 overflow-hidden">
                  <img
                    src={issue.image}
                    alt={issue.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 p-3 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4
                      className="text-xs leading-tight line-clamp-2 flex-1"
                      style={{
                        color: darkMode ? "#FFFFFF" : "#1D1D1F",
                        fontWeight: 600,
                      }}
                    >
                      {issue.title}
                    </h4>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: darkMode ? statusCfg.darkBg : statusCfg.bg,
                        color: statusCfg.color,
                        fontWeight: 600,
                        fontSize: "10px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {statusCfg.label}
                    </span>
                  </div>

                  <div
                    className="flex items-center gap-1 text-xs mb-2 truncate"
                    style={{ color: darkMode ? "#666" : "#9CA3AF" }}
                  >
                    <MapPin size={10} />
                    <span className="truncate">{issue.address}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1" style={{ color: darkMode ? "#666" : "#9CA3AF" }}>
                        <Users size={10} />
                        <span className="text-xs">{issue.votes}</span>
                      </div>
                      {issue.status !== "Resolved" && (
                        <div className="flex items-center gap-1" style={{ color: darkMode ? "#666" : "#9CA3AF" }}>
                          <Calendar size={10} />
                          <span className="text-xs">{issue.daysOpen}d aberta</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => handleSupport(e, issue.id)}
                      className="flex items-center gap-1 text-xs px-2 h-6 rounded-lg transition-all"
                      style={{
                        backgroundColor: isSupported
                          ? "#1565C0"
                          : darkMode
                          ? "#2a2a2a"
                          : "#F5F7FA",
                        color: isSupported ? "#fff" : darkMode ? "#888" : "#6B7280",
                        border: `1px solid ${
                          isSupported ? "#1565C0" : darkMode ? "#333" : "#E8ECF0"
                        }`,
                      }}
                    >
                      <ThumbsUp size={10} />
                      <span>{isSupported ? "Apoiado" : "Apoiar"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
