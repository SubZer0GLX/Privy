const devMode = !(window as any)?.['invokeNative'];

export async function fetchNui<T = any>(eventName: string, data?: unknown, mockData?: T): Promise<T> {
    if (devMode) {
        // In dev mode, return mock data if provided
        if (mockData !== undefined) {
            return mockData;
        }
        // Default mock response
        return {} as T;
    }

    // In production, use direct NUI fetch with lb-phone's global resourceName
    const resName = (window as any).resourceName || (window as any).GetParentResourceName?.() || 'privys';
    const resp = await fetch(`https://${resName}/${eventName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || {}),
    });
    return resp.json() as Promise<T>;
}

export function isDevMode(): boolean {
    return devMode;
}

export function formatTimestamp(ts: any): string {
    if (!ts) return '';

    // Handle numeric timestamps (epoch ms)
    if (typeof ts === 'number') {
        const date = new Date(ts);
        if (!isNaN(date.getTime())) {
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMin = Math.floor(diffMs / 60000);
            const diffDays = Math.floor(diffMs / 86400000);
            if (date.toDateString() === now.toDateString()) {
                if (diffMin < 1) return 'now';
                if (diffMin < 60) return `${diffMin}min`;
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            if (diffDays < 7) return `${diffDays}d`;
            const diffWeeks = Math.floor(diffDays / 7);
            if (diffWeeks < 5) return `${diffWeeks}s`;
            const diffMonths = Math.floor(diffDays / 30);
            if (diffMonths < 12) return `${diffMonths}m`;
            return `${Math.floor(diffDays / 365)}a`;
        }
    }

    // Ensure ts is a string
    const str = typeof ts === 'string' ? ts : String(ts);

    // If already relative (e.g. "2h ago", "1d", "now"), return as-is
    if (/^\d+[hmsw]|^now$|ago$/i.test(str.trim())) return str;

    // Handle pure numeric strings (epoch ms)
    if (/^\d{10,13}$/.test(str.trim())) {
        const epoch = parseInt(str.trim());
        const date = new Date(epoch < 10000000000 ? epoch * 1000 : epoch);
        if (!isNaN(date.getTime())) {
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMin = Math.floor(diffMs / 60000);
            const diffDays = Math.floor(diffMs / 86400000);
            if (date.toDateString() === now.toDateString()) {
                if (diffMin < 1) return 'now';
                if (diffMin < 60) return `${diffMin}min`;
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            if (diffDays < 7) return `${diffDays}d`;
            const diffWeeks = Math.floor(diffDays / 7);
            if (diffWeeks < 5) return `${diffWeeks}s`;
            const diffMonths = Math.floor(diffDays / 30);
            if (diffMonths < 12) return `${diffMonths}m`;
            return `${Math.floor(diffDays / 365)}a`;
        }
    }

    // MySQL timestamps use space separator, replace with T for reliable parsing
    const normalized = str.trim().replace(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/, '$1T$2');
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return str;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Same day: show time (HH:MM)
    if (date.toDateString() === now.toDateString()) {
        if (diffMin < 1) return 'now';
        if (diffMin < 60) return `${diffMin}min`;
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Days
    if (diffDays < 7) return `${diffDays}d`;

    // Weeks
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 5) return `${diffWeeks}s`;

    // Months
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}m`;

    // Years
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears}a`;
}
