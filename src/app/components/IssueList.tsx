import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import {
  ThumbsUp,
  MapPin,
  Calendar,
  Users,
  ChevronDown,
  Filter,
} from "lucide-react";

export type IssueStatus = "aberto" | "em_analise" | "resolvido";
export type IssueSeverity = "critical" | "high" | "medium" | "low";

export type Issue = {
  id: string;
  created_at: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  status: IssueStatus;
  address: string | null;
  neighborhood: string | null;
  lat: number;
  lng: number;
  photo_url: string | null;
  severity: IssueSeverity;
};

interface IssueListProps {
  darkMode: boolean;
  searchQuery: string;
  onSelectIssue: (issue: Issue) => void;
  selectedIssueId: string | null;
  issues: Issue[];
  loading?: boolean;
  currentUserId: string | null;
  voteCounts?: Record<string, number>;
  votedByMe?: Set<string>;
  onToggleVote: (issueId: string, shouldVote: boolean) => Promise<void>;
}

type FilterTab = "all" | "critical" | "recurrent" | "most-voted";

const STATUS_CONFIG: Record<
  IssueStatus,
  { label: string; bg: string; color: string; darkBg: string }
> = {
  aberto: {
    label: "Aberta",
    bg: "#FFF0F0",
    color: "#E53935",
    darkBg: "#2a1818",
  },
  em_analise: {
    label: "Em Análise",
    bg: "#FFF8E1",
    color: "#FF9800",
    darkBg: "#2a2010",
  },
  resolvido: {
    label: "Resolvida",
    bg: "#F0FAF0",
    color: "#2E7D32",
    darkBg: "#1a2a1a",
  },
};

const SEVERITY_CONFIG: Record<IssueSeverity, { color: string; label: string }> =
  {
    critical: { color: "#E53935", label: "Crítico" },
    high: { color: "#FF9800", label: "Alto" },
    medium: { color: "#FFC107", label: "Médio" },
    low: { color: "#4CAF50", label: "Baixo" },
  };

function isIssueStatus(v: unknown): v is IssueStatus {
  return v === "aberto" || v === "em_analise" || v === "resolvido";
}

function isIssueSeverity(v: unknown): v is IssueSeverity {
  return v === "critical" || v === "high" || v === "medium" || v === "low";
}

function normalizeStatus(input: unknown): IssueStatus {
  const raw = (input ?? "").toString().toLowerCase().trim();
  if (raw === "em análise" || raw === "em analise" || raw === "em-analise") {
    return "em_analise";
  }
  if (raw === "aberta") return "aberto";
  if (raw === "resolvida") return "resolvido";
  if (isIssueStatus(raw)) return raw;
  return "aberto";
}

function normalizeSeverity(input: unknown): IssueSeverity {
  const raw = (input ?? "").toString().toLowerCase().trim();
  if (isIssueSeverity(raw)) return raw;
  return "medium";
}

