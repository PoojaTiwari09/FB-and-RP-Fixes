'use client';

import { Info } from 'lucide-react';
import { useState } from 'react';

export default function SourceColumnInfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1">
      <Info
        size={11}
        className="text-gray-400 cursor-help"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <span className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-[10px] font-normal rounded px-2 py-1 whitespace-nowrap shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
}
