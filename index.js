

import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import { randomUUID } from 'crypto';
import nodemailer from 'nodemailer';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import http from 'http';
import https from 'https';

const app = express();
const PORT = 2121;
const JWT_SECRET = process.env.JWT_SECRET || 'plex-expiry-manager-super-secret-key-12345';
const CLIENT_ID = process.env.CLIENT_ID || 'plex-expiry-manager-client-id'; // Ideally should be unique per install

app.use(express.json()); // Middleware to parse JSON bodies
app.use(cookieParser()); // Middleware to parse cookies

// --- Configuration and Paths ---
const CONFIG_PATH = path.join(process.cwd(), 'config.json');
const USERS_PATH = path.join(process.cwd(), 'users.json');
const DELETED_USERS_PATH = path.join(process.cwd(), 'deleted-users.json');
const AUDIT_LOG_PATH = path.join(process.cwd(), 'audit-log.json');
const EMAIL_LOG_PATH = path.join(process.cwd(), 'email_log.json');
const STATUS_CONFIG_PATH = path.join(process.cwd(), 'status.json');
const HEALTH_PATH = path.join(process.cwd(), 'subzero-health.json');
const PLEX_API = 'https://plex.tv/api';

// --- Status App Global State ---
let statusConfig = {
  services: [],
  groups: [
    { id: 'core', name: 'Core Infrastructure', order: 0 },
    { id: 'media', name: 'Media Stack', order: 1 },
    { id: 'downloads', name: 'Download Clients', order: 2 },
    { id: 'external', name: 'External Services', order: 3 },
  ],
  announcement: null
};

let healthData = {};
const SPEED_TEST_CHUNK_SIZE = 1024 * 1024;
const SPEED_TEST_BUFFER = Buffer.alloc(SPEED_TEST_CHUNK_SIZE, 'x');

// --- Helper Functions ---
const log = (message) => console.log(`[${new Date().toISOString()}] ${message}`);

const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const addMonths = (date, months) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
};

const addYears = (date, years) => {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d;
};

const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};

const normalized = (value) => value ? value.toString().trim().toLowerCase() : '';

const isDeletedUser = (deletedUsers, user) => {
    const ids = [
        normalized(user.id),
        normalized(user.plexId)
    ].filter(Boolean);
    const email = normalized(user.email);
    const username = normalized(user.username);

    return deletedUsers.some(deletedUser => {
        const deletedIds = [
            normalized(deletedUser.id),
            normalized(deletedUser.plexId)
        ].filter(Boolean);

        return (
            ids.some(id => deletedIds.includes(id)) ||
            (email && email === normalized(deletedUser.email)) ||
            (username && username === normalized(deletedUser.username))
        );
    });
};

const rememberDeletedUser = async (user, deletedBy) => {
    const deletedUsers = await loadFile(DELETED_USERS_PATH, []);
    if (!isDeletedUser(deletedUsers, user)) {
        deletedUsers.push({
            blockId: randomUUID(),
            id: user.id,
            plexId: user.plexId || user.id,
            username: user.username,
            email: user.email,
            deletedAt: new Date().toISOString(),
            deletedBy: deletedBy?.username || deletedBy?.email || 'admin'
        });
        await saveFile(DELETED_USERS_PATH, deletedUsers);
    }
};

const getDeletedUserKey = (deletedUser) => deletedUser.blockId || deletedUser.id || deletedUser.plexId || deletedUser.email || deletedUser.username;

const appendAuditLog = async (event, actor, target = null, details = {}) => {
    try {
        const auditLog = await loadFile(AUDIT_LOG_PATH, []);
        auditLog.unshift({
            id: randomUUID(),
            timestamp: new Date().toISOString(),
            event,
            actor: actor ? {
                id: actor.id || actor.plexId || null,
                plexId: actor.plexId || actor.id || null,
                username: actor.username || null,
                email: actor.email || null,
                isAdmin: !!actor.isAdmin
            } : null,
            target: target ? {
                id: target.id || target.plexId || null,
                plexId: target.plexId || target.id || null,
                username: target.username || null,
                email: target.email || null
            } : null,
            details
        });
        await saveFile(AUDIT_LOG_PATH, auditLog.slice(0, 1000));
    } catch (error) {
        log(`Failed to write audit log: ${error.message}`);
    }
};

// --- Email Logging Helpers ---
const hasEmailBeenSent = async (userId, type, uniqueKey) => {
    try {
        const logs = await loadFile(EMAIL_LOG_PATH, []);
        return logs.some(l => l.userId === String(userId) && l.type === type && l.uniqueKey === String(uniqueKey));
    } catch (e) {
        return false;
    }
};

const logEmailSent = async (userId, type, uniqueKey) => {
    try {
        const logs = await loadFile(EMAIL_LOG_PATH, []);
        logs.push({
            userId: String(userId),
            type,
            uniqueKey: String(uniqueKey),
            timestamp: new Date().toISOString()
        });
        if (logs.length > 5000) logs.splice(0, logs.length - 5000);
        await saveFile(EMAIL_LOG_PATH, logs);
    } catch (e) {
        log(`Failed to write to email log: ${e.message}`);
    }
};

// --- SMTP & Email Alerts ---
const sendEmail = async (config, to, subject, html, customTransporter = null) => {
    if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
        log('SMTP is not fully configured. Skipping email send.');
        return false;
    }

    const transporter = customTransporter || nodemailer.createTransport({
        host: config.smtpHost,
        port: parseInt(config.smtpPort, 10) || 587,
        secure: !!config.smtpSecure,
        auth: {
            user: config.smtpUser,
            pass: config.smtpPass,
        },
    });

    const logoPath = path.join(process.cwd(), 'static', 'logo.png');
    let hasLogo = false;
    try {
        await fs.access(logoPath);
        hasLogo = true;
    } catch (e) {
        // Logo doesn't exist
    }

    const mailOptions = {
        from: config.smtpFrom || config.smtpUser,
        to,
        subject,
        html,
        attachments: hasLogo ? [{
            filename: 'logo.png',
            path: logoPath,
            cid: 'logo' // same CID value as in the HTML img src
        }] : []
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        log(`Email sent successfully: ${info.messageId}`);
        await appendAuditLog('system_email_sent', { username: 'System', email: config.smtpFrom || config.smtpUser }, { username: 'Recipient', email: to }, { subject });
        return true;
    } catch (error) {
        log(`Error sending email to ${to}: ${error.message}`);
        throw error;
    }
};

const checkAndSendNotifications = async (config) => {
    if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
        return;
    }
    
    log('Checking for users to notify about upcoming expiry...');
    const users = await loadFile(USERS_PATH, []);
    const daysBefore = parseInt(config.emailDaysBefore, 10) || 7;
    let usersModified = false;
    
    // Check if logo exists to determine if we should reference it in HTML
    const logoPath = path.join(process.cwd(), 'static', 'logo.png');
    let hasLogo = false;
    try {
        await fs.access(logoPath);
        hasLogo = true;
    } catch (e) {}

    for (const user of users) {
        if (!user.expiryDate || user.plexAccessStatus === 'revoked' || !user.email) {
            continue;
        }
        
        const days = getDaysUntilExpiry(user.expiryDate);
        if (days !== null && days <= daysBefore && days >= 0) {
            const alreadySent = await hasEmailBeenSent(user.id, 'expiry_warning', user.expiryDate);
            if (alreadySent) continue;

            log(`Sending expiry warning to ${user.username} (${user.email}) - ${days} days remaining.`);
            const subject = `[Plex Server] Your shared access expires in ${days} day${days === 1 ? '' : 's'}`;
            const html = `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; padding: 30px; color: #333333; line-height: 1.6;">
                    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-top: 6px solid #e5a00d;">
                        <div style="background-color: #282A2D; padding: 25px; text-align: center;">
                            ${hasLogo ? '<img src="cid:logo" alt="Logo" style="max-height: 100px; display: block; margin: 0 auto 10px auto;" />' : ''}
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">PLEX SERVER</h1>
                        </div>
                        <div style="padding: 30px 40px;">
                            <h2 style="color: #282A2D; font-size: 20px; margin-top: 0; font-weight: 600;">Access Expiry Notification</h2>
                            <p>Hello <strong>${user.username}</strong>,</p>
                            <p>This is a notification that your shared access to the Plex media server is coming to an end soon. Below are your account details:</p>
                            
                            <div style="background-color: #fcf8f2; border-left: 4px solid #e5a00d; padding: 20px; margin: 25px 0; border-radius: 6px;">
                                <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                                    <tr>
                                        <td style="padding: 6px 0; color: #718096; font-weight: 500;">Plex Username:</td>
                                        <td style="padding: 6px 0; color: #2d3748; font-weight: bold; text-align: right;">${user.username}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; color: #718096; font-weight: 500;">Expiry Date:</td>
                                        <td style="padding: 6px 0; color: #e5a00d; font-weight: bold; text-align: right;">${new Date(user.expiryDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; color: #718096; font-weight: 500;">Time Remaining:</td>
                                        <td style="padding: 6px 0; color: #e5a00d; font-weight: bold; text-align: right;">${days} day${days === 1 ? '' : 's'}</td>
                                    </tr>
                                </table>
                            </div>

                            <p>To ensure uninterrupted streaming of your favorite movies and shows, please get in touch with the server owner to renew your subscription before the expiry date.</p>
                            
                            <div style="text-align: center; margin: 35px 0 15px 0;">
                                <a href="mailto:${config.smtpFrom || config.smtpUser}" style="background-color: #e5a00d; color: #ffffff; text-decoration: none; padding: 14px 35px; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(229, 160, 13, 0.2);">Request Extension</a>
                            </div>
                        </div>
                        <div style="background-color: #f7fafc; padding: 20px 30px; border-top: 1px solid #edf2f7; text-align: center; font-size: 12px; color: #a0aec0;">
                            <p style="margin: 0 0 5px 0;">Automated alert from the Plex Expiry Service.</p>
                            <p style="margin: 0;">Please contact the administrator for any billing or subscription queries.</p>
                        </div>
                    </div>
                </div>
            `;
            
            try {
                const sent = await sendEmail(config, user.email, subject, html);
                if (sent) {
                    await logEmailSent(user.id, 'expiry_warning', user.expiryDate);
                }
            } catch (err) {
                log(`Failed to send email to ${user.username}: ${err.message}`);
            }
        }
    }
};


// --- File I/O ---
const fileLocks = new Map();

const lockFile = async (path) => {
    while (fileLocks.get(path)) {
        await fileLocks.get(path);
    }
    let resolve;
    const promise = new Promise(r => resolve = r);
    fileLocks.set(path, promise);
    return () => {
        if (fileLocks.get(path) === promise) {
            fileLocks.delete(path);
        }
        resolve();
    };
};

const loadFile = async (path, defaultContent) => {
    const unlock = await lockFile(path);
    try {
        return JSON.parse(await fs.readFile(path, 'utf-8'));
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(path, JSON.stringify(defaultContent, null, 2));
            return defaultContent;
        }
        throw error;
    } finally {
        unlock();
    }
};

const saveFile = async (path, data) => {
    const unlock = await lockFile(path);
    try {
        const tempPath = `${path}.tmp`;
        await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
        await fs.rename(tempPath, path);
    } finally {
        unlock();
    }
};

// --- Plex API Functions (Server-side only) ---
const apiFetch = (url, token, options = {}) => {
    const headers = {
        'Accept': 'application/json',
        ...(options.headers || {}),
        'X-Plex-Token': token,
        'X-Plex-Client-Identifier': CLIENT_ID
    };
    return fetch(url, { ...options, headers });
};

let cachedAdminId = null;
const getAdminId = async (config) => {
    if (cachedAdminId) return cachedAdminId;
    if (!config || !config.plexToken) return null;
    try {
        const res = await apiFetch('https://plex.tv/api/v2/user', config.plexToken);
        if (!res.ok) return null;
        const data = await res.json();
        cachedAdminId = data.id;
        return data.id;
    } catch (e) {
        log('Failed to fetch admin info: ' + e.message);
        return null;
    }
};

const requireAuth = (req, res, next) => {
    const token = req.cookies.session;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid session' });
    }
};

const requireAdmin = async (req, res, next) => {
    const token = req.cookies.session;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
    } catch (e) {
        return res.status(401).json({ error: 'Invalid session' });
    }

    const config = await loadFile(CONFIG_PATH, {});
    const adminId = await getAdminId(config);
    if (!adminId) {
        // If app isn't configured, we technically have no admin.
        // For security, require them to configure it via the existing unauthenticated config route first,
        // or allow if we want. We will block here to be safe.
        return res.status(403).json({ error: 'Forbidden: App not configured' });
    }
    if (!req.user || req.user.plexId !== adminId) {
        return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    next();
};

