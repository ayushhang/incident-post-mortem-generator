-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "serviceAffected" TEXT,
    "environment" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "isOngoing" BOOLEAN NOT NULL DEFAULT false,
    "durationMinutes" INTEGER,
    "usersAffected" INTEGER,
    "revenueImpact" REAL,
    "regionsAffected" TEXT,
    "internalTeams" TEXT,
    "slaTarget" INTEGER,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Incident_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IncidentSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incidentId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fileName" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IncidentSource_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incidentId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "canonicalTime" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "sourceReference" TEXT,
    "extractedBy" TEXT,
    "confidence" REAL NOT NULL DEFAULT 1.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TimelineEvent_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TimelineConflict" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incidentId" TEXT NOT NULL,
    "event1Id" TEXT NOT NULL,
    "event2Id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolution" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TimelineConflict_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimelineConflict_event1Id_fkey" FOREIGN KEY ("event1Id") REFERENCES "TimelineEvent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TimelineConflict_event2Id_fkey" FOREIGN KEY ("event2Id") REFERENCES "TimelineEvent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImpactAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incidentId" TEXT NOT NULL,
    "mttd" INTEGER,
    "mtte" INTEGER,
    "mttr" INTEGER,
    "totalDuration" INTEGER,
    "timeToComm" INTEGER,
    "usersImpacted" INTEGER,
    "servicesDown" TEXT,
    "revenueImpact" REAL,
    "slaBreached" BOOLEAN NOT NULL DEFAULT false,
    "breachDetails" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ImpactAssessment_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PostmortemDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incidentId" TEXT NOT NULL,
    "executiveSummary" TEXT,
    "metadata" TEXT,
    "impactAssessment" TEXT,
    "timeline" TEXT,
    "rootCauseAnalysis" TEXT,
    "contributingFactors" TEXT,
    "whyAnalysis" TEXT,
    "whatWentWell" TEXT,
    "whatCouldImprove" TEXT,
    "correctiveActions" TEXT,
    "ownership" TEXT,
    "confidence" TEXT,
    "openQuestions" TEXT,
    "blamelessReview" TEXT,
    "slaNote" TEXT,
    "generatedBy" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PostmortemDocument_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentRevision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incidentId" TEXT NOT NULL,
    "postmortemId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "changeNotes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentRevision_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DocumentRevision_postmortemId_fkey" FOREIGN KEY ("postmortemId") REFERENCES "PostmortemDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QualityGateResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postmortemId" TEXT NOT NULL,
    "checkType" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'WARNING',
    "message" TEXT NOT NULL,
    "suggestions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QualityGateResult_postmortemId_fkey" FOREIGN KEY ("postmortemId") REFERENCES "PostmortemDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incidentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "assignedTo" TEXT,
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "ticketUrl" TEXT,
    "prUrl" TEXT,
    "extractedFrom" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ActionItem_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActionItem_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActionItemUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actionItemId" TEXT NOT NULL,
    "previousStatus" TEXT NOT NULL,
    "newStatus" TEXT NOT NULL,
    "notes" TEXT,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActionItemUpdate_actionItemId_fkey" FOREIGN KEY ("actionItemId") REFERENCES "ActionItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SimilarIncidentLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incidentId" TEXT NOT NULL,
    "similarId" TEXT NOT NULL,
    "similarity" REAL NOT NULL,
    "sharedRootCause" BOOLEAN NOT NULL DEFAULT false,
    "comparisonNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SimilarIncidentLink_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SimilarIncidentLink_similarId_fkey" FOREIGN KEY ("similarId") REFERENCES "Incident" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatternAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rootCause" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "incidentIds" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "firstSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" DATETIME NOT NULL,
    "recommendations" TEXT
);

