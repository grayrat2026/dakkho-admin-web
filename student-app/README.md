<div align="center">

# 📚 DAKKHO — Student App

**Student-facing application for the DAKKHO Online Learning Platform**

[![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

**🌐 Live:** [dakkho-student.pages.dev](https://dakkho-student.pages.dev)

</div>

---

## 📖 Overview

DAKKHO Student App is a mobile-first SPA built with Next.js 16 (static export) that provides polytechnic students in Bangladesh with access to video courses, live classes, and academic resources. The app features tokenized HLS video streaming, PipraPay/bKash/Nagad payment integration, enrollment management, progress tracking, achievements, certificates, and a full support system.

## 🔗 Related Repositories

| Repository | Description | Live URL |
|---|---|---|
| [dakkho-student-app](https://github.com/grayrat2026/dakkho-student-app) | Student-facing Next.js 16 SPA (this repo) | [dakkho-student.pages.dev](https://dakkho-student.pages.dev) |
| [dakkho-worker](https://github.com/grayrat2026/dakkho-worker) | Backend API (Hono + Cloudflare Workers) | [dakkho-admin-api.dakkho-admin.workers.dev](https://dakkho-admin-api.dakkho-admin.workers.dev) |
| [dakkho-instructor](https://github.com/grayrat2026/dakkho-instructor) | Instructor-facing Next.js 16 SPA | [dakkho-instructor.pages.dev](https://dakkho-instructor.pages.dev) |
| [dakkho-admin-web](https://github.com/grayrat2026/dakkho-admin-web) | Admin panel Next.js 16 SPA | [dakkho-admin.pages.dev](https://dakkho-admin.pages.dev) |
| [dakkho-admin-src](https://github.com/grayrat2026/dakkho-admin-src) *(private)* | Admin panel source (build artifact repo) | — |
| [dakkho-types](https://github.com/grayrat2026/dakkho-types) *(private)* | Shared TypeScript type definitions | — |

## 🏗 Architecture

- **Framework**: Next.js 16 with App Router, static export (`next export`)
- **Hosting**: Cloudflare Pages
- **State Management**: Zustand (navigation, auth, bookmarks, etc.)
- **Styling**: Tailwind CSS 4 + custom glassmorphism components
- **Animations**: Framer Motion
- **API Client**: Custom fetch wrapper with interceptors
- **Auth**: Bearer token (student_sessions) with email OTP verification
- **2FA**: TOTP-based two-factor authentication (Google Authenticator, Authy, etc.)

## 📱 Key Features

### Course Browsing & Enrollment
- Browse courses by department (technology), semester, and category
- Course detail page with curriculum overview, instructor info, and reviews
- Smart enrollment check — enrolled users see "Continue Learning" instead of "Enroll Now"
- Multi-package enrollment: Single, Duo/Friend Pack, Custom packages

### Payment System
- **PipraPay**: Full-page redirect to `pay.dakkho.pro.bd` (bKash, Nagad, Rocket)
- **Manual Payment**: TRX ID submission with admin verification
- Coupon code support with percentage and flat discounts
- All amounts displayed as round figures (Math.round)

### Video Streaming
- Tokenized HLS streaming with HMAC-SHA256 signed URLs
- Custom video player with progress tracking
- Watch history and resume playback
- Chapter/lesson organized curriculum

### Profile & Learning
- Student profile with institute and technology info
- Real-time learning statistics dashboard (hours watched, streak, courses enrolled)
- AI-powered search across courses, instructors, and videos
- Achievement system with unlockable badges
- Certificate generation for completed courses

### Security & Account
- **Two-Factor Authentication (2FA)**: TOTP-based 2FA with authenticator app support (Google Authenticator, Authy)
- QR code enrollment flow with backup codes generation
- 2FA verification during login for enabled accounts
- **Active Sessions Management**: View all logged-in devices, revoke individual sessions or all at once
- Device info and IP tracking per session
- **Account Deletion**: Multi-step flow with password verification, reason survey, and confirmation
- Change password with current password verification

### Support
- Support ticket system with real-time messaging
- Telegram integration for admin notifications
- File attachment support via R2

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with PWA meta
│   └── [[...slug]]/page.tsx      # SPA catch-all route
├── components/
│   └── dakkho/
│       ├── DakkhoApp.tsx         # Main SPA router (route registry)
│       ├── course/               # Course pages (detail, catalog)
│       ├── profile/              # Profile, subscription, settings
│       ├── auth/                 # Login, register, OTP
│       ├── misc/                 # Payment result, about, support
│       ├── shared/               # Reusable UI components
│       ├── department/           # Department listing templates
│       └── semester/             # Semester listing templates
├── lib/
│   ├── api-client.ts             # API client (auth, courses, payments, etc.)
│   ├── store.ts                  # Zustand stores (navigation, auth, etc.)
│   ├── data-hooks.ts             # SWR data fetching hooks
│   └── mock-data.ts              # Utility functions
└── hooks/
    └── use-piprapay.ts           # PipraPay payment hook
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/grayrat2026/dakkho-student-app.git
cd dakkho-student-app

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build & Deploy

```bash
# Build static export
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy out --project-name dakkho-student
```

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Worker API base URL (default: `https://dakkho-admin-api.dakkho-admin.workers.dev`) |

## 📋 Recent Changes (June 2026)

- **Trending course cards redesign**: Full-poster image cards with minimal mobile UI (title overlay only) and desktop hover micro-animations (image zoom, staggered metadata reveal with category, instructor, rating, students, duration)
- **Custom cursors**: Dark-mode and light-mode custom SVG cursors applied via CSS variables (desktop only, no-touch devices)
- **Exam tips admin CRUD**: ExamTipsPage fetches from /api/exam-tips endpoint (stored in app_config, editable by admin via D1)
- **Enrollment status on course detail**: Enrolled users now see "Continue Learning" + "Enrolled ✓" badge instead of "Enroll Now — ৳XXX"
- **Payment verification by payment_id**: PaymentResultPage now verifies using `payment_id` from URL, fixing the `{pp_id}` placeholder issue
- **PipraPay natural redirect**: Full-page redirect instead of iframe for better payment gateway compatibility
- **Round figure amounts**: All prices and discounted amounts display as whole numbers (Math.round)
- **Discounted price calculation**: `getDiscountedPrice()` returns rounded values in both SubscriptionPage and CourseDetailPage
- **Fixed profile edit**: Institute & semester now save correctly (D1 SQLITE_MISMATCH fix — string→INTEGER conversion in worker API)
- **Semester badge**: Profile page now shows semester badge (e.g. "Sem 3") alongside institute and technology — uses Math.floor to avoid "3.0"
- **Profile stats API**: `/api/student/profile/stats` now returns `profile` object for pre-filling edit form
- **OneSignal ServiceWorker fix**: Wrapped importScripts in try-catch to prevent console errors on Cloudflare Pages static export
- **Search results images**: Instructor avatars and course thumbnails now display in search results instead of placeholder icons
- **Semester persistence**: Semester now survives page refresh — stored via /auth/me and profile/stats API
- **Institute name from API**: Login and refreshUser now get institute name directly from /auth/me response
- **Progressive image loading**: All images across the app now use lazy loading + progressive blur-up (ProgressiveImage component) — IntersectionObserver-based lazy load with shimmer placeholder, smooth crossfade transition, and error fallback
- **Radix Avatar lazy**: AvatarImage components now include `loading="lazy"` and `decoding="async"` for deferred loading
- **Instructor avatars fixed**: InstructorsPage now shows actual profile pictures via ProgressiveImage (was showing only initial letter)
- **Removed mock data**: Downloads, Certificates, and all Exam pages (Prep, Schedule, Results, Practice) no longer use hardcoded mock data
- **Certificates API-connected**: CertificatesPage fetches from real /api/student/certificates endpoint
- **Dynamic departments**: Sidebar Departments section now fetches active technologies from Admin Panel API instead of hardcoded list
- **Admin-editable exam tips**: ExamTipsPage now fetches tips from /api/exam-tips endpoint (stored in app_config, editable by admin via D1)

## 📄 License

This project is proprietary and confidential. All rights reserved.

---

<p align="center">
  Built with ❤️ for the DAKKHO Platform
</p>
