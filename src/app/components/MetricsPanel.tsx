import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Tag,
} from "lucide-react";
import type { Issue } from "../Dashboard";

interface MetricsPanelProps {
  darkMode: boolean;
  issues?: Issue[]; // 👈 agora é opcional
}

function MetricCard({
  darkMode,
  icon,
  iconBg,
  label,
  value,
  sub,
  accentColor,
}: any) {
  return (
    <div
      className="flex-1 min-w-[180px] rounded-2xl p-5 flex flex-col gap-3"
      style={{
        backgroundColor: darkMode ? "#1E1E1E" : "#FFFFFF",
        border: `1px solid ${darkMode ? "#2a2a2a" : "#EEF1F5"}`,
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>

      <div>
        <p className="text-xs uppercase mb-1" style={{ color: "#9CA3AF" }}>
          {label}
        </p>
        <p
          className="text-3xl"
          style={{
            color: accentColor,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </p>
        {sub && (
          <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

export function MetricsPanel({ darkMode, issues = [] }: MetricsPanelProps) {
  // 👆 DEFAULT = [] → nunca mais quebra

  const totalActive = issues.filter(
    (i) => i.status !== "resolvido"
  ).length;

  const now = new Date();

  const resolvedThisMonth = issues.filter((i) => {
    if (i.status !== "resolvido") return false;
    const d = new Date(i.created_at);
    return (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }).length;

  const openIssues = issues.filter(
    (i) => i.status !== "resolvido"
  );

  const avgResponseDays =
    openIssues.length === 0
      ? 0
      : Math.round(
          openIssues.reduce((acc, i) => {
            const days =
              (Date.now() - new Date(i.created_at).getTime()) /
              (1000 * 60 * 60 * 24);
            return acc + days;
          }, 0) / openIssues.length
        );

  const neighborhoodMap: Record<string, number> = {};
  issues.forEach((i) => {
    if (!i.neighborhood) return;
    neighborhoodMap[i.neighborhood] =
      (neighborhoodMap[i.neighborhood] || 0) + 1;
  });

  const mostIssuesNeighborhood =
    Object.entries(neighborhoodMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const categoryMap: Record<string, number> = {};
  issues.forEach((i) => {
    categoryMap[i.category] =
      (categoryMap[i.category] || 0) + 1;
  });

  const mostCategory =
    Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  return (
    <section className="w-full">
      <div className="flex flex-wrap gap-4">
        <MetricCard
          darkMode={darkMode}
          icon={<AlertTriangle size={18} color="#E53935" />}
          iconBg="#FFF0F0"
          label="Ocorrências Ativas"
          value={totalActive}
          sub="Não resolvidas"
          accentColor="#E53935"
        />

        <MetricCard
          darkMode={darkMode}
          icon={<CheckCircle2 size={18} color="#2E7D32" />}
          iconBg="#F0FAF0"
          label="Resolvidas no Mês"
          value={resolvedThisMonth}
          accentColor="#2E7D32"
        />

        <MetricCard
          darkMode={darkMode}
          icon={<Clock size={18} color="#FF9800" />}
          iconBg="#FFF8E1"
          label="Tempo Médio (dias)"
          value={avgResponseDays}
          accentColor="#FF9800"
        />

        <MetricCard
          darkMode={darkMode}
          icon={<MapPin size={18} color="#1565C0" />}
          iconBg="#E3F0FF"
          label="Bairro com Mais Ocorrências"
          value={mostIssuesNeighborhood}
          accentColor="#1565C0"
        />

        <MetricCard
          darkMode={darkMode}
          icon={<Tag size={18} color="#7B3F9E" />}
          iconBg="#F3E8FF"
          label="Categoria Mais Frequente"
          value={mostCategory}
          accentColor="#7B3F9E"
        />
      </div>
    </section>
  );
}