-- Enable RLS on all tenant-aware tables

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "User";
CREATE POLICY "tenant_isolation_policy" ON "User"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "Account";
CREATE POLICY "tenant_isolation_policy" ON "Account"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "Deal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Deal" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "Deal";
CREATE POLICY "tenant_isolation_policy" ON "Deal"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "Call" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Call" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "Call";
CREATE POLICY "tenant_isolation_policy" ON "Call"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "Dataset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Dataset" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "Dataset";
CREATE POLICY "tenant_isolation_policy" ON "Dataset"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "Dashboard" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Dashboard" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "Dashboard";
CREATE POLICY "tenant_isolation_policy" ON "Dashboard"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "Widget" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Widget" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "Widget";
CREATE POLICY "tenant_isolation_policy" ON "Widget"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "coachingrecommendations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "coachingrecommendations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "coachingrecommendations";
CREATE POLICY "tenant_isolation_policy" ON "coachingrecommendations"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "coachingsnapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "coachingsnapshots" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "coachingsnapshots";
CREATE POLICY "tenant_isolation_policy" ON "coachingsnapshots"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "DashboardConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DashboardConfig" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "DashboardConfig";
CREATE POLICY "tenant_isolation_policy" ON "DashboardConfig"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "DashboardSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DashboardSnapshot" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "DashboardSnapshot";
CREATE POLICY "tenant_isolation_policy" ON "DashboardSnapshot"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "trainerscenarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trainerscenarios" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "trainerscenarios";
CREATE POLICY "tenant_isolation_policy" ON "trainerscenarios"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "trainersessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trainersessions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "trainersessions";
CREATE POLICY "tenant_isolation_policy" ON "trainersessions"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "DataSource" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DataSource" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "DataSource";
CREATE POLICY "tenant_isolation_policy" ON "DataSource"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "Team" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Team" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "Team";
CREATE POLICY "tenant_isolation_policy" ON "Team"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "DashboardAccess" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DashboardAccess" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "DashboardAccess";
CREATE POLICY "tenant_isolation_policy" ON "DashboardAccess"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "CallRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CallRecord" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "CallRecord";
CREATE POLICY "tenant_isolation_policy" ON "CallRecord"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "Transcript" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transcript" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "Transcript";
CREATE POLICY "tenant_isolation_policy" ON "Transcript"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "Utterance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Utterance" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "Utterance";
CREATE POLICY "tenant_isolation_policy" ON "Utterance"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "CallNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CallNote" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "CallNote";
CREATE POLICY "tenant_isolation_policy" ON "CallNote"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "CallShare" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CallShare" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "CallShare";
CREATE POLICY "tenant_isolation_policy" ON "CallShare"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "AuditLog";
CREATE POLICY "tenant_isolation_policy" ON "AuditLog"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "Integration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Integration" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "Integration";
CREATE POLICY "tenant_isolation_policy" ON "Integration"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "AiBrief" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AiBrief" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "AiBrief";
CREATE POLICY "tenant_isolation_policy" ON "AiBrief"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "AiChatHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AiChatHistory" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "AiChatHistory";
CREATE POLICY "tenant_isolation_policy" ON "AiChatHistory"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "AiExtractionField" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AiExtractionField" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "AiExtractionField";
CREATE POLICY "tenant_isolation_policy" ON "AiExtractionField"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "AiExtractionResult" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AiExtractionResult" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "AiExtractionResult";
CREATE POLICY "tenant_isolation_policy" ON "AiExtractionResult"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "ForecastPeriod" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ForecastPeriod" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "ForecastPeriod";
CREATE POLICY "tenant_isolation_policy" ON "ForecastPeriod"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "AiForecastSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AiForecastSnapshot" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "AiForecastSnapshot";
CREATE POLICY "tenant_isolation_policy" ON "AiForecastSnapshot"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "ForecastSubmission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ForecastSubmission" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "ForecastSubmission";
CREATE POLICY "tenant_isolation_policy" ON "ForecastSubmission"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "ForecastAuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ForecastAuditLog" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "ForecastAuditLog";
CREATE POLICY "tenant_isolation_policy" ON "ForecastAuditLog"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "ForecastExecutiveSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ForecastExecutiveSnapshot" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "ForecastExecutiveSnapshot";
CREATE POLICY "tenant_isolation_policy" ON "ForecastExecutiveSnapshot"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "M06PredictionJob" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "M06PredictionJob" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "M06PredictionJob";
CREATE POLICY "tenant_isolation_policy" ON "M06PredictionJob"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "PipelineCoverageMetrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PipelineCoverageMetrics" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "PipelineCoverageMetrics";
CREATE POLICY "tenant_isolation_policy" ON "PipelineCoverageMetrics"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "HistoricalConversionRate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HistoricalConversionRate" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "HistoricalConversionRate";
CREATE POLICY "tenant_isolation_policy" ON "HistoricalConversionRate"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "ForecastNotification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ForecastNotification" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "ForecastNotification";
CREATE POLICY "tenant_isolation_policy" ON "ForecastNotification"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "PipelineValuesCache" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PipelineValuesCache" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "PipelineValuesCache";
CREATE POLICY "tenant_isolation_policy" ON "PipelineValuesCache"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "CrmDeal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CrmDeal" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "CrmDeal";
CREATE POLICY "tenant_isolation_policy" ON "CrmDeal"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "ForecastUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ForecastUser" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "ForecastUser";
CREATE POLICY "tenant_isolation_policy" ON "ForecastUser"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "Quota" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Quota" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "Quota";
CREATE POLICY "tenant_isolation_policy" ON "Quota"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "ForecastBoard" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ForecastBoard" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "ForecastBoard";
CREATE POLICY "tenant_isolation_policy" ON "ForecastBoard"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "BoardColumn" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BoardColumn" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "BoardColumn";
CREATE POLICY "tenant_isolation_policy" ON "BoardColumn"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "BoardExclusion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BoardExclusion" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "BoardExclusion";
CREATE POLICY "tenant_isolation_policy" ON "BoardExclusion"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "BoardCrmMapping" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BoardCrmMapping" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "BoardCrmMapping";
CREATE POLICY "tenant_isolation_policy" ON "BoardCrmMapping"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "BoardReminderConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BoardReminderConfig" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "BoardReminderConfig";
CREATE POLICY "tenant_isolation_policy" ON "BoardReminderConfig"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "BoardSubmissionAnnotation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BoardSubmissionAnnotation" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "BoardSubmissionAnnotation";
CREATE POLICY "tenant_isolation_policy" ON "BoardSubmissionAnnotation"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "SalesPlay" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SalesPlay" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "SalesPlay";
CREATE POLICY "tenant_isolation_policy" ON "SalesPlay"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "PlayEnrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlayEnrollment" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "PlayEnrollment";
CREATE POLICY "tenant_isolation_policy" ON "PlayEnrollment"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "PlayStepCompletion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlayStepCompletion" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "PlayStepCompletion";
CREATE POLICY "tenant_isolation_policy" ON "PlayStepCompletion"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "PlayNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlayNote" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "PlayNote";
CREATE POLICY "tenant_isolation_policy" ON "PlayNote"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "PlayAdherenceLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlayAdherenceLog" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "PlayAdherenceLog";
CREATE POLICY "tenant_isolation_policy" ON "PlayAdherenceLog"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "Task";
CREATE POLICY "tenant_isolation_policy" ON "Task"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "Workflow" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Workflow" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "Workflow";
CREATE POLICY "tenant_isolation_policy" ON "Workflow"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "WorkflowRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkflowRun" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "WorkflowRun";
CREATE POLICY "tenant_isolation_policy" ON "WorkflowRun"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "Approval" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Approval" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "Approval";
CREATE POLICY "tenant_isolation_policy" ON "Approval"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "WorkflowException" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkflowException" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "WorkflowException";
CREATE POLICY "tenant_isolation_policy" ON "WorkflowException"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "IntegrationState" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IntegrationState" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "IntegrationState";
CREATE POLICY "tenant_isolation_policy" ON "IntegrationState"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "WorkflowAuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkflowAuditLog" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "WorkflowAuditLog";
CREATE POLICY "tenant_isolation_policy" ON "WorkflowAuditLog"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "M10Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "M10Account" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "M10Account";
CREATE POLICY "tenant_isolation_policy" ON "M10Account"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "M10Contact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "M10Contact" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "M10Contact";
CREATE POLICY "tenant_isolation_policy" ON "M10Contact"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "M10Deal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "M10Deal" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "M10Deal";
CREATE POLICY "tenant_isolation_policy" ON "M10Deal"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "M10DealContact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "M10DealContact" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "M10DealContact";
CREATE POLICY "tenant_isolation_policy" ON "M10DealContact"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "M10Activity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "M10Activity" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "M10Activity";
CREATE POLICY "tenant_isolation_policy" ON "M10Activity"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "M10InteractionLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "M10InteractionLink" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "M10InteractionLink";
CREATE POLICY "tenant_isolation_policy" ON "M10InteractionLink"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "M10LinkDecisionLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "M10LinkDecisionLog" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "M10LinkDecisionLog";
CREATE POLICY "tenant_isolation_policy" ON "M10LinkDecisionLog"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "M10MappingRuleSet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "M10MappingRuleSet" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "M10MappingRuleSet";
CREATE POLICY "tenant_isolation_policy" ON "M10MappingRuleSet"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "M10CrmSyncState" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "M10CrmSyncState" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "M10CrmSyncState";
CREATE POLICY "tenant_isolation_policy" ON "M10CrmSyncState"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "M10DataCloudConnection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "M10DataCloudConnection" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "M10DataCloudConnection";
CREATE POLICY "tenant_isolation_policy" ON "M10DataCloudConnection"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "M10DataCloudExportRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "M10DataCloudExportRun" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "M10DataCloudExportRun";
CREATE POLICY "tenant_isolation_policy" ON "M10DataCloudExportRun"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "M10DataCloudCheckpoint" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "M10DataCloudCheckpoint" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "M10DataCloudCheckpoint";
CREATE POLICY "tenant_isolation_policy" ON "M10DataCloudCheckpoint"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "LiveCallSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LiveCallSession" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "LiveCallSession";
CREATE POLICY "tenant_isolation_policy" ON "LiveCallSession"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "LiveCallSummary" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LiveCallSummary" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "LiveCallSummary";
CREATE POLICY "tenant_isolation_policy" ON "LiveCallSummary"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "EngageTask" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EngageTask" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "EngageTask";
CREATE POLICY "tenant_isolation_policy" ON "EngageTask"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "EngageContact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EngageContact" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "EngageContact";
CREATE POLICY "tenant_isolation_policy" ON "EngageContact"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "EmailDraft" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailDraft" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "EmailDraft";
CREATE POLICY "tenant_isolation_policy" ON "EmailDraft"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "EmailTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailTemplate" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "EmailTemplate";
CREATE POLICY "tenant_isolation_policy" ON "EmailTemplate"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "EngageActivity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EngageActivity" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "EngageActivity";
CREATE POLICY "tenant_isolation_policy" ON "EngageActivity"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "CallReview" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CallReview" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "CallReview";
CREATE POLICY "tenant_isolation_policy" ON "CallReview"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "M02Tracker" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "M02Tracker" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "M02Tracker";
CREATE POLICY "tenant_isolation_policy" ON "M02Tracker"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "M02TrackerDetection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "M02TrackerDetection" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "M02TrackerDetection";
CREATE POLICY "tenant_isolation_policy" ON "M02TrackerDetection"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "ManagerAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ManagerAccount" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "ManagerAccount";
CREATE POLICY "tenant_isolation_policy" ON "ManagerAccount"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "ManagerAccountsConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ManagerAccountsConfig" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "ManagerAccountsConfig";
CREATE POLICY "tenant_isolation_policy" ON "ManagerAccountsConfig"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "ManagerCoachingConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ManagerCoachingConfig" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "ManagerCoachingConfig";
CREATE POLICY "tenant_isolation_policy" ON "ManagerCoachingConfig"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "ManagerCoachingRep" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ManagerCoachingRep" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "ManagerCoachingRep";
CREATE POLICY "tenant_isolation_policy" ON "ManagerCoachingRep"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "DealMeddpicc" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DealMeddpicc" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "DealMeddpicc";
CREATE POLICY "tenant_isolation_policy" ON "DealMeddpicc"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "M04DealDriver" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "M04DealDriver" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "M04DealDriver";
CREATE POLICY "tenant_isolation_policy" ON "M04DealDriver"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "DealComment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DealComment" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "DealComment";
CREATE POLICY "tenant_isolation_policy" ON "DealComment"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "DealTask" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DealTask" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "DealTask";
CREATE POLICY "tenant_isolation_policy" ON "DealTask"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "DealWarning" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DealWarning" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "DealWarning";
CREATE POLICY "tenant_isolation_policy" ON "DealWarning"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "DealPlaybook" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DealPlaybook" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "DealPlaybook";
CREATE POLICY "tenant_isolation_policy" ON "DealPlaybook"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "DealActivityEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DealActivityEvent" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "DealActivityEvent";
CREATE POLICY "tenant_isolation_policy" ON "DealActivityEvent"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE "DealNotification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DealNotification" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "DealNotification";
CREATE POLICY "tenant_isolation_policy" ON "DealNotification"
  AS PERMISSIVE FOR ALL
  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);

