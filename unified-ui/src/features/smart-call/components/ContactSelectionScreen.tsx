'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Phone } from 'lucide-react';
import PageHeader from '@shared/components/PageHeader/PageHeader';
import RoleBadge from '@shared/components/RoleBadge/RoleBadge';
import type { Contact } from '@smart-call/types/smart-call.types';
import { fetchContacts } from '@smart-call/services/smart-call.service';

interface Props {
  onContactSelect: (contact: Contact) => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-green-100 text-green-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
];

function avatarColor(name: string): string {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function ContactSelectionScreen({ onContactSelect }: Props) {
  const [query,    setQuery]    = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const result = await fetchContacts(q);
      setContacts(result.contacts);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { load(''); }, [load]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => load(query), 300);
    return () => clearTimeout(timer);
  }, [query, load]);

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Smart Call"
        subtitle="Select a contact to start an AI-powered live call session."
        badge={<RoleBadge role="sales_rep" />}
      />

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Search bar */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search contacts, accounts, companies..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Contact list */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-200 p-4 h-[72px] animate-pulse"
                />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-12 text-center">
              <p className="text-sm font-medium text-gray-400">No contacts found.</p>
              <p className="text-xs text-gray-300 mt-1">Try a different name or company.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <div
                  key={contact.contactId}
                  className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-gray-300 transition-colors"
                >
                  {/* Avatar */}
                  {contact.avatarUrl ? (
                    <img
                      src={contact.avatarUrl}
                      alt={contact.contactName}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${avatarColor(contact.contactName)}`}
                    >
                      {getInitials(contact.contactName)}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{contact.contactName}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {contact.jobTitle} · {contact.company}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{contact.lastInteractionLabel}</p>
                  </div>

                  {/* Call CTA */}
                  <button
                    onClick={() => onContactSelect(contact)}
                    className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Phone size={13} />
                    Call
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
