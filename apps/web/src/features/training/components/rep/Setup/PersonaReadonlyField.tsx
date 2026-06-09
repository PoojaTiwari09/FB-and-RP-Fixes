interface PersonaReadonlyFieldProps {
  label: string;
  value: string;
  multiline?: boolean;
}

export default function PersonaReadonlyField({
  label,
  value,
  multiline = false,
}: PersonaReadonlyFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {label}
      </label>
      {multiline ? (
        <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 leading-relaxed min-h-[80px]">
          {value}
        </div>
      ) : (
        <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
          {value}
        </div>
      )}
    </div>
  );
}
