# Architectural & Design Decisions Log

This document records architectural, technical, and implementation decisions that extend or clarify `docs/SPEC.md`.

| # | Date | Decision | Rationale |
|---|---|---|---|
| D1-D12 | 2026-09-29 | Spec Locked Decisions D1 to D12 adopted as specified in §2. | Single source of truth. |
| D13 | 2026-09-29 | Use Vite React TypeScript template with Tailwind CSS for `apps/web`. | Standard, fast bundling and zero-friction component styling. |
| D14 | 2026-09-29 | Self-hosted `@fontsource` packages for Archivo, IBM Plex Mono, and Inter. | Guarantees offline/college intranet resilience without CDN dependency (§3). |