const syncUsers = async (config) => {
    log('Starting user sync from Plex...');
    const res = await apiFetch(
        `${PLEX_API}/users`,
        config.plexToken
    );

    if (!res.ok) {
        const errorText = await res.text();
        log(`Error fetching Plex shared users. Status: ${res.status}. Response: ${errorText}`);
        throw new Error(`Failed to fetch Plex shared users. Status: ${res.status}`);
    }

    const xmlText = await res.text();
    // Use regex to find all <User>...</User> blocks, then filter by server identifier
    const userBlocks = xmlText.match(/<User\b[^>]*>.*?<\/User>/gs) || [];

    const plexUsers = userBlocks
        .filter(block => block.includes(`machineIdentifier="${config.serverIdentifier}"`))
        .map(block => {
            const userTagMatch = block.match(/<User\b[^>]*>/);
            if (!userTagMatch) return null;
            const userTag = userTagMatch[0];
            return {
                id: userTag.match(/id="([^"]+)"/)?.[1],
                username: userTag.match(/title="([^"]+)"/)?.[1],
                email: userTag.match(/email="([^"]+)"/)?.[1],
                thumb: userTag.match(/thumb="([^"]+)"/)?.[1],
            };
        }).filter(user => user && user.id && user.username);


    const localUsers = await loadFile(USERS_PATH, []);
    const deletedUsers = await loadFile(DELETED_USERS_PATH, []);
    const existingUserMap = new Map(localUsers.map(u => [u.id, u]));
    const emailUserMap = new Map(localUsers.filter(u => u.email).map(u => [u.email.toLowerCase(), u]));
    const usernameUserMap = new Map(localUsers.filter(u => u.username).map(u => [u.username.toLowerCase(), u]));
    const matchedLocalUserIds = new Set();
    
    const syncedUsers = plexUsers.map(pUser => {
        if (isDeletedUser(deletedUsers, pUser)) {
            log(`Skipping deleted user during sync: ${pUser.username}`);
            return null;
        }

        const existingUser =
            existingUserMap.get(pUser.id) ||
            (pUser.email ? emailUserMap.get(pUser.email.toLowerCase()) : null) ||
            (pUser.username ? usernameUserMap.get(pUser.username.toLowerCase()) : null);

        if (existingUser) {
            matchedLocalUserIds.add(existingUser.id);
            if (existingUser.plexAccessStatus === 'pending') {
                appendAuditLog('invite_accepted_synced', null, { ...existingUser, id: pUser.id, username: pUser.username, email: pUser.email }).catch(() => {});
            }
            // Update existing user with latest info from Plex, but keep local expiry/trial data.
            return { ...existingUser, id: pUser.id, username: pUser.username, email: pUser.email, thumb: pUser.thumb, plexAccessStatus: 'active' };
        }
        log(`New user found: ${pUser.username}. Setting default 1-day expiry.`);
        appendAuditLog('plex_sync_new_user_added', null, pUser).catch(() => {});
        return {
            id: pUser.id,
            username: pUser.username,
            email: pUser.email,
            thumb: pUser.thumb,
            joiningDate: new Date().toISOString(),
            expiryDate: addDays(new Date(), 1).toISOString(),
            plexAccessStatus: 'active',
            isTrial: false
        };
    }).filter(Boolean);

    for (const localUser of localUsers) {
        if (localUser.plexAccessStatus === 'pending' && !matchedLocalUserIds.has(localUser.id)) {
            syncedUsers.push(localUser);
        }
    }

    await saveFile(USERS_PATH, syncedUsers);
    const message = `Sync complete. Synced ${plexUsers.length} users.`;
    log(message);
    return { message, count: plexUsers.length };
};

const revokePlexAccess = async (user, config) => {
    if (!user.id || !config.serverIdentifier) {
        log(`Error: Cannot revoke access for ${user.username} due to missing user ID or server ID.`);
        return false;
    }
    log(`Revoking Plex access for expired user: ${user.username} (ID: ${user.id})`);

    try {
        // Step 1: Find the Share ID for the user on the specific server by fetching ALL users
        const usersListRes = await apiFetch(
            `${PLEX_API}/users`,
            config.plexToken
        );

        if (!usersListRes.ok) {
            const errorText = await usersListRes.text();
            log(`Error fetching Plex users list for revocation. Status: ${usersListRes.status}. Response: ${errorText}`);
            return false;
        }

        const xmlText = await usersListRes.text();
        
        const userBlockRegex = new RegExp(`<User\\b[^>]*id="${user.id}"[^>]*>.*?<\\/User>`, 's');
        const userBlockMatch = xmlText.match(userBlockRegex);

        if (!userBlockMatch) {
            log(`User ${user.username} not found in friends list. Assuming already revoked.`);
            return true;
        }
        
        const serverTagRegex = new RegExp(`<Server\\b[^>]*machineIdentifier="${config.serverIdentifier}"[^>]*>`);
        const serverTagMatch = userBlockMatch[0].match(serverTagRegex);

        if (!serverTagMatch) {
            log(`--- DIAGNOSTIC: User XML Block for ${user.username} ---`);
            log(userBlockMatch[0]);
            log(`--- END DIAGNOSTIC ---`);
            log(`User ${user.username} does not have access to server ${config.serverIdentifier}. Assuming already revoked.`);
            return true;
        }

        const shareIdMatch = serverTagMatch[0].match(/id="([^"]+)"/);
        if (!shareIdMatch || !shareIdMatch[1]) {
            log(`Could not find share ID for user ${user.username} on server ${config.serverIdentifier}.`);
            return false;
        }
        const shareId = shareIdMatch[1];
        log(`Found share ID for ${user.username}: ${shareId}`);

        // Step 2: Delete the share entirely using a DELETE request
        const res = await apiFetch(
            `https://plex.tv/api/servers/${config.serverIdentifier}/shared_servers/${shareId}`,
            config.plexToken,
            {
                method: 'DELETE'
            }
        );

        if (!res.ok) {
            const errorText = await res.text();
            log(`Error: Failed to revoke access for ${user.username}. Status: ${res.status}. Response: ${errorText}`);
            return false;
        }

        log(`Successfully revoked access for ${user.username}.`);
        return true;

    } catch (error) {
        log(`An exception occurred while revoking access for ${user.username}: ${error.message}`);
        return false;
    }
};


