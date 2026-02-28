import { Search, Bell, User, Moon, Sun, MapPin, ChevronDown } from "lucide-react";

interface HeaderProps {
  darkMode: boolean;
  onToggleDark: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function Header({ darkMode, onToggleDark, searchQuery, onSearchChange }: HeaderProps) {
  return (
    <header
      className="w-full border-b sticky top-0 z-50"
      style={{
        backgroundColor: darkMode ? "#1E1E1E" : "#FFFFFF",
        borderColor: darkMode ? "#2a2a2a" : "#E8ECF0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center gap-6">
        {/* Logo & Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#1565C0" }}
          >
            <MapPin size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-xs uppercase tracking-widest"
                style={{ color: "#1565C0", letterSpacing: "0.12em" }}
              >
                Belém
              </span>
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: darkMode ? "#2a3a5c" : "#E3F0FF",
                  color: "#1565C0",
                  fontSize: "10px",
                  fontWeight: 600,
                }}
              >
                BETA
              </span>
            </div>
            <h1
              className="text-sm"
              style={{
                color: darkMode ? "#FFFFFF" : "#1D1D1F",
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
              }}
            >
              Urban Intelligence Dashboard
            </h1>
          </div>
        </div>

        {/* Subtitle */}
        <div
          className="hidden lg:flex items-center gap-1 text-xs px-3 py-1 rounded-full"
          style={{
            backgroundColor: darkMode ? "#2a2a2a" : "#F5F7FA",
            color: darkMode ? "#888" : "#6B7280",
          }}
        >
          <span>Projeto Acadêmico – Versão Beta</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <div
          className="hidden md:flex items-center gap-2 px-3 h-9 rounded-xl w-64"
          style={{
            backgroundColor: darkMode ? "#2a2a2a" : "#F5F7FA",
            border: `1px solid ${darkMode ? "#333" : "#E8ECF0"}`,
          }}
        >
          <Search size={15} color={darkMode ? "#666" : "#9CA3AF"} />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar ocorrências..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: darkMode ? "#fff" : "#1D1D1F" }}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{
              backgroundColor: darkMode ? "#2a2a2a" : "#F5F7FA",
              border: `1px solid ${darkMode ? "#333" : "#E8ECF0"}`,
            }}
          >
            <Bell size={16} color={darkMode ? "#ccc" : "#6B7280"} />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: "#E53935" }}
            />
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={onToggleDark}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{
              backgroundColor: darkMode ? "#2a2a2a" : "#F5F7FA",
              border: `1px solid ${darkMode ? "#333" : "#E8ECF0"}`,
            }}
          >
            {darkMode ? (
              <Sun size={16} color="#FFD700" />
            ) : (
              <Moon size={16} color="#6B7280" />
            )}
          </button>

          {/* User */}
          <button
            className="flex items-center gap-2 h-9 px-3 rounded-xl transition-colors"
            style={{
              backgroundColor: darkMode ? "#2a2a2a" : "#F5F7FA",
              border: `1px solid ${darkMode ? "#333" : "#E8ECF0"}`,
            }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#1565C0" }}
            >
              <User size={11} color="#fff" />
            </div>
            <span className="text-xs hidden sm:block" style={{ color: darkMode ? "#ccc" : "#4B5563" }}>
              Gestor
            </span>
            <ChevronDown size={12} color={darkMode ? "#666" : "#9CA3AF"} />
          </button>
        </div>
      </div>
    </header>
  );
}
