// Prevent `useLayoutEffect` from running during SSR or static builds.
// Use a namespace import and guard accesses so we don't try to read
// properties from an undefined default import (can happen with some bundlers).
import * as React from 'react';

// Only patch during SSR/static rendering when `window` is not available.
if (typeof window === 'undefined') {
    // Defensive: ensure React was imported and `useLayoutEffect` exists or assign a noop.
    try {
        if (React && typeof (React as any).useLayoutEffect === 'undefined') {
            // Assign a no-op to prevent warnings/errors when code calls useLayoutEffect on the server.
            (React as any).useLayoutEffect = () => { };
        }
    } catch (e) {
        // If something goes wrong, swallow the error — it's only a best-effort SSR safeguard.
    }
}
