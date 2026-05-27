/**
 * @deprecated Use `src/api/m03Api.js` — NestJS-backed API only.
 */
export {
  setUserContext,
  createResearchJob,
  getJobStatus,
  listJobs,
  getReport,
  askQuery as askAnything,
  submitFeedback,
  healthCheck,
} from '../api/m03Api';

export async function getDataSummary() {
  const { fetchWorkspace } = await import('../api/m03Api');
  const ws = await fetchWorkspace();
  return {
    calls: ws.calls?.length ?? 0,
    deals: ws.deals?.length ?? 0,
    accounts: ws.accounts?.length ?? 0,
    contacts: ws.contacts?.length ?? 0,
  };
}
