/**
 * Utility to clear stale Supabase session data from localStorage.
 * This is used to resolve "Invalid Refresh Token" errors.
 */
export const resetSupabaseSession = () => {
    console.warn("Resetting Supabase session due to auth error...");

    // Clear all Supabase related keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Also clear sessionStorage as a precaution
    sessionStorage.clear();

    // Redirect to login page
    window.location.href = '/login';
};
