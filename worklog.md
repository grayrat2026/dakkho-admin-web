---
Task ID: 1
Agent: Main
Task: Fix 4 issues on Dakkho student app + admin panel + worker API

Work Log:
- Updated worker admin GET /exam-tips endpoint to return default data (same as student sees) when no custom data saved in D1
- Added isDefault flag to admin exam-tips response
- Shared default exam tips function between admin and student public routes
- Enhanced admin exam-tips panel with: reorder (up/down), duplicate, preview mode, item count stats, default data indicator
- Added poster variant to CourseCard (portrait aspect-[3/4] layout) for better thumbnail display
- Changed TrendingCourses from grid layout to horizontal scrollable with poster-style cards
- Created custom SVG cursors for light mode (dark pointer) and dark mode (light pointer with sky accent)
- Created pointer cursor variants (circle with checkmark) for hover states
- Added CSS custom cursor styles in globals.css with @media (hover: hover) for non-touch devices only
- Fixed admin panel static export compatibility (force-dynamic -> force-static)
- Removed conflicting /api/route.ts from admin panel
- Built and deployed: Worker API, Student App, Admin Panel
- Pushed all changes to GitHub (admin, worker, student repos)
- Updated README with new features
- Verified all deployment URLs return 200

Stage Summary:
- Worker API: https://dakkho-admin-api.dakkho-admin.workers.dev (deployed)
- Student App: https://dakkho-student.pages.dev (deployed)
- Admin Panel: https://dakkho-admin.pages.dev (deployed)
- Exam tips student endpoint returns 5 strategies, 5 time management, 4 common mistakes, 4 wellness tips
- Custom cursor files accessible at /cursors/cursor-light.svg, cursor-dark.svg, pointer-light.svg, pointer-dark.svg