const sendExpiryEmail = async (config, user, hasLogo) => {
    if (!user.email) {
        log(`No email address for ${user.username}. Skipping expiry notification.`);
        return false;
    }

    const alreadySent = await hasEmailBeenSent(user.id, 'access_expired', user.expiryDate || 'none');
    if (alreadySent) return true;

    const subject = `[Plex Server] Your shared access has expired`;
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; padding: 30px; color: #333333; line-height: 1.6;">
            <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-top: 6px solid #e53e3e;">
                <div style="background-color: #282A2D; padding: 25px; text-align: center;">
                    ${hasLogo ? '<img src="cid:logo" alt="Logo" style="max-height: 100px; display: block; margin: 0 auto 10px auto;" />' : ''}
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">PLEX SERVER</h1>
                </div>
                <div style="padding: 30px 40px;">
                    <h2 style="color: #e53e3e; font-size: 20px; margin-top: 0; font-weight: 600;">Access Expired</h2>
                    <p>Hello <strong>${user.username}</strong>,</p>
                    <p>We're writing to let you know that your shared access to the Plex media server has <strong style="color: #e53e3e;">expired</strong> and your account has been removed from the server.</p>
                    
                    <div style="background-color: #fff5f5; border-left: 4px solid #e53e3e; padding: 20px; margin: 25px 0; border-radius: 6px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                            <tr>
                                <td style="padding: 6px 0; color: #718096; font-weight: 500;">Plex Username:</td>
                                <td style="padding: 6px 0; color: #2d3748; font-weight: bold; text-align: right;">${user.username}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #718096; font-weight: 500;">Expiry Date:</td>
                                <td style="padding: 6px 0; color: #e53e3e; font-weight: bold; text-align: right;">${new Date(user.expiryDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #718096; font-weight: 500;">Status:</td>
                                <td style="padding: 6px 0; color: #e53e3e; font-weight: bold; text-align: right;">Access Revoked</td>
                            </tr>
                        </table>
                    </div>

                    <p style="font-size: 16px; font-weight: 600; color: #282A2D; margin-bottom: 5px;">Want to renew your access?</p>
                    <p>If you'd like to continue enjoying all the content, simply get in touch using any of the methods below and we'll get you set up again:</p>

                    <div style="background-color: #fcf8f2; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                            <tr>
                                <td style="padding: 10px 0; vertical-align: middle;">
                                    <span style="font-size: 20px; margin-right: 10px;">📧</span>
                                    <strong style="color: #2d3748;">Email:</strong>
                                </td>
                                <td style="padding: 10px 0; text-align: right; vertical-align: middle;">
                                    <a href="mailto:jasonlucas58@gmail.com" style="color: #e5a00d; text-decoration: none; font-weight: 600;">jasonlucas58@gmail.com</a>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; vertical-align: middle; border-top: 1px solid #edf2f7;">
                                    <span style="font-size: 20px; margin-right: 10px;">💬</span>
                                    <strong style="color: #2d3748;">WhatsApp:</strong>
                                </td>
                                <td style="padding: 10px 0; text-align: right; vertical-align: middle; border-top: 1px solid #edf2f7;">
                                    <a href="https://wa.me/447305697245" style="color: #25d366; text-decoration: none; font-weight: 600;">07305 697 245</a>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div style="text-align: center; margin: 30px 0 15px 0;">
                        <a href="https://wa.me/447305697245" style="background-color: #25d366; color: #ffffff; text-decoration: none; padding: 14px 35px; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 211, 102, 0.2); margin-right: 10px;">WhatsApp Me</a>
                        <a href="mailto:jasonlucas58@gmail.com" style="background-color: #e5a00d; color: #ffffff; text-decoration: none; padding: 14px 35px; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(229, 160, 13, 0.2);">Email Me</a>
                    </div>
                </div>
                <div style="background-color: #f7fafc; padding: 20px 30px; border-top: 1px solid #edf2f7; text-align: center; font-size: 12px; color: #a0aec0;">
                    <p style="margin: 0 0 5px 0;">Automated notification from the Plex Expiry Service.</p>
                    <p style="margin: 0;">We'd love to have you back — don't hesitate to reach out!</p>
                </div>
            </div>
        </div>
    `;

    try {
        const sent = await sendEmail(config, user.email, subject, html);
        if (sent) {
            log(`Expiry notification email sent to ${user.username} (${user.email}).`);
            await logEmailSent(user.id, 'access_expired', user.expiryDate || 'none');
        }
        return sent;
    } catch (err) {
        log(`Failed to send expiry notification to ${user.username}: ${err.message}`);
        return false;
    }
};

const sendAdjustmentEmail = async (config, user, hasLogo) => {
    if (!user.email) return false;

    const subject = `[Plex Server] Your subscription has been updated`;
    const days = getDaysUntilExpiry(user.expiryDate);
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; padding: 30px; color: #333333; line-height: 1.6;">
            <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-top: 6px solid #e5a00d;">
                <div style="background-color: #282A2D; padding: 25px; text-align: center;">
                    ${hasLogo ? '<img src="cid:logo" alt="Logo" style="max-height: 100px; display: block; margin: 0 auto 10px auto;" />' : ''}
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">PLEX SERVER</h1>
                </div>
                <div style="padding: 30px 40px;">
                    <h2 style="color: #282A2D; font-size: 20px; margin-top: 0; font-weight: 600;">Subscription Updated</h2>
                    <p>Hello <strong>${user.username}</strong>,</p>
                    <p>Your subscription to the Plex media server has been successfully updated. Here are your new account details:</p>
                    
                    <div style="background-color: #fcf8f2; border-left: 4px solid #e5a00d; padding: 20px; margin: 25px 0; border-radius: 6px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                            <tr>
                                <td style="padding: 6px 0; color: #718096; font-weight: 500;">Plex Username:</td>
                                <td style="padding: 6px 0; color: #2d3748; font-weight: bold; text-align: right;">${user.username}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #718096; font-weight: 500;">New Expiry Date:</td>
                                <td style="padding: 6px 0; color: #e5a00d; font-weight: bold; text-align: right;">${user.expiryDate ? new Date(user.expiryDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Unlimited'}</td>
                            </tr>
                            ${days !== null ? `
                            <tr>
                                <td style="padding: 6px 0; color: #718096; font-weight: 500;">Time Remaining:</td>
                                <td style="padding: 6px 0; color: #e5a00d; font-weight: bold; text-align: right;">${days} day${days === 1 ? '' : 's'}</td>
                            </tr>` : ''}
                        </table>
                    </div>

                    <p>Thank you for continuing to be a part of our community!</p>
                </div>
                <div style="background-color: #f7fafc; padding: 20px 30px; border-top: 1px solid #edf2f7; text-align: center; font-size: 12px; color: #a0aec0;">
                    <p style="margin: 0 0 5px 0;">Automated notification from the Plex Expiry Service.</p>
                </div>
            </div>
        </div>
    `;


    try {
        const sent = await sendEmail(config, user.email, subject, html);
        if (sent) {
            log(`Expiry notification email sent to ${user.username} (${user.email}).`);
        }
        return sent;
    } catch (err) {
        log(`Failed to send expiry notification to ${user.username}: ${err.message}`);
        return false;
    }
};

const checkAndRevoke = async (config) => {
    log('Running periodic check for expired users...');
    const users = await loadFile(USERS_PATH, []);
    const expiredUsers = users.filter(u => {
        const days = getDaysUntilExpiry(u.expiryDate);
        return u.plexAccessStatus !== 'revoked' && days !== null && days < 0;
    });

    if (expiredUsers.length === 0) {
        log('No expired users found.');
        return;
    }

    // Check if logo exists for email template
    const logoPath = path.join(process.cwd(), 'static', 'logo.png');
    let hasLogo = false;
    try {
        await fs.access(logoPath);
        hasLogo = true;
    } catch (e) {}

    log(`Found ${expiredUsers.length} expired user(s).`);
    let usersModified = false;
    for (const user of expiredUsers) {
        const revoked = await revokePlexAccess(user, config);
        if (revoked) {
            const userInList = users.find(u => u.id === user.id);
            if (userInList) {
                userInList.plexAccessStatus = 'revoked';
                usersModified = true;

                // Send expiry notification email if not already sent
                if (!userInList.expiryEmailSent) {
                    const emailSent = await sendExpiryEmail(config, userInList, hasLogo);
                    if (emailSent) {
                        userInList.expiryEmailSent = true;
                    }
                }
            }
        }
    }

    if (usersModified) {
        await saveFile(USERS_PATH, users);
        log('Updated local user file with revocation status.');
    }
};

// --- API Routes ---

app.post('/api/users/broadcast', requireAdmin, async (req, res) => {
    const { subject, body, recipientFilter, selectedUserIds } = req.body;
    if (!subject || !body) return res.status(400).json({ error: 'Subject and body are required.' });

    try {
        const users = await loadFile(USERS_PATH, []);
        let targetUsers = [];
        const now = new Date();

        for (const user of users) {
            let include = false;
            if (recipientFilter === 'all') {
                include = true;
            } else if (recipientFilter === 'selected') {
                include = selectedUserIds && selectedUserIds.includes(user.id);
            } else if (recipientFilter === 'active') {
                include = user.plexAccessStatus === 'active';
            } else if (recipientFilter === 'trial') {
                include = user.isTrial;
            } else if (recipientFilter === 'expiring') {
                if (user.expiryDate && new Date(user.expiryDate) > now) {
                    const diffTime = Math.abs(new Date(user.expiryDate) - now);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                    include = diffDays <= 7;
                }
            } else if (recipientFilter === 'expired') {
                include = user.expiryDate && new Date(user.expiryDate) < now;
            }

            if (include && user.email) {
                targetUsers.push(user);
            }
        }

        if (targetUsers.length === 0) {
            return res.status(400).json({ error: 'No users found matching the selected criteria (with valid emails).' });
        }

        res.json({ message: `Broadcast started for ${targetUsers.length} users.`, count: targetUsers.length });

        (async () => {
            const config = await loadFile(CONFIG_PATH, null);
            
            // Create a single pooled connection to avoid rate limits
            const bulkTransporter = nodemailer.createTransport({
                pool: true,
                host: config.smtpHost,
                port: parseInt(config.smtpPort, 10) || 587,
                secure: !!config.smtpSecure,
                auth: {
                    user: config.smtpUser,
                    pass: config.smtpPass,
                },
                maxConnections: 1,
                maxMessages: 100
            });

            for (const user of targetUsers) {
                try {
                    await sendEmail(config, user.email, subject, body, bulkTransporter);
                    // Add a tiny throttle so it doesn't look like a burst attack
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (e) {
                    log(`Broadcast failed to ${user.email}: ${e.message}`);
                }
            }
            log(`Broadcast completed for ${targetUsers.length} users.`);
            bulkTransporter.close(); // Clean up the connection pool
        })();
    } catch (error) {
        log(`Error sending broadcast: ${error.message}`);
        res.status(500).json({ error: 'Failed to initiate broadcast' });
    }
});

app.post('/api/users/broadcast/test', requireAdmin, async (req, res) => {
    const { subject, body } = req.body;
    if (!subject || !body) return res.status(400).json({ error: 'Subject and body are required.' });

    try {
        const config = await loadFile(CONFIG_PATH, null);
        if (!config || !config.smtpHost || !config.smtpUser) {
            return res.status(400).json({ error: 'SMTP settings are not configured.' });
        }
        const adminEmail = req.user.email;
        
        if (!adminEmail) {
            return res.status(400).json({ error: 'Admin email not found in session.' });
        }

        log(`Sending test broadcast email to ${adminEmail}...`);
        await sendEmail(config, adminEmail, subject, body);
        res.json({ message: `Test email sent successfully to ${adminEmail}` });
    } catch (error) {
        log(`Error sending test broadcast: ${error.message}`);
        res.status(500).json({ error: `Failed to send test broadcast: ${error.message}` });
    }
});

// Auth endpoints
app.post('/api/auth/plex/login', async (req, res) => {
    try {
        const response = await fetch('https://plex.tv/api/v2/pins?strong=true', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'X-Plex-Product': 'Plex Expiry Manager',
                'X-Plex-Client-Identifier': CLIENT_ID
            }
        });
        if (!response.ok) throw new Error('Failed to generate Plex PIN');
        const data = await response.json();
        res.json(data);
    } catch (err) {
        log('Error in plex login: ' + err.message);
        res.status(500).json({ error: 'Failed to initiate login' });
    }
});

app.post('/api/auth/plex/callback', async (req, res) => {
    const { pinId } = req.body;
    if (!pinId) return res.status(400).json({ error: 'pinId is required' });

    try {
        const pinRes = await fetch(`https://plex.tv/api/v2/pins/${pinId}`, {
            headers: {
                'Accept': 'application/json',
                'X-Plex-Client-Identifier': CLIENT_ID
            }
        });
        const pinData = await pinRes.json();
        
        if (!pinData.authToken) {
            return res.status(400).json({ error: 'Not authenticated yet' });
        }

        // Fetch user info
        const userRes = await apiFetch('https://plex.tv/api/v2/user', pinData.authToken);
        if (!userRes.ok) throw new Error('Failed to fetch user info');
        const userData = await userRes.json();

        const config = await loadFile(CONFIG_PATH, {});
        const adminId = await getAdminId(config);
        const isAdmin = userData.id === adminId;
        const deletedUsers = await loadFile(DELETED_USERS_PATH, []);

        const sessionUser = {
            id: userData.uuid, // Using UUID to match if possible, or ID
            plexId: userData.id,
            email: userData.email,
            username: userData.username,
            isAdmin
        };

        if (!isAdmin && isDeletedUser(deletedUsers, sessionUser)) {
            await appendAuditLog('login_blocked_deleted_user', sessionUser, sessionUser);
            res.clearCookie('session');
            return res.status(403).json({ error: 'Your portal session has expired. Please contact the admin for access.' });
        }

        const token = jwt.sign(sessionUser, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('session', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
        
        res.json({ message: 'Logged in successfully', user: sessionUser });
    } catch (err) {
        log('Error in plex callback: ' + err.message);
        res.status(500).json({ error: 'Failed to verify login' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('session');
    res.json({ message: 'Logged out' });
});

app.post('/api/users/preferences', requireAuth, async (req, res) => {
    try {
        const { optOutNewsletter } = req.body;
        const users = await loadFile(USERS_PATH, []);
        const userIndex = users.findIndex(u => u.id === req.user.id);
        
        if (userIndex === -1) {
            return res.status(404).json({error: 'User not found'});
        }
        
        users[userIndex].optOutNewsletter = !!optOutNewsletter;
        await saveFile(USERS_PATH, users);
        
        res.json({success: true, user: users[userIndex]});
    } catch (e) {
        log(`Error updating preferences: ${e.message}`);
        res.status(500).json({error: 'Failed to update preferences'});
    }
});

app.get('/api/users/me', requireAuth, async (req, res) => {
    const users = await loadFile(USERS_PATH, []);
    const localUser = users.find(u => u.email === req.user.email || u.username === req.user.username);
    const deletedUsers = await loadFile(DELETED_USERS_PATH, []);

    if (!localUser && !req.user.isAdmin && isDeletedUser(deletedUsers, req.user)) {
        await appendAuditLog('session_blocked_deleted_user', req.user, req.user);
        res.clearCookie('session');
        return res.status(403).json({ error: 'Your portal session has expired. Please contact the admin for access.' });
    }
    
    let serverName = 'Plex Server';
    let adminThumb = null;
    let requestUrl = 'https://plexified.co.uk';
    try {
        const config = await loadFile(CONFIG_PATH, {});
        if (config && config.plexToken && config.serverIdentifier) {
            const profile = await getAdminProfile(config);
            serverName = profile.serverName || 'Plex Server';
            adminThumb = profile.thumb;
            requestUrl = config.requestUrl || 'https://plexified.co.uk';
        }
    } catch(e) {}

    res.json({
        session: req.user,
        account: localUser || null,
        serverName,
        adminThumb,
        requestUrl
    });
});

// Config endpoints
app.get('/api/config', async (req, res) => {
    const config = await loadFile(CONFIG_PATH, {});
    const isConfigured = !!(config && config.plexToken && config.serverIdentifier);

    if (isConfigured) {
        res.json({
            configured: true,
            settings: {
                token: config.plexToken,
                serverIdentifier: config.serverIdentifier,
                checkIntervalMinutes: config.checkIntervalMinutes || 60,
                smtpHost: config.smtpHost || '',
                smtpPort: config.smtpPort || 587,
                smtpUser: config.smtpUser || '',
                smtpPass: config.smtpPass || '',
                smtpFrom: config.smtpFrom || '',
                smtpSecure: !!config.smtpSecure,
                emailDaysBefore: config.emailDaysBefore || 7,
                newsletterFrequency: config.newsletterFrequency || 'disabled',
                newsletterDay: config.newsletterDay || 0,
                publicDomain: config.publicDomain || 'https://portal.plexified.co.uk',
                requestUrl: config.requestUrl || 'https://plexified.co.uk'
            },
        });
    } else {
        res.json({
            configured: false,
            settings: {
                token: '',
                serverIdentifier: '',
                checkIntervalMinutes: 60,
                smtpHost: '',
                smtpPort: 587,
                smtpUser: '',
                smtpPass: '',
                smtpFrom: '',
                smtpSecure: false,
                emailDaysBefore: 7,
                newsletterFrequency: 'disabled',
                newsletterDay: 0,
                publicDomain: 'https://portal.plexified.co.uk',
                requestUrl: 'https://plexified.co.uk'
            },
        });
    }
});

app.post('/api/config', async (req, res) => {
    const { 
        token, serverIdentifier, checkIntervalMinutes, 
        smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, smtpSecure, emailDaysBefore,
        newsletterFrequency, newsletterDay, publicDomain, requestUrl
    } = req.body;

    if (!token || !serverIdentifier) {
        return res.status(400).json({ error: 'Token and serverIdentifier are required.' });
    }
    
    const existingConfig = await loadFile(CONFIG_PATH, {});
    const isConfigured = !!(existingConfig && existingConfig.plexToken && existingConfig.serverIdentifier);
    
    if (isConfigured) {
        if (!req.cookies || req.cookies.session !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: App is already configured. Please log in as admin to modify settings.' });
        }
    }
    const interval = parseInt(checkIntervalMinutes, 10);
    
    const config = { 
        ...existingConfig,
        plexToken: token, 
        serverIdentifier, 
        checkIntervalMinutes: (interval > 0 ? interval : 60),
        smtpHost: smtpHost || '',
        smtpPort: parseInt(smtpPort, 10) || 587,
        smtpUser: smtpUser || '',
        smtpPass: smtpPass || '',
        smtpFrom: smtpFrom || '',
        smtpSecure: !!smtpSecure,
        emailDaysBefore: parseInt(emailDaysBefore, 10) || 7,
        newsletterFrequency: newsletterFrequency || 'disabled',
        newsletterDay: parseInt(newsletterDay, 10) || 0,
        publicDomain: publicDomain || 'https://portal.plexified.co.uk',
        requestUrl: requestUrl || 'https://plexified.co.uk'
    };
    await saveFile(CONFIG_PATH, config);
    log('Configuration saved successfully.');
    startBackgroundService(); // (Re)start service with new config
    res.json({ message: 'Configuration saved.' });
});

app.post('/api/config/test-email', async (req, res) => {
    const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, smtpSecure, testRecipient } = req.body;
    
    if (!smtpHost || !smtpUser || !smtpPass || !testRecipient) {
        return res.status(400).json({ error: 'Host, user, password, and test recipient are required.' });
    }

    const config = {
        smtpHost,
        smtpPort: parseInt(smtpPort, 10) || 587,
        smtpUser,
        smtpPass,
        smtpFrom,
        smtpSecure: !!smtpSecure,
    };

    // Check if logo exists to determine if we should reference it in HTML
    const logoPath = path.join(process.cwd(), 'static', 'logo.png');
    let hasLogo = false;
    try {
        await fs.access(logoPath);
        hasLogo = true;
    } catch (e) {}

    try {
        log(`Sending test email to ${testRecipient}...`);
        await sendEmail(
            config,
            testRecipient,
            '[Plex Server] Test Email Connection',
            `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; padding: 30px; color: #333333; line-height: 1.6;">
                <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-top: 6px solid #e5a00d;">
                    <div style="background-color: #282A2D; padding: 25px; text-align: center;">
                        ${hasLogo ? '<img src="cid:logo" alt="Logo" style="max-height: 100px; display: block; margin: 0 auto 10px auto;" />' : ''}
                        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">PLEX SERVER</h1>
                    </div>
                    <div style="padding: 30px 40px;">
                        <h2 style="color: #282A2D; font-size: 20px; margin-top: 0; font-weight: 600; text-align: center;">SMTP Test Successful</h2>
                        <p>This is a test notification confirming that the Plex SMTP server parameters are active and communicating successfully.</p>
                        <p>Automated expiry notifications will use this template design to contact shared members before access revocation.</p>
                    </div>
                    <div style="background-color: #f7fafc; padding: 20px 30px; border-top: 1px solid #edf2f7; text-align: center; font-size: 12px; color: #a0aec0;">
                        <p style="margin: 0;">Automated alert from the Plex Expiry Service.</p>
                    </div>
                </div>
            </div>
            `
        );
        res.json({ message: 'Test email sent successfully!' });
    } catch (error) {
        log(`Failed to send test email: ${error.message}`);
        res.status(500).json({ error: `SMTP test failed: ${error.message}` });
    }
});

let cachedPlexConnectionUri = null;
let lastPlexConnectionUriFetch = 0;

// Plex interaction helpers
const getPlexConnectionUri = async (config) => {
    if (cachedPlexConnectionUri && (Date.now() - lastPlexConnectionUriFetch < 60 * 60 * 1000)) {
        return cachedPlexConnectionUri;
    }
    const response = await fetch('https://plex.tv/api/v2/resources?includeHttps=1', {
        headers: {
            'X-Plex-Token': config.plexToken,
            'X-Plex-Client-Identifier': CLIENT_ID,
            'Accept': 'application/json'
        }
    });
    if (!response.ok) throw new Error('Failed to fetch resources from Plex.tv');
    const resources = await response.json();
    const server = resources.find(r => r.clientIdentifier === config.serverIdentifier);
    if (!server || !server.connections || server.connections.length === 0) throw new Error('Server not found');
    const localConnection = server.connections.find(c => c.local) || server.connections[0];
    cachedPlexConnectionUri = localConnection.uri;
    lastPlexConnectionUriFetch = Date.now();
    return cachedPlexConnectionUri;
};

app.get('/api/plex/image', async (req, res) => {
    const { path } = req.query;
    if (!path) return res.status(400).send('path required');
    try {
        const config = await loadFile(CONFIG_PATH, {});
        const uri = await getPlexConnectionUri(config);
        const url = `${uri}${path}?X-Plex-Token=${config.plexToken}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('fetch failed');
        const buffer = Buffer.from(await response.arrayBuffer());
        res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(buffer);
    } catch (e) {
        res.status(500).send('');
    }
});

// Plex interaction endpoints
let cachedPlexStats = null;
let lastPlexStatsFetch = 0;

const fetchPlexStatsInternal = async (config) => {
    if (cachedPlexStats && (Date.now() - lastPlexStatsFetch < 15 * 60 * 1000)) {
        return cachedPlexStats;
    }
    const uri = await getPlexConnectionUri(config);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const sectionsRes = await fetch(`${uri}/library/sections`, {
        headers: { 'X-Plex-Token': config.plexToken, 'Accept': 'application/json' },
        signal: controller.signal
    });
    if (!sectionsRes.ok) throw new Error('Failed to connect to local Plex server.');
    const sectionsData = await sectionsRes.json();
    const directories = sectionsData.MediaContainer.Directory || [];
    let totalMovies = 0; let totalShows = 0; let totalMusic = 0;
    for (const dir of directories) {
        try {
            const sectionAllRes = await fetch(`${uri}/library/sections/${dir.key}/all?X-Plex-Container-Start=0&X-Plex-Container-Size=0`, {
                headers: { 'X-Plex-Token': config.plexToken, 'Accept': 'application/json' },
                signal: controller.signal
            });
            if (sectionAllRes.ok) {
                const sectionAllData = await sectionAllRes.json();
                const size = sectionAllData.MediaContainer.totalSize || sectionAllData.MediaContainer.size || 0;
                if (dir.type === 'movie') totalMovies += size;
                else if (dir.type === 'show') totalShows += size;
                else if (dir.type === 'artist') totalMusic += size;
            }
        } catch (e) { log(`Failed to fetch size for section ${dir.title}`); }
    }
    clearTimeout(timeout);
    cachedPlexStats = { movies: totalMovies, shows: totalShows, music: totalMusic };
    lastPlexStatsFetch = Date.now();
    return cachedPlexStats;
};

app.get('/api/plex/stats', async (req, res) => {
    const config = await loadFile(CONFIG_PATH, null);
    if (!config || !config.plexToken || !config.serverIdentifier) {
        return res.status(400).json({ error: 'App not configured.' });
    }
    try {
        const stats = await fetchPlexStatsInternal(config);
        res.json(stats);
    } catch (error) {
        log(`Error fetching plex stats: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch plex stats' });
    }
});

const calculateUptime30Days = (history) => {
    if (!history || history.length === 0) return 100;
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentHistory = history.filter(h => h.timestamp >= thirtyDaysAgo);
    if (recentHistory.length === 0) return 100;
    const upCount = recentHistory.filter(h => h.status === 'up').length;
    return (upCount / recentHistory.length) * 100;
};

const fetchImageBuffer = async (config, thumbPath) => {
    if (!thumbPath) return null;
    try {
        const uri = await getPlexConnectionUri(config);
        const url = `${uri}${thumbPath}?X-Plex-Token=${config.plexToken}`;
        const res = await fetch(url);
        if (res.ok) {
            return Buffer.from(await res.arrayBuffer());
        }
    } catch (e) {}
    return null;
};

const generateNewsletterHtml = async (config) => {
    const stats = await fetchPlexStatsInternal(config).catch(() => ({ movies: 0, shows: 0, music: 0 }));
    let recentHtml = '';
    let serverName = 'our Plex Server';
    const attachments = [];
    let cidCounter = 1;
    
    try {
        const logoPath = path.join(process.cwd(), 'static', 'logo.png');
        const logoBuf = await fs.readFile(logoPath).catch(() => null);
        if (logoBuf) {
            attachments.push({ filename: 'logo.png', content: logoBuf, cid: 'logo' });
        }
    } catch(e) {}

    try {
        const uri = await getPlexConnectionUri(config);
        
        // serverName is declared at function scope above
        try {
            const serverRes = await fetch(`${uri}/?X-Plex-Token=${config.plexToken}`, {
                headers: { 'Accept': 'application/json' }
            });
            const serverData = await serverRes.json();
            if (serverData?.MediaContainer?.friendlyName) {
                serverName = serverData.MediaContainer.friendlyName;
            }
        } catch(e) {}

        const recentRes = await fetch(`${uri}/library/recentlyAdded?X-Plex-Container-Start=0&X-Plex-Container-Size=100`, {
            headers: { 'X-Plex-Token': config.plexToken, 'Accept': 'application/json' }
        });
        const recentData = await recentRes.json();
        const items = recentData.MediaContainer.Metadata || [];

        const movies = [];
        const tvShowsMap = new Map();
        const music = [];

        items.forEach(item => {
            if (item.type === 'movie') {
                movies.push(item);
            } else if (item.type === 'season' || item.type === 'episode') {
                const showKey = item.grandparentRatingKey || item.parentRatingKey || item.ratingKey;
                if (!tvShowsMap.has(showKey)) {
                    tvShowsMap.set(showKey, {
                        ratingKey: showKey,
                        title: item.grandparentTitle || item.parentTitle || item.title,
                        type: 'TV Show',
                        thumb: item.grandparentThumb || item.parentThumb || item.thumb
                    });
                }
            } else if (item.type === 'album' || item.type === 'track') {
                music.push(item);
            }
        });

        const tvShows = Array.from(tvShowsMap.values());
        
        const renderGrid = async (categoryItems, categoryTitle, isSquare = false) => {
            if (!categoryItems || categoryItems.length === 0) return '';
            const itemsToRender = categoryItems.slice(0, 20);
            const imgWidth = 115;
            const imgHeight = isSquare ? 115 : 173;
            
            let cols = '';
            for (let i = 0; i < itemsToRender.length; i++) {
                if (i % 4 === 0) cols += '<tr>';
                
                const item = itemsToRender[i];
                let thumbPath = item.thumb;
                let imageUrl = '';
                
                if (thumbPath) {
                    const buf = await fetchImageBuffer(config, thumbPath);
                    if (buf) {
                        const cid = `poster-${cidCounter++}`;
                        attachments.push({ filename: `${cid}.jpg`, content: buf, cid: cid });
                        imageUrl = `cid:${cid}`;
                    }
                }
                if (!imageUrl) {
                    imageUrl = `https://via.placeholder.com/${imgWidth}x${imgHeight}/1f2937/eab308?text=No+Image`;
                }

                const itemUrl = `https://app.plex.tv/desktop/#!/server/${config.serverIdentifier}/details?key=%2Flibrary%2Fmetadata%2F${item.ratingKey}`;
                cols += `
                    <td width="25%" align="center" valign="top" style="padding: 10px 5px;">
                        <a href="${itemUrl}" style="text-decoration: none; display: block;" target="_blank">
                            <img src="${imageUrl}" width="${imgWidth}" height="${imgHeight}" style="width: ${imgWidth}px; height: ${imgHeight}px; object-fit: cover; border-radius: 6px; border: 1px solid #374151; display: block; margin-bottom: 8px;" alt="Poster" />
                            <h4 style="margin: 0; color: #ffffff; font-size: 12px; font-family: Helvetica, Arial, sans-serif; line-height: 1.3; text-align: center; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${item.title || item.parentTitle || item.grandparentTitle || 'Unknown'}</h4>
                        </a>
                    </td>
                `;
                
                if (i % 4 === 3 || i === itemsToRender.length - 1) {
                    if (i === itemsToRender.length - 1) {
                        const remaining = 3 - (i % 4);
                        for (let j = 0; j < remaining; j++) {
                            cols += '<td width="25%"></td>';
                        }
                    }
                    cols += '</tr>';
                }
            }

            return `
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #eab308; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; margin: 0 0 15px 0; padding-left: 10px; border-left: 3px solid #eab308;">${categoryTitle}</h3>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed;">
                        ${cols}
                    </table>
                </div>
            `;
        };

        const moviesHtml = await renderGrid(movies, 'Recently Added Movies', false);
        const tvHtml = await renderGrid(tvShows, 'Recently Added TV', false);
        const musicHtml = await renderGrid(music, 'Recently Added Music', true);

        recentHtml = moviesHtml + tvHtml + musicHtml;

    } catch(e) {
        recentHtml = '<p style="color:#a0aec0; text-align:center;">Failed to load recently added content.</p>';
    }

    const uptimeStr = (healthData && healthData.history && healthData.history.length > 0) ? `${calculateUptime30Days(healthData.history).toFixed(2)}%` : '100%';

    const htmlContent = `
                        <!-- Header -->
                        <tr>
                            <td align="center" style="padding: 40px 30px; background-color: #0b0f19; border-bottom: 1px solid #1f2937;">
                                <img src="cid:logo" alt="Plex Portal" style="max-width: 280px; height: auto; display: block; margin: 0 auto 10px auto;" />
                                <p style="color: #9ca3af; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; margin: 0;">Here is what's happening on the server</p>
                            </td>
                        </tr>
                        
                        <!-- Stats Row -->
                        <tr>
                            <td style="padding: 30px;">
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <!-- Uptime -->
                                        <td width="48%" align="center" style="padding: 20px; background-color: rgba(31, 41, 55, 0.6); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                                            <p style="margin: 0; color: #9ca3af; font-family: Helvetica, Arial, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">30-Day Uptime</p>
                                            <h2 style="margin: 8px 0 0 0; color: #22c55e; font-family: Helvetica, Arial, sans-serif; font-size: 26px;">${uptimeStr}</h2>
                                        </td>
                                        <td width="4%" style="font-size: 0; line-height: 0;">&nbsp;</td>
                                        <!-- Library -->
                                        <td width="48%" align="center" style="padding: 20px; background-color: rgba(31, 41, 55, 0.6); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                                            <p style="margin: 0; color: #9ca3af; font-family: Helvetica, Arial, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Library Size</p>
                                            <p style="margin: 8px 0 4px 0; color: #ffffff; font-family: Helvetica, Arial, sans-serif; font-size: 15px;"><strong>${stats.movies}</strong> Movies</p>
                                            <p style="margin: 0; color: #ffffff; font-family: Helvetica, Arial, sans-serif; font-size: 15px;"><strong>${stats.shows}</strong> TV Shows</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Greeting -->
                        <tr>
                            <td style="padding: 0 30px 20px 30px; text-align: center;">
                                <p style="margin: 0; color: #9ca3af; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5;">
                                    <strong>{{USERNAME}}</strong>, you are receiving this newsletter as you are a member of <strong>{{SERVER_NAME}}</strong>.
                                </p>
                            </td>
                        </tr>

                        <!-- Recently Added -->
                        <tr>
                            <td style="padding: 0 30px 30px 30px;">
                                ${recentHtml}
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td align="center" style="padding: 30px; background-color: #0b0f19; border-top: 1px solid #1f2937;">
                                <p style="margin: 0 0 10px 0; color: #6b7280; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px;">This is an automated message from Plex Server Manager.</p>
                                <p style="margin: 0; color: #6b7280; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px;">To opt out of these newsletters, please visit your <a href="${config.publicDomain}" style="color: #eab308; text-decoration: none;">User Portal</a>.</p>
                            </td>
                        </tr>
                    `;

    const finalHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Plex Server Automated Newsletter</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #000000; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #000000;">
                    <tr>
                        <td align="center" style="padding: 20px 0;">
                            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #0b0f19; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
                                ${htmlContent}
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
    `.replace(/{{SERVER_NAME}}/g, serverName);

    return { html: finalHtml, attachments };
};

app.post('/api/newsletter/test', requireAdmin, async (req, res) => {
    try {
        const config = await loadFile(CONFIG_PATH, {});
        if (!config.smtpHost || !config.smtpUser) return res.status(400).json({error: 'SMTP not configured'});
        
        let adminEmail = null;
        try {
            const userRes = await fetch('https://plex.tv/api/v2/user', {
                headers: { 'X-Plex-Token': config.plexToken, 'Accept': 'application/json' }
            });
            if (userRes.ok) {
                const userData = await userRes.json();
                adminEmail = userData.email;
            }
        } catch (e) {
            log('Error fetching admin email: ' + e.message);
        }

        if (!adminEmail) return res.status(400).json({error: 'Could not fetch admin email from Plex account.'});

        const { html, attachments } = await generateNewsletterHtml(config);
        const transporter = nodemailer.createTransport({
            host: config.smtpHost,
            port: config.smtpPort,
            secure: config.smtpSecure,
            auth: { user: config.smtpUser, pass: config.smtpPass }
        });
        
        const personalizedHtml = html.replace(/{{USERNAME}}/g, 'Admin');

        await transporter.sendMail({
            from: config.smtpFrom || config.smtpUser,
            to: adminEmail,
            subject: 'Plex Server Automated Newsletter (Test)',
            html: personalizedHtml,
            attachments: attachments
        });
        res.json({success: true});
    } catch(e) {
        log(`Newsletter test error: ${e.message}`);
        res.status(500).json({error: e.message});
    }
});

app.post('/api/newsletter/send-now', requireAdmin, async (req, res) => {
    try {
        const config = await loadFile(CONFIG_PATH, {});
        if (!config.smtpHost || !config.smtpUser) return res.status(400).json({error: 'SMTP not configured'});
        
        const users = await loadFile(USERS_PATH, []);
        const validUsers = users.filter(u => u.email);
        if (validUsers.length === 0) return res.status(400).json({error: 'No users with email addresses found.'});
        
        const { html, attachments } = await generateNewsletterHtml(config);
        const transporter = nodemailer.createTransport({
            host: config.smtpHost,
            port: config.smtpPort,
            secure: config.smtpSecure,
            auth: { user: config.smtpUser, pass: config.smtpPass }
        });
        
        // Respond immediately, process in background
        res.json({success: true, message: `Sending to ${validUsers.length} users...`});
        
        log(`Manual newsletter trigger initiated for ${validUsers.length} users.`);
        for (const user of validUsers) {
            try {
                await transporter.sendMail({
                    from: config.smtpFrom || config.smtpUser,
                    to: user.email,
                    subject: 'Plex Server Automated Newsletter',
                    html: html,
                    attachments: attachments
                });
                await new Promise(resolve => setTimeout(resolve, 15000)); // 15s delay to avoid Gmail rate limits
            } catch(e) {
                log(`Failed to send manual newsletter to ${user.email}: ${e.message}`);
            }
        }
        log(`Manual newsletter dispatch completed.`);
    } catch(e) {
        log(`Newsletter send-now error: ${e.message}`);
        if (!res.headersSent) res.status(500).json({error: e.message});
    }
});

app.post('/api/plex/servers', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Plex token is required.' });

    try {
        log('Fetching Plex servers using /pms/servers XML API...');
        const response = await fetch('https://plex.tv/pms/servers', {
            headers: {
                'X-Plex-Token': token,
                'Accept': 'application/xml'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            log(`Error fetching Plex servers (XML). Status: ${response.status}. Response: ${errorText}`);
            throw new Error('Failed to fetch servers from Plex. Please double-check your Plex token.');
        }

        const xmlText = await response.text();
        const serverTags = xmlText.match(/<Server\b[^>]*\/>/g) || [];

        const servers = serverTags.map(tag => {
            const nameMatch = tag.match(/name="([^"]+)"/);
            const idMatch = tag.match(/machineIdentifier="([^"]+)"/);
            
            if (nameMatch && idMatch) {
                return { name: nameMatch[1], identifier: idMatch[1] };
            }
            return null;
        }).filter(Boolean); // Filter out any null entries from failed regex matches

        if (servers.length === 0) {
            log('API call successful, but no servers with a machineIdentifier were found in the response.');
        } else {
            log(`Found ${servers.length} server(s).`);
        }
        
        res.json(servers);
    } catch (error) {
        log(`An exception occurred in /api/plex/servers: ${error.message}`);
        res.status(500).json({ error: error.message || 'An unexpected error occurred while fetching servers.' });
    }
});


app.post('/api/sync', requireAdmin, async (req, res) => {
    const config = await loadFile(CONFIG_PATH, null);
    if (!config) return res.status(400).json({ error: 'App not configured.' });
    try {
        const result = await syncUsers(config);
        await appendAuditLog('plex_sync_completed', req.user || null, null, { count: result.count });
        res.json(result);
    } catch (error) {
        await appendAuditLog('plex_sync_failed', req.user || null, null, { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// User data endpoints
app.get('/api/users', requireAdmin, async (req, res) => {
    const users = await loadFile(USERS_PATH, []);
    res.json(users);
});

app.get('/api/deleted-users', requireAdmin, async (req, res) => {
    const deletedUsers = await loadFile(DELETED_USERS_PATH, []);
    res.json(deletedUsers.map(user => ({ ...user, blockId: getDeletedUserKey(user) })));
});

app.delete('/api/deleted-users/:blockId', requireAdmin, async (req, res) => {
    const { blockId } = req.params;
    const deletedUsers = await loadFile(DELETED_USERS_PATH, []);
    const deletedUser = deletedUsers.find(user => getDeletedUserKey(user) === blockId);
    if (!deletedUser) return res.status(404).json({ error: 'Deleted user record not found.' });

    await saveFile(DELETED_USERS_PATH, deletedUsers.filter(user => getDeletedUserKey(user) !== blockId));
    await appendAuditLog('deleted_user_unblocked', req.user, deletedUser);
    res.status(204).send();
});

app.get('/api/audit-log', requireAdmin, async (req, res) => {
    const auditLog = await loadFile(AUDIT_LOG_PATH, []);
    res.json(auditLog.slice(0, 200));
});

app.put('/api/users/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { expiryDate } = req.body; 
    let users = await loadFile(USERS_PATH, []);
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) return res.status(404).json({ error: 'User not found.' });
    
    const previousExpiryDate = users[userIndex].expiryDate;
    users[userIndex].expiryDate = expiryDate;
    await saveFile(USERS_PATH, users);
    await appendAuditLog('user_expiry_updated', req.user, users[userIndex], { previousExpiryDate, expiryDate });

    // Send adjustment email
    const config = await loadFile(CONFIG_PATH, {});
    const logoPath = path.join(process.cwd(), 'static', 'logo.png');
    let hasLogo = false;
    try { await fs.access(logoPath); hasLogo = true; } catch (e) {}
    await sendAdjustmentEmail(config, users[userIndex], hasLogo);

    res.json(users[userIndex]);
});

const applyBulkAction = (user, action, customDate) => {
    const baseDate = user.expiryDate ? new Date(user.expiryDate) : new Date();
    
    switch (action) {
        case 'addMonth':
            user.expiryDate = addMonths(baseDate, 1).toISOString();
            break;
        case 'addYear':
            user.expiryDate = addYears(baseDate, 1).toISOString();
            break;
        case 'unlimited':
            user.expiryDate = null;
            break;
        case 'custom':
            user.expiryDate = customDate ? new Date(customDate).toISOString() : null;
            break;
    }
};

app.post('/api/users/bulk-update', requireAdmin, async (req, res) => {
    const { userIds, action, customDate } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0 || !['addMonth', 'addYear', 'unlimited', 'custom'].includes(action)) {
        return res.status(400).json({ error: 'Invalid request body.' });
    }
    if (action === 'custom' && !customDate) {
        return res.status(400).json({ error: 'customDate is required for custom action.' });
    }

    try {
        let users = await loadFile(USERS_PATH, []);
        let updatedCount = 0;
        const config = await loadFile(CONFIG_PATH, {});
        const logoPath = path.join(process.cwd(), 'static', 'logo.png');
        let hasLogo = false;
        try { await fs.access(logoPath); hasLogo = true; } catch (e) {}
        
        for (const user of users) {
            if (userIds.includes(user.id)) {
                applyBulkAction(user, action, customDate);
                updatedCount++;
                await appendAuditLog('user_bulk_updated', req.user, user, { action, customDate: customDate || null });
                await sendAdjustmentEmail(config, user, hasLogo);
            }
        }

        await saveFile(USERS_PATH, users);
        log(`Bulk updated ${updatedCount} users with action: ${action}`);
        res.json({ message: `Successfully updated ${updatedCount} users.` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to process bulk update.' });
    }
});

app.delete('/api/users/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const config = await loadFile(CONFIG_PATH, null);
    let users = await loadFile(USERS_PATH, []);
    const user = users.find(u => u.id === id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (config && config.serverIdentifier && config.plexToken) {
        const revoked = await revokePlexAccess(user, config);
        if (!revoked) {
            return res.status(500).json({ error: 'Failed to revoke Plex access before deleting user.' });
        }
    }

    await rememberDeletedUser(user, req.user);
    await saveFile(USERS_PATH, users.filter(u => u.id !== id));
    await appendAuditLog('user_deleted_blocked', req.user, user, { plexAccessRevoked: !!(config && config.serverIdentifier && config.plexToken) });
    res.status(204).send();
});

app.post('/api/users/:id/revoke', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const config = await loadFile(CONFIG_PATH, null);
    if (!config) return res.status(400).json({ error: 'App not configured.' });
    let users = await loadFile(USERS_PATH, []);
    const user = users.find(u => u.id === id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    
    const revoked = await revokePlexAccess(user, config);
    if (revoked) {
        user.plexAccessStatus = 'revoked';
        await saveFile(USERS_PATH, users);
        await appendAuditLog('plex_access_revoked', req.user, user);
        res.json(user);
    } else {
        res.status(500).json({ error: 'Failed to revoke access via Plex API.' });
    }
});

app.post('/api/users/request-invite', requireAuth, async (req, res) => {
    const config = await loadFile(CONFIG_PATH, null);
    if (!config || !config.serverIdentifier) return res.status(400).json({ error: 'App not configured.' });
    
    let users = await loadFile(USERS_PATH, []);
    const existingUser = users.find(u => u.email === req.user.email || u.username === req.user.username);
    const deletedUsers = await loadFile(DELETED_USERS_PATH, []);
    
    if (existingUser) {
        await appendAuditLog('trial_request_blocked_existing_user', req.user, existingUser);
        return res.status(400).json({ error: 'You are already registered.' });
    }
    if (!req.user.isAdmin && isDeletedUser(deletedUsers, req.user)) {
        await appendAuditLog('trial_request_blocked_deleted_user', req.user, req.user);
        res.clearCookie('session');
        return res.status(403).json({ error: 'Your portal session has expired. Please contact the admin for access.' });
    }

    const expiryDate = addDays(new Date(), 3);

    const newUser = {
        id: req.user.plexId.toString(),
        username: req.user.username,
        email: req.user.email,
        joiningDate: new Date().toISOString(),
        expiryDate: expiryDate.toISOString(),
        plexAccessStatus: 'pending',
        isTrial: true
    };

    try {
        const staleAccessRevoked = await revokePlexAccess(newUser, config);
        if (!staleAccessRevoked) {
            await appendAuditLog('trial_request_failed_stale_access', req.user, newUser);
            return res.status(500).json({ error: 'Failed to clear existing Plex access before sending invite.' });
        }

        log(`Inviting new user ${newUser.username} to server...`);
        const inviteRes = await apiFetch(`https://plex.tv/api/servers/${config.serverIdentifier}/shared_servers`, config.plexToken, {
            method: 'POST',
            body: JSON.stringify({
                server_id: config.serverIdentifier,
                shared_server: { invited_email: newUser.email }
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!inviteRes.ok) {
            const errText = await inviteRes.text();
            log(`Note: Plex API returned an error during invite (${inviteRes.status}): ${errText}`);
            // We do not throw an error here. If Plex says they are already invited, 
            // we still want to save them locally so they don't get stuck in a request loop!
        }

        users.push(newUser);
        await saveFile(USERS_PATH, users);
        await appendAuditLog('trial_invite_sent', req.user, newUser, { expiryDate: newUser.expiryDate });

        // Optional: send welcome email here

        res.json({ message: 'Invite sent successfully', user: newUser });
    } catch (e) {
        log('Error requesting invite: ' + e.message);
        res.status(500).json({ error: 'Failed to request invite.' });
    }
});

app.post('/api/users/relink', requireAuth, async (req, res) => {
    const config = await loadFile(CONFIG_PATH, null);
    if (!config || !config.serverIdentifier) return res.status(400).json({ error: 'App not configured.' });

    let users = await loadFile(USERS_PATH, []);
    const user = users.find(u => u.email === req.user.email || u.username === req.user.username);
    const deletedUsers = await loadFile(DELETED_USERS_PATH, []);

    if (!user && !req.user.isAdmin && isDeletedUser(deletedUsers, req.user)) {
        await appendAuditLog('relink_blocked_deleted_user', req.user, req.user);
        res.clearCookie('session');
        return res.status(403).json({ error: 'Your portal session has expired. Please contact the admin for access.' });
    }
    if (!user) {
        await appendAuditLog('relink_failed_user_not_found', req.user, req.user);
        return res.status(404).json({ error: 'User not found.' });
    }

    const days = getDaysUntilExpiry(user.expiryDate);
    if (days === null || days < 0) {
        await appendAuditLog('relink_blocked_expired', req.user, user, { days });
        return res.status(400).json({ error: 'Your access has expired.' });
    }

    try {
        log(`Re-linking user ${user.username}...`);
        const inviteRes = await apiFetch(`https://plex.tv/api/servers/${config.serverIdentifier}/shared_servers`, config.plexToken, {
            method: 'POST',
            body: JSON.stringify({
                server_id: config.serverIdentifier,
                shared_server: { invited_email: user.email }
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!inviteRes.ok) {
            // It might fail if they are already linked, but that's okay we just catch it
            const errText = await inviteRes.text();
            log(`Re-link Plex API response: ${inviteRes.status} ${errText}`);
        }

        user.plexAccessStatus = 'pending';
        await saveFile(USERS_PATH, users);
        await appendAuditLog('relink_invite_sent', req.user, user);

        res.json({ message: 'Account re-linked successfully.', user });
    } catch (e) {
        log('Error re-linking account: ' + e.message);
        res.status(500).json({ error: 'Failed to re-link account.' });
    }
});

// --- Public & Status API Endpoints ---
let cachedAdminProfile = null;
let lastAdminProfileFetch = 0;

async function getAdminProfile(config) {
    if (!config || !config.plexToken) return { thumb: null, serverName: 'Plex Server' };
    
    if (cachedAdminProfile && Date.now() - lastAdminProfileFetch < 3600000) {
         return cachedAdminProfile;
    }

    try {
        const userRes = await fetch('https://plex.tv/api/v2/user', { headers: { 'X-Plex-Token': config.plexToken, 'Accept': 'application/json' } }).then(r => r.json());
        
        let serverName = 'Plex Server';
        const uri = await getPlexConnectionUri(config);
        if (uri) {
            const serverRes = await fetch(`${uri}/?X-Plex-Token=${config.plexToken}`, { headers: { 'Accept': 'application/json' } }).then(r => r.json()).catch(() => null);
            if (serverRes && serverRes.MediaContainer && serverRes.MediaContainer.friendlyName) {
                serverName = serverRes.MediaContainer.friendlyName;
            }
        }

        cachedAdminProfile = { thumb: userRes.thumb || null, serverName };
        lastAdminProfileFetch = Date.now();
        return cachedAdminProfile;
    } catch (e) {
        return { thumb: null, serverName: 'Plex Server' };
    }
}

app.get('/api/public/info', async (req, res) => {
    try {
        const config = await loadFile(CONFIG_PATH, {});
        const profile = await getAdminProfile(config);
        const isConfigured = !!(config && config.plexToken && config.serverIdentifier);
        res.json({ ...profile, isConfigured, requestUrl: config.requestUrl || 'https://plexified.co.uk' });
    } catch (e) {
        res.json({ thumb: null, serverName: 'Plex Server', isConfigured: false, requestUrl: 'https://plexified.co.uk' });
    }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.get('/api/status', (req, res) => res.json({ config: statusConfig, healthData }));
app.get('/api/status/config', requireAuth, requireAdmin, (req, res) => res.json(statusConfig));
app.post('/api/status/config', requireAuth, requireAdmin, async (req, res) => {
    try {
        statusConfig = req.body;
        await saveFile(STATUS_CONFIG_PATH, statusConfig);
        res.json({ success: true, message: 'Status configuration updated successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update status configuration' });
    }
});

// --- Plex Dashboard & Image Proxy ---

app.get('/api/plex/image', async (req, res) => {
    try {
        const { path: imagePath } = req.query;
        if (!imagePath) return res.status(400).send('Path required');

        const config = await loadFile(CONFIG_PATH, null);
        if (!config || !config.plexToken || !config.serverIdentifier) {
            return res.status(503).send('Plex not configured');
        }

        const uri = await getPlexConnectionUri(config);
        if (!uri) return res.status(503).send('Cannot connect to Plex');

        const imageUrl = `${uri}${imagePath}?X-Plex-Token=${config.plexToken}`;
        const imageRes = await fetch(imageUrl);

        if (!imageRes.ok) return res.status(imageRes.status).send('Failed to fetch image');

        const contentType = imageRes.headers.get('content-type');
        if (contentType) res.setHeader('Content-Type', contentType);
        
        imageRes.body.pipe(res);
    } catch (e) {
        log(`Error proxying Plex image: ${e.message}`);
        res.status(500).send('Proxy error');
    }
});

app.get('/api/plex/dashboard', async (req, res) => {
    try {
        const config = await loadFile(CONFIG_PATH, null);
        if (!config || !config.plexToken || !config.serverIdentifier) {
            return res.status(503).json({ error: 'Plex not configured' });
        }

        const uri = await getPlexConnectionUri(config);
        if (!uri) return res.status(503).json({ error: 'Cannot connect to Plex' });

        const limit = parseInt(req.query.limit) || 50;
        
        const sessionsPromise = fetch(`${uri}/status/sessions?X-Plex-Token=${config.plexToken}`, { headers: { 'Accept': 'application/json' } }).then(r => r.json()).catch(() => null);
        const sectionsPromise = fetch(`${uri}/library/sections?X-Plex-Token=${config.plexToken}`, { headers: { 'Accept': 'application/json' } }).then(r => r.json()).catch(() => null);

        const [sessionsData, sectionsData] = await Promise.all([sessionsPromise, sectionsPromise]);

        let activeSessions = [];
        if (sessionsData && sessionsData.MediaContainer && sessionsData.MediaContainer.Metadata) {
            activeSessions = sessionsData.MediaContainer.Metadata.map(m => {
                const isTranscoding = m.TranscodeSession || (m.Media && m.Media[0] && m.Media[0].Part && m.Media[0].Part[0] && m.Media[0].Part[0].Stream && m.Media[0].Part[0].Stream.some(s => s.decision === 'transcode'));
                const player = m.Player || {};
                const session = m.Session || {};
                const duration = m.duration || 0;
                const viewOffset = m.viewOffset || 0;
                const progress = duration > 0 ? (viewOffset / duration) * 100 : 0;
                const plexUrl = `https://app.plex.tv/desktop/#!/server/${config.serverIdentifier}/details?key=${encodeURIComponent(m.key)}`;
                
                return {
                    title: m.title,
                    type: m.type,
                    grandparentTitle: m.grandparentTitle,
                    year: m.year,
                    thumb: m.grandparentThumb || m.parentThumb || m.thumb,
                    playerProduct: player.product || 'Unknown Device',
                    playerTitle: player.title || 'Unknown Player',
                    state: player.state || 'playing',
                    isTranscoding: !!isTranscoding,
                    progress: progress,
                    bandwidth: (session && session.bandwidth) || (m.Media && m.Media[0] && m.Media[0].bitrate) || 0,
                    plexUrl: plexUrl
                };
            });
        }

        let recentMovies = [];
        let recentShows = [];
        let recentMusic = [];
        
        if (sectionsData && sectionsData.MediaContainer && sectionsData.MediaContainer.Directory) {
            const sections = sectionsData.MediaContainer.Directory;
            const sectionPromises = sections.map(section => 
                fetch(`${uri}/library/sections/${section.key}/recentlyAdded?X-Plex-Token=${config.plexToken}&X-Plex-Container-Start=0&X-Plex-Container-Size=${limit}`, { headers: { 'Accept': 'application/json' } })
                .then(r => r.json())
                .then(data => ({ sectionType: section.type, data }))
                .catch(() => ({ sectionType: section.type, data: null }))
            );
            
            const results = await Promise.all(sectionPromises);
            
            results.forEach(({ sectionType, data }) => {
                if (data && data.MediaContainer && data.MediaContainer.Metadata) {
                    data.MediaContainer.Metadata.forEach(m => {
                        const item = {
                            title: m.grandparentTitle || m.parentTitle || m.title,
                            type: m.type,
                            year: m.year,
                            thumb: m.grandparentThumb || m.parentThumb || m.thumb,
                            addedAt: m.addedAt,
                            plexUrl: `https://app.plex.tv/desktop/#!/server/${config.serverIdentifier}/details?key=${encodeURIComponent(m.key)}`
                        };
                        
                        if (sectionType === 'movie') recentMovies.push(item);
                        else if (sectionType === 'show') recentShows.push(item);
                        else if (sectionType === 'artist') recentMusic.push(item);
                    });
                }
            });
            
            const processList = (list) => {
                const unique = [];
                const seen = new Set();
                list.sort((a, b) => b.addedAt - a.addedAt);
                for (const item of list) {
                    if (!seen.has(item.title)) {
                        seen.add(item.title);
                        unique.push(item);
                        if (unique.length >= limit) break;
                    }
                }
                return unique;
            };
            
            recentMovies = processList(recentMovies);
            recentShows = processList(recentShows);
            recentMusic = processList(recentMusic);
        }

        res.json({ activeSessions, recentMovies, recentShows, recentMusic });
    } catch (e) {
        log(`Error fetching Plex dashboard: ${e.message}`);
        res.status(500).json({ error: 'Dashboard error' });
    }
});

app.get('/api/plex/analytics', requireAdmin, async (req, res) => {
    try {
        const config = await loadFile(CONFIG_PATH, null);
        if (!config || !config.plexToken || !config.serverIdentifier) return res.status(503).json({ error: 'Plex not configured' });
        
        const uri = await getPlexConnectionUri(config);
        if (!uri) return res.status(503).json({ error: 'Cannot connect to Plex' });

        const limit = req.query.days === 'all' ? 999999 : 5000;
        const historyRes = await fetch(`${uri}/status/sessions/history/all?X-Plex-Token=${config.plexToken}&sort=viewedAt:desc&limit=${limit}`, { headers: { 'Accept': 'application/json' } }).then(r => r.json()).catch(() => null);
        const sectionsRes = await fetch(`${uri}/library/sections?X-Plex-Token=${config.plexToken}`, { headers: { 'Accept': 'application/json' } }).then(r => r.json()).catch(() => null);
        const accountsRes = await fetch(`${uri}/accounts?X-Plex-Token=${config.plexToken}`, { headers: { 'Accept': 'application/json' } }).then(r => r.json()).catch(() => null);
        const users = await loadFile(USERS_PATH, []);

        if (!historyRes || !historyRes.MediaContainer || !historyRes.MediaContainer.Metadata) {
            return res.json({ topUsers: [], topLibraries: [], topContent: [] });
        }

        const accountsMap = {};
        if (accountsRes && accountsRes.MediaContainer && accountsRes.MediaContainer.Account) {
            accountsRes.MediaContainer.Account.forEach(acc => accountsMap[acc.id] = { name: acc.name, thumb: acc.thumb });
        }

        const sectionsMap = {};
        if (sectionsRes && sectionsRes.MediaContainer && sectionsRes.MediaContainer.Directory) {
            sectionsRes.MediaContainer.Directory.forEach(s => sectionsMap[s.key] = s.title);
        }

        let cutoffDate = 0;
        if (req.query.days && req.query.days !== 'all') {
            const days = parseInt(req.query.days, 10) || 30;
            cutoffDate = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
        } else if (!req.query.days) {
            cutoffDate = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
        }
        
        const userCounts = {};
        const libraryCounts = {};
        const contentCounts = {};

        historyRes.MediaContainer.Metadata.forEach(item => {
            if (cutoffDate > 0 && item.viewedAt < cutoffDate) return;

            // User aggregation
            if (item.accountID) {
                const userFromDb = users.find(u => u.id === String(item.accountID));
                const accountFromPlex = accountsMap[item.accountID];
                let username = `User ${item.accountID}`;
                let thumb = null;

                if (userFromDb) {
                    username = userFromDb.username;
                    thumb = userFromDb.thumb;
                } else if (accountFromPlex) {
                    username = accountFromPlex.name;
                    thumb = accountFromPlex.thumb;
                }

                if (!userCounts[item.accountID]) userCounts[item.accountID] = { id: item.accountID, username, thumb, plays: 0 };
                userCounts[item.accountID].plays++;
            }

            // Library aggregation
            if (item.librarySectionID) {
                const libTitle = sectionsMap[item.librarySectionID] || `Library ${item.librarySectionID}`;
                if (!libraryCounts[item.librarySectionID]) libraryCounts[item.librarySectionID] = { id: item.librarySectionID, title: libTitle, plays: 0 };
                libraryCounts[item.librarySectionID].plays++;
            }

            // Content aggregation
            const contentKey = item.type === 'episode' ? (item.grandparentKey || item.parentKey || item.ratingKey) : item.ratingKey;
            const contentTitle = item.type === 'episode' ? (item.grandparentTitle || item.parentTitle || item.title) : item.title;
            const contentThumb = item.type === 'episode' ? (item.grandparentThumb || item.parentThumb || item.thumb) : item.thumb;
            
            if (contentKey) {
                if (!contentCounts[contentKey]) {
                    contentCounts[contentKey] = {
                        key: contentKey,
                        title: contentTitle,
                        type: item.type === 'episode' ? 'show' : item.type,
                        thumb: contentThumb,
                        plays: 0,
                        plexUrl: `https://app.plex.tv/desktop/#!/server/${config.serverIdentifier}/details?key=${encodeURIComponent('/library/metadata/' + contentKey.split('/').pop())}`
                    };
                }
                contentCounts[contentKey].plays++;
            }
        });

        const topUsers = Object.values(userCounts).sort((a, b) => b.plays - a.plays).slice(0, 10);
        const topLibraries = Object.values(libraryCounts).sort((a, b) => b.plays - a.plays).slice(0, 10);
        let topContent = Object.values(contentCounts).sort((a, b) => b.plays - a.plays).slice(0, 10).map(c => {
            if (c.thumb) {
                c.thumbUrl = `/api/plex/image?path=${encodeURIComponent(c.thumb)}`;
            }
            return c;
        });

        // Fetch rich metadata for top content
        topContent = await Promise.all(topContent.map(async (c) => {
            try {
                const metadataId = c.key.split('/').pop();
                const metaRes = await fetch(`${uri}/library/metadata/${metadataId}?X-Plex-Token=${config.plexToken}`, { headers: { 'Accept': 'application/json' } }).then(r => r.json()).catch(() => null);
                if (metaRes && metaRes.MediaContainer && metaRes.MediaContainer.Metadata && metaRes.MediaContainer.Metadata.length > 0) {
                    const meta = metaRes.MediaContainer.Metadata[0];
                    c.summary = meta.summary || '';
                    c.year = meta.year || '';
                    c.rating = meta.rating || meta.audienceRating || '';
                    c.contentRating = meta.contentRating || '';
                    c.duration = meta.duration || 0;
                    c.genres = meta.Genre ? meta.Genre.map(g => g.tag) : [];
                }
            } catch (e) {}
            return c;
        }));

        res.json({ topUsers, topLibraries, topContent });
    } catch (e) {
        log(`Error fetching analytics: ${e.message}`);
        res.status(500).json({ error: 'Analytics error' });
    }
});

app.get('/api/plex/analytics/me', requireAuth, async (req, res) => {
    try {
        const config = await loadFile(CONFIG_PATH, null);
        if (!config || !config.plexToken || !config.serverIdentifier) return res.status(503).json({ error: 'Plex not configured' });
        
        const uri = await getPlexConnectionUri(config);
        if (!uri) return res.status(503).json({ error: 'Cannot connect to Plex' });

        const users = await loadFile(USERS_PATH, []);
        const localUser = users.find(u => u.email === req.user.email || u.username === req.user.username);
        if (!localUser || !localUser.id) {
            return res.json({ totalPlays: 0, topLibraries: [], topContent: [], recentHistory: [] });
        }

        const accountID = localUser.id;
        const limit = req.query.days === 'all' ? 999999 : 5000;
        
        const historyRes = await fetch(`${uri}/status/sessions/history/all?accountID=${accountID}&X-Plex-Token=${config.plexToken}&sort=viewedAt:desc&limit=${limit}`, { headers: { 'Accept': 'application/json' } }).then(r => r.json()).catch(() => null);
        const sectionsRes = await fetch(`${uri}/library/sections?X-Plex-Token=${config.plexToken}`, { headers: { 'Accept': 'application/json' } }).then(r => r.json()).catch(() => null);

        if (!historyRes || !historyRes.MediaContainer || !historyRes.MediaContainer.Metadata) {
            return res.json({ totalPlays: 0, topLibraries: [], topContent: [], recentHistory: [] });
        }

        const sectionsMap = {};
        if (sectionsRes && sectionsRes.MediaContainer && sectionsRes.MediaContainer.Directory) {
            sectionsRes.MediaContainer.Directory.forEach(s => sectionsMap[s.key] = s.title);
        }

        let cutoffDate = 0;
        if (req.query.days && req.query.days !== 'all') {
            const days = parseInt(req.query.days, 10) || 30;
            cutoffDate = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
        } else if (!req.query.days) {
            cutoffDate = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
        }

        let totalPlays = 0;
        const libraryCounts = {};
        const contentCounts = {};
        const recentHistory = [];

        historyRes.MediaContainer.Metadata.forEach(item => {
            if (cutoffDate > 0 && item.viewedAt < cutoffDate) return;
            totalPlays++;

            if (recentHistory.length < 50) {
                recentHistory.push({
                    title: item.type === 'episode' ? (item.grandparentTitle || item.parentTitle || item.title) : item.title,
                    episodeTitle: item.type === 'episode' ? item.title : null,
                    viewedAt: item.viewedAt,
                    thumb: item.type === 'episode' ? (item.grandparentThumb || item.parentThumb || item.thumb) : item.thumb,
                    plexUrl: `https://app.plex.tv/desktop/#!/server/${config.serverIdentifier}/details?key=${encodeURIComponent(item.key)}`
                });
            }

            if (item.librarySectionID) {
                const libTitle = sectionsMap[item.librarySectionID] || `Library ${item.librarySectionID}`;
                if (!libraryCounts[item.librarySectionID]) libraryCounts[item.librarySectionID] = { id: item.librarySectionID, title: libTitle, plays: 0 };
                libraryCounts[item.librarySectionID].plays++;
            }

            const contentKey = item.type === 'episode' ? (item.grandparentKey || item.parentKey || item.ratingKey) : item.ratingKey;
            const contentTitle = item.type === 'episode' ? (item.grandparentTitle || item.parentTitle || item.title) : item.title;
            const contentThumb = item.type === 'episode' ? (item.grandparentThumb || item.parentThumb || item.thumb) : item.thumb;
            
            if (contentKey) {
                if (!contentCounts[contentKey]) {
                    contentCounts[contentKey] = {
                        key: contentKey,
                        title: contentTitle,
                        type: item.type === 'episode' ? 'show' : item.type,
                        thumb: contentThumb,
                        plays: 0,
                        plexUrl: `https://app.plex.tv/desktop/#!/server/${config.serverIdentifier}/details?key=${encodeURIComponent('/library/metadata/' + contentKey.split('/').pop())}`
                    };
                }
                contentCounts[contentKey].plays++;
            }
        });

        const topLibraries = Object.values(libraryCounts).sort((a, b) => b.plays - a.plays).slice(0, 5);
        const topContent = Object.values(contentCounts).sort((a, b) => b.plays - a.plays).slice(0, 6).map(c => {
            if (c.thumb) c.thumbUrl = `/api/plex/image?path=${encodeURIComponent(c.thumb)}`;
            return c;
        });

        res.json({ 
            totalPlays, 
            topLibraries, 
            topContent,
            recentHistory: recentHistory.map(h => {
                if (h.thumb) h.thumbUrl = `/api/plex/image?path=${encodeURIComponent(h.thumb)}`;
                return h;
            })
        });
    } catch (e) {
        log(`Error fetching personal analytics: ${e.message}`);
        res.status(500).json({ error: 'Analytics error' });
    }
});

app.get('/api/plex/analytics/user/:id', requireAdmin, async (req, res) => {
    try {
        const config = await loadFile(CONFIG_PATH, null);
        if (!config || !config.plexToken || !config.serverIdentifier) return res.status(503).json({ error: 'Plex not configured' });
        
        const uri = await getPlexConnectionUri(config);
        if (!uri) return res.status(503).json({ error: 'Cannot connect to Plex' });

        const accountID = req.params.id;
        const limit = req.query.days === 'all' ? 999999 : 5000;
        
        const historyRes = await fetch(`${uri}/status/sessions/history/all?accountID=${accountID}&X-Plex-Token=${config.plexToken}&sort=viewedAt:desc&limit=${limit}`, { headers: { 'Accept': 'application/json' } }).then(r => r.json()).catch(() => null);
        const sectionsRes = await fetch(`${uri}/library/sections?X-Plex-Token=${config.plexToken}`, { headers: { 'Accept': 'application/json' } }).then(r => r.json()).catch(() => null);

        if (!historyRes || !historyRes.MediaContainer || !historyRes.MediaContainer.Metadata) {
            return res.json({ totalPlays: 0, topLibraries: [], topContent: [], recentHistory: [] });
        }

        const sectionsMap = {};
        if (sectionsRes && sectionsRes.MediaContainer && sectionsRes.MediaContainer.Directory) {
            sectionsRes.MediaContainer.Directory.forEach(s => sectionsMap[s.key] = s.title);
        }

        let cutoffDate = 0;
        if (req.query.days && req.query.days !== 'all') {
            const days = parseInt(req.query.days, 10) || 30;
            cutoffDate = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
        } else if (!req.query.days) {
            cutoffDate = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
        }

        let totalPlays = 0;
        const libraryCounts = {};
        const contentCounts = {};
        const recentHistory = [];

        historyRes.MediaContainer.Metadata.forEach(item => {
            if (cutoffDate > 0 && item.viewedAt < cutoffDate) return;
            totalPlays++;

            // Recent history
            if (recentHistory.length < 50) {
                recentHistory.push({
                    title: item.type === 'episode' ? (item.grandparentTitle || item.parentTitle || item.title) : item.title,
                    episodeTitle: item.type === 'episode' ? item.title : null,
                    viewedAt: item.viewedAt,
                    thumb: item.type === 'episode' ? (item.grandparentThumb || item.parentThumb || item.thumb) : item.thumb,
                    plexUrl: `https://app.plex.tv/desktop/#!/server/${config.serverIdentifier}/details?key=${encodeURIComponent(item.key)}`
                });
            }

            // Library aggregation
            if (item.librarySectionID) {
                const libTitle = sectionsMap[item.librarySectionID] || `Library ${item.librarySectionID}`;
                if (!libraryCounts[item.librarySectionID]) libraryCounts[item.librarySectionID] = { id: item.librarySectionID, title: libTitle, plays: 0 };
                libraryCounts[item.librarySectionID].plays++;
            }

            // Content aggregation
            const contentKey = item.type === 'episode' ? (item.grandparentKey || item.parentKey || item.ratingKey) : item.ratingKey;
            const contentTitle = item.type === 'episode' ? (item.grandparentTitle || item.parentTitle || item.title) : item.title;
            const contentThumb = item.type === 'episode' ? (item.grandparentThumb || item.parentThumb || item.thumb) : item.thumb;
            
            if (contentKey) {
                if (!contentCounts[contentKey]) {
                    contentCounts[contentKey] = {
                        key: contentKey,
                        title: contentTitle,
                        type: item.type === 'episode' ? 'show' : item.type,
                        thumb: contentThumb,
                        plays: 0,
                        plexUrl: `https://app.plex.tv/desktop/#!/server/${config.serverIdentifier}/details?key=${encodeURIComponent('/library/metadata/' + contentKey.split('/').pop())}`
                    };
                }
                contentCounts[contentKey].plays++;
            }
        });

        const topLibraries = Object.values(libraryCounts).sort((a, b) => b.plays - a.plays).slice(0, 5);
        const topContent = Object.values(contentCounts).sort((a, b) => b.plays - a.plays).slice(0, 6).map(c => {
            if (c.thumb) c.thumbUrl = `/api/plex/image?path=${encodeURIComponent(c.thumb)}`;
            return c;
        });

        res.json({ 
            totalPlays, 
            topLibraries, 
            topContent,
            recentHistory: recentHistory.map(h => {
                if (h.thumb) h.thumbUrl = `/api/plex/image?path=${encodeURIComponent(h.thumb)}`;
                return h;
            })
        });
    } catch (e) {
        log(`Error fetching user analytics: ${e.message}`);
        res.status(500).json({ error: 'Analytics error' });
    }
});

app.get('/api/speedtest/ping', (req, res) => { res.set('Cache-Control', 'no-store'); res.send('pong'); });
app.get('/api/speedtest/download', (req, res) => {
  const bytes = parseInt(req.query.bytes) || SPEED_TEST_CHUNK_SIZE;
  res.set('Content-Type', 'application/octet-stream');
  res.set('Content-Length', bytes);
  res.set('Cache-Control', 'no-store');
  let sent = 0;
  const streamData = () => {
    if (sent >= bytes) return res.end();
    const remaining = bytes - sent;
    const chunk = remaining >= SPEED_TEST_CHUNK_SIZE ? SPEED_TEST_BUFFER : SPEED_TEST_BUFFER.subarray(0, remaining);
    const canContinue = res.write(chunk);
    sent += chunk.length;
    if (canContinue) setImmediate(streamData);
    else res.once('drain', streamData);
  };
  streamData();
});
app.post('/api/speedtest/upload', (req, res) => { req.on('data', () => {}); req.on('end', () => res.sendStatus(200)); });

// --- Static File Serving ---
// Serve static assets from the 'static' directory
app.use('/static', express.static(path.join(process.cwd(), 'static')));

// Serve index.css from the root directory
app.get('/style.css', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'style.css'));
});

// Serve the main index.html for any other GET request
app.get(['/', '/portal', '/status', '/admin', '/dashboard', '/settings', '/analytics', '/logs', '/auth/*'], (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html'));
});


// --- API Routes ---Service ---
let serviceIntervalId = null;

const checkAndSendNewsletter = async (config) => {
    if (!config.newsletterFrequency || config.newsletterFrequency === 'disabled') return;
    if (!config.smtpHost || !config.smtpUser) return;
    
    const now = new Date();
    const dayOfWeek = now.getDay();
    const dayOfMonth = now.getDate();
    
    let shouldSend = false;
    if (config.newsletterFrequency === 'weekly' && dayOfWeek === Number(config.newsletterDay)) {
        shouldSend = true;
    } else if (config.newsletterFrequency === 'monthly' && dayOfMonth === Number(config.newsletterDay)) {
        shouldSend = true;
    }
    
    if (!shouldSend) return;
    
    const dateStr = now.toISOString().split('T')[0];
    if (config.lastNewsletterSent === dateStr) return;
    
    try {
        log('Generating and sending automated newsletters...');
        const { html, attachments } = await generateNewsletterHtml(config);
        const transporter = nodemailer.createTransport({
            host: config.smtpHost,
            port: config.smtpPort,
            secure: config.smtpSecure,
            auth: { user: config.smtpUser, pass: config.smtpPass }
        });
        
        const users = await loadFile(USERS_PATH, []);
        let sentCount = 0;
        for (const user of users) {
            if (!user.email) continue;
            if (user.optOutNewsletter) continue;
            
            const personalizedHtml = html.replace(/{{USERNAME}}/g, user.username || 'User');
            
            try {
                await transporter.sendMail({
                    from: config.smtpFrom || config.smtpUser,
                    to: user.email,
                    subject: 'Plex Server Automated Newsletter',
                    html: personalizedHtml,
                    attachments: attachments
                });
                sentCount++;
                await new Promise(resolve => setTimeout(resolve, 15000)); // 15s delay to avoid Gmail rate limits
            } catch(e) {
                log(`Failed to send newsletter to ${user.email}: ${e.message}`);
            }
        }
        
        log(`Newsletter sent to ${sentCount} users.`);
        config.lastNewsletterSent = dateStr;
        await saveFile(CONFIG_PATH, config);
    } catch (e) {
        log(`Failed to generate/send newsletter: ${e.message}`);
    }
};

const startBackgroundService = async () => {
    if (serviceIntervalId) clearInterval(serviceIntervalId);
    
    const config = await loadFile(CONFIG_PATH, null);
    if (!config || !config.plexToken || !config.serverIdentifier) {
        log('Plex is not configured. Background service will not start.');
        return;
    }
    
    await syncUsers(config).catch(e => log(`Error during initial sync: ${e.message}`));
    await checkAndSendNotifications(config).catch(e => log(`Error during initial notifications check: ${e.message}`));
    await checkAndRevoke(config).catch(e => log(`Error during initial check: ${e.message}`));
    await checkAndSendNewsletter(config).catch(e => log(`Error during initial newsletter check: ${e.message}`));

    const intervalMinutes = config.checkIntervalMinutes || 60;
    const intervalMs = intervalMinutes * 60 * 1000;
    
    log(`Service started successfully. Checks will run every ${intervalMinutes} minute(s).`);
    serviceIntervalId = setInterval(async () => {
        try {
            const currentConfig = await loadFile(CONFIG_PATH, config);
            await checkAndSendNotifications(currentConfig);
            await checkAndRevoke(currentConfig);
            await checkAndSendNewsletter(currentConfig);
        } catch (e) {
            log(`Error during hourly check: ${e.message}`);
        }
    }, intervalMs);
};

// --- Status App Functions ---
async function loadStatusState() {
  try {
    const configData = await fs.readFile(STATUS_CONFIG_PATH, 'utf-8');
    statusConfig = JSON.parse(configData);
  } catch (e) {
    await saveFile(STATUS_CONFIG_PATH, statusConfig);
  }

  try {
    const healthRaw = await fs.readFile(HEALTH_PATH, 'utf-8');
    healthData = JSON.parse(healthRaw);
  } catch (e) {
    healthData = {};
  }
}

async function saveHealthData() {
  try {
    await saveFile(HEALTH_PATH, healthData);
  } catch (e) {}
}

function performSingleProbe(service) {
  return new Promise((resolve) => {
    const rawUrl = service.url;
    if (!rawUrl) return resolve({ status: 'offline', latency: 0, httpCode: 0 });

    let targetUrl = rawUrl;
    if (!/^https?:\/\//i.test(targetUrl)) targetUrl = 'http://' + targetUrl;
    if (service.port) {
       try {
         const u = new URL(targetUrl);
         u.port = service.port;
         targetUrl = u.toString();
       } catch(e) {}
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl);
    } catch (e) {
      return resolve({ status: 'offline', latency: 0, httpCode: 0 });
    }

    const lib = parsedUrl.protocol === 'https:' ? https : http;
    const start = Date.now();
    
    const request = lib.get(targetUrl, {
      headers: { 'User-Agent': 'SubZero-Monitor/1.0', 'Cache-Control': 'no-cache', 'Connection': 'close' },
      timeout: 8000, 
      rejectUnauthorized: false 
    }, (response) => {
      response.resume();
      const latency = Math.round(Date.now() - start);
      const code = response.statusCode || 0;
      let status = (code >= 200 && code < 400) || code === 401 || code === 403 ? 'online' : (code >= 500 ? 'degraded' : 'offline');
      resolve({ status, latency, httpCode: code });
    });

    request.on('error', () => resolve({ status: 'offline', latency: 0, httpCode: 0 }));
    request.on('timeout', () => { request.destroy(); resolve({ status: 'offline', latency: 0, httpCode: 408 }); });
  });
}

async function runMonitorCycle() {
  if (!statusConfig.services || statusConfig.services.length === 0) return;
  for (const service of statusConfig.services) {
    const result = await performSingleProbe(service);
    const timestamp = Date.now();
    if (!healthData[service.id]) {
      healthData[service.id] = { serviceId: service.id, currentStatus: 'unknown', lastCheck: 0, history: [], uptimePercentage: 100 };
    }
    const record = healthData[service.id];
    record.currentStatus = result.status;
    record.lastCheck = timestamp;
    record.history.push({ timestamp, ...result });
    if (record.history.length > 100) record.history.shift(); // keep last 100 checks
    const onlineCount = record.history.filter(h => h.status === 'online').length;
    record.uptimePercentage = Math.round((onlineCount / record.history.length) * 100);
  }
  saveHealthData();
}

// (Endpoints moved up before wildcard route)

app.listen(PORT, async () => {
    log(`--- Plex Expiry Manager Service starting on http://localhost:${PORT} ---`);
    await loadStatusState();
    runMonitorCycle();
    setInterval(runMonitorCycle, 15000);
    startBackgroundService();
});
