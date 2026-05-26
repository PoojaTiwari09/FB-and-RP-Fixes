'use client';
import React from 'react';
import styles from './TranscriptSearch.module.css';

interface Props {
  value:    string;
  onChange: (v: string) => void;
}

export default function TranscriptSearch({ value, onChange }: Props) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.icon}>🔍</span>
      <input
        id="transcript-search"
        className={styles.input}
        type="text"
        placeholder="Search transcript…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search within transcript"
      />
      {value && (
        <button className={styles.clear} onClick={() => onChange('')} aria-label="Clear search">
          ✕
        </button>
      )}
    </div>
  );
}
