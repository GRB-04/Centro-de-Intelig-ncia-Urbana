import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  BarChart2,
  Map as MapIcon,
  List,
  Activity,
} from "lucide-react";

import { Header } from "./components/Header";
import { MetricsPanel } from "./components/MetricsPanel";
import { IssueList } from "./components/IssueList";
import { MapView } from "./components/MapView";
import {
  ReportModal,
  type ReportModalInitialData,
} from "./components/ReportModal";
import { ChatWidget } from "./components/ChatWidget";

import { supabase } from "../lib/supabase";

type View = "split" | "list" | "map";

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

function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}

function normalizeStatus(raw: string): IssueStatus {
  const value = (raw ?? "").toLowerCase().trim();

  if (
    value === "analise" ||
    value === "em analise" ||
    value === "em_analise" ||
    value === "em processo"
  ) {
    return "em_analise";
  }

  if (
    value === "resolvido" ||
    value === "finalizado" ||
    value === "finalizada"
  ) {
    return "resolvido";
  }

  if (value === "aberto" || value === "aberta") {
    return "aberto";
  }

  return "aberto";
}

function getDisplayName(user: any) {
  const metadata = user?.user_metadata ?? {};

  const fullName =
    metadata.full_name ||
    metadata.name ||
    metadata.nome ||
    user?.email?.split("@")[0] ||
    "Gabriel";

  return String(fullName).trim().split(" ")[0];
}

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportModalInitialData, setReportModalInitialData] =
    useState<ReportModalInitialData | null>(null);

  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [view, setView] = useState<View>("split");

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [issuesError, setIssuesError] = useState<string | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState("Gabriel");

  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [votedByMe, setVotedByMe] = useState<Set<string>>(new Set());

  const isMountedRef = useRef(true);

  const bg = darkMode ? "#121212" : "#F5F7FA";
  const textColor = darkMode ? "#FFFFFF" : "#1D1D1F";
  const mutedColor = darkMode ? "#666" : "#9CA3AF";
  const borderColor = darkMode ? "#2a2a2a" : "#E8ECF0";

  const clearDashboardState = useCallback(() => {
    setIssues([]);
    setVoteCounts({});
    setVotedByMe(new Set());
    setSelectedIssue(null);
    setIssuesError(null);
    setShowReportModal(false);
    setReportModalInitialData(null);
  }, []);

  async function handleLogout() {
    clearDashboardState();
    await supabase.auth.signOut();
  }

  const fetchVoteCounts = useCallback(async (issueIds: string[]) => {
    const ids = uniq(issueIds).filter(Boolean);

    if (ids.length === 0) return {};

    const { data, error } = await supabase
      .from("issue_vote_counts")
      .select("issue_id, count")
      .in("issue_id", ids);

    if (error) {
      console.error("[Votes] fetchVoteCounts error:", error);
      throw error;
    }

    const map: Record<string, number> = {};
    for (const row of data ?? []) {
      map[String(row.issue_id)] = Number(row.count ?? 0);
    }

    return map;
  }, []);

  const fetchVotedByMe = useCallback(
    async (userId: string, issueIds: string[]) => {
      const ids = uniq(issueIds).filter(Boolean);

      if (!userId || ids.length === 0) return new Set<string>();

      const { data, error } = await supabase
        .from("issue_votes")
        .select("issue_id")
        .eq("user_id", userId)
        .in("issue_id", ids);

      if (error) {
        console.error("[Votes] fetchVotedByMe error:", error);
        throw error;
      }

      return new Set((data ?? []).map((row) => String(row.issue_id)));
    },
    []
  );

  const refreshVotesForCurrentIssues = useCallback(
    async (nextIssues: Issue[], userIdOverride?: string | null) => {
      const ids = nextIssues.map((i) => i.id).filter(Boolean);

      if (ids.length === 0) {
        if (!isMountedRef.current) return;
        setVoteCounts({});
        setVotedByMe(new Set());
        return;
      }

      const uid = userIdOverride ?? currentUserId;

      try {
        const counts = await fetchVoteCounts(ids);
        const mine = uid ? await fetchVotedByMe(uid, ids) : new Set<string>();

        if (!isMountedRef.current) return;

        setVoteCounts(counts);
        setVotedByMe(mine);
      } catch (error) {
        console.error("[Votes] refreshVotesForCurrentIssues error:", error);
      }
    },
    [currentUserId, fetchVoteCounts, fetchVotedByMe]
  );

  const loadIssues = useCallback(
    async (userIdOverride?: string | null) => {
      try {
        setLoadingIssues(true);
        setIssuesError(null);

        const { data, error } = await supabase
          .from("issues")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const rows = (data ?? []).map((row: any) => ({
          ...row,
          status: normalizeStatus(row.status),
        })) as Issue[];

        if (!isMountedRef.current) return;

        setIssues(rows);

        const uid = userIdOverride ?? currentUserId ?? null;
        await refreshVotesForCurrentIssues(rows, uid);

        setSelectedIssue((prev) => {
          if (!prev) return prev;
          const stillExists = rows.some((r) => r.id === prev.id);
          return stillExists ? prev : null;
        });
      } catch (err: any) {
        console.error("[Issues] loadIssues error:", err);
        if (!isMountedRef.current) return;
        setIssuesError(err?.message ?? "Erro ao carregar.");
      } finally {
        if (isMountedRef.current) {
          setLoadingIssues(false);
        }
      }
    },
    [currentUserId, refreshVotesForCurrentIssues]
  );

  async function onToggleVote(issueId: string, shouldVote: boolean) {
    const { data: userRes, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("[Votes] getUser error:", userError);
      return;
    }

    const uid = userRes.user?.id ?? null;
    if (!uid) return;

    try {
      if (shouldVote) {
        const { error } = await supabase.from("issue_votes").insert({
          issue_id: issueId,
          user_id: uid,
        });

        if (error && error.code !== "23505") {
          throw error;
        }
      } else {
        const { error } = await supabase
          .from("issue_votes")
          .delete()
          .eq("issue_id", issueId)
          .eq("user_id", uid);

        if (error) throw error;
      }

      await refreshVotesForCurrentIssues(issues, uid);
    } catch (error) {
      console.error("[Votes] onToggleVote error:", error);
      throw error;
    }
  }

  function openEmptyReportModal() {
    setReportModalInitialData(null);
    setShowReportModal(true);
  }

  function openReportModalWithPrefill(initialData: ReportModalInitialData) {
    setReportModalInitialData(initialData);
    setShowReportModal(true);
  }

  useEffect(() => {
    isMountedRef.current = true;

    async function bootstrap() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMountedRef.current) return;

      if (user) {
        const uid = user.id;
        setCurrentUserId(uid);
        setCurrentUserName(getDisplayName(user));
        await loadIssues(uid);
      } else {
        setCurrentUserId(null);
        setCurrentUserName("Gabriel");
        clearDashboardState();
        setLoadingIssues(false);
      }
    }

    void bootstrap();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMountedRef.current) return;

        const user = session?.user ?? null;

        if (!user) {
          setCurrentUserId(null);
          setCurrentUserName("Gabriel");
          clearDashboardState();
          setLoadingIssues(false);
          return;
        }

        const uid = user.id;
        setCurrentUserId(uid);
        setCurrentUserName(getDisplayName(user));
        await loadIssues(uid);
      }
    );

    return () => {
      isMountedRef.current = false;
      authListener.subscription.unsubscribe();
    };
  }, [clearDashboardState, loadIssues]);

  const filteredIssues = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return issues;

    return issues.filter((i) => {
      const hay = [
        i.title,
        i.description ?? "",
        i.category,
        i.status,
        i.address ?? "",
        i.neighborhood ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [issues, searchQuery]);

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{
        backgroundColor: bg,
        color: textColor,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Header
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((d) => !d)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        userName={currentUserName}
        onProfileClick={() => console.log("Perfil")}
        onSettingsClick={() => console.log("Configurações")}
        onLogoutClick={handleLogout}
      />

      <main className="flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-6 py-6 gap-6">
        <MetricsPanel darkMode={darkMode} issues={issues} />

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity size={14} color="#1565C0" />
            <span className="text-xs uppercase tracking-widest">
              Gestão de Ocorrências
            </span>
            <span className="text-xs" style={{ color: mutedColor }}>
              {loadingIssues ? "• carregando…" : `• ${filteredIssues.length} itens`}
            </span>
            {issuesError && (
              <span
                className="text-xs"
                style={{ color: "#ef4444" }}
                title={issuesError}
              >
                • erro
              </span>
            )}
          </div>

          <div className="flex gap-2">
            {(["split", "list", "map"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 h-8 rounded-xl text-xs flex items-center gap-2"
                style={{
                  backgroundColor:
                    view === v ? "#1565C0" : darkMode ? "#1E1E1E" : "#fff",
                  color: view === v ? "#fff" : mutedColor,
                  border: `1px solid ${view === v ? "#1565C0" : borderColor}`,
                }}
              >
                {v === "split" && <BarChart2 size={14} />}
                {v === "list" && <List size={14} />}
                {v === "map" && <MapIcon size={14} />}
                <span className="hidden sm:inline">
                  {v === "split" ? "Dividido" : v === "list" ? "Lista" : "Mapa"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div
          className={`flex-1 gap-4 ${
            view === "split"
              ? "grid grid-cols-1 lg:grid-cols-[420px_1fr]"
              : "flex"
          }`}
        >
          {(view === "split" || view === "list") && (
            <IssueList
              darkMode={darkMode}
              searchQuery={searchQuery}
              onSelectIssue={setSelectedIssue}
              selectedIssueId={selectedIssue?.id ?? null}
              issues={filteredIssues}
              loading={loadingIssues}
              currentUserId={currentUserId}
              voteCounts={voteCounts}
              votedByMe={votedByMe}
              onToggleVote={onToggleVote}
            />
          )}

          {(view === "split" || view === "map") && (
            <MapView
              darkMode={darkMode}
              issues={filteredIssues}
              selectedIssue={selectedIssue}
              onSelectIssue={(issue) => setSelectedIssue(issue as Issue)}
            />
          )}
        </div>
      </main>

      <button
        onClick={openEmptyReportModal}
        className="fixed bottom-6 right-24 z-[1000] flex items-center gap-2 h-12 px-5 rounded-2xl"
        style={{
          backgroundColor: darkMode ? "#FFFFFF" : "#1D1D1F",
          color: darkMode ? "#1D1D1F" : "#fff",
          fontWeight: 600,
          boxShadow: "0 14px 36px rgba(0,0,0,0.18)",
        }}
      >
        <Plus size={18} />
        Reportar Ocorrência
      </button>

      <ChatWidget
        darkMode={darkMode}
        currentUserName={currentUserName}
        onStartReport={openReportModalWithPrefill}
      />

      {showReportModal && (
        <ReportModal
          darkMode={darkMode}
          initialData={reportModalInitialData ?? undefined}
          onClose={() => {
            setShowReportModal(false);
            setReportModalInitialData(null);
          }}
          onCreated={async () => {
            setShowReportModal(false);
            setReportModalInitialData(null);
            await loadIssues(currentUserId);
          }}
        />
      )}
    </div>
  );
}