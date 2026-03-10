/* ── Deadline Notification Utilities ── */

const DEADLINE_KEY = 'taohoso_deadline_reminders';

interface DeadlineReminder {
    projectId: string;
    projectName: string;
    deadline: string; // ISO date
    enabled: boolean;
}

export function getDeadlineReminders(): DeadlineReminder[] {
    try { return JSON.parse(localStorage.getItem(DEADLINE_KEY) || '[]'); }
    catch { return []; }
}

export function saveDeadlineReminder(reminder: DeadlineReminder) {
    const all = getDeadlineReminders().filter(r => r.projectId !== reminder.projectId);
    all.push(reminder);
    localStorage.setItem(DEADLINE_KEY, JSON.stringify(all));
}

export function removeDeadlineReminder(projectId: string) {
    const all = getDeadlineReminders().filter(r => r.projectId !== projectId);
    localStorage.setItem(DEADLINE_KEY, JSON.stringify(all));
}

/**
 * Check all deadline reminders and show notifications for those expiring within `daysThreshold`.
 * Call this on page load.
 */
export function checkDeadlines(daysThreshold = 3): DeadlineReminder[] {
    const reminders = getDeadlineReminders().filter(r => r.enabled);
    const now = new Date();
    const urgent: DeadlineReminder[] = [];

    for (const r of reminders) {
        const deadline = new Date(r.deadline);
        const diffMs = deadline.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays <= daysThreshold && diffDays >= -1) {
            urgent.push(r);
        }
    }

    // Show browser notification if permitted
    if (urgent.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
        for (const r of urgent) {
            const deadline = new Date(r.deadline);
            const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const msg = diffDays <= 0
                ? `⚠️ "${r.projectName}" đã QUÁ HẠN!`
                : `⏰ "${r.projectName}" còn ${diffDays} ngày nữa hết hạn`;
            new Notification('TaoHoSo — Nhắc deadline', { body: msg, icon: '/icon-192.png' });
        }
    }

    return urgent;
}

export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
}
