# NextGenLegal: Implementation Report

This document provides a comprehensive overview of the features, security measures, and architectural components currently implemented in the NextGenLegal platform.

## 1. Core Platform Architecture
- **Tech Stack**: Built with a modern **Vite + React + TypeScript** frontend and an **Express.js + Sequelize (PostgreSQL)** backend.
- **Global State**: Managed using **Zustand** for authentication and **React Query** for server-state synchronization.
- **Styling**: Premium, responsive UI using **Tailwind CSS** and **Shadcn UI**, following a deep indigo-blue professional aesthetic.

## 2. Authentication & Identity
- **Dual-Role System**: Dedicated registration and login flows for **Citizens** and **Lawyers** with role-based dashboard redirection.
- **Standard Auth**: Secure Email/Password authentication with icon-enriched inputs.
- **OAuth Integration**: "Single-click" login for **Google** and **GitHub** using Passport.js.
- **JWT Session Management**: Implementation of secure token handling (AccessToken in-memory, RefreshToken as HttpOnly cookies) via Axios interceptors.
- **Initial Subscription**: Removed 'freemium' account creation logic. Users now authenticate directly, as the platform transitions to a commission-based revenue model.

## 3. Document Studio & Automation
- **Template Library**: Pre-built legal templates including NDA, Rental Agreements, Partnership Deeds, and Employment Contracts.
- **Generation Engine**:
  - **Handlebars-to-PDF**: Server-side rendering of legal documents using Puppeteer (A4 layout, precise margins).
  - **AES-256-CBC Encryption**: Transparent encryption of all generated and uploaded documents before S3 storage.
  - **S3 Storage Pipeline**: Secure storage with pre-signed URL generation (900s expiry) for safe downloads.

## 4. Lawyer Marketplace & Booking
- **Lawyer Directory**: Advanced search with filtering (specialization, location), sorting, and pagination.
- **14-Day Scheduling**: Automated slot generation based on a lawyer's `working_hours`, excluding confirmed bookings.
- **Booking Flow**: Multi-step booking process integrated with **Razorpay** for secure payments.
- **Commission Model**:
  - Replaced the platform's subscription-based plan system with a commission-based revenue model.
  - Subscriptions model removed from the active system; `bookings` table enriched with tracking for `platform_commission_paise`, `lawyer_payout_paise`, and `payout_status`.
  - Added fields to the `lawyers` schema for Razorpay Route integration (`razorpay_linked_account_id`, `commission_rate`, `kyc_status`).
- **Review System**: Post-consultation review and rating system ensuring platform accountability.

## 5. CourtHouse & Case Compliance
- **Hearing Management**: Portal for lawyers to schedule hearings, add descriptions, and track status.
- **Smart Checklists**: Case-type specific requirements (e.g., "Aadhaar Copy", "Vakalatnama") with status tracking (Missing/Uploaded).
- **Secure Upload Pipeline**: Real-time document upload directly to active case cards with automatic compliance status updates.
- **Automated Reminders**: Background cron job scanning for missing documents and upcoming hearings, triggering notifications.

## 6. Private Infrastructure & Security
- **Secure Viewer (`SecureViewer.tsx`)**:
  - **Anti-Screenshot**: Blurring logic triggered by focus loss or print/screenshot keyboard shortcuts.
  - **Protective Overlays**: Watermarking and disabled context menus to prevent unauthorized copying.
- **Encrypted Offline Storage**: **IndexedDB** implementation for browser-confined storage, keeping sensitive Blobs off the native filesystem.
- **Server Hardening**:
  - **Helmet.js**: Strict Content Security Policies.
  - **Rate Limiting**: Tiered limits for Auth (5/min), API (60/min), and AI Chat (10/min).
  - **Activity Logging**: Comprehensive audit trail for all critical actions (uploads, deletions, logins).

## 7. AI-Powered Legal Assistant
- **Knowledge-Aware Bot**: Production-ready chatbot panel with session-save capability.
- **Optimized Backend**:
  - **Redis Caching**: SHA-256 message hashing to cache successful replies for 3600s.
  - **Rate Limiting**: Per-user Redis-backed limits to ensure platform stability.
  - **Gemini Integration**: High-speed, contextually aware legal guidance with strict system prompting.

---
*Last Updated: March 30, 2026*
