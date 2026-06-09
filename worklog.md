---
Task ID: 1
Agent: Main Agent
Task: Fix Student App & Admin App bugs

Work Log:
- Investigated dakkho-student-app (deployed student app) architecture
- Identified root cause of Header & Hamburger Menu disappearing: no hydration guard, authPageKeys including 'forgot-password', return null on auth pages
- Fixed store.ts: Added isHydrated, hydrateAuth, resetPassword methods; initialized auth as unauthenticated to match SSR
- Fixed api-client.ts: Added resetPassword API method for password reset flow
- Created ErrorBoundary component for dakkho-student-app
- Rewrote DakkhoApp.tsx: Added hydration guard with loading spinner, removed 'forgot-password' from authPageKeys, added forgot-password to PageRouter, fixed return null issue, added ErrorBoundary
- Fixed ForgotPasswordPage.tsx: Now uses resetPassword API instead of verifyOTP; stores OTP value in state and calls resetPassword with email, OTP, and new password
- Updated ThemeStore: Added themeMode, setThemeMode, loadFromPreferences
- Updated NotificationStore: Added localStorage persistence, addNotifications, hydrateFromStorage
- Fixed AppShell.tsx: Added scroll-to-top on page change
- Fixed TopBar.tsx: Updated z-index from z-30 to z-50
- Fixed BottomNav.tsx: Updated z-index from z-30 to z-40
- Investigated Admin App client-side errors: Found transformResponse in api-client.ts was converting snake_case to camelCase, but all panel components use snake_case
- Fixed Admin App: Disabled transformResponse in api-client.ts, updated notifications-panel.tsx to use snake_case
- Both apps build successfully

Stage Summary:
- Student App: Fixed header/hamburger disappearing, forgot password OTP, hydration mismatch, z-index issues
- Admin App: Fixed client-side exception errors by disabling snake_case→camelCase transform
- All changes build successfully with no TypeScript errors
