import { Bell, Search, Sparkles, UserCircle2 } from 'lucide-react'

interface TopBarProps {
  search: string
  onSearchChange: (value: string) => void
}

function TopBar({ search, onSearchChange }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="brand-mark">CI</div>

        <div>
          <h1 className="brand-title">Centro de Inteligência Urbana</h1>
          <p className="brand-subtitle">Belém • Sistema colaborativo de problemas urbanos</p>
        </div>

        <span className="project-badge">
          <Sparkles size={14} />
          Apple-style
        </span>
      </div>

      <div className="topbar-right">
        <div className="searchbar">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar ocorrências, bairros ou categorias..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <button className="icon-button" aria-label="Notificações">
          <Bell size={18} />
        </button>

        <button className="profile-button" aria-label="Perfil do usuário">
          <UserCircle2 size={18} />
          <span>Gabri</span>
        </button>
      </div>
    </header>
  )
}

export default TopBar