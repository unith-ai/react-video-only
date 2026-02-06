# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

A React demonstration of Unith's "video only mode" - embedding AI-powered video avatars via iframe. The app communicates with Unith's chat service (`chat.unith.ai`) using the postMessage API.

## Commands

- `npm run dev` - Start development server (Vite)
- `npm run build` - TypeScript check + production build
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally
- `npm run test` - Run unit tests (Vitest)
- `npm run test:watch` - Run tests in watch mode

## CI/CD

GitHub Actions workflows in `.github/workflows/`:
- `ci.yml` - Runs lint, tests, and build on all PRs and pushes to master
- `dependabot-review.yml` - Claude reviews Dependabot PRs, runs tests, and posts summary

**Required secret:** `ANTHROPIC_API_KEY` for Claude code review.

## Architecture

### Unith iframe Integration

Communication with the Unith iframe uses a postMessage protocol:

**Outbound events (to iframe):**
- `DH_MESSAGE` - Send a text message to generate video response

**Inbound events (from iframe):**
- `DH_READY` - Iframe loaded and ready (`{ isReady: boolean }`)
- `DH_PROCESSING` - Video generation state (`{ processing: boolean }`)
- `DH_MESSAGE` - Received message from avatar (`{ message: string }`)

Always validate `event.origin` against `UNITH_ORIGIN` before processing messages.

### Routes

- `/` - Basic example (`src/App.tsx`) - Simple send message → generate video
- `/advanced` - Advanced example (`src/advanced/index.tsx`) - Adds incoming message display

### Styling

Bootstrap 4 via CDN (in `index.html`) + minimal custom CSS in `src/index.css`.
