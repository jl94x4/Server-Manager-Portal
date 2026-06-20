
export enum ServiceStatus {
  ONLINE = 'online',
  DEGRADED = 'degraded',
  OFFLINE = 'offline',
  UNKNOWN = 'unknown'
}

export enum ServiceType {
  LOCAL = 'local',
  EXTERNAL = 'external'
}

export enum AnnouncementSeverity {
  INFO = 'info',       // Green (Maintenance/Update)
  WARNING = 'warning', // Amber (Partial/Degraded)
  CRITICAL = 'critical' // Red (Outage)
}

export interface SystemAnnouncement {
  message: string;
  severity: AnnouncementSeverity;
  isActive: boolean;
  timestamp: number;
}

export type Theme = 'light' | 'dark';

export interface Group {
  id: string;
  name: string;
  order: number;
}

export interface Service {
  id: string;
  name: string;
  url: string;
  port?: string;
  type: ServiceType;
  category: string; // Kept for legacy filtering/tags
  groupId?: string; // New grouping logic
  description?: string;
  isCritical?: boolean;
}

export interface UptimeSnapshot {
  timestamp: number;
  status: ServiceStatus;
  latency: number;
  httpCode?: number;
}

export interface ServiceHealth {
  serviceId: string;
  currentStatus: ServiceStatus;
  lastCheck: number;
  history: UptimeSnapshot[];
  uptimePercentage: number;
}
