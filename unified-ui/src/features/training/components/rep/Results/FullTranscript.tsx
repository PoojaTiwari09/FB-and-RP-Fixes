import { TranscriptEntry as TranscriptEntryType } from '@training/types/trainingResults.types';
import TranscriptEntry from './TranscriptEntry';

interface FullTranscriptProps {
  entries: TranscriptEntryType[];
}

export default function FullTranscript({ entries }: FullTranscriptProps) {
  return (
    <div className="space-y-1">
      {entries.map((entry, index) => (
        <TranscriptEntry key={`${entry.timestampSeconds}-${index}`} entry={entry} />
      ))}
    </div>
  );
}
