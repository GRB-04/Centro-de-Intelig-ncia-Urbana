import { useState } from 'react'
import { Clock3, MapPin, ThumbsUp, ChevronDown, ChevronRight } from 'lucide-react'
import type { Occurrence } from '../types/occurrence'
import OccurrenceDetailModal from './OccurrenceDetailModal'

interface OccurrenceCardProps {
  occurrence: Occurrence
  onSupport: (id: string) => void
  isSupported?: boolean
  isAdmin?: boolean
  onChangeStatus?: (id: string, status: Occurrence['status']) => void
  theme?: 'light' | 'dark'
}

function getTimeAgo(dateString: string) {
  const now = new Date()
  const created = new Date(dateString)
  const diffMs = now.getTime() - created.getTime()
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))

  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return '1 dia atrás'
  return `${diffDays} dias atrás`
}

function getStatusClass(status: string) {
  if (status === 'aberta') return 'aberta'
  if (status === 'em análise') return 'em-analise'
  return 'resolvida'
}

function OccurrenceCard({ occurrence, onSupport, isSupported, isAdmin, onChangeStatus, theme = 'dark' }: OccurrenceCardProps) {
  const [detailOpen, setDetailOpen] = useState(false)

  return (
    <>
      <div
        className="occurrence-card"
        style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
        onClick={() => setDetailOpen(true)}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') setDetailOpen(true) }}
        aria-label={`Ver detalhes: ${occurrence.title}`}
      >
        <div className="occurrence-card-top">
          <div className="occurrence-main">
            <h3 className="occurrence-title">{occurrence.title}</h3>
            <p className="occurrence-description">{occurrence.description}</p>
          </div>

          <div className="occurrence-badges">
            {isAdmin && onChangeStatus ? (
              <div
                className="admin-status-select-wrapper"
                onClick={(e) => e.stopPropagation()}
              >
                <select
                  className={`admin-status-select admin-status-select--${getStatusClass(occurrence.status)}`}
                  value={occurrence.status}
                  onChange={(e) => onChangeStatus(occurrence.id, e.target.value as Occurrence['status'])}
                >
                  <option value="aberta">aberta</option>
                  <option value="em análise">em análise</option>
                  <option value="resolvida">resolvida</option>
                </select>
                <ChevronDown size={11} className="admin-status-chevron" />
              </div>
            ) : (
              <span className={`status-badge status-badge--${occurrence.status.replace(' ', '-')}`}>
                {occurrence.status}
              </span>
            )}
            <span className={`severity-badge severity-badge--${occurrence.severity}`}>
              Severidade {occurrence.severity}
            </span>
          </div>
        </div>

        <div className="occurrence-meta">
          <span>
            <MapPin size={14} />
            {occurrence.neighborhood}
          </span>

          <span>
            <Clock3 size={14} />
            {getTimeAgo(occurrence.createdAt)}
          </span>
        </div>

        <div className="occurrence-footer">
          <span className="category-badge">{occurrence.category}</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <button
              className={`support-button${isSupported ? ' supported' : ''}`}
              onClick={(e) => { e.stopPropagation(); onSupport(occurrence.id) }}
              disabled={isAdmin}
              style={{ opacity: isAdmin ? 0.5 : 1, cursor: isAdmin ? 'not-allowed' : 'pointer' }}
            >
              <ThumbsUp size={14} />
              {isSupported ? 'Apoiado' : 'Apoiar'}
              <span className="support-count">{occurrence.supportCount}</span>
            </button>

            <button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '5px 10px',
                borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent',
                color: '#8888a0',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              onClick={(e) => { e.stopPropagation(); setDetailOpen(true) }}
            >
              Detalhes
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {detailOpen && (
        <OccurrenceDetailModal
          occurrence={occurrence}
          onClose={() => setDetailOpen(false)}
          onSupport={onSupport}
          isSupported={!!isSupported}
          isAdmin={isAdmin}
          onChangeStatus={onChangeStatus}
          theme={theme}
        />
      )}
    </>
  )
}

export default OccurrenceCard