"use client";

import { Calendar } from 'lucide-react';
import { useAIRevenuePredictor } from '../../hooks/useAIRevenuePredictor';
import { ForecastSummaryCard } from './ForecastSummaryCard';
import { RepForecastTable } from './RepForecastTable';
import { RepDetailView } from './RepDetailView';

export default function AIRevenuePredictorManagerView() {
  const vm = useAIRevenuePredictor();

  return (
    <div className="h-full overflow-y-auto font-sans" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="mx-auto max-w-[1600px] px-8 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-2xl font-bold text-[#111827]">AI Revenue Predictor</h1>
          <p className="text-sm text-[#6B7280]">
            AI-powered revenue forecasting with team-level visibility and manager override capabilities
          </p>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#6B7280]" />
            <select
              value={vm.selectedQuarter}
              onChange={(e) => vm.setSelectedQuarter(e.target.value as typeof vm.selectedQuarter)}
              className="px-3 py-2 rounded-lg text-sm font-medium cursor-pointer"
              style={{
                border: '1px solid #D1D5DB',
                backgroundColor: '#FFFFFF',
                color: '#111827',
                outline: 'none',
              }}
            >
              {vm.quarterOptions.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>
        </div>

        {vm.isLoading && (
          <div className="mb-6 rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280]">
            Loading AI revenue predictor data...
          </div>
        )}
        {vm.loadError && (
          <div className="mb-6 rounded-xl border border-[#FCA5A5] bg-[#FEE2E2] p-4 text-sm text-[#991B1B]">
            Unable to load AI Revenue Predictor: {vm.loadError}
          </div>
        )}

        {vm.viewMode === 'rep-detail' && vm.selectedRep && vm.repDetail ? (
          <RepDetailView
            rep={vm.selectedRep}
            repDetail={vm.repDetail}
            quarter={vm.selectedQuarter}
            onBack={vm.backToOverview}
            lobFilter={vm.lobFilter}
            setLobFilter={vm.setLobFilter}
            baseline={vm.selectedBaseline}
            setBaseline={vm.setSelectedBaseline}
          />
        ) : (
          <>
            {vm.teamSummary && (
              <ForecastSummaryCard
                teamSummary={vm.teamSummary}
                quarter={vm.selectedQuarter}
                team={vm.selectedTeamLabel}
                lobFilter={vm.lobFilter}
                setLobFilter={vm.setLobFilter}
                baseline={vm.selectedBaseline}
                setBaseline={vm.setSelectedBaseline}
              />
            )}

            <RepForecastTable
              members={vm.repForecasts}
              onReviewRep={vm.openRepDetail}
            />
          </>
        )}
      </div>
    </div>
  );
}
