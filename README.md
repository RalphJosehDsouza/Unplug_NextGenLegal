# NextGenLegal (Legal Tech) - Full-Stack Application

This repository contains the NextGenLegal platform: a React + TailwindCSS (ShadCN UI) frontend and an Express + Sequelize + PostgreSQL backend. 

The platform provides a comprehensive suite of digital legal tools, bridging the gap between everyday citizens, businesses, and legal professionals in India.

## Core Features & Offerings
- **Document Studio**: 17+ customizable document templates covering Business, Real Estate, Family, and Employment law. Generated instantly via Handlebars + Puppeteer.
- **Lawyer Booking & WebRTC**: A fully-fledged directory of verified lawyers. Includes availability slots, automated Escrow Razorpay payouts, and a built-in WebRTC video consultation suite for seamless citizen-lawyer meetings.
- **AI-Powered Legal Tools**:
  - **Contract Audit**: Instantly upload contracts for AI analysis of risk, compliance, and hidden clauses.
  - **Law Mapper**: Map your problem to relevant sections of Indian Law (BNS, BSA) powered by AI.
  - **RTI Assistant**: Generate comprehensive Right To Information (RTI) applications instantly.
  - **Business Name Generator**: Get available, legally viable, and catchy business names using AI.
- **Business Formation & Compliance**:
  - **Company Registration**: Step-by-step Private Limited / LLP registration with DIN/DSC routing.
  - **Trademark Filing**: Trademark application processing and conflict checks.
  - **Registered Agent**: Automated virtual office and compliance agent subscriptions.
- **Enterprise Solutions**: High-volume legal workflows, bulk e-signing, and dedicated account management for large businesses.
- **Subscriptions**: 3 distinct tiers (Starter, Professional, Business) that unlock advanced tools, higher API limits, and prioritized lawyer bookings.

## Tech Stack
- **Frontend**: React (Vite), TailwindCSS, ShadCN UI, Zustand, Daily.co (Video Calls), Socket.io-client.
- **Backend**: Node.js + Express
- **Database**: PostgreSQL 15 (managed via Sequelize ORM)
- **Caching**: Redis (ioredis) for fast responses and rate-limiting
- **File Storage**: AWS S3 (SDK v3) for secure document and contract storage
- **Payments**: Razorpay (Orders, Escrow Route, Webhooks)
- **AI Integrations**: Gemini / Google AI Studio for semantic analysis
- **Notifications**: SMTP Emails, MSG91 SMS, and realtime WebSocket in-app alerts.

## Infrastructure
Backend env template is available in `backend/.env.example`.
Start the backend dependencies quickly using `docker compose up -d` to spin up PostgreSQL and Redis locally.

Ensure you configure all relevant Environment variables (Razorpay, S3, Gemini, SMTP, Msg91) before running the application.
