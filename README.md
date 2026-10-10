# Nourish AI — Meal & Pantry Tracker

A React + TypeScript meal, pantry, and weight tracker with AI-assisted meal ideas.

## Features
- Food diary with nutrition totals
- Pantry ingredient tracking and search
- Weight history
- AI-assisted meal ideas
- Owner profile display for Faida Sylivester

## Source layout
- `src/`: React user interface
- `backend/`: API routes and realtime subscription helpers
- `tests/tests.json`: app QA scenarios
- `vite.config.ts`, `tsconfig.json`, and other root files: build configuration

## Runtime note
This source was exported from the deployed Nourish AI app. The backend uses the AppDeploy SDK (`@appdeploy/sdk`) and the frontend uses `@appdeploy/client`; those integrations require the AppDeploy runtime. A standard local Vite setup alone will not provide the same backend services.

## Profile note
The displayed name and email are UI text, not an authentication or account-login system.
