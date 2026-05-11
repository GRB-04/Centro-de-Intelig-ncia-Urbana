import type { Occurrence } from '../types/occurrence'
import OccurrenceCard from './OccurrenceCard'

interface OccurrenceListProps {
  occurrences: Occurrence[]
  onSupport: (id: string) => void
}

function OccurrenceList({ occurrences, onSupport }: OccurrenceListProps) {
  if (occurrences.length === 0) {
    return <div className="empty-state">Nenhuma ocorrência encontrada para essa busca.</div>
  }

  return (
    <div className="occurrence-list">
      {occurrences.map((occurrence) => (
        <OccurrenceCard key={occurrence.id} occurrence={occurrence} onSupport={onSupport} />
      ))}
    </div>
  )
}

export default OccurrenceList