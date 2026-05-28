'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  listCalls,
  uploadAudio,
  uploadFromS3,
  listS3Recordings,
  deleteCall,
  CallRecord,
  S3RecordingOption,
} from '../../api/calls.api';
import { S3_RECORDINGS_FALLBACK } from '../../lib/s3-recordings';
import styles from './page.module.css';

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pending',    color: '#475569' },
  processing: { label: 'Processing', color: '#f59e0b' },
  completed:  { label: 'Transcribed',color: '#10b981' },
  failed:     { label: 'Failed',     color: '#ef4444' },
  skipped:    { label: 'Skipped',    color: '#8b5cf6' },
};

const SOURCE_ICON: Record<string, string> = {
  zoom: '🎥', teams: '💬', meet: '📹', dialer: '📞', manual: '📁',
};

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

const ACCEPTED = '.mp3,.wav,.ogg,.m4a,.flac,.aac,.webm,.mp4';

export default function CallsListPage() {
  const [calls,   setCalls]   = useState<CallRecord[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortBy,   setSortBy]   = useState('callDate');
  const [order,    setOrder]    = useState<'asc'|'desc'>('desc');
  const [deletingId, setDeletingId] = useState<string>('');
  const [status,   setStatus]   = useState('');
  const [search,   setSearch]   = useState('');
  const [callType, setCallType] = useState('');

  // Upload states
  const [uploading,  setUploading]  = useState(false);
  const [uploadPct,  setUploadPct]  = useState(0);
  const [uploadErr,  setUploadErr]  = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showS3Picker, setShowS3Picker] = useState(false);
  const [s3Options, setS3Options] = useState<S3RecordingOption[]>([]);
  const [s3Loading, setS3Loading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCalls = React.useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = { sortBy, order };
    if (status) params.status = status;
    listCalls(params)
      .then((r) => { setCalls(r.records); setTotal(r.total); })
      .catch((err) => console.error('Failed to load calls:', err))
      .finally(() => setLoading(false));
  }, [sortBy, order, status]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const handleSort = (col: string) => {
    if (col === sortBy) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col); setOrder('desc'); }
  };

  const sortArrow = (col: string) => sortBy === col ? (order === 'asc' ? ' ↑' : ' ↓') : '';

  const filtered = calls.filter((c) => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (callType && c.callType !== callType) return false;
    return true;
  });

  // ── Upload handler ────────────────────────────────────────────────────

  const handleDeleteCall = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteCall(id);
      fetchCalls();
    } catch (e: any) {
      alert(e.message || 'Failed to delete call');
    } finally {
      setDeletingId('');
    }
  };
  const runUploadProgress = async (uploadFn: () => Promise<unknown>) => {
    setUploadErr('');
    setUploadPct(0);
    setUploading(true);
    setShowS3Picker(false);

    const progressInterval = setInterval(() => {
      setUploadPct((prev) => Math.min(prev + Math.random() * 15, 90));
    }, 300);

    try {
      await uploadFn();
      setUploadPct(100);
      clearInterval(progressInterval);
      setTimeout(() => {
        setUploading(false);
        setUploadPct(0);
        fetchCalls();
      }, 600);
    } catch (err: unknown) {
      clearInterval(progressInterval);
      setUploading(false);
      setUploadPct(0);
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadErr(msg);
    }
  };

  const handleUpload = (file: File) => runUploadProgress(() => uploadAudio(file));

  const openS3Picker = async () => {
    if (uploading) return;
    setUploadErr('');
    setS3Options(S3_RECORDINGS_FALLBACK);
    setShowS3Picker(true);
    setS3Loading(true);
    try {
      const { recordings } = await listS3Recordings();
      if (recordings.length > 0) {
        setS3Options(recordings);
      }
    } catch (err: unknown) {
      console.warn('S3 catalog API failed, using built-in list:', err);
    } finally {
      setS3Loading(false);
    }
  };

  const handleS3Select = (recordingId: string) => {
    runUploadProgress(() => uploadFromS3(recordingId));
  };

  const onFileSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    handleUpload(files[0]);
  };

  // Drag handlers
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    onFileSelected(e.dataTransfer.files);
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.heading}>📞 Calls</h1>
          <p className={styles.sub}>{total} total calls</p>
          <Link href="/extraction-library" style={{ fontSize: 13, color: '#a5b4fc', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            🧠 Extraction Library →
          </Link>
        </div>
        <div className={styles.filters}>
          {/* Global search (CT-05) */}
          <input
            id="calls-global-search"
            className={styles.searchInput}
            placeholder="🔍  Search transcripts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Status filter */}
          <select
            id="calls-status-filter"
            className={styles.select}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Transcribed</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
          </select>

          {/* Call type filter (US-22) */}
          <select
            id="calls-type-filter"
            className={styles.select}
            value={callType}
            onChange={(e) => setCallType(e.target.value)}
          >
            <option value="">All types</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
            <option value="meeting">Meeting</option>
          </select>
        </div>
      </div>

      {/* ── Upload: device drop zone + separate S3 action ───────────────── */}
      <div className={styles.uploadSection}>
        <div
          className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''} ${uploading ? styles.dropZoneUploading : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED}
            className={styles.hiddenInput}
            onChange={(e) => onFileSelected(e.target.files)}
          />

          {uploading ? (
            <div className={styles.uploadProgress}>
              <div className={styles.spinner} />
              <span className={styles.uploadText}>
                Uploading & queueing transcription… {Math.round(uploadPct)}%
              </span>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${uploadPct}%` }} />
              </div>
            </div>
          ) : (
            <>
              <div className={styles.uploadIcon}>🎵</div>
              <div className={styles.uploadLabel}>
                Drop an audio file here or <span className={styles.browseLink}>browse</span>
              </div>
              <div className={styles.uploadHint}>
                MP3, WAV, OGG, M4A, FLAC, AAC — up to 500 MB
              </div>
              <div className={styles.uploadHint}>
                All fields (speakers, timestamps, duration) are automatically extracted
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          className={styles.s3UploadBtn}
          onClick={openS3Picker}
          disabled={uploading || s3Loading}
        >
          {s3Loading ? 'Loading S3 list…' : 'Upload from S3'}
        </button>
      </div>

      {showS3Picker && !uploading && (
        <div
          className={styles.s3PickerBackdrop}
          role="presentation"
          onClick={() => setShowS3Picker(false)}
        >
          <div
            className={styles.s3Picker}
            role="dialog"
            aria-labelledby="s3-picker-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="s3-picker-title" className={styles.s3PickerTitle}>
              Select a recording from S3
            </h3>
            <p className={styles.s3PickerHint}>
              File is downloaded to the server, stored locally, then transcribed like a normal upload.
            </p>
            {s3Options.length === 0 ? (
              <p className={styles.s3PickerEmpty}>No recordings available.</p>
            ) : (
              <ul className={styles.s3PickerList}>
                {s3Options.map((opt) => (
                  <li key={opt.id}>
                    <button
                      type="button"
                      className={styles.s3PickerItem}
                      onClick={() => handleS3Select(opt.id)}
                    >
                      <span className={styles.s3PickerNameBlock}>
                        <span className={styles.s3PickerName}>{opt.displayName}</span>
                        {opt.sourceUrl && (
                          <span className={styles.s3PickerUrl} title={opt.sourceUrl}>
                            {opt.sourceUrl}
                          </span>
                        )}
                      </span>
                      <span className={styles.s3PickerAction}>Import & transcribe →</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              className={styles.s3PickerCancel}
              onClick={() => setShowS3Picker(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {uploadErr && (
        <div className={styles.uploadError}>⚠️ {uploadErr}</div>
      )}

      {/* ── Calls Table ──────────────────────────────────────────────────── */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th} onClick={() => handleSort('title')}>
                Title{sortArrow('title')}
              </th>
              <th className={styles.th} onClick={() => handleSort('callDate')}>
                Date{sortArrow('callDate')}
              </th>
              <th className={styles.th} onClick={() => handleSort('durationSeconds')}>
                Duration{sortArrow('durationSeconds')}
              </th>
              <th className={styles.th}>Source</th>
              <th className={styles.th}>Owner</th>
              <th className={styles.th} onClick={() => handleSort('transcriptStatus')}>
                Transcript{sortArrow('transcriptStatus')}
              </th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className={styles.center}>Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className={styles.center}>No calls found — upload an audio file above to get started</td></tr>
            )}
            {filtered.map((call) => {
              const badge = STATUS_BADGE[call.transcriptStatus] ?? STATUS_BADGE.pending;
              return (
                <tr key={call.id} className={styles.row}>
                  <td className={styles.td}>
                    <Link href={`/calls/${call.id}`} className={styles.callLink}>
                      {call.title}
                    </Link>
                    <div className={styles.participants}>
                      {call.participants.length > 0
                        ? call.participants.slice(0, 3).join(', ')
                        : 'Extracting speakers…'}
                      {call.participants.length > 3 && ` +${call.participants.length - 3}`}
                    </div>
                  </td>
                  <td className={styles.td}>
                    {new Date(call.callDate).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                    <div className={styles.time}>
                      {new Date(call.callDate).toLocaleTimeString('en-US', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                  </td>
                  <td className={styles.td}>{call.durationSeconds > 0 ? formatDuration(call.durationSeconds) : '—'}</td>
                  <td className={styles.td}>
                    <span className={styles.sourceChip}>
                      {SOURCE_ICON[call.callSource] ?? '📁'} {call.callSource}
                    </span>
                  </td>
                  <td className={styles.td}>{call.callOwner}</td>
                  <td className={styles.td}>
                    <span
                      className={styles.statusBadge}
                      style={{ background: badge.color + '22', color: badge.color, borderColor: badge.color + '44' }}
                    >
                      {badge.label}
                    </span>
                    {call.transcriptStatus === 'skipped' && call.skipReason && (
                      <div className={styles.participants} title={call.skipReason}>
                        {call.skipReason}
                      </div>
                    )}
                  </td>
                  <td className={styles.td}>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteCall(call.id)}
                      disabled={deletingId === call.id}
                    >
                      {deletingId === call.id ? 'Deleting…' : '🗑 Delete'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
