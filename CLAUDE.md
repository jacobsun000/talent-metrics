# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web-based gaming talent assessment platform featuring scientifically inspired mini-games that measure reaction speed, visual tracking, memory, focus, and motor precision. Designed for gamers, esports teams, and enthusiasts to benchmark and improve performance.

## Tech Stack

- **Frontend:** Next.js, React (Vite + TypeScript), TailwindCSS
- **Rendering:** Canvas API / WebGL for test loops
- **State Management:** Zustand/Jotai for lightweight global state
- **Backend:** Next.js + PostgreSQL (for scores, users, leaderboards)
- **Deployment:** Vercel, Netlify, or Docker-based self-hosting

## Test Categories

The application will implement multiple test types:

1. **Core Reaction & Reflex:** Simple reaction time, choice reaction time, go/no-go tests
2. **Visual & Spatial:** Dynamic visual acuity, multiple object tracking (MOT), peripheral vision
3. **Cognitive & Memory:** Working memory (N-back), pattern recognition, predictive anticipation
4. **Motor Control & Precision:** Aim accuracy, tracking, click speed/tapping
5. **Multitasking & Focus:** Dual task reaction, Stroop test

## Critical Performance Requirements

- Use `requestAnimationFrame` for test loops to ensure frame accuracy
- Record time with `performance.now()` for millisecond precision
- Avoid React state updates every frame — batch updates periodically
- Calibrate for different refresh rates (60Hz, 120Hz, 144Hz, etc.)

## Architecture Guidelines

- Each test should be a modular, independent component
- Test results must be exportable (CSV, JSON, PDF formats)
- Support both mobile and desktop interfaces
- Implement user profiles with history tracking
- Build global and friend leaderboard systems
- Include difficulty scaling for all tests
