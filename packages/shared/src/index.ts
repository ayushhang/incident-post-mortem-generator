// DTOs for API requests and responses
// Shared between frontend and backend

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthRegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: UserDto;
}

export interface UserDto {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: string;
}

export enum UserRole {
  ADMIN = "ADMIN",
  EDITOR = "EDITOR",
  REVIEWER = "REVIEWER",
  VIEWER = "VIEWER",
}

// Incident DTOs
export interface IncidentListRequest {
  page: number;
  limit: number;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  search?: string;
  sortBy?: "createdAt" | "startTime" | "title";
  sortOrder?: "asc" | "desc";
}

export interface IncidentListResponse {
  data: IncidentDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateIncidentRequest {
  title: string;
  description?: string;
  severity: IncidentSeverity;
  serviceAffected?: string;
  environment?: string;
  startTime: string; // ISO 8601
  endTime?: string;
  isOngoing: boolean;
  usersAffected?: number;
  revenueImpact?: number;
  regionsAffected?: string;
  internalTeams?: string;
  slaTarget?: number; // minutes
}

export interface UpdateIncidentRequest {
  title?: string;
  description?: string;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  endTime?: string;
  isOngoing?: boolean;
  usersAffected?: number;
  revenueImpact?: number;
}

export interface IncidentDto {
  id: string;
  title: string;
  description: string | null;
  status: IncidentStatus;
  severity: IncidentSeverity;
  serviceAffected: string | null;
  environment: string | null;
  startTime: string;
  endTime: string | null;
  isOngoing: boolean;
  durationMinutes: number | null;
  usersAffected: number | null;
  revenueImpact: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy: UserDto;
  status_label: string;
  severity_label: string;
}

export enum IncidentStatus {
  DRAFT = "DRAFT",
  IN_REVIEW = "IN_REVIEW",
  FINALIZED = "FINALIZED",
  ARCHIVED = "ARCHIVED",
}

export enum IncidentSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

// Source DTOs
export interface IncidentSourceDto {
  id: string;
  sourceType: SourceType;
  content: string;
  fileName: string | null;
  uploadedAt: string;
}

export enum SourceType {
  TIMELINE_NOTES = "TIMELINE_NOTES",
  LOGS = "LOGS",
  SLACK_EXPORT = "SLACK_EXPORT",
  ALERT_HISTORY = "ALERT_HISTORY",
}

export interface UploadSourceRequest {
  sourceType: SourceType;
  content: string;
  fileName?: string;
}

// Timeline DTOs
export interface TimelineEventDto {
  id: string;
  timestamp: string;
  canonicalTime: string;
  description: string;
  classification: EventClassification;
  sourceReference: string | null;
  extractedBy: string | null;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export enum EventClassification {
  DETECTION = "DETECTION",
  ESCALATION = "ESCALATION",
  INVESTIGATION = "INVESTIGATION",
  MITIGATION = "MITIGATION",
  RESOLUTION = "RESOLUTION",
  COMMUNICATION = "COMMUNICATION",
  OTHER = "OTHER",
}

export interface CreateTimelineEventRequest {
  timestamp: string;
  description: string;
  classification: EventClassification;
}

export interface UpdateTimelineEventRequest {
  timestamp?: string;
  description?: string;
  classification?: EventClassification;
}

export interface TimelineConflictDto {
  id: string;
  event1Id: string;
  event2Id: string;
  description: string;
  resolved: boolean;
  resolution: string | null;
  createdAt: string;
}

export interface TimelineMetricsDto {
  mttd: number | null; // minutes to detect
  mtte: number | null; // minutes to escalate
  mttr: number | null; // minutes to resolve
  totalDuration: number | null;
  timeToComm: number | null;
  eventCount: number;
  classificationBreakdown: Record<EventClassification, number>;
}

// Post-Mortem DTOs
export interface GeneratePostmortemRequest {
  incidentId: string;
}

export interface PostmortemDocumentDto {
  id: string;
  incidentId: string;
  executiveSummary: string | null;
  metadata: string | null;
  impactAssessment: string | null;
  timeline: string | null;
  rootCauseAnalysis: string | null;
  contributingFactors: string | null;
  whyAnalysis: string | null;
  whatWentWell: string | null;
  whatCouldImprove: string | null;
  correctiveActions: string | null;
  ownership: string | null;
  confidence: string | null;
  openQuestions: string | null;
  blamelessReview: string | null;
  slaNote: string | null;
  generatedBy: string;
  generatedAt: string;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePostmortemRequest {
  executiveSummary?: string;
  metadata?: string;
  impactAssessment?: string;
  timeline?: string;
  rootCauseAnalysis?: string;
  contributingFactors?: string;
  whyAnalysis?: string;
  whatWentWell?: string;
  whatCouldImprove?: string;
  correctiveActions?: string;
  ownership?: string;
  confidence?: string;
  openQuestions?: string;
  blamelessReview?: string;
  slaNote?: string;
}

// Quality Gate DTOs
export interface ValidationRequest {
  incidentId: string;
}

export interface QualityCheckResult {
  checkType: QualityCheckType;
  passed: boolean;
  severity: IssueSeverity;
  message: string;
  suggestions: string | null;
}

export interface ValidationResponse {
  incidentId: string;
  passed: boolean;
  overallSeverity: IssueSeverity;
  checks: QualityCheckResult[];
  timestamp: string;
}

export enum QualityCheckType {
  BLAME_LANGUAGE = "BLAME_LANGUAGE",
  SYSTEM_ROOT_CAUSE = "SYSTEM_ROOT_CAUSE",
  VAGUE_ACTION_ITEMS = "VAGUE_ACTION_ITEMS",
  UNSUPPORTED_CLAIMS = "UNSUPPORTED_CLAIMS",
  TIMELINE_CONFLICTS = "TIMELINE_CONFLICTS",
  SLA_BREACH = "SLA_BREACH",
}

export enum IssueSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}

// Export DTOs
export interface ExportRequest {
  incidentId: string;
  format: "markdown" | "pdf";
}

// Action Item DTOs
export interface ActionItemDto {
  id: string;
  title: string;
  description: string | null;
  status: ActionItemStatus;
  priority: Priority;
  assignedTo: UserDto | null;
  dueDate: string | null;
  completedAt: string | null;
  ticketUrl: string | null;
  prUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActionItemRequest {
  title: string;
  description?: string;
  priority: Priority;
  assignedTo?: string;
  dueDate?: string;
  ticketUrl?: string;
}

export interface UpdateActionItemRequest {
  title?: string;
  description?: string;
  status?: ActionItemStatus;
  priority?: Priority;
  assignedTo?: string;
  dueDate?: string;
  ticketUrl?: string;
  prUrl?: string;
}

export enum ActionItemStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum Priority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

// Similarity & Pattern DTOs
export interface SimilarIncidentDto {
  id: string;
  incidentId: string;
  similarId: string;
  similarity: number; // 0-1
  sharedRootCause: boolean;
  comparisonNote: string | null;
  incident: IncidentDto;
  similarIncident: IncidentDto;
}

export interface PatternDto {
  id: string;
  rootCause: string;
  frequency: number;
  severity: string;
  firstSeen: string;
  lastSeen: string;
  recommendations: string | null;
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

// Notification DTOs
export interface NotificationSettingDto {
  id: string;
  channelType: ChannelType;
  channelId: string;
  enabled: boolean;
  events: string[];
  createdAt: string;
}

export enum ChannelType {
  SLACK = "SLACK",
  EMAIL = "EMAIL",
  WEBHOOK = "WEBHOOK",
}
