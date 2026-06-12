'use client';

import { useState, useEffect, useMemo } from 'react';
import PageHeader from '@shared/components/PageHeader/PageHeader';
import RoleBadge from '@shared/components/RoleBadge/RoleBadge';
import { dataCloudApi } from '../../services/apiClient';
import { TableMeta, TableSchema, ConnectionMeta, ExportRun, ComplianceLog } from '../../services/mockData';
import {
  Database,
  Search,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Download,
  ArrowLeft,
  Check,
  CheckSquare,
  Square,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Layers,
  Link,
  Plus,
  Terminal,
  ArrowRight
} from 'lucide-react';

export default function DataCloudManagerView() {
  const [activeTab, setActiveTab] = useState<'TABLES' | 'WAREHOUSE'>('TABLES');
  const [selectedTableName, setSelectedTableName] = useState<string | null>(null);
  
  // API & Data States
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [activeSchema, setActiveSchema] = useState<TableSchema | null>(null);
  const [connections, setConnections] = useState<ConnectionMeta[]>([]);
  const [exportRuns, setExportRuns] = useState<ExportRun[]>([]);
  const [complianceLogs, setComplianceLogs] = useState<ComplianceLog[]>([]);
  const [crmStatus, setCrmStatus] = useState<any>(null);
  
  // UI Interaction States
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [connectionTestStatus, setConnectionTestStatus] = useState<{ id: string; state: 'idle' | 'testing' | 'success' | 'failed'; message?: string } | null>(null);
  const [isSyncingCrm, setIsSyncingCrm] = useState(false);
  const [isReplayingExport, setIsReplayingExport] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [backendError, setBackendError] = useState<string | null>(null);
  
  // Schema Column Export Selection State
  const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>({});
  
  // Compliance Modals
  const [showAddComplianceModal, setShowAddComplianceModal] = useState(false);
  const [newComplianceRule, setNewComplianceRule] = useState({ ruleName: '', appliedTo: 'conversations', status: 'COMPLIANT' as any, details: '' });
  
  // Connection Modals
  const [showAddConnectionModal, setShowAddConnectionModal] = useState(false);
  const [newConnection, setNewConnection] = useState({ name: '', host: '', database: '', schema: '', username: '' });

  // View Export Payload Modal
  const [viewingPayload, setViewingPayload] = useState<string | null>(null);

  // Initialize and Fetch data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoadingTables(true);
    setBackendError(null);
    try {
      const tablesRes = await dataCloudApi.getTables();
      setTables(tablesRes.data);

      const [connRes, runsRes, compRes, crmRes] = await Promise.all([
        dataCloudApi.getConnections(),
        dataCloudApi.getExportRuns(),
        dataCloudApi.getDataCompliance(),
        dataCloudApi.getCrmSyncStatus(),
      ]);

      setConnections(connRes.data);
      setExportRuns(runsRes.data);
      setComplianceLogs(compRes.data);
      setCrmStatus(crmRes.data);
      setBackendStatus('connected');
    } catch (err: any) {
      setBackendStatus('error');
      setBackendError(
        err?.message?.includes('fetch')
          ? 'Cannot reach backend at http://localhost:4011. Start the M10 NestJS server first.'
          : (err?.message ?? 'Backend request failed.')
      );
    } finally {
      setIsLoadingTables(false);
    }
  };

  // Handle table drilldown
  const handleSelectTable = async (tableName: string) => {
    const res = await dataCloudApi.getTableSchema(tableName);
    setActiveSchema(res.data);
    
    // Initialize column selection dictionary to true
    const colsInit: Record<string, boolean> = {};
    res.data.columns.forEach((c) => {
      colsInit[c.name] = true;
    });
    setSelectedColumns(colsInit);
    setSelectedTableName(tableName);
  };

  // Filtered tables list
  const filteredTables = useMemo(() => {
    return tables.filter(
      (t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tables, searchQuery]);

  // Refresh tables logic
  const handleRefreshTables = async () => {
    setIsLoadingTables(true);
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate refresh animation
    await fetchInitialData();
    setIsLoadingTables(false);
  };

  // Test warehouse connection
  const handleTestConnection = async (id: string) => {
    setConnectionTestStatus({ id, state: 'testing' });
    await new Promise((resolve) => setTimeout(resolve, 1200)); // Animation delay
    const res = await dataCloudApi.testConnection(id);
    if (res.data.success) {
      setConnectionTestStatus({ id, state: 'success', message: res.data.message });
      setTimeout(() => setConnectionTestStatus(null), 4000);
    } else {
      setConnectionTestStatus({ id, state: 'failed', message: 'Failed to verify connection.' });
    }
  };

  // Trigger CRM Sync
  const handleCrmSync = async () => {
    setIsSyncingCrm(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await dataCloudApi.triggerCrmSync();
    const crmRes = await dataCloudApi.getCrmSyncStatus();
    setCrmStatus(crmRes.data);
    setIsSyncingCrm(false);
  };

  // Force replay export
  const handleReplaySync = async () => {
    setIsReplayingExport(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Pass the first connection's id so the backend gets a valid connectionId
    await dataCloudApi.replaySync({ connectionId: connections[0]?.id });
    const runsRes = await dataCloudApi.getExportRuns();
    setExportRuns(runsRes.data);
    setIsReplayingExport(false);

    // Simulate completion of a mock "RUNNING" export task after 5 seconds
    setTimeout(async () => {
      const finalRuns = await dataCloudApi.getExportRuns();
      // Modify the running task to SUCCESS in mock state
      const updated = finalRuns.data.map(r => r.status === 'RUNNING' ? { ...r, status: 'SUCCESS' as const, completedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC', recordsExported: 45621 } : r);
      setExportRuns(updated);
    }, 5000);
  };

  // Add compliance rule
  const handleAddComplianceRule = async (e: React.FormEvent) => {
    e.preventDefault();
    await dataCloudApi.createDataCompliance(newComplianceRule);
    const compRes = await dataCloudApi.getDataCompliance();
    setComplianceLogs(compRes.data);
    setShowAddComplianceModal(false);
    setNewComplianceRule({ ruleName: '', appliedTo: 'conversations', status: 'COMPLIANT', details: '' });
  };

  // Add new connection
  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    const connMeta: Omit<ConnectionMeta, 'id' | 'status' | 'lastSynced'> = {
      type: 'Snowflake',
      name: newConnection.name || 'New Database Connection',
      host: newConnection.host || 'snowflake.example.com',
      database: newConnection.database || 'ANALYTICS',
      schema: newConnection.schema || 'public',
      username: newConnection.username || 'READER',
    };
    await dataCloudApi.createConnection(connMeta);
    const connRes = await dataCloudApi.getConnections();
    setConnections(connRes.data);
    setShowAddConnectionModal(false);
    setNewConnection({ name: '', host: '', database: '', schema: '', username: '' });
  };

  // Download export runs logs payload
  const handleDownloadRunPayload = async (runId: string) => {
    const res = await dataCloudApi.downloadExportRun(runId);
    setViewingPayload(res.data.payload);
  };

  // Dynamic CSV generation and download
  const handleDownloadCSV = () => {
    if (!activeSchema) return;
    const selectedCols = activeSchema.columns.filter((c) => selectedColumns[c.name]);
    if (selectedCols.length === 0) return;

    let csvContent = 'COLUMN NAME,DATA TYPE,NULLABLE,DESCRIPTION,EXAMPLE VALUE\r\n';
    selectedCols.forEach((col) => {
      csvContent += `"${col.name}","${col.type}","${col.nullable}","${col.description.replace(/"/g, '""')}","${col.example.replace(/"/g, '""')}"\r\n`;
    });

    // Use a Data URI with UTF-8 BOM prefix (\uFEFF) to guarantee correct file encoding and naming compatibility in Windows Chrome/Edge
    const csvContentEncoded = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvContent);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = csvContentEncoded;
    link.setAttribute('download', `${activeSchema.name}_schema_export.csv`);
    link.download = `${activeSchema.name}_schema_export.csv`;
    
    document.body.appendChild(link);
    link.click();
    
    // Defer link removal to allow Chrome's download engine to resolve the transaction
    setTimeout(() => {
      document.body.removeChild(link);
    }, 150);
  };

  const allColumnsChecked = useMemo(() => {
    if (!activeSchema) return false;
    return activeSchema.columns.every((c) => selectedColumns[c.name]);
  }, [activeSchema, selectedColumns]);

  const toggleSelectAllColumns = () => {
    if (!activeSchema) return;
    const nextVal = !allColumnsChecked;
    const nextState: Record<string, boolean> = {};
    activeSchema.columns.forEach((c) => {
      nextState[c.name] = nextVal;
    });
    setSelectedColumns(nextState);
  };

  const toggleColumnSelection = (name: string) => {
    setSelectedColumns((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const selectedCount = useMemo(() => {
    return Object.values(selectedColumns).filter(Boolean).length;
  }, [selectedColumns]);

  // Actions row on top right of the PageHeader
  const headerActions = (
    <div className="flex items-center gap-3">
      {/* Backend connectivity status pill */}
      <span
        title={
          backendStatus === 'connected'
            ? 'Live backend API connected.'
            : backendStatus === 'error'
            ? 'Backend is offline. See error below.'
            : 'Connecting to backend...'
        }
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
          backendStatus === 'connected'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : backendStatus === 'error'
            ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            backendStatus === 'connected'
              ? 'bg-emerald-500'
              : backendStatus === 'error'
              ? 'bg-red-500'
              : 'bg-amber-500 animate-pulse'
          }`}
        />
        {backendStatus === 'connected'
          ? 'Backend Connected'
          : backendStatus === 'error'
          ? 'Backend Offline'
          : 'Connecting...'}
      </span>

      {/* Warehouse Info — only shown when connected */}
      {backendStatus === 'connected' && (
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <Database className="w-3.5 h-3.5 text-blue-600" />
          M10 API · port 4011
        </span>
      )}
    </div>
  );

  return (
    <div className="flex flex-col flex-1 bg-gray-50/50 h-full overflow-y-auto text-gray-900 font-sans">
      <PageHeader
        title="Data Cloud"
        subtitle={selectedTableName ? undefined : "Explore your warehouse tables and schema information."}
        badge={<RoleBadge role="sales_manager" />}
        actions={headerActions}
      />

      {/* Backend Error Banner */}
      {backendStatus === 'error' && backendError && (
        <div className="mx-6 mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Backend Unreachable</p>
            <p className="text-xs mt-0.5 text-red-700 font-mono">{backendError}</p>
          </div>
          <button
            onClick={fetchInitialData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex-shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Drill-down Schema Reference View */}
        {selectedTableName && activeSchema ? (
          <div className="space-y-6 animate-fadeIn">
            {/* Breadcrumbs navigation row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedTableName(null)}
                  className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Data Cloud</span>
                </button>
                <span className="text-gray-300">/</span>
                <span className="text-sm font-semibold text-gray-800">Schema Reference</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                  READ ONLY
                </span>
              </div>

              <button
                onClick={handleDownloadCSV}
                disabled={selectedCount === 0}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#10338D] hover:bg-[#0c276b] active:bg-[#0a1e53] rounded-lg shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download CSV</span>
              </button>
            </div>

            <p className="text-xs text-gray-500 font-serif italic -mt-2">
              All query/views created using SQL Builder use the model schema of the {activeSchema.schemaName}
            </p>

            {/* Meta badges row */}
            <div className="flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Last synced 6 hours ago
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 font-medium">
                📅 2026-05-20 02:00 UTC
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 font-medium">
                🗂️ 11 tables
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 font-medium">
                🖧 Snowflake / RI_ANALYTICS
              </span>
            </div>

            {/* Top Schema description Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="p-3 bg-blue-50 text-[#10338D] rounded-xl flex-shrink-0">
                <Database className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">{activeSchema.name}</h2>
                  <span className="text-xs text-gray-400 font-medium">
                    Schema: <span className="text-gray-600">{activeSchema.schemaName}</span>
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-600 font-semibold bg-gray-100 px-2 py-0.5 rounded">
                    {activeSchema.rowCountLabel}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">
                    Updated: <span className="font-semibold text-gray-700">{activeSchema.updateFreq}</span>
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed font-sans">{activeSchema.description}</p>
              </div>
            </div>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs hover:border-[#10338D]/20 transition-all">
                <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">PRIMARY KEY</span>
                <p className="text-sm font-semibold text-gray-800 mt-1.5">{activeSchema.primaryKey}</p>
                <p className="text-xs text-gray-400 mt-0.5">{activeSchema.primaryKeyDetails}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs hover:border-[#10338D]/20 transition-all">
                <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">PARTITION COLUMN</span>
                <p className="text-sm font-semibold text-gray-800 mt-1.5">{activeSchema.partitionColumn}</p>
                <p className="text-xs text-gray-400 mt-0.5">{activeSchema.partitionColumnDetails}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs hover:border-[#10338D]/20 transition-all">
                <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">FOREIGN KEYS OUT</span>
                <p className="text-sm font-semibold text-gray-800 mt-1.5">{activeSchema.foreignKeysOutLabel}</p>
                <p className="text-xs text-orange-500 font-medium mt-0.5">{activeSchema.foreignKeysOutDetails}</p>
              </div>
            </div>

            {/* Column Definitions Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-150 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900 font-serif">Column Definitions</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-gray-200/80 text-gray-700 rounded-full">
                    {activeSchema.columns.length} columns
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-medium text-gray-500">Select columns to include in CSV</span>
                  <button
                    onClick={toggleSelectAllColumns}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-medium text-gray-700 bg-white transition-all cursor-pointer"
                  >
                    {allColumnsChecked ? (
                      <CheckSquare className="w-4 h-4 text-[#10338D]" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                    <span>Select All</span>
                  </button>
                </div>
              </div>

              {/* Responsive table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/20">
                      <th className="py-4 px-6 w-10 text-center"></th>
                      <th className="py-4 px-4 font-sans text-gray-500">Column Name</th>
                      <th className="py-4 px-4 font-sans text-gray-500">Data Type</th>
                      <th className="py-4 px-4 font-sans text-gray-500">Nullable</th>
                      <th className="py-4 px-4 font-sans text-gray-500">Description</th>
                      <th className="py-4 px-6 font-sans text-gray-500">Example Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {activeSchema.columns.map((col) => {
                      const isChecked = !!selectedColumns[col.name];
                      return (
                        <tr
                          key={col.name}
                          onClick={() => toggleColumnSelection(col.name)}
                          className={`hover:bg-blue-50/10 transition-colors cursor-pointer ${
                            isChecked ? 'bg-blue-50/5' : ''
                          }`}
                        >
                          <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => toggleColumnSelection(col.name)}
                              className="text-gray-400 hover:text-[#10338D] transition-colors"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-[#10338D]" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-300 hover:border-gray-400" />
                              )}
                            </button>
                          </td>
                          <td className="py-4 px-4 font-bold text-gray-800 font-mono text-xs">{col.name}</td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                                col.type === 'VARCHAR'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                  : col.type === 'TIMESTAMP'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                  : col.type === 'INTEGER'
                                  ? 'bg-orange-50 text-orange-700 border border-orange-100'
                                  : col.type === 'FLOAT'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'bg-gray-100 text-gray-700 border border-gray-200'
                              }`}
                            >
                              {col.type}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                col.nullable === 'NOT NULL'
                                  ? 'bg-red-50 text-red-700 border border-red-100'
                                  : 'bg-green-50 text-green-700 border border-green-100'
                              }`}
                            >
                              {col.nullable}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-600 max-w-sm leading-relaxed text-xs font-sans">
                            {col.description}
                          </td>
                          <td className="py-4 px-6 text-gray-500 font-mono text-xs truncate max-w-[200px]" title={col.example}>
                            {col.example}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer actions */}
              <div className="px-6 py-4 border-t border-gray-150 flex items-center justify-between text-xs text-gray-500 bg-gray-50/30">
                <span>
                  <strong className="text-gray-700">{selectedCount}</strong> of{' '}
                  <strong className="text-gray-700">{activeSchema.columns.length}</strong> columns selected for export
                </span>
                <button
                  onClick={handleDownloadCSV}
                  disabled={selectedCount === 0}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-200 hover:border-[#10338D]/40 hover:bg-gray-50 rounded-lg font-medium text-gray-700 transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5 text-gray-500" />
                  <span>Download/Export selected</span>
                </button>
              </div>
            </div>

            {/* Foreign Key Relationships diagram section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 font-serif">Foreign Key Relationships</h3>

              {/* Interactive relational node map */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-12 py-10 px-6 bg-gray-550/10 bg-[#fafafc] rounded-2xl border border-gray-100 relative overflow-hidden">
                {/* Center Node (conversations) */}
                <div className="flex flex-col items-center p-6 bg-white border-2 border-[#10338D]/25 rounded-2xl shadow-sm hover:border-[#10338D]/50 hover:shadow-md transition-all duration-300 w-44 z-10">
                  <div className="p-3 bg-blue-50 text-[#10338D] rounded-xl mb-3">
                    <Database className="w-6.5 h-6.5" />
                  </div>
                  <span className="font-bold text-gray-900 text-xs px-3.5 py-1.5 bg-blue-50/50 rounded-full border border-blue-100 font-mono">
                    {activeSchema.name}
                  </span>
                </div>

                {/* SVG Connecting Paths */}
                <div className="hidden md:block w-24 h-48 relative z-0">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 100 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Curve 1 -> transcripts */}
                    <path d="M 0 100 C 50 100, 50 25, 100 25" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
                    <polygon points="98,25 92,21 94,25 92,29" fill="#94a3b8" />

                    {/* Curve 2 -> participants */}
                    <path d="M 0 100 C 50 100, 50 75, 100 75" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
                    <polygon points="98,75 92,71 94,75 92,79" fill="#94a3b8" />

                    {/* Curve 3 -> tracker_detections */}
                    <path d="M 0 100 C 50 100, 50 125, 100 125" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
                    <polygon points="98,125 92,121 94,125 92,129" fill="#94a3b8" />

                    {/* Curve 4 -> CRM (external) */}
                    <path d="M 0 100 C 50 100, 50 175, 100 175" stroke="#fdba74" strokeWidth="1.5" strokeDasharray="3 3" />
                    <polygon points="98,175 92,171 94,175 92,179" fill="#f97316" />
                  </svg>
                </div>

                {/* Vertical list of related nodes */}
                <div className="flex flex-col gap-3 min-w-[220px] z-10">
                  {activeSchema.relationships.map((rel) => {
                    const isExt = rel.type === 'external';
                    return (
                      <div
                        key={rel.name}
                        className={`flex items-center justify-between gap-3 px-4 py-3 bg-white border rounded-xl shadow-xs transition-all hover:translate-x-1 ${
                          isExt
                            ? 'border-orange-200 bg-orange-50/10 hover:border-orange-300'
                            : 'border-gray-250 border-[#e5e7eb] hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Database className={`w-4 h-4 ${isExt ? 'text-orange-500' : 'text-blue-500'}`} />
                          <span className="text-xs font-semibold text-gray-800 font-mono">{rel.name}</span>
                        </div>
                        {isExt && (
                          <span className="text-[9px] font-bold tracking-wider text-orange-700 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md uppercase font-accent">
                            EXTERNAL
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-xs text-center text-gray-400 font-mono">
                {activeSchema.joinKeyInfo}
              </p>
            </div>
          </div>
        ) : (
          /* Main Tab Views */
          <div className="space-y-6">
            {/* Header Navigation tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('TABLES')}
                className={`py-4 px-6 text-sm font-semibold tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === 'TABLES'
                    ? 'border-[#10338D] text-[#10338D]'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                TABLES
              </button>
              <button
                onClick={() => setActiveTab('WAREHOUSE')}
                className={`py-4 px-6 text-sm font-semibold tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === 'WAREHOUSE'
                    ? 'border-[#10338D] text-[#10338D]'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                WAREHOUSE
              </button>
            </div>

            {activeTab === 'TABLES' ? (
              /* TABLES VIEW */
              <div className="space-y-6 animate-fadeIn">
                {/* Search Bar Panel */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search tables..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 focus:border-[#10338D] focus:ring-1 focus:ring-[#10338D]/30 rounded-xl bg-gray-50/50 text-sm focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-3 py-1 bg-gray-100 text-gray-600 rounded-full border border-gray-200">
                      {filteredTables.length} Tables
                    </span>
                    <button
                      onClick={handleRefreshTables}
                      disabled={isLoadingTables}
                      className="p-2 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingTables ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Table List */}
                {isLoadingTables ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-16 w-full skeleton" />
                    ))}
                  </div>
                ) : filteredTables.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                    <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No tables match your search query.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100 relative">
                    {filteredTables.map((table) => (
                      <div
                        key={table.name}
                        onClick={() => handleSelectTable(table.name)}
                        className="flex items-center justify-between px-6 py-4.5 hover:bg-blue-50/10 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3.5">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              table.isActive ? 'bg-[#10b981] shadow-xs' : 'bg-gray-300'
                            }`}
                          />
                          <div className="space-y-0.5">
                            <h3 className="text-sm font-bold text-gray-900 font-mono group-hover:text-[#10338D] transition-colors">
                              {table.name}
                            </h3>
                            <p className="text-xs text-gray-400 font-sans">{table.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                          <span className="group-hover:text-gray-600 transition-colors font-semibold">
                            {table.rows}
                          </span>
                          <ChevronRight className="w-4 h-4 group-hover:text-[#10338D] transition-colors transform group-hover:translate-x-0.5 duration-200" />
                        </div>
                      </div>
                    ))}

                    {/* Floating Action Button */}
                    <button
                      title="Create query in SQL builder"
                      className="absolute bottom-6 right-6 p-4 rounded-full bg-gradient-to-tr from-violet-600 to-[#10338D] hover:from-violet-750 hover:to-[#0c276b] text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-600/35 hover:-translate-y-0.5 transition-all duration-300 group z-10 cursor-pointer"
                    >
                      <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                    </button>
                  </div>
                )}

                {/* Warehouse Details Footer Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow">
                  <div className="space-y-4 w-full">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 font-serif">
                      Warehouse Details
                    </h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 max-w-md text-xs font-medium">
                      <div className="text-gray-400">Schema:</div>
                      <div className="text-gray-800 font-mono">revenue_intelligence</div>
                      
                      <div className="text-gray-400">Sync:</div>
                      <div className="text-gray-800">Daily @ 02:00 UTC</div>
                    </div>
                  </div>
                  <div className="p-5 bg-blue-50/70 border border-blue-100 text-[#10338D] rounded-2xl flex-shrink-0">
                    <Database className="w-9 h-9" />
                  </div>
                </div>
              </div>
            ) : (
              /* WAREHOUSE MANAGEMENT VIEW */
              <div className="space-y-6 animate-fadeIn">
                {/* Connection Details and CRM synchronization */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Warehouse Connection Card */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Database className="w-5 h-5 text-[#10338D]" />
                        <h3 className="text-sm font-bold text-gray-900">Active Warehouse</h3>
                      </div>
                      <button
                        onClick={() => setShowAddConnectionModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-700 bg-white transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New</span>
                      </button>
                    </div>

                    {connections.length === 0 ? (
                      <p className="text-xs text-gray-400 py-6 text-center">No databases configured.</p>
                    ) : (
                      <div className="space-y-4 divide-y divide-gray-100">
                        {connections.map((conn) => {
                          const isTesting = connectionTestStatus?.id === conn.id && connectionTestStatus.state === 'testing';
                          const isSuccess = connectionTestStatus?.id === conn.id && connectionTestStatus.state === 'success';
                          const isFailed = connectionTestStatus?.id === conn.id && connectionTestStatus.state === 'failed';

                          return (
                            <div key={conn.id} className="pt-4 first:pt-0 space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-0.5">
                                  <h4 className="text-sm font-bold text-gray-800">{conn.name}</h4>
                                  <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 font-mono">
                                    {conn.type} • Host: {conn.host}
                                  </span>
                                </div>
                                <span className="inline-flex px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                                  {conn.status}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs border border-gray-100 bg-gray-50/50 p-3 rounded-xl font-mono text-gray-600">
                                <div>DB Name: {conn.database}</div>
                                <div>Schema: {conn.schema}</div>
                                <div className="col-span-2">Username: {conn.username}</div>
                              </div>

                              <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] text-gray-400">Last Synced: {conn.lastSynced}</span>
                                <button
                                  onClick={() => handleTestConnection(conn.id)}
                                  disabled={isTesting}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#10338D]/20 hover:border-[#10338D]/50 hover:bg-[#10338D]/5 rounded-lg text-xs font-semibold text-[#10338D] bg-white transition-all disabled:opacity-40 cursor-pointer"
                                >
                                  <Activity className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                                  <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                                </button>
                              </div>

                              {isSuccess && (
                                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2 animate-pulse">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                  <span>{connectionTestStatus.message}</span>
                                </div>
                              )}
                              {isFailed && (
                                <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                  <span>{connectionTestStatus.message}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* CRM Synchronization sync status */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
                      <Link className="w-5 h-5 text-[#10338D]" />
                      <h3 className="text-sm font-bold text-gray-900">CRM Sync Integration</h3>
                    </div>

                    {crmStatus ? (
                      <div className="space-y-4 font-medium text-xs">
                        <div className="flex justify-between items-center py-1 border-b border-gray-50">
                          <span className="text-gray-400">Service:</span>
                          <span className="text-gray-800 font-semibold">{crmStatus.crmType} Integration</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-gray-50">
                          <span className="text-gray-400">Sync Status:</span>
                          <span className="inline-flex px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-bold">
                            {crmStatus.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-gray-50">
                          <span className="text-gray-400">Schedule Frequency:</span>
                          <span className="text-gray-700 font-mono">{crmStatus.syncSchedule}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-400">Last Synced Timestamp:</span>
                          <span className="text-gray-700">{crmStatus.lastSyncTime}</span>
                        </div>

                        <div className="pt-2">
                          <button
                            onClick={handleCrmSync}
                            disabled={isSyncingCrm}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#10338D] hover:bg-[#0c276b] rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                          >
                            <RefreshCw className={`w-4 h-4 ${isSyncingCrm ? 'animate-spin' : ''}`} />
                            <span>{isSyncingCrm ? 'Synchronizing with Salesforce...' : 'Sync Salesforce CRM'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-24 skeleton" />
                    )}
                  </div>
                </div>

                {/* Compliance Guard & Policy Audits */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-5 h-5 text-[#10338D]" />
                      <h3 className="text-sm font-bold text-gray-900">Data Compliance & PII Guard</h3>
                    </div>
                    <button
                      onClick={() => setShowAddComplianceModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-700 bg-white transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Trigger Audit Check</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-250 border-[#e5e7eb] font-semibold text-gray-400 bg-gray-50/30">
                          <th className="py-3 px-4">Rule / Audit Name</th>
                          <th className="py-3 px-4">Applied Table</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Audit Date</th>
                          <th className="py-3 px-4">Details log</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-600">
                        {complianceLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50/50">
                            <td className="py-3 px-4 font-bold text-gray-800">{log.ruleName}</td>
                            <td className="py-3 px-4 font-mono">{log.appliedTo}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                  log.status === 'COMPLIANT'
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : log.status === 'WARNING'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                              >
                                {log.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-gray-400">{log.checkedAt}</td>
                            <td className="py-3 px-4 leading-normal">{log.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Export Runs and Trigger Sync */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <Terminal className="w-5 h-5 text-[#10338D]" />
                      <h3 className="text-sm font-bold text-gray-900">Export Sync Run History</h3>
                    </div>

                    <button
                      onClick={handleReplaySync}
                      disabled={isReplayingExport}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#10338D] hover:bg-[#0c276b] active:bg-[#0a1e53] rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-40"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isReplayingExport ? 'animate-spin' : ''}`} />
                      <span>{isReplayingExport ? 'Triggering...' : 'Force Replay Export'}</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-250 border-[#e5e7eb] font-semibold text-gray-400 bg-gray-50/30">
                          <th className="py-3 px-4">Run ID</th>
                          <th className="py-3 px-4">Table</th>
                          <th className="py-3 px-4">Started At</th>
                          <th className="py-3 px-4">Completed At</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Rows Exported</th>
                          <th className="py-3 px-4 text-center">Payload Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-mono text-gray-600">
                        {exportRuns.map((run) => (
                          <tr key={run.id} className="hover:bg-gray-50/50">
                            <td className="py-3 px-4 font-bold text-gray-800">{run.id}</td>
                            <td className="py-3 px-4">{run.tableName}</td>
                            <td className="py-3 px-4 text-gray-400">{run.startedAt}</td>
                            <td className="py-3 px-4 text-gray-400">{run.completedAt}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                  run.status === 'SUCCESS'
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : run.status === 'RUNNING'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                              >
                                {run.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right text-gray-700 font-semibold font-sans">
                              {run.recordsExported.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleDownloadRunPayload(run.id)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 hover:border-[#10338D]/35 hover:bg-gray-50 rounded-lg text-[10px] text-gray-700 bg-white transition-all font-sans cursor-pointer"
                              >
                                <Download className="w-3 h-3 text-gray-400" />
                                <span>Inspect JSON</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- DIALOG MODALS --- */}

      {/* View JSON payload modal */}
      {viewingPayload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 font-serif">Sync Payload Inspection</h3>
              <button
                onClick={() => setViewingPayload(null)}
                className="text-gray-400 hover:text-gray-700 text-xs font-semibold px-2 py-1 bg-gray-100 hover:bg-gray-250 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-gray-900 text-gray-100 rounded-b-2xl font-mono text-xs leading-relaxed">
              <pre>{viewingPayload}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Add Compliance Rule audit modal */}
      {showAddComplianceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-900 font-serif">Trigger Security/Compliance Audit</h3>
              <button
                onClick={() => setShowAddComplianceModal(false)}
                className="text-gray-400 hover:text-gray-700 text-xs font-semibold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddComplianceRule} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Audit Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SOC2 PII Masking Audit"
                  value={newComplianceRule.ruleName}
                  onChange={(e) => setNewComplianceRule({ ...newComplianceRule, ruleName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-250 border-[#e5e7eb] focus:border-[#10338D] focus:ring-1 focus:ring-[#10338D]/20 rounded-xl outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Target Table</label>
                  <select
                    value={newComplianceRule.appliedTo}
                    onChange={(e) => setNewComplianceRule({ ...newComplianceRule, appliedTo: e.target.value })}
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-xl outline-none text-sm"
                  >
                    {tables.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Audit Assessment</label>
                  <select
                    value={newComplianceRule.status}
                    onChange={(e) => setNewComplianceRule({ ...newComplianceRule, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-xl outline-none text-sm"
                  >
                    <option value="COMPLIANT">COMPLIANT</option>
                    <option value="WARNING">WARNING</option>
                    <option value="NON-COMPLIANT">NON-COMPLIANT</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Log details</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Audit findings notes..."
                  value={newComplianceRule.details}
                  onChange={(e) => setNewComplianceRule({ ...newComplianceRule, details: e.target.value })}
                  className="w-full px-3 py-2 border border-[#e5e7eb] focus:border-[#10338D] focus:ring-1 focus:ring-[#10338D]/20 rounded-xl outline-none text-sm resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddComplianceModal(false)}
                  className="px-4 py-2 border border-gray-250 border-[#e5e7eb] hover:bg-gray-50 text-xs font-semibold rounded-xl text-gray-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#10338D] hover:bg-[#0c276b] text-xs font-semibold text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Trigger Run
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Connection Modal */}
      {showAddConnectionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-900 font-serif">Configure New Snowflake Connection</h3>
              <button
                onClick={() => setShowAddConnectionModal(false)}
                className="text-gray-400 hover:text-gray-700 text-xs font-semibold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddConnection} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Connection Alias Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Snowflake Analytics Production"
                  value={newConnection.name}
                  onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#e5e7eb] focus:border-[#10338D] focus:ring-1 focus:ring-[#10338D]/20 rounded-xl outline-none text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Warehouse URL/Host</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. acme-123.snowflakecomputing.com"
                  value={newConnection.host}
                  onChange={(e) => setNewConnection({ ...newConnection, host: e.target.value })}
                  className="w-full px-3 py-2 border border-[#e5e7eb] focus:border-[#10338D] focus:ring-1 focus:ring-[#10338D]/20 rounded-xl outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Database</label>
                  <input
                    type="text"
                    required
                    placeholder="RI_ANALYTICS"
                    value={newConnection.database}
                    onChange={(e) => setNewConnection({ ...newConnection, database: e.target.value })}
                    className="w-full px-3 py-2 border border-[#e5e7eb] focus:border-[#10338D] focus:ring-1 focus:ring-[#10338D]/20 rounded-xl outline-none text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Schema</label>
                  <input
                    type="text"
                    required
                    placeholder="revenue_intelligence"
                    value={newConnection.schema}
                    onChange={(e) => setNewConnection({ ...newConnection, schema: e.target.value })}
                    className="w-full px-3 py-2 border border-[#e5e7eb] focus:border-[#10338D] focus:ring-1 focus:ring-[#10338D]/20 rounded-xl outline-none text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Role/User ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RI_DATA_READER"
                  value={newConnection.username}
                  onChange={(e) => setNewConnection({ ...newConnection, username: e.target.value })}
                  className="w-full px-3 py-2 border border-[#e5e7eb] focus:border-[#10338D] focus:ring-1 focus:ring-[#10338D]/20 rounded-xl outline-none text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddConnectionModal(false)}
                  className="px-4 py-2 border border-[#e5e7eb] hover:bg-gray-50 text-xs font-semibold rounded-xl text-gray-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#10338D] hover:bg-[#0c276b] text-xs font-semibold text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Establish Connection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