-- CreateTable
CREATE TABLE "NotificationSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "channelType" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "events" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotificationSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incidentId" TEXT,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SLAConfiguration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "severity" TEXT NOT NULL,
    "targetMTTD" INTEGER NOT NULL,
    "targetMTTE" INTEGER NOT NULL,
    "targetMTTR" INTEGER NOT NULL,
    "warningThreshold" REAL NOT NULL DEFAULT 0.8,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminConfiguration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SampleIncidentPackage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "timelineNotes" TEXT,
    "logs" TEXT,
    "slackExport" TEXT,
    "alertHistory" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Incident_createdBy_idx" ON "Incident"("createdBy");

-- CreateIndex
CREATE INDEX "Incident_status_idx" ON "Incident"("status");

-- CreateIndex
CREATE INDEX "Incident_severity_idx" ON "Incident"("severity");

-- CreateIndex
CREATE INDEX "Incident_startTime_idx" ON "Incident"("startTime");

-- CreateIndex
CREATE INDEX "IncidentSource_incidentId_idx" ON "IncidentSource"("incidentId");

-- CreateIndex
CREATE INDEX "TimelineEvent_incidentId_idx" ON "TimelineEvent"("incidentId");

-- CreateIndex
CREATE INDEX "TimelineEvent_timestamp_idx" ON "TimelineEvent"("timestamp");

-- CreateIndex
CREATE INDEX "TimelineEvent_classification_idx" ON "TimelineEvent"("classification");

-- CreateIndex
CREATE INDEX "TimelineConflict_incidentId_idx" ON "TimelineConflict"("incidentId");

-- CreateIndex
CREATE UNIQUE INDEX "TimelineConflict_event1Id_event2Id_key" ON "TimelineConflict"("event1Id", "event2Id");

-- CreateIndex
CREATE UNIQUE INDEX "ImpactAssessment_incidentId_key" ON "ImpactAssessment"("incidentId");

-- CreateIndex
CREATE INDEX "ImpactAssessment_incidentId_idx" ON "ImpactAssessment"("incidentId");

-- CreateIndex
CREATE UNIQUE INDEX "PostmortemDocument_incidentId_key" ON "PostmortemDocument"("incidentId");

-- CreateIndex
CREATE INDEX "PostmortemDocument_incidentId_idx" ON "PostmortemDocument"("incidentId");

-- CreateIndex
CREATE INDEX "DocumentRevision_incidentId_idx" ON "DocumentRevision"("incidentId");

-- CreateIndex
CREATE INDEX "DocumentRevision_postmortemId_idx" ON "DocumentRevision"("postmortemId");

-- CreateIndex
CREATE INDEX "QualityGateResult_postmortemId_idx" ON "QualityGateResult"("postmortemId");

-- CreateIndex
CREATE INDEX "ActionItem_incidentId_idx" ON "ActionItem"("incidentId");

-- CreateIndex
CREATE INDEX "ActionItem_status_idx" ON "ActionItem"("status");

-- CreateIndex
CREATE INDEX "ActionItem_assignedTo_idx" ON "ActionItem"("assignedTo");

-- CreateIndex
CREATE INDEX "ActionItemUpdate_actionItemId_idx" ON "ActionItemUpdate"("actionItemId");

-- CreateIndex
CREATE INDEX "SimilarIncidentLink_incidentId_idx" ON "SimilarIncidentLink"("incidentId");

-- CreateIndex
CREATE INDEX "SimilarIncidentLink_similarity_idx" ON "SimilarIncidentLink"("similarity");

-- CreateIndex
CREATE UNIQUE INDEX "SimilarIncidentLink_incidentId_similarId_key" ON "SimilarIncidentLink"("incidentId", "similarId");

-- CreateIndex
CREATE INDEX "PatternAnalytics_frequency_idx" ON "PatternAnalytics"("frequency");

-- CreateIndex
CREATE INDEX "NotificationSetting_userId_idx" ON "NotificationSetting"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSetting_userId_channelType_channelId_key" ON "NotificationSetting"("userId", "channelType", "channelId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_incidentId_idx" ON "AuditLog"("incidentId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SLAConfiguration_severity_key" ON "SLAConfiguration"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "AdminConfiguration_key_key" ON "AdminConfiguration"("key");
