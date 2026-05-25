'use client';
import React from 'react';
import { TalkRatio } from '../api/calls.api';
import styles from './TalkRatioChart.module.css';

interface Props { talkRatio: TalkRatio }

const SPEAKER_COLORS: Record<string, string> = {
  Rep:      '#6366f1',
  Customer: '#10b981',
};

export default function TalkRatioChart({ talkRatio }: Props) {
  const entries = Object.entries(talkRatio);

  return (
    <div className={styles.wrapper}>
      <div className={styles.title}>🎙 Talk Ratio</div>
      {/* Bar chart */}
      <div className={styles.bar}>
        {entries.map(([speaker, data]) => (
          <div
            key={speaker}
            className={styles.segment}
            style={{
              width: `${data.percentage}%`,
              background: SPEAKER_COLORS[speaker] ?? '#475569',
            }}
            title={`${speaker}: ${data.percentage}%`}
          />
        ))}
      </div>
      {/* Legend */}
      <div className={styles.legend}>
        {entries.map(([speaker, data]) => (
          <div key={speaker} className={styles.legendItem}>
            <span
              className={styles.dot}
              style={{ background: SPEAKER_COLORS[speaker] ?? '#475569' }}
            />
            <span className={styles.speaker}>{speaker}</span>
            <span className={styles.pct}>{data.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
