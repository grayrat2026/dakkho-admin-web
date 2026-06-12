---
Task ID: 1
Agent: Main Agent
Task: Fix Instructor Site - SPA routing, Profile edit, Social links, Video popup, R2 integration

Work Log:
- Read all key codebase files: InstructorApp.tsx, store.ts, api-client.ts, api-hooks.ts, Profile.tsx, VideoManager.tsx, CourseLive.tsx, CourseCurriculum.tsx, CourseSettings.tsx, CourseDetail.tsx, constants.ts
- Identified SPA routing issue: Next.js static export generates per-route HTML files which Cloudflare Pages serves with priority over _redirects
- Fixed build script in package.json to remove route-specific HTML/txt files after build
- Rewrote Profile.tsx with: clear labeled edit fields with icons, always-visible cover/photo change buttons, Rating displayed as read-only with amber background, improved social links UI with blue highlight platform selector and keyboard support
- Fixed VideoManager popup: Changed to z-[100], proper centering with items-center and p-4
- Fixed CourseLive popup: Same alignment fix as VideoManager
- Fixed useDeleteVideo API path: Changed from /videos/:videoId to /courses/:courseId/videos/:videoId
- Added R2_CONFIG to constants.ts with instructor-only credentials
- Updated README.md with comprehensive project documentation
- Built successfully, deployed to Cloudflare Pages
- Committed and pushed to GitHub (grayrat2026/dakkho-instructor)

Stage Summary:
- SPA routing 404 fixed by removing pre-generated HTML files from out/ directory
- Profile edit UI now has clear labels with icons, visible photo change buttons, read-only rating
- Social links UI improved with blue highlight selector and keyboard support
- Video popup and Live popup now properly centered with higher z-index
- Delete video API path fixed to include courseId
- R2 credentials added for instructor-only uploads
- Deployed to: https://dakkho-instructor.pages.dev
- GitHub: https://github.com/grayrat2026/dakkho-instructor
