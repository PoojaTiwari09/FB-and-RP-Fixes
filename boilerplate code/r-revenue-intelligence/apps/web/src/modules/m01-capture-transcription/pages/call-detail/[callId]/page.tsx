'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCall, shareCall, extractAI, deleteCall, CallRecord } from '../../../api/calls.api';
import { getM02WebUrl, getM10WebUrl } from '../../../lib/api-env';
import AudioPlayer         from '../../../components/AudioPlayer';
import TranscriptViewer   from '../../../components/TranscriptViewer';
import TalkRatioChart     from '../../../components/TalkRatioChart';
import CallNotes          from '../../../components/CallNotes';
import NextSteps          from '../../../components/NextSteps';
import ConnectorCards     from '../../../components/ConnectorCards';
import AiInsightsPanel    from '../../../components/AiInsightsPanel';
import styles             from './page.module.css';

const SOURCE_ICON: Record<string, string> = {
  zoom: '🎥', teams: '💬', meet: '📹', dialer: '📞', manual: '📁',
};

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export default function CallDetailPage() {
  const { callId }  = useParams<{ callId: string }>();
  const router      = useRouter();
  const audioRef    = useRef<HTMLAudioElement>(null);

  const [call,      setCall]      = useState<CallRecord | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [currentMs, setCurrentMs] = useState(0);
  const [sharing,     setSharing]     = useState(false);
  const [extracting,  setExtracting]  = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getCall(callId);
      setCall(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [callId]);

  useEffect(() => { load(); }, [load]);

  // CT-19: clicking a transcript timestamp seeks the audio and plays from there
  const handleUtteranceClick = (startMs: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = startMs / 1000;
      audioRef.current.play().catch(() => {}); // auto-play after seek
    }
    setCurrentMs(startMs);
  };

  const handleShare = async () => {
    const who = prompt('Enter user ID or team ID to share with:');
    if (!who) return;
    const type = confirm('Share with a team? (Cancel = user)') ? 'team' : 'user';
    setSharing(true);
    try {
      await shareCall(callId, who, type);
      alert('Call shared successfully!');
    } finally { setSharing(false); }
  };

  const openConversationIntelligence = () => {
    window.location.href = getM02WebUrl();
  };

  const openDataAndCompliance = () => {
    window.location.href = getM10WebUrl();
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCall(callId);
      router.push('/');
    } catch (e: any) {
      alert(e.message || 'Failed to delete call');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading call…</div>;
  if (!call)   return <div className={styles.loading}>Call not found.</div>;

  const tr = call.transcript;

  return (
    <div className={styles.page}>
      <div className={styles.topNav}>
        <button type="button" className={styles.back} onClick={() => router.back()}>
          ← Back to Calls
        </button>
        <div className={styles.moduleLinks}>
          <button
            id="conversational_intelligence"
            type="button"
            className={styles.conversationIntelLink}
            onClick={openConversationIntelligence}
            title="Open M02 Conversation Intelligence (port 5175)"
          >
            💬 conversational_intelligence →
          </button>
          <button
            id="data_and_compliance"
            type="button"
            className={styles.dataComplianceLink}
            onClick={openDataAndCompliance}
            title="Open M10 Data & Compliance (port 5178)"
          >
            🛡️ data and compliance →
          </button>
        </div>
      </div>

      {/* ── CT-13: Call metadata header ─────────────────────────────────── */}
      <div className={styles.metaHeader}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{call.title}</h1>
          <div className={styles.headerActions}>
            {call.transcriptStatus === 'completed' && (
              <button
                id="extract-ai-btn"
                className={styles.extractBtn}
                onClick={async () => {
                  setExtracting(true);
                  try {
                    await extractAI(callId);
                    await load();
                  } catch (e: any) {
                    alert(e.message || 'AI extraction failed');
                  } finally {
                    setExtracting(false);
                  }
                }}
                disabled={extracting}
              >
                {extracting ? '⏳ Extracting…' : '✨ Extract AI Insights'}
              </button>
            )}
            <button id="share-call-btn" className={styles.shareBtn} onClick={handleShare} disabled={sharing}>
              {sharing ? 'Sharing…' : '🔗 Share'}
            </button>
            <button
              id="delete-call-btn"
              className={styles.deleteBtn}
              onClick={() => setShowDeleteModal(true)}
              disabled={deleting}
            >
              🗑 Delete
            </button>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className={styles.modalOverlay}>
              <div className={styles.modalBox}>
                <div className={styles.modalIcon}>⚠️</div>
                <h3 className={styles.modalTitle}>Delete this call?</h3>
                <p className={styles.modalDesc}>
                  This will permanently delete <strong>{call.title}</strong> and all its
                  associated data — transcript, utterances, AI insights, notes, and shares.
                  This action cannot be undone.
                </p>
                <div className={styles.modalActions}>
                  <button
                    className={styles.modalCancel}
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.modalConfirm}
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting…' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className={styles.metaChips}>
          <span className={styles.chip}>📅 {new Date(call.callDate).toLocaleString()}</span>
          <span className={styles.chip}>⏱ {fmt(call.durationSeconds)}</span>
          <span className={styles.chip}>📋 {call.callType}</span>
          <span className={styles.chip}>{SOURCE_ICON[call.callSource]} {call.callSource}</span>
          <span className={styles.chip}>👤 {call.callOwner}</span>
          {call.accountId && <span className={styles.chip}>🏢 {call.accountId}</span>}
        </div>
        <div className={styles.participants}>
          <span className={styles.partLabel}>Participants:</span>
          {call.participants.map((p, i) => (
            <span key={i} className={styles.partChip}>{p}</span>
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.mainCol}>
          {/* ── CT-14: AI Summary ──────────────────────────────────────────── */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>🤖 AI Summary</div>
            {tr?.summary ? (
              <p className={styles.summaryText}>{tr.summary}</p>
            ) : (
              <div className={styles.aiPlaceholder}>
                <div className={styles.aiPlaceholderIcon}>✨</div>
                <div className={styles.aiPlaceholderText}>
                  AI summary will appear here once the extraction pipeline processes this call.
                </div>
                <div className={styles.aiPlaceholderHint}>
                  Powered by GPT-4o · Generates 3–5 sentence summaries of key discussion points
                </div>
              </div>
            )}
          </div>

          {/* ── CT-15: Key Highlights ──────────────────────────────────────── */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>⚡ Key Highlights</div>
            {tr?.keyHighlights && tr.keyHighlights.length > 0 ? (
              <div className={styles.highlights}>
                {tr.keyHighlights.map((h, i) => (
                  <div
                    key={i}
                    className={styles.highlightItem}
                    onClick={() => handleUtteranceClick(h.timestampMs)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleUtteranceClick(h.timestampMs)}
                  >
                    <span className={`${styles.hlLabel} ${styles[h.label]}`}>{h.label}</span>
                    <span className={styles.hlText}>{h.text}</span>
                    <span className={styles.hlTime}>
                      {Math.floor(h.timestampMs / 60000)}:{String(Math.floor((h.timestampMs % 60000) / 1000)).padStart(2,'0')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.aiPlaceholder}>
                <div className={styles.highlightCategories}>
                  <span className={`${styles.hlLabel} ${styles.pricing}`}>pricing</span>
                  <span className={`${styles.hlLabel} ${styles.objection}`}>objection</span>
                  <span className={`${styles.hlLabel} ${styles.competitor}`}>competitor</span>
                  <span className={`${styles.hlLabel} ${styles.next_step}`}>next step</span>
                  <span className={`${styles.hlLabel} ${styles.risk}`}>risk</span>
                </div>
                <div className={styles.aiPlaceholderText}>
                  Key moments will be auto-tagged and linked to audio timestamps.
                </div>
              </div>
            )}
          </div>

          {/* ── M-18: AI-Extracted Insights ────────────────────────────────── */}
          <AiInsightsPanel
            callId={callId}
            transcriptStatus={call.transcriptStatus}
            onSeek={handleUtteranceClick}
          />

          {/* ── CT-16: Talk Ratio ─────────────────────────────────────────── */}
          {tr?.talkRatio ? (
            <TalkRatioChart talkRatio={tr.talkRatio} />
          ) : tr && (
            <div className={styles.card}>
              <div className={styles.cardTitle}>📊 Talk Ratio</div>
              <div className={styles.aiPlaceholder}>
                <div className={styles.aiPlaceholderText}>
                  Speaking time distribution will appear here after analysis.
                </div>
              </div>
            </div>
          )}

          {/* ── CT-17: Audio Player ───────────────────────────────────────── */}
          {call.audioUrl ? (
            <AudioPlayer
              ref={audioRef}
              audioUrl={call.audioUrl}
              onTimeUpdate={setCurrentMs}
            />
          ) : (
            <div className={styles.noAudio}>🎙 No audio recording available</div>
          )}

          {/* ── CT-18 / CT-19 / CT-20 / CT-21: Transcript Viewer ─────────── */}
          {tr?.utterances && tr.utterances.length > 0 ? (
            <div className={styles.card}>
              <div className={styles.cardTitle}>📄 Transcript</div>
              <TranscriptViewer
                utterances={tr.utterances}
                currentMs={currentMs}
                onUtteranceClick={handleUtteranceClick}
              />
            </div>
          ) : (
            <div className={styles.card}>
              <div className={styles.cardTitle}>📄 Transcript</div>
              <div className={styles.noTranscript}>
              {call.transcriptStatus === 'processing'
                  ? '⏳ Transcription is in progress…'
                  : call.transcriptStatus === 'failed'
                  ? `❌ Transcription failed: ${call.failureReason ?? 'unknown reason'}`
                  : call.transcriptStatus === 'skipped'
                  ? `⏭️ Skipped: ${call.skipReason ?? 'Administrative rule'}`
                  : '⏰ No transcript yet.'}
              </div>
            </div>
          )}

          {/* ── CT-24: Interactive Next Steps (US-11) ──────────────── */}
          <NextSteps
            callId={callId}
            steps={tr?.nextSteps ?? []}
            onRefresh={load}
          />

          {/* ── Platform: Connected Services ─────────────────────────── */}
          <div className={styles.card}>
            <ConnectorCards />
          </div>

          {/* ── CT-22: Notes ──────────────────────────────────────────────── */}
          <CallNotes
            callId={callId}
            notes={call.notes ?? []}
            onRefresh={load}
          />
        </div>
      </div>
    </div>
  );
}
