import { useEffect, useRef, useState } from "react";
import {
  Search,
  Bell,
  User,
  Moon,
  Sun,
  MapPin,
  ChevronDown,
  Settings,
  LogOut,
  UserCircle2,
} from "lucide-react";

interface HeaderProps {
  darkMode: boolean;
  onToggleDark: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  userName?: string;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onLogoutClick?: () => Promise<void> | void;
}

export function Header({
  darkMode,
  onToggleDark,
  searchQuery,
  onSearchChange,
  userName = "Gabriel",
  onProfileClick,
  onSettingsClick,
  onLogoutClick,
}: HeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const surfaceColor = darkMode ? "#2a2a2a" : "#F5F7FA";
  const borderColor = darkMode ? "#333" : "#E8ECF0";
  const textPrimary = darkMode ? "#FFFFFF" : "#1D1D1F";
  const textSecondary = darkMode ? "#ccc" : "#4B5563";
  const iconMuted = darkMode ? "#666" : "#9CA3AF";

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
                color: textPrimary,
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
              }}
            >
              Urban Intelligence Dashboard
            </h1>
          </div>
        </div>

        <div
          className="hidden lg:flex items-center gap-1 text-xs px-3 py-1 rounded-full"
          style={{
            backgroundColor: darkMode ? "#2a2a2a" : "#F5F7FA",
            color: darkMode ? "#888" : "#6B7280",
          }}
        >
          <span>Projeto Acadêmico – Versão Beta</span>
        </div>

        <div className="flex-1" />

        <div
          className="hidden md:flex items-center gap-2 px-3 h-9 rounded-xl w-72"
          style={{
            backgroundColor: surfaceColor,
            border: `1px solid ${borderColor}`,
          }}
        >
          <Search size={15} color={iconMuted} />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar ocorrências..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: textPrimary }}
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{
              backgroundColor: surfaceColor,
              border: `1px solid ${borderColor}`,
            }}
          >
            <Bell size={16} color={darkMode ? "#ccc" : "#6B7280"} />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: "#E53935" }}
            />
          </button>

          <button
            type="button"
            onClick={onToggleDark}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{
              backgroundColor: surfaceColor,
              border: `1px solid ${borderColor}`,
            }}
          >
            {darkMode ? (
              <Sun size={16} color="#FFD700" />
            ) : (
              <Moon size={16} color="#6B7280" />
            )}
          </button>

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setUserMenuOpen((prev) => !prev);
              }}
              className="flex items-center gap-2 h-9 px-3 rounded-xl transition-colors"
              style={{
                backgroundColor: surfaceColor,
                border: `1px solid ${borderColor}`,
              }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#1565C0" }}
              >
                <User size={13} color="#fff" />
              </div>

              <span
                className="text-sm font-medium hidden sm:block"
                style={{ color: textSecondary }}
              >
                {userName}
              </span>

              <ChevronDown
                size={14}
                color={iconMuted}
                className={`transition-transform duration-200 ${
                  userMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {userMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-52 rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: darkMode ? "#232323" : "#FFFFFF",
                  border: `1px solid ${borderColor}`,
                  boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onProfileClick?.();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left"
                  style={{
                    color: textPrimary,
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = darkMode
                      ? "#2d2d2d"
                      : "#F8FAFC")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <UserCircle2 size={16} />
                  <span>Perfil</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onSettingsClick?.();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left"
                  style={{
                    color: textPrimary,
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = darkMode
                      ? "#2d2d2d"
                      : "#F8FAFC")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <Settings size={16} />
                  <span>Configurações</span>
                </button>

                <div
                  style={{
                    height: "1px",
                    backgroundColor: borderColor,
                  }}
                />

                <button
                  type="button"
                  onClick={async () => {
                    setUserMenuOpen(false);
                    await onLogoutClick?.();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left"
                  style={{
                    color: "#DC2626",
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = darkMode
                      ? "#2d1f1f"
                      : "#FEF2F2")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <LogOut size={16} />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}