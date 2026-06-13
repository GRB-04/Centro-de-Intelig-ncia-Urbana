import type { Occurrence } from '../types/occurrence'
import OccurrenceCard from './OccurrenceCard'

interface OccurrenceListProps {
  occurrences: Occurrence[]
  onSupport: (id: string) => void
  votedByMe?: Set<string>
  isAdmin?: boolean
  onChangeStatus?: (id: string, status: Occurrence['status']) => void
  theme?: 'light' | 'dark'
}

function OccurrenceList({ occurrences, onSupport, votedByMe = new Set(), isAdmin, onChangeStatus, theme = 'dark' }: OccurrenceListProps) {
  if (occurrences.length === 0) {
    return <div className="empty-state">Nenhuma ocorrência encontrada para essa busca.</div>
  }

  return (
    <div className="occurrence-list">
      {occurrences.map((occurrence) => (
        <OccurrenceCard
          key={occurrence.id}
          occurrence={occurrence}
          onSupport={onSupport}
          isSupported={votedByMe.has(occurrence.id)}
          isAdmin={isAdmin}
          onChangeStatus={onChangeStatus}
          theme={theme}
        />
      ))}
    </div>
  )
}

export default OccurrenceList