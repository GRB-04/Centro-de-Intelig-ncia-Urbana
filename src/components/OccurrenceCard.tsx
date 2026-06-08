import { Clock3, MapPin, ThumbsUp } from 'lucide-react'
import type { Occurrence } from '../types/occurrence'

interface OccurrenceCardProps {
  occurrence: Occurrence
  onSupport: (id: string) => void
  isSupported?: boolean
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

function OccurrenceCard({ occurrence, onSupport, isSupported }: OccurrenceCardProps) {
  return (
    <div className="occurrence-card">
      <div className="occurrence-card-top">
        <div className="occurrence-main">
          <h3 className="occurrence-title">{occurrence.title}</h3>
          <p className="occurrence-description">{occurrence.description}</p>
        </div>

        <div className="occurrence-badges">
          <span className={`status-badge status-badge--${occurrence.status.replace(' ', '-')}`}>
            {occurrence.status}
          </span>
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

        <button 
          className={`support-button${isSupported ? ' supported' : ''}`} 
          onClick={() => onSupport(occurrence.id)}
        >
          <ThumbsUp size={14} />
          {isSupported ? 'Apoiado' : 'Apoiar'}
          <span className="support-count">{occurrence.supportCount}</span>
        </button>
      </div>
    </div>
  )
}

export default OccurrenceCard