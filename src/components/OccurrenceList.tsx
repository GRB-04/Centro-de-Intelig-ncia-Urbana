import type { Occurrence } from '../types/occurrence'
import OccurrenceCard from './OccurrenceCard'

interface OccurrenceListProps {
  occurrences: Occurrence[]
  onSupport: (id: string) => void
  votedByMe?: Set<string>
}

function OccurrenceList({ occurrences, onSupport, votedByMe = new Set() }: OccurrenceListProps) {
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
        />
      ))}
    </div>
  )
}

export default OccurrenceList