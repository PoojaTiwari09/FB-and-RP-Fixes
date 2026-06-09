import { ContactPersona } from '@shared/types/shared.types';
import PersonaReadonlyField from './PersonaReadonlyField';

interface ContactPersonaCardProps {
  persona: ContactPersona;
}

export default function ContactPersonaCard({ persona }: ContactPersonaCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-5">Contact Persona</h2>

      {/* Row 1: Name + Title */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <PersonaReadonlyField label="Name" value={persona.name} />
        <PersonaReadonlyField label="Title" value={persona.jobTitle} />
      </div>

      {/* Row 2: Company */}
      <div className="mb-4">
        <PersonaReadonlyField label="Company" value={persona.company} />
      </div>

      {/* Row 3: Motivations */}
      <div className="mb-4">
        <PersonaReadonlyField
          label="Motivations & Priorities"
          value={persona.motivations}
          multiline
        />
      </div>

      {/* Row 4: Communication Style */}
      <div>
        <PersonaReadonlyField
          label="Communication Style"
          value={persona.communicationStyle}
          multiline
        />
      </div>
    </div>
  );
}
