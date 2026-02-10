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

    // In production (inside FiveM NUI), use the global fetchNui from lb-phone
    if (typeof (window as any).fetchNui === 'function') {
        return (window as any).fetchNui(eventName, data, mockData);
    }

    // Fallback: direct NUI fetch
    const resourceName = (window as any).GetParentResourceName?.() || 'privy';
    const resp = await fetch(`https://${resourceName}/${eventName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || {}),
    });
    return resp.json() as Promise<T>;
}

export function isDevMode(): boolean {
    return devMode;
}
