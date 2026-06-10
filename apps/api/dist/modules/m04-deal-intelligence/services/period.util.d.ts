import { Period, PeriodWindow } from '../entities/deal-drivers.entities';
export declare const WARNING_ACTIVE_THRESHOLD_HOURS = 24;
export declare function resolvePeriodWindow(period: Period, now?: Date): PeriodWindow;
export declare function intervalOverlapMs(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): number;
export declare function msToHours(ms: number): number;
