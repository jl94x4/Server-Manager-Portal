/**
 * In-app notification types that are for server operators only.
 * Members (and impersonation sessions) must never receive these from GET /api/notifications.
 */

export const ADMIN_ONLY_IN_APP_TYPES = new Set([
    'admin_pending',
    'admin_test',
    'collexions_failed',
    'scanner_failed',
    'scanner_deleted',
    'scanner_upgrade',
    'scanner_import',
    'scanner_grab',
    'scanner_update',
    'scanner_interaction',
    'spotify_sync_failed',
    'status_down',
    'status_up',
    'media_job_failed',
    'media_job_completed',
    'tautulli_api_failed',
]);

export const isAdminOnlyInAppNotificationType = (type) => (
    ADMIN_ONLY_IN_APP_TYPES.has(String(type || ''))
);

export default ADMIN_ONLY_IN_APP_TYPES;
