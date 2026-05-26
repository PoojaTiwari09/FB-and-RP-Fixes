'use client';
import React, { forwardRef } from 'react';
import styles from './AudioPlayer.module.css';

interface Props {
  audioUrl:     string;
  onTimeUpdate: (ms: number) => void;
}

/**
 * AudioPlayer — exposes its <audio> element via ref so the parent
 * can imperatively seek to a transcript timestamp (CT-19).
 */
const AudioPlayer = forwardRef<HTMLAudioElement, Props>(
  function AudioPlayer({ audioUrl, onTimeUpdate }, ref) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.label}>🎙 Call Recording</div>
        <audio
          ref={ref}
          className={styles.audio}
          controls
          src={audioUrl}
          onTimeUpdate={(e) => {
            const ms = Math.floor(e.currentTarget.currentTime * 1000);
            onTimeUpdate(ms);
          }}
          aria-label="Call recording audio player"
        />
      </div>
    );
  },
);

export default AudioPlayer;
