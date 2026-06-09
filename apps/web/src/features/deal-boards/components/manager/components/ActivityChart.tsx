import type { DealDetail } from '../types/deal.types';

interface ActivityChartProps {
  data: number[];
  color?: string;
}

export default function ActivityChart({ data = [], color = '#3B82F6' }: ActivityChartProps) {
  const safeData = data || [];
  // Aggregate the 10 data values into exactly 3 values: early, middle, recent
  const val1 = safeData.slice(0, 3).reduce((sum, v) => sum + v, 0);
  const val2 = safeData.slice(3, 7).reduce((sum, v) => sum + v, 0);
  const val3 = safeData.slice(7).reduce((sum, v) => sum + v, 0);
  const aggregated = [val1, val2, val3];

  const max = Math.max(...aggregated, 1);

  return (
    <div className="flex items-end gap-[4px] h-6 px-1">
      {aggregated.map((value, i) => {
        // Bar 1 & 3 are blue, Bar 2 is purple
        const barColor = i === 1 ? '#8B5CF6' : '#3B82F6';
        const barHeight = Math.max(25, (value / max) * 100); // at least 25% height for visual quality

        return (
          <div
            key={i}
            className="w-[4px] rounded-full transition-all hover:scale-y-110"
            style={{
              height: `${barHeight}%`,
              backgroundColor: barColor,
            }}
          />
        );
      })}
    </div>
  );
}

export function ActivityOverTimeChart({ detail }: { detail: DealDetail }) {
  const details = detail?.activity?.details || [];

  // Group activities by date
  const groupedByDate: Record<string, typeof details> = {};
  details.forEach((item) => {
    const dateStr = item.date;
    let formattedDate = dateStr;
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (monthIdx >= 0 && monthIdx < 12) {
        formattedDate = `${monthNames[monthIdx].toUpperCase()} ${day}`;
      }
    } else {
      formattedDate = dateStr.toUpperCase();
    }

    if (!groupedByDate[formattedDate]) {
      groupedByDate[formattedDate] = [];
    }
    groupedByDate[formattedDate].push(item);
  });

  const uniqueDates = Object.keys(groupedByDate).sort((a, b) => {
    const dayA = parseInt(a.replace(/[^\d]/g, ''), 10) || 0;
    const dayB = parseInt(b.replace(/[^\d]/g, ''), 10) || 0;
    return dayA - dayB;
  });

  return (
    <div className="space-y-4">
      <div className="text-left">
        <h4 className="text-sm font-bold text-[#1E293B]">Activity Over Time</h4>
        <p className="text-[11px] text-gray-500 font-medium">Larger dots represent longer interactions. Hover to see details.</p>
      </div>

      <div className="relative pt-2 pb-8">
        {/* Horizontal timeline axis line */}
        <div className="absolute left-6 right-6 bottom-[22px] h-[3px] bg-gray-200 rounded-full" />

        {/* Columns Grid */}
        <div className="grid" style={{ gridTemplateColumns: `repeat(${uniqueDates.length}, minmax(0, 1fr))` }}>
          {uniqueDates.map((dateKey) => {
            const dayActivities = groupedByDate[dateKey];
            const count = dayActivities.length;

            const ourAct = dayActivities.find((a) => a.type === 'our' || a.direction === 'outbound');
            const custAct = dayActivities.find((a) => a.type === 'customer' || a.direction === 'inbound');

            const getDotSize = (durationStr: string) => {
              const num = parseInt(durationStr.replace(/[^\d]/g, ''), 10) || 10;
              if (num <= 5) return 8;
              if (num <= 10) return 12;
              if (num <= 30) return 16;
              if (num <= 45) return 20;
              return 24;
            };

            return (
              <div key={dateKey} className="flex flex-col items-center relative">
                {/* Date Header */}
                <span className="text-[10px] font-bold text-gray-400 mb-1.5 tracking-wider">{dateKey}</span>

                {/* Count Badge */}
                <span className="rounded bg-gray-50 px-2 py-0.5 text-[10px] font-bold text-gray-500 border border-gray-150 mb-6 shadow-sm">
                  {count}
                </span>

                {/* Vertical Dot Stack */}
                <div className="h-16 w-full flex flex-col justify-end items-center relative">
                  {/* Customer interaction (purple dot) - sits above the timeline */}
                  {custAct && (
                    <div className="group/dot relative mb-4 z-10 flex justify-center">
                      <span
                        className="rounded-full bg-[#8B5CF6] hover:ring-4 hover:ring-purple-200 transition-all cursor-pointer shadow"
                        style={{
                          width: `${getDotSize(custAct.duration)}px`,
                          height: `${getDotSize(custAct.duration)}px`,
                        }}
                      />
                      {/* Interactive hover detail tooltip */}
                      <div className="absolute bottom-full mb-1.5 hidden group-hover/dot:block z-50 bg-gray-900 text-white text-[10px] p-2.5 rounded-lg shadow-xl whitespace-nowrap text-left border border-gray-800">
                        <p className="font-bold text-white">{custAct.title}</p>
                        <p className="text-gray-300 mt-0.5">{custAct.subtitle}</p>
                        <p className="text-purple-400 font-semibold mt-1">Duration: {custAct.duration}</p>
                      </div>
                    </div>
                  )}

                  {/* Our interaction (pink dot) - sits directly on top of the timeline axis */}
                  {ourAct ? (
                    <div className="group/dot relative z-10 flex justify-center translate-y-[2px]">
                      <span
                        className="rounded-full bg-[#EC4899] hover:ring-4 hover:ring-pink-200 transition-all cursor-pointer shadow"
                        style={{
                          width: `${getDotSize(ourAct.duration)}px`,
                          height: `${getDotSize(ourAct.duration)}px`,
                        }}
                      />
                      {/* Interactive hover detail tooltip */}
                      <div className="absolute bottom-full mb-1.5 hidden group-hover/dot:block z-50 bg-gray-900 text-white text-[10px] p-2.5 rounded-lg shadow-xl whitespace-nowrap text-left border border-gray-800">
                        <p className="font-bold text-white">{ourAct.title}</p>
                        <p className="text-gray-300 mt-0.5">{ourAct.subtitle}</p>
                        <p className="text-pink-400 font-semibold mt-1">Duration: {ourAct.duration}</p>
                      </div>
                    </div>
                  ) : (
                    // Center anchor dot if only customer interaction happened
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 translate-y-[3px]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
