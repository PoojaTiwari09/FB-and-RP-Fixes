'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { Deal } from '../types/deal.types';

interface CommentDealModalProps {
  deal: Deal;
  onClose: () => void;
  onPost: (comment: string) => Promise<void>;
}

export default function CommentDealModal({ deal, onClose, onPost }: CommentDealModalProps) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const canPost = comment.trim().length > 0;

  const handlePost = async () => {
    if (!canPost || submitting) return;

    setSubmitting(true);
    await onPost(comment.trim());
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        aria-label="Close comment modal"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
      />
      <section className="relative z-10 w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Add Comment</h2>
            <p className="mt-5 text-sm text-gray-700">
              Deal: <span className="font-medium text-gray-900">{deal.name}</span>
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="min-h-32 w-full resize-none rounded-md border border-blue-300 px-4 py-3 text-sm outline-none focus:border-[#153E91] focus:ring-2 focus:ring-blue-100"
          placeholder="Add your comment for the sales rep..."
        />

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canPost || submitting}
            className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${
              canPost && !submitting ? 'bg-[#153E91] hover:bg-[#0f2f70]' : 'bg-gray-300'
            }`}
            onClick={handlePost}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </section>
    </div>
  );
}
