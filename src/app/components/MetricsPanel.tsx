import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Tag,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { METRICS } from "../data/issues";

interface MetricsPanelProps {
  darkMode: boolean;
}

interface MetricCardProps {
  darkMode: boolean;
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  accentColor: string;
}

function MetricCard({
  darkMode,
  icon,
  iconBg,
  label,
  value,
  sub,
  trend,
  trendLabel,
  accentColor,
}: MetricCardProps) {
  return (
    <div
      className="flex-1 min-w-[180px] rounded-2xl p-5 flex flex-col gap-3"
      style={{
        backgroundColor: darkMode ? "#1E1E1E" : "#FFFFFF",
        border: `1px solid ${darkMode ? "#2a2a2a" : "#EEF1F5"}`,
        boxShadow: darkMode
          ? "0 0 0 1px rgba(255,255,255,0.04)"
          : "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </div>
        {trend && trendLabel && (
          <div
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
            style={{
              backgroundColor:
                trend === "up"
                  ? darkMode
                    ? "#1a2a1a"
                    : "#F0FAF0"
                  : trend === "down"
                  ? darkMode
                    ? "#2a1a1a"
                    : "#FFF5F5"
                  : darkMode
                  ? "#2a2a2a"
                  : "#F5F7FA",
              color:
                trend === "up"
                  ? "#2E7D32"
                  : trend === "down"
                  ? "#E53935"
                  : "#6B7280",
            }}
          >
            {trend === "up" ? (
              <TrendingUp size={11} />
            ) : trend === "down" ? (
              <TrendingDown size={11} />
            ) : null}
            <span>{trendLabel}</span>
          </div>
        )}
      </div>

      <div>
        <p
          className="text-xs uppercase tracking-wider mb-1"
          style={{ color: darkMode ? "#666" : "#9CA3AF", letterSpacing: "0.06em" }}
        >
          {label}
        </p>
        <p
          className="text-3xl"
          style={{
            color: accentColor,
            fontWeight: 700,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </p>
        {sub && (
          <p className="text-xs mt-1" style={{ color: darkMode ? "#555" : "#9CA3AF" }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

export function MetricsPanel({ darkMode }: MetricsPanelProps) {
  return (
    <section className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-1 h-5 rounded-full"
          style={{ backgroundColor: "#1565C0" }}
        />
        <h2
          className="text-xs uppercase tracking-widest"
          style={{ color: darkMode ? "#888" : "#6B7280", letterSpacing: "0.1em" }}
        >
          Indicadores Urbanos em Tempo Real
        </h2>
        <div className="flex-1 border-t" style={{ borderColor: darkMode ? "#2a2a2a" : "#EEF1F5" }} />
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: darkMode ? "#1a2a1a" : "#F0FAF0",
            color: "#2E7D32",
          }}
        >
          ● Ao vivo
        </span>
      </div>

      <div className="flex flex-wrap gap-4">
        <MetricCard
          darkMode={darkMode}
          icon={<AlertTriangle size={18} color="#E53935" />}
          iconBg={darkMode ? "#2a1818" : "#FFF0F0"}
          label="Ocorrências Ativas"
          value={METRICS.totalActive.toLocaleString("pt-BR")}
          sub="Em toda a cidade"
          trend="down"
          trendLabel="-8% este mês"
          accentColor="#E53935"
        />
        <MetricCard
          darkMode={darkMode}
          icon={<CheckCircle2 size={18} color="#2E7D32" />}
          iconBg={darkMode ? "#1a2a1a" : "#F0FAF0"}
          label="Resolvidas no Mês"
          value={METRICS.resolvedThisMonth}
          sub="Fevereiro/2026"
          trend="up"
          trendLabel="+12% vs jan"
          accentColor="#2E7D32"
        />
        <MetricCard
          darkMode={darkMode}
          icon={<Clock size={18} color="#FF9800" />}
          iconBg={darkMode ? "#2a2010" : "#FFF8E1"}
          label="Tempo Médio de Resposta"
          value={`${METRICS.avgResponseDays}d`}
          sub="Meta: 5 dias"
          trend="down"
          trendLabel="-1.3d vs meta"
          accentColor="#FF9800"
        />
        <MetricCard
          darkMode={darkMode}
          icon={<MapPin size={18} color="#1565C0" />}
          iconBg={darkMode ? "#0d1a2e" : "#E3F0FF"}
          label="Bairro Mais Crítico"
          value={METRICS.mostIssuesNeighborhood}
          sub="142 ocorrências ativas"
          accentColor="#1565C0"
        />
        <MetricCard
          darkMode={darkMode}
          icon={<Tag size={18} color="#7B3F9E" />}
          iconBg={darkMode ? "#1e1228" : "#F3E8FF"}
          label="Categoria Mais Crítica"
          value="Vias e Pavim."
          sub="38% das ocorrências"
          accentColor="#7B3F9E"
        />
      </div>
    </section>
  );
}
