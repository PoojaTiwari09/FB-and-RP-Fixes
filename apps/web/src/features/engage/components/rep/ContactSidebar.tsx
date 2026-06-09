'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Phone, Mail, ExternalLink, User } from 'lucide-react';
import type { ChannelType, ContactDetails } from './types/engage.types';

function LinkedInIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

const CHANNEL_COLOR: Record<ChannelType, string> = {
  CALL:     '#059669',
  EMAIL:    '#2563EB',
  LINKEDIN: '#0EA5E9',
  CUSTOM:   '#0EA5E9',
};

function ChannelIcon({ type, size = 12 }: { type: ChannelType; size?: number }) {
  if (type === 'CALL')  return <Phone size={size} />;
  if (type === 'EMAIL') return <Mail  size={size} />;
  return <LinkedInIcon size={size} />;
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full px-4 py-3 text-left cursor-pointer"
      >
        <span className="text-xs font-semibold text-gray-700">{title}</span>
        {open
          ? <ChevronUp   size={14} className="text-gray-400" />
          : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

interface ContactSidebarProps {
  contact: ContactDetails;
}

export default function ContactSidebar({ contact }: ContactSidebarProps) {
  const timeline = contact.engagementTimeline;
  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col flex-shrink-0 overflow-y-auto">

      {/* Contact */}
      <Section title="Contact">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{contact.contactName}</p>
            <p className="text-xs text-gray-500">{contact.jobTitle}</p>
            <p className="text-xs text-gray-400">{contact.company}</p>
          </div>
        </div>
        <div className="space-y-2 text-xs">
          <a
            href={`tel:${contact.phone}`}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Phone size={12} className="flex-shrink-0" />
            <span>{contact.phone}</span>
          </a>
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Mail size={12} className="flex-shrink-0" />
            <span>{contact.email}</span>
          </a>
          <a
            href={contact.linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <LinkedInIcon size={12} />
            <span>View LinkedIn Profile</span>
            <ExternalLink size={10} className="flex-shrink-0" />
          </a>
        </div>
      </Section>

      {/* Engagement Timeline */}
      {timeline.length > 0 && (
        <Section title="Engagement Timeline">
          <ul className="space-y-3">
            {timeline.map((ev, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs">
                <span
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: CHANNEL_COLOR[ev.channelType] }}
                >
                  <ChannelIcon type={ev.channelType} size={12} />
                </span>
                <div>
                  <p className="text-gray-700">{ev.summary}</p>
                  <p className="text-gray-400 mt-0.5">{ev.date}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Account Info */}
      <Section title="Account Info">
        <dl className="space-y-2 text-xs">
          {contact.accountInfo.industry && (
            <div className="flex justify-between">
              <dt className="text-gray-400">Industry</dt>
              <dd className="text-gray-700 font-medium">{contact.accountInfo.industry}</dd>
            </div>
          )}
          {contact.accountInfo.size && (
            <div className="flex justify-between">
              <dt className="text-gray-400">Size</dt>
              <dd className="text-gray-700 font-medium">{contact.accountInfo.size}</dd>
            </div>
          )}
          {contact.accountInfo.website && (
            <div className="flex justify-between">
              <dt className="text-gray-400">Website</dt>
              <dd>
                <a
                  href={`https://${contact.accountInfo.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 font-medium hover:underline"
                >
                  {contact.accountInfo.website}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </Section>

      {/* Deal Info */}
      {contact.dealInfo.dealName && (
        <Section title="Deal Info">
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between">
              <dt className="text-gray-400">Deal Name</dt>
              <dd className="text-gray-700 font-medium truncate max-w-40">{contact.dealInfo.dealName}</dd>
            </div>
            {contact.dealInfo.dealStage && (
              <div className="flex justify-between">
                <dt className="text-gray-400">Stage</dt>
                <dd className="text-gray-700 font-medium">{contact.dealInfo.dealStage}</dd>
              </div>
            )}
            {contact.dealInfo.dealValue && (
              <div className="flex justify-between">
                <dt className="text-gray-400">Value</dt>
                <dd className="text-gray-700 font-medium">{contact.dealInfo.dealValue}</dd>
              </div>
            )}
            {contact.dealInfo.closeDate && (
              <div className="flex justify-between">
                <dt className="text-gray-400">Close Date</dt>
                <dd className="text-gray-700 font-medium">{contact.dealInfo.closeDate}</dd>
              </div>
            )}
          </dl>
        </Section>
      )}

      {/* Notes */}
      <div className="px-4 py-3">
        <p className="text-xs font-semibold text-gray-700 mb-2">Notes</p>
        <textarea
          placeholder="Add notes about this task..."
          rows={3}
          className="w-full text-xs text-gray-700 placeholder-gray-400 border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}
