import CallsListRepView from '@calls/components/rep/CallsListRepView';

/** Manager uses the same DB-backed calls list as rep (team-wide tenant scope). */
export default function CallsListManagerView() {
  return <CallsListRepView />;
}
