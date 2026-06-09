'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import { getRepM06Headers, M06_API_BASE } from '../services/m06-api';

interface SourceBoardPeriodSelectorProps {
  periodName: string;
  onChange?: (periodName: string) => void;
}

export default function SourceBoardPeriodSelector({ periodName, onChange }: SourceBoardPeriodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [periods, setPeriods] = useState<{ periodId: string; name: string }[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('January');
  const [selectedYear, setSelectedYear] = useState('2026');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const years = ['2025', '2026', '2027'];

  useEffect(() => {
    fetch(`${M06_API_BASE}/periods`, { headers: getRepM06Headers(), cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.periods || data.data || []);
        if (list.length > 0) {
          setPeriods(list.map((p: any) => ({ periodId: p.periodId ?? p.id, name: p.name })));
        } else {
          throw new Error();
        }
      })
      .catch(() => {
        setPeriods([
          { periodId: 'q2-fy26-demo', name: 'Q2 FY26' },
          { periodId: 'q1-fy26-demo', name: 'Q1 FY26' },
          { periodId: 'q4-fy25-demo', name: 'Q4 FY25' },
          { periodId: 'q2-fy25-demo', name: 'Q2 FY25' }
        ]);
      });
  }, []);

  const handleSelectQuarter = (name: string) => {
    setIsOpen(false);
    if (onChange) onChange(name);
  };

  const handleApplyCustom = () => {
    setIsOpen(false);
    if (onChange) {
      onChange(`${selectedMonth} ${selectedYear}`);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white cursor-pointer select-none outline-none border-none hover:opacity-90 transition-opacity bg-blue-600"
      >
        <Calendar size={13} className="mr-0.5 opacity-80" />
        <span>Forecast for</span>
        <span className="font-bold">{periodName}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[420px] overflow-y-auto">
            {/* Quarters section */}
            <div className="px-4 pt-3 pb-1.5 border-b border-gray-100 bg-gray-50/50">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Quarter</span>
            </div>
            <div className="flex flex-col max-h-[160px] overflow-y-auto">
              {periods.map((p) => (
                <button
                  key={p.periodId}
                  type="button"
                  onClick={() => handleSelectQuarter(p.name)}
                  className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-gray-50 transition-colors ${
                    p.name === periodName ? 'text-blue-600 bg-blue-50/50' : 'text-gray-700'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* Custom Month/Year section */}
            <div className="px-4 py-2 border-t border-b border-gray-100 bg-gray-50/50">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Custom Month & Year</span>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div className="flex gap-2">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs font-semibold text-gray-700 outline-none focus:border-blue-500 bg-white"
                  >
                    {months.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="w-20 flex-col gap-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs font-semibold text-gray-700 outline-none focus:border-blue-500 bg-white"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={handleApplyCustom}
                className="w-full py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              >
                Apply Custom Filter
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
