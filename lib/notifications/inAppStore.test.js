import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'inapp-notify-'));
process.env.CONFIG_DIR = path.join(tmpRoot, 'config');
await fs.mkdir(process.env.CONFIG_DIR, { recursive: true });

const {
    createInAppNotification,
    loadNotificationsState,
    listInAppNotificationsForUser,
    summarizeInAppNotificationsForUser,
} = await import('./inAppStore.js');

test('merged notifications accumulate repeatHistory entries', async () => {
    const userId = 'admin-1';
    const first = await createInAppNotification({
        userId,
        type: 'scanner_import',
        title: 'Scanner Notification',
        body: 'Imported: Show A',
        href: '/scanner',
        meta: { posterPath: '/a.jpg' },
    });
    assert.ok(first?.id);

    const second = await createInAppNotification({
        userId,
        type: 'scanner_import',
        title: 'Scanner Notification',
        body: 'Imported: Show B',
        href: '/scanner',
        meta: { posterPath: '/b.jpg' },
    });
    assert.equal(second?.id, first.id);
    assert.equal(second?.meta?.repeatCount, 2);
    assert.equal(second?.meta?.repeatHistory?.length, 2);
    assert.equal(second?.meta?.repeatHistory?.[0]?.body, 'Imported: Show B');
    assert.equal(second?.meta?.repeatHistory?.[1]?.body, 'Imported: Show A');
    assert.equal(second?.body, 'Imported: Show B');

    const state = await loadNotificationsState();
    assert.equal(state.items.filter((item) => item.userId === userId).length, 1);
});

test('list and summary hide admin-only types unless includeAdminTypes is set', async () => {
    const userId = 'member-1';
    await createInAppNotification({
        userId,
        type: 'request_available',
        title: 'Ready',
        body: 'Your movie is available',
        href: '/discovery/movie/1',
    });
    await createInAppNotification({
        userId,
        type: 'tautulli_api_failed',
        title: 'Tautulli API failed',
        body: 'request to http://tautulli:8181/api/v2?apikey=super-secret-key failed',
        href: '/settings#tautulli',
    });

    const memberItems = await listInAppNotificationsForUser(userId, { includeAdminTypes: false });
    assert.equal(memberItems.some((item) => item.type === 'tautulli_api_failed'), false);
    assert.equal(memberItems.some((item) => item.type === 'request_available'), true);
    const memberSummary = await summarizeInAppNotificationsForUser(userId, { includeAdminTypes: false });
    assert.equal(memberSummary.total, 1);

    const adminItems = await listInAppNotificationsForUser(userId, { includeAdminTypes: true });
    const tautulli = adminItems.find((item) => item.type === 'tautulli_api_failed');
    assert.ok(tautulli);
    assert.equal(String(tautulli.body).includes('super-secret-key'), false);
    assert.match(String(tautulli.body), /apikey=\*\*\*/i);
});

test('members keep own ticket replies but not admin fan-out support alerts', async () => {
    const userId = 'member-ticket';
    await createInAppNotification({
        userId,
        type: 'support_ticket',
        title: 'Support reply',
        body: 'Admin replied to “My ticket”',
        href: '/support?ticket=mine',
        meta: { ticketId: 'mine', audience: 'owner' },
    });
    await createInAppNotification({
        userId,
        type: 'support_ticket',
        title: 'New support ticket',
        body: 'OtherUser: Someone else’s ticket',
        href: '/support?ticket=other',
        meta: { ticketId: 'other', username: 'OtherUser', supportEvent: 'support_ticket' },
    });
    await createInAppNotification({
        userId,
        type: 'support_reply',
        title: 'Support ticket reply',
        body: 'OtherUser replied to “Someone else’s ticket”',
        href: '/support?ticket=other',
        meta: { ticketId: 'other', username: 'OtherUser', supportEvent: 'support_reply' },
    });

    const memberItems = await listInAppNotificationsForUser(userId, { includeAdminTypes: false });
    assert.equal(memberItems.length, 1);
    assert.equal(memberItems[0].href, '/support?ticket=mine');
    const memberSummary = await summarizeInAppNotificationsForUser(userId, { includeAdminTypes: false });
    assert.equal(memberSummary.total, 1);
    assert.equal(memberSummary.unread, 1);

    const adminView = await listInAppNotificationsForUser(userId, { includeAdminTypes: true });
    assert.equal(adminView.length, 3);
});

test.after(async () => {
    await fs.rm(tmpRoot, { recursive: true, force: true });
});
