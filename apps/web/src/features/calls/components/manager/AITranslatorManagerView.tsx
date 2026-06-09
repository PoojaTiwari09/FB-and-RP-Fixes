import PageHeader from '@shared/components/PageHeader/PageHeader';
import RoleBadge from '@shared/components/RoleBadge/RoleBadge';

export default function AITranslatorManagerView() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="AI Translator"
        subtitle="Auto-translate call transcripts for international deals and cross-region coaching."
        badge={<RoleBadge role="sales_manager" />}
      />
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Supported Languages</p>
          <div className="flex flex-wrap gap-2">
            {['English', 'Spanish', 'French', 'German', 'Portuguese', 'Japanese', 'Mandarin'].map(
              (lang) => (
                <span
                  key={lang}
                  className="px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-full text-xs font-medium"
                >
                  {lang}
                </span>
              )
            )}
          </div>
          <p className="mt-4 text-sm text-gray-400">
            Select a call from Calls List to translate its transcript.
          </p>
        </div>
      </div>
    </div>
  );
}
