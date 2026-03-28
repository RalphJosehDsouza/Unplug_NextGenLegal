# NextGenLegal - What’s Implemented

## Backend (Express + Sequelize)

### Server + hardening
- `app/backend/app.js`
  - `helmet()` with strict API CSP
  - `cors({ origin: FRONTEND_URL, credentials: true })`
  - JSON/form parsing
  - rate limiters:
    - `authLimiter` (5 req/min)
    - `apiLimiter` (60 req/min)
    - `chatLimiter` (10 req/min)
  - mounts:
    - `/api/auth`
    - `/api/docs`
    - `/api/lawyers`
    - `/api/bookings`
    - `/api/compliance`
    - `/api/notifications`
    - `/api/chat`
  - global error handler at the bottom

### Authentication
- `app/backend/controllers/authController.js`
  - `register`, `login`, `refresh`, `logout`, `me`
- `app/backend/config/passport.js`
  - Google OAuth: find-or-create `User` by `google_id`, create `Subscription`, role defaults to `citizen`

### Document automation engine
- `app/backend/services/documentService.js`
  - Handlebars template -> Puppeteer PDF (A4, 2cm margins)
  - AES-256-CBC encryption (stores `iv` + ciphertext; key stored as hex)
  - S3 upload/download helpers
  - presigned URL generator (900s)
- `app/backend/controllers/documentController.js`
  - `POST /api/docs/generate`
  - `GET /api/docs`
  - `GET /api/docs/:id/download`
  - `DELETE /api/docs/:id`
- `app/backend/templates/`
  - `nda.hbs`, `rental_agreement.hbs`, `partnership_deed.hbs`, `employment_contract.hbs`, `affidavit.hbs`

### Lawyer directory + booking
- `app/backend/controllers/lawyerController.js`
  - `GET /api/lawyers` (filters + pagination + array contains + sorting)
  - `GET /api/lawyers/:id` (profile + last reviews + rating summary)
  - `GET /api/lawyers/:id/slots` (next 14 days based on `working_hours`, excludes booked slots)
  - `POST /api/lawyers/register` (auth + lawyer-only + S3 upload via Multer memory)
- `app/backend/controllers/bookingController.js`
  - `POST /api/bookings` (Razorpay order + slot uniqueness)
  - `POST /api/bookings/confirm` (verifies Razorpay signature + creates Daily room + email + SMS)
  - `GET /api/bookings`
  - `PATCH /api/bookings/:id/cancel` (24h rule)
  - `POST /api/bookings/:id/review` (one review per completed booking)
- Models/migrations added/extended:
  - `working_hours` + `bar_council_image_s3_key` on `lawyers`
  - `Review` model + migration

### Compliance monitoring + notifications
- `app/backend/controllers/complianceController.js`
  - `POST /api/compliance` (auto due_date logic)
  - `GET /api/compliance` (grouped by status + computed daysUntilDue)
  - `PATCH /api/compliance/:id`
  - `DELETE /api/compliance/:id`
  - `GET /api/compliance/stats`
- `app/backend/services/notificationService.js`
  - SMTP email via Nodemailer
  - MSG91 SMS + WhatsApp helpers
- `app/backend/cron/complianceAlerts.js`
  - scheduled run at `0 8 * * *` Asia/Kolkata
  - sends reminders for due soon tasks, marks notified
  - marks overdue tasks and sends red alert email
  - logs run summary to `ActivityLog` and creates in-app notifications
- In-app notifications
  - `app/backend/models/Notification.js` + migration
  - `GET /api/notifications` (last 20 + unread count)
  - `PATCH /api/notifications/read-all`

### AI legal chatbot
- `app/backend/controllers/chatController.js`
  - `POST /api/chat`
    - Redis per-user rate limiting (10 req/min)
    - Redis caching by SHA-256 of normalized message
    - Gemini call with your required system prompt
    - caches successful reply for 3600s
    - logs to `ActivityLog`

## Frontend (React + Tailwind + ShadCN)

### Global app wiring
- Zustand auth store (`app/src/store/authStore.ts`) with in-memory access token
- `app/src/api/axios.ts` attaches Bearer token and refreshes on 401 (retry original request)
- React Query provider (`app/src/main.tsx`)
- Route structure updated in `app/src/App.tsx`

### Document Studio UI
- Template library:
  - `app/src/pages/DocStudio/TemplateLibrary.tsx`
- Generate form + live preview:
  - `app/src/pages/DocStudio/GenerateDocument.tsx`
- My documents list + download in SecureViewer:
  - `app/src/pages/MyDocuments/index.tsx`

### Lawyer directory + booking UI
- Search + filters + pagination:
  - `app/src/pages/Lawyers/LawyerSearch.tsx`
- Lawyer profile + 14-day slot picker:
  - `app/src/pages/Lawyers/LawyerProfile.tsx`
- Lawyer booking multi-step flow:
  - `app/src/components/lawyers/BookingFlow.tsx`
- Upcoming/past bookings + review:
  - `app/src/pages/MyBookings/index.tsx`
- Cards:
  - `app/src/components/lawyers/LawyerCard.tsx`

### Compliance UI + notifications bell
- Compliance Kanban + add/edit task modal + stats:
  - `app/src/pages/Compliance/index.tsx`
- Notification bell:
  - `app/src/components/NotificationBell.tsx`
  - mounted inside `Navbar.tsx`

### AI Chat UI
- Production chatbot panel (slide-up panel) with sessionStorage persistence:
  - `app/src/components/ChatBot.tsx`
  - mounted globally in `app/src/Layout.tsx`

## Env files
- Backend env template: `app/backend/.env.example`
- Compose: `app/docker-compose.yml`