function buildRecurrentSet(issues: Issue[]) {
  const counts = new Map<string, number>();

  for (const i of issues) {
    const key = `${i.category}::${i.neighborhood ?? ""}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const recurrent = new Set<string>();
  counts.forEach((v, k) => {
    if (v >= 2) recurrent.add(k);
  });

  return recurrent;
}

function daysSince(dateIso: string) {
  const d = new Date(dateIso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - d);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function IssueList(props: IssueListProps) {
  const {
    darkMode,
    searchQuery,
    onSelectIssue,
    selectedIssueId,
    issues,
    loading,
    currentUserId,
    onToggleVote,
    voteCounts = {},
    votedByMe = new Set<string>(),
  } = props;

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [neighborhood, setNeighborhood] = useState("Todos os Bairros");
  const [pendingVotes, setPendingVotes] = useState<Set<string>>(new Set());
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const listRef = useRef<HTMLDivElement | null>(null);

  const neighborhoods = useMemo(() => {
    const set = new Set<string>();
    issues.forEach((i) => {
      if (i.neighborhood) set.add(i.neighborhood);
    });
    return ["Todos os Bairros", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [issues]);

  const recurrentSet = useMemo(() => buildRecurrentSet(issues), [issues]);

  const getIsSupported = (issueId: string) => votedByMe.has(issueId);

  const getVotes = (issueId: string) => voteCounts[issueId] ?? 0;

  // Dynamic threshold: top 25% by vote count (min 1 vote)
  const mostVotedThreshold = useMemo(() => {
    const sortedVotes = issues
      .map((i) => voteCounts[i.id] ?? 0)
      .filter((v) => v > 0)
      .sort((a, b) => b - a);
    if (sortedVotes.length === 0) return 1;
    const top25Index = Math.max(0, Math.floor(sortedVotes.length * 0.25) - 1);
    return sortedVotes[top25Index] ?? 1;
  }, [issues, voteCounts]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return issues.filter((issue) => {
      const matchesSearch =
        !q ||
        issue.title.toLowerCase().includes(q) ||
        (issue.address ?? "").toLowerCase().includes(q) ||
        (issue.neighborhood ?? "").toLowerCase().includes(q) ||
        (issue.category ?? "").toLowerCase().includes(q);

      const matchesNeighborhood =
        neighborhood === "Todos os Bairros" || issue.neighborhood === neighborhood;

      const isRecurrent = recurrentSet.has(
        `${issue.category}::${issue.neighborhood ?? ""}`
      );
      const votes = getVotes(issue.id);

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "critical" &&
          normalizeSeverity(issue.severity) === "critical") ||
        (activeTab === "recurrent" && isRecurrent) ||
        (activeTab === "most-voted" && votes >= mostVotedThreshold);

      return matchesSearch && matchesNeighborhood && matchesTab;
    });
  }, [issues, searchQuery, neighborhood, activeTab, recurrentSet, voteCounts, mostVotedThreshold]);

  // Tab counts
  const tabCounts = useMemo(() => ({
    all: issues.length,
    critical: issues.filter((i) => normalizeSeverity(i.severity) === "critical").length,
    recurrent: issues.filter((i) => recurrentSet.has(`${i.category}::${i.neighborhood ?? ""}`)).length,
    "most-voted": issues.filter((i) => (voteCounts[i.id] ?? 0) >= mostVotedThreshold).length,
  }), [issues, recurrentSet, voteCounts, mostVotedThreshold]);

  // Scroll to selected issue
  useEffect(() => {
    if (!selectedIssueId) return;
    const el = itemRefs.current[selectedIssueId];
    if (el && listRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedIssueId]);

  const tabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: "Todas" },
    { id: "critical", label: "Críticas" },
    { id: "recurrent", label: "Recorrentes" },
    { id: "most-voted", label: "Mais Votadas" },
  ];


  const handleSupport = async (
    e: MouseEvent<HTMLButtonElement>,
    issueId: string
  ) => {
    e.stopPropagation();
    if (!currentUserId) return;
    if (pendingVotes.has(issueId)) return;

    setPendingVotes((prev) => {
      const next = new Set(prev);
      next.add(issueId);
      return next;
    });

    try {
      const shouldVote = !votedByMe.has(issueId);
      await onToggleVote(issueId, shouldVote);
    } catch (error) {
      console.error("[IssueList] handleSupport error:", error);
    } finally {
      setPendingVotes((prev) => {
        const next = new Set(prev);
        next.delete(issueId);
        return next;
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            className="text-base"
            style={{
              color: darkMode ? "#FFFFFF" : "#1D1D1F",
              fontWeight: 700,
            }}
          >
            Ocorrências Recentes
          </h2>
          <p
            className="text-xs mt-0.5"
            style={{ color: darkMode ? "#666" : "#9CA3AF" }}
          >
            {loading
              ? "Carregando…"
              : `${filtered.length} ocorrência${
                  filtered.length !== 1 ? "s" : ""
                } encontrada${filtered.length !== 1 ? "s" : ""}`}
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

      <div className="flex gap-1 mb-3 flex-wrap">
        {tabs.map((tab) => {
          const count = tabCounts[tab.id];
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs transition-all"
              style={{
                backgroundColor: isActive ? "#1565C0" : darkMode ? "#2a2a2a" : "#F5F7FA",
                color: isActive ? "#fff" : darkMode ? "#888" : "#6B7280",
                fontWeight: isActive ? 600 : 400,
                border: `1px solid ${isActive ? "#1565C0" : darkMode ? "#333" : "#E8ECF0"}`,
              }}
            >
              {tab.label}
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: isActive ? "rgba(255,255,255,0.25)" : darkMode ? "#333" : "#E8ECF0",
                  color: isActive ? "#fff" : darkMode ? "#666" : "#9CA3AF",
                  fontWeight: 700,
                  minWidth: 16,
                  textAlign: "center",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-4 relative">
        <div
          className="flex items-center justify-between px-3 h-9 rounded-xl cursor-pointer"
          style={{
            backgroundColor: darkMode ? "#2a2a2a" : "#F5F7FA",
            border: `1px solid ${darkMode ? "#333" : "#E8ECF0"}`,
          }}
        >
          <div className="flex items-center gap-2 w-full">
            <MapPin size={13} color={darkMode ? "#888" : "#9CA3AF"} />
            <select
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="bg-transparent text-xs outline-none cursor-pointer flex-1"
              style={{ color: darkMode ? "#ccc" : "#4B5563" }}
            >
              {neighborhoods.map((n) => (
                <option
                  key={n}
                  value={n}
                  style={{ backgroundColor: darkMode ? "#1E1E1E" : "#fff" }}
                >
                  {n}
                </option>
              ))}
            </select>
          </div>
          <ChevronDown size={13} color={darkMode ? "#666" : "#9CA3AF"} />
        </div>
      </div>

      <div
        ref={listRef}
        className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1"
        style={{ scrollbarWidth: "thin" }}
      >
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
              style={{ backgroundColor: darkMode ? "#2a2a2a" : "#F5F7FA" }}
            >
              {activeTab === "critical" ? "⚠️" : activeTab === "recurrent" ? "🔄" : activeTab === "most-voted" ? "👍" : "📋"}
            </div>
            <p className="text-sm font-semibold" style={{ color: darkMode ? "#ccc" : "#374151" }}>
              {activeTab === "critical"
                ? "Nenhuma ocorrência crítica"
                : activeTab === "recurrent"
                ? "Nenhuma ocorrência recorrente"
                : activeTab === "most-voted"
                ? "Nenhuma ocorrência votada ainda"
                : "Nenhuma ocorrência encontrada"}
            </p>
            <p className="text-xs" style={{ color: darkMode ? "#555" : "#9CA3AF" }}>
              {activeTab === "most-voted"
                ? "Vote nas ocorrências para que apareçam aqui."
                : "Tente ajustar os filtros ou a busca."}
            </p>
          </div>
        )}

        {loading && (
          <div
            className="text-center py-12 text-sm"
            style={{ color: darkMode ? "#555" : "#9CA3AF" }}
          >
            Carregando ocorrências…
          </div>
        )}

        {!loading &&
          filtered.map((issue) => {
            const statusKey = normalizeStatus(issue.status);
            const statusCfg = STATUS_CONFIG[statusKey];

            const severityKey = normalizeSeverity(issue.severity);
            const severityCfg = SEVERITY_CONFIG[severityKey];

            const isSelected = selectedIssueId === issue.id;
            const isSupported = currentUserId ? getIsSupported(issue.id) : false;
            const votes = getVotes(issue.id);
            const daysOpen = daysSince(issue.created_at);
            const isPending = pendingVotes.has(issue.id);

            return (
              <div
                key={issue.id}
                ref={(el) => { itemRefs.current[issue.id] = el; }}
                onClick={() => onSelectIssue(issue)}
                className="rounded-2xl overflow-hidden cursor-pointer transition-all"
                style={{
                  backgroundColor: darkMode ? "#1E1E1E" : "#FFFFFF",
                  border: `1px solid ${
                    isSelected ? "#1565C0" : darkMode ? "#2a2a2a" : "#EEF1F5"
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
                  <div
                    className="w-1 shrink-0 rounded-l-2xl"
                    style={{ backgroundColor: severityCfg.color }}
                  />

                  <div
                    className="w-20 h-20 shrink-0 overflow-hidden"
                    style={{ backgroundColor: darkMode ? "#111" : "#f3f4f6" }}
                  >
                    {issue.photo_url ? (
                      <img
                        src={issue.photo_url}
                        alt={issue.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-[10px]"
                        style={{ color: darkMode ? "#777" : "#999" }}
                      >
                        sem foto
                      </div>
                    )}
                  </div>

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
                          backgroundColor: darkMode
                            ? statusCfg.darkBg
                            : statusCfg.bg,
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
                      <span className="truncate">
                        {issue.address ??
                          `${issue.neighborhood ?? "Belém"} • ${issue.category}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center gap-1"
                          style={{ color: darkMode ? "#666" : "#9CA3AF" }}
                        >
                          <Users size={10} />
                          <span className="text-xs">{votes}</span>
                        </div>

                        {statusKey !== "resolvido" && (
                          <div
                            className="flex items-center gap-1"
                            style={{ color: darkMode ? "#666" : "#9CA3AF" }}
                          >
                            <Calendar size={10} />
                            <span className="text-xs">{daysOpen}d aberta</span>
                          </div>
                        )}
                      </div>

                      <button
                        disabled={!currentUserId || isPending}
                        onClick={(e) => handleSupport(e, issue.id)}
                        className="flex items-center gap-1 text-xs px-2 h-6 rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
                        title={
                          !currentUserId
                            ? "Faça login para apoiar"
                            : isPending
                            ? "Salvando..."
                            : ""
                        }
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