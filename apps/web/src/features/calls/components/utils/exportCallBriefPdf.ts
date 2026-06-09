import { jsPDF } from 'jspdf';
import type {
  BriefDetail,
  CallMetadata,
  NextStep,
  TalkRatio,
  Topic,
} from '../types/calls.types';

export interface CallBriefPdfData {
  metadata: CallMetadata;
  aiSummary: string;
  nextSteps: NextStep[];
  talkRatio: TalkRatio | null;
  topics: Topic[];
  brief: BriefDetail | null;
}

const MARGIN = 18;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = 174;
const LINE = 5.5;

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function sectionTitle(doc: jsPDF, y: number, title: string): number {
  y = ensureSpace(doc, y, LINE * 2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text(title, MARGIN, y);
  return y + LINE + 2;
}

function bodyText(doc: jsPDF, y: number, text: string): number {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(55, 65, 81);
  const lines = doc.splitTextToSize(text || '—', CONTENT_WIDTH);
  for (const line of lines) {
    y = ensureSpace(doc, y, LINE);
    doc.text(line, MARGIN, y);
    y += LINE;
  }
  return y + 3;
}

function bulletList(doc: jsPDF, y: number, items: string[]): number {
  if (items.length === 0) return bodyText(doc, y, 'None recorded.');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(55, 65, 81);
  for (const item of items) {
    const lines = doc.splitTextToSize(`• ${item}`, CONTENT_WIDTH - 4);
    for (const line of lines) {
      y = ensureSpace(doc, y, LINE);
      doc.text(line, MARGIN + 2, y);
      y += LINE;
    }
  }
  return y + 3;
}

function metaRow(doc: jsPDF, y: number, label: string, value: string): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`${label}:`, MARGIN, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(17, 24, 39);
  const lines = doc.splitTextToSize(value || '—', CONTENT_WIDTH - 38);
  doc.text(lines, MARGIN + 38, y);
  return y + Math.max(1, lines.length) * LINE + 1;
}

function sanitizeFilename(title: string): string {
  return title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 80) || 'call-brief';
}

export function exportCallBriefPdf(data: CallBriefPdfData): void {
  const { metadata, aiSummary, nextSteps, talkRatio, topics, brief } = data;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  let y = MARGIN;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  const titleLines = doc.splitTextToSize(metadata.callTitle, CONTENT_WIDTH);
  doc.text(titleLines, MARGIN, y);
  y += titleLines.length * 7 + 4;

  y = metaRow(doc, y, 'Account', metadata.account);
  y = metaRow(doc, y, 'Type', metadata.type);
  y = metaRow(doc, y, 'Deal Type', metadata.dealType);
  y = metaRow(doc, y, 'Date', metadata.date);
  y = metaRow(doc, y, 'Time', metadata.time);
  y = metaRow(doc, y, 'Duration', metadata.duration);
  y = metaRow(doc, y, 'Source', metadata.source);
  y = metaRow(
    doc,
    y,
    'Participants',
    metadata.participants.map((p) => p.name).join(', '),
  );
  y = metaRow(
    doc,
    y,
    'Owner',
    `${metadata.owner.avatarInitials} ${metadata.owner.ownerName}`,
  );

  y += 4;

  y = sectionTitle(doc, y, 'AI Summary');
  y = bodyText(doc, y, aiSummary);

  y = sectionTitle(doc, y, 'Suggested Next Steps');
  y = bulletList(
    doc,
    y,
    nextSteps.map((s) => (s.completed ? `[Done] ${s.description}` : s.description)),
  );

  y = sectionTitle(doc, y, 'Talk Ratio');
  const repPct = talkRatio?.rep?.percentage ?? 50;
  const custPct = talkRatio?.customer?.percentage ?? 50;
  y = bodyText(doc, y, `Rep: ${repPct}%  |  Customer: ${custPct}%`);

  y = sectionTitle(doc, y, 'Topics');
  y = bulletList(
    doc,
    y,
    topics.length
      ? topics.map((t) => `${t.label} (${t.timestamp}) — ${t.description}`)
      : [],
  );

  y = sectionTitle(doc, y, 'Overview');
  y = bodyText(doc, y, brief?.overview?.text || aiSummary);

  y = sectionTitle(doc, y, 'Key Discussion Points');
  y = bulletList(
    doc,
    y,
    (brief?.keyDiscussionPoints ?? []).map(
      (p) => `[${p.timestamp}] ${p.description}`,
    ),
  );

  y = sectionTitle(doc, y, 'Customer Needs & Goals');
  y = bulletList(
    doc,
    y,
    (brief?.customerNeeds ?? []).map((n) =>
      n.title ? `${n.title}: ${n.description}` : n.description,
    ),
  );

  y = sectionTitle(doc, y, 'Risks & Objections');
  y = bulletList(
    doc,
    y,
    (brief?.risks ?? []).map((r) =>
      r.title ? `${r.title} (${r.severity}): ${r.description}` : r.description,
    ),
  );

  y = sectionTitle(doc, y, 'Decisions & Commitments');
  y = bulletList(
    doc,
    y,
    (brief?.commitments ?? []).map((c) =>
      c.dueDate
        ? `${c.description} (${c.assigneeType}, due ${c.dueDate})`
        : `${c.description} (${c.assigneeType})`,
    ),
  );

  y = sectionTitle(doc, y, 'Key Stakeholders');
  y = bulletList(
    doc,
    y,
    (brief?.stakeholders ?? []).map((s) =>
      [s.name, s.title, s.company].filter(Boolean).join(' — '),
    ),
  );

  y = sectionTitle(doc, y, 'Recent Activity Context');
  y = bulletList(
    doc,
    y,
    (brief?.activityContext ?? []).map((a) =>
      `[${a.date}] ${a.type}: ${a.description}`,
    ),
  );

  doc.save(`${sanitizeFilename(metadata.callTitle)}-brief.pdf`);
}
