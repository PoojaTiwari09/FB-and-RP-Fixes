'use client';

import { getM05BoardUrl } from '../lib/api-env';

/** Cross-module link → M05 Account Intelligence (standalone port 5179). */
export function ModuleNavLinks() {
  return (
    <button
      type="button"
      className="secondary"
      onClick={() => { window.location.href = getM05BoardUrl(); }}
      title="Open M05 Account Intelligence (port 5179)"
    >
      Account Intelligence (M05)
    </button>
  );
}
