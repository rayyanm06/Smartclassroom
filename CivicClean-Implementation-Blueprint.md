# CivicClean — Implementation Blueprint
**Hackathon:** HackConquest Aether 2026 · **PS03:** Smart Waste Management System
**Repo:** `TCETHACKAthon/` (`frontend/`, `backend/`) · **Audience:** Antigravity coding agent(s) + the four team members
**Status of this document:** architecture and product spec only. No application code, no repo changes.

> **Read this first — assumptions and gaps**
> 1. The brief mentioned a baseline "implementation plan" document. Only the brief itself came through, so I could not preserve decisions from it. Where the brief states a preference (stack, thresholds, categories, phases) I have treated it as the baseline. **Phase 0 must check the real repo/plan and reconcile anything that differs.**
> 2. I have no repository access. Anything about "what already exists" is deferred to Phase 0.
> 3. Every number in this document (radius, weights, credits, capacity, thresholds) is a **configurable prototype default**, not a validated municipal standard. The UI and PPT must say so where they show it.
> 4. Model names, free-tier limits and third-party terms change. Section 19 says what to verify at setup time instead of hard-coding claims.

---

# 1. EXECUTIVE PRODUCT SUMMARY

**CivicClean connects citizen waste reports with municipal collection planning.**

It is one operational loop seen from two sides:

- **Citizens** photograph waste, confirm where it is, and later see *what changed because of their contribution*.
- **Municipal operators** see a single, de-duplicated list of waste events, verify them, plan a capacity-aware collection route, replan when congestion appears, close events with evidence, and look at where waste is likely to recur.

The core modelling decision that makes the product coherent:

```
5 citizen REPORTS  →  1 WASTE EVENT  →  1 COLLECTION STOP
```

Duplicate detection removes *operational* duplication (one truck stop, not five) but keeps *citizen* contribution (each report is preserved, linked, and can earn a smaller, verified credit). Everything else — priority, credits, analytics, the PPT story — hangs off that relationship.

**What the prototype will genuinely do (must-have):**
photo + editable location reporting · AI category suggestion with citizen correction · transparent duplicate detection with a support/separate choice · operator verification · explainable rule-based priority · priority-aware, capacity-constrained route planning on real road times · simulated congestion with remaining-route replanning · closure with optional photo · verified-impact credit ledger visible to the citizen · baseline hotspot forecast on a small synthetic dataset.

**What it will not pretend to do:** live traffic, kilogram estimation from photos, image-based clearance verification, validated prediction accuracy, "optimal" routing beyond what the algorithm proves.

---

# 2. PRODUCT DIFFERENTIATOR

## 2.1 The Civic Impact Loop

| # | Stage | Exactly what happens | Data written | Citizen sees | Operator sees |
|---|---|---|---|---|---|
| 1 | **REPORT** | Citizen adds a photo, confirms an editable location, (optionally) describes. | `Report` (photo, GeoJSON point, `locationSource`) | "Report received" | — (until consolidated) |
| 2 | **UNDERSTAND** | Backend sends the photo to a vision model → `category` + `shortReason`. Citizen accepts or corrects. AI suggestion and final choice stored separately. | `Report.aiSuggestedCategory`, `aiShortReason`, `citizenCategory` | Category chip with one-line reason, editable | Both values, flagged if they differ |
| 3 | **CONSOLIDATE** | Geo query for unresolved events ≤ radius, compatible category, inside time window. Citizen picks **Support existing** or **Submit as separate**. | New `WasteEvent` (separate/none found) **or** new `Report(role=SUPPORTING)` linked to an existing event; `supportCount` updated | "You confirmed an existing report" or "New incident created" | One event with N linked reports and photo gallery |
| 4 | **PRIORITIZE** | Operator verifies: severity (S1–S3), estimated weight (kg, operator estimate), optional sensitive-site flag, confirms category. Rule engine computes a score with a per-factor breakdown. | `WasteEvent.status=VERIFIED`, `severity`, `estimatedWeightKg`, `priority{score,tier,breakdown}`; impact transactions flip PENDING→VERIFIED | Status "Verified" | Priority tier + "why" sentence |
| 5 | **OPTIMIZE** | Route planner takes verified, unassigned, weight-known, vehicle-compatible events; selects the highest-priority set that fits capacity; sequences it on road travel times. | `Route(status=DRAFT)` with stops, deferred + reasons, totals | — | Route ribbon, planned load vs capacity, deferred list with reasons |
| 6 | **COLLECT** | Operator assigns route; stops are worked in order. If congestion appears, remaining stops are re-sequenced from the last completed stop with remaining capacity preserved. | `Route.status`, `stops[].state`, `planVersion++`, `StatusEvent` | "Scheduled for collection" | Live route, replan delta (before/after minutes) |
| 7 | **VERIFY** | Operator marks the stop resolved, optional closure photo + note. | `WasteEvent.status=RESOLVED`, `resolvedAt`, `closurePhotoUrl`, `StatusEvent` | "Resolved" + closure photo if present | Closure evidence in drawer |
| 8 | **RECOGNIZE IMPACT** | Resolution creates `RESOLUTION_BONUS` transactions for the primary reporter and verified supporters. | `ImpactTransaction` rows | "My Civic Impact" updates: "3 of your 4 incidents resolved" | Aggregate verified contribution |
| 9 | **LEARN** | Resolved/verified unique events roll into weekly grid-cell counts that feed the baseline forecast. In the prototype the *current partial week is shown but excluded from the forecast until complete* (stated in the UI). | Aggregations from `WasteEvent` + `HistoryIncident` | — | Hotspot/forecast lens |

## 2.2 Civic Impact Credits (summary; full engine in §17)

Credits reward **verified impact**, not activity.

- Unique verified report → high value. Supporting report → smaller value. Verified classification correction → value. Resolved event → bonus.
- Rejected/invalid → zero. Repeat support from the same person → nothing. Spam cannot raise credits **or** priority.
- Credits begin `PENDING` and only count once `VERIFIED` by an operator action. They can be `REJECTED` or `REVOKED`.
- No streaks, no daily-login points, no public leaderboard for citizens, no cartoon badges.

## 2.3 Why this is not a generic waste-reporting app

1. **Reports ≠ complaints.** Most apps show N tickets for N photos; here duplicates collapse into one operational event while contributions persist.
2. **Recognition is tied to outcomes**, so there is no incentive to spam.
3. **Priority is legible.** Every score decomposes into stated reasons.
4. **Routing is honest.** Capacity, compatibility, deferrals and travel time are shown, with reasons for what was *not* collected.
5. **One canvas, not a dashboard.** The operator works on a living city map with lenses (Now · Routes · Forecast · Impact) rather than page-per-feature admin screens.
6. **Prediction is labelled** as a baseline on synthetic data, not marketing.

---

# 3. USER ROLES & USER JOURNEYS

## 3.1 Roles

| Role | Can | Cannot |
|---|---|---|
| `CITIZEN` | Register/login, classify photo, submit reports, support an event, view own reports/impact, view public status of own events | Change event status, severity, weight, priority, routes; see other citizens' data; see leaderboards |
| `OPERATOR` | Everything municipal: verify/reject, edit category/severity/weight, plan/assign/replan routes, resolve events, view analytics, aggregate impact, reset demo data (non-production) | Edit citizen reports' original photos/AI fields (immutable evidence) |

Auth is first-party (email + password → JWT). No external identity provider (see §19). Demo login buttons ("Continue as demo citizen / operator") exist on the login screen in non-production.

## 3.2 Citizen journey (mobile, one thumb)

1. Opens app → Home shows one dominant **Report waste** action and a quiet "Your impact" strip.
2. Report: photo → AI category appears as a layer over the photo → confirm/correct → confirm location on map (editable) → possible duplicate sheet → submit.
3. Sees "Received", later "Verified", "Scheduled for collection", "Resolved" on **My Reports**.
4. Opens **Report Details** for the timeline and closure photo.
5. Opens **My Civic Impact**: "You helped identify 4 unique waste events. 3 have been resolved."

## 3.3 Operator journey (desktop-first)

1. Lands on the **Live City Map** with **Needs Attention** rail.
2. Opens an event drawer → checks photos, linked reports, category, sets severity/weight → verifies (priority "why" appears).
3. Switches to **Routes** lens → previews route → sees deferred stops with reasons → assigns.
4. Marks stops resolved with closure evidence.
5. Adds a simulated congestion zone → replans remaining route (animated).
6. Switches to **Forecast** lens → Now/Forecast toggle and week slider.
7. **Impact** lens → aggregate verified contribution.

## 3.4 How information flows between the two sides

| Citizen action | Operator sees | Operator action | Citizen sees |
|---|---|---|---|
| Submit primary report | New event in Needs Attention | Verify | Status → Verified; pending credit → verified |
| Support existing event | Event `supportCount`+1, new photo in gallery, priority breakdown changes | Reject event | Status "Not accepted", reason; credits rejected |
| Correct AI category | Flag "citizen corrected AI" | Confirm/override category | Correction credit verified or revoked |
| — | — | Assign to route | "Scheduled for collection" |
| — | — | Resolve (+ closure photo) | "Resolved", closure photo, resolution bonus |

Sync mechanism: **polling** (citizen lists every 15 s while visible; operator every 5 s). No WebSockets in the prototype.

---

# 4. COMPLETE FEATURE SCOPE

## 4.1 Must Have (working prototype)

| ID | Feature | Notes |
|---|---|---|
| M1 | Auth (JWT, 2 roles) + demo accounts | Seeded |
| M2 | Photo-first report flow, editable map location | GPS / pin / (EXIF optional) |
| M3 | AI classification (category + shortReason) with citizen correction; AI/final stored separately | No confidence numbers |
| M4 | Duplicate detection (Haversine, thresholds configurable) with Support / Separate choice | Never auto-merge |
| M5 | Report → WasteEvent → status timeline (`StatusEvent`) | |
| M6 | Operator live map, Needs Attention rail, event drawer | |
| M7 | Verify/reject, severity, weight estimate, category confirm | |
| M8 | Explainable priority engine | |
| M9 | Capacity-aware, priority-aware routing on OSRM road times with fallback | Depot + 1 vehicle |
| M10 | Simulated congestion + remaining-route replan (completed stops fixed, remaining capacity preserved) | Labelled SIMULATED |
| M11 | Resolution with optional closure photo | |
| M12 | Impact ledger + "My Civic Impact" | UNIQUE, SUPPORTING, CORRECTION, RESOLUTION_BONUS |
| M13 | Hotspot lens: historical zones + baseline forecast + NOW/FORECAST toggle | Synthetic data |
| M14 | Seed + reset scripts, `.env.example`, setup docs | |
| M15 | Responsive: citizen mobile-first (375/390/430), municipal desktop-first with tablet/mobile fallback | |

## 4.2 Important If Time Permits

| ID | Feature |
|---|---|
| T1 | Hotspot week time-slider (historical playback) |
| T2 | Neighbourhood impact mini-map in "My Civic Impact" |
| T3 | Operator aggregate impact lens + contributor list (`/impact/leaderboard`, operator-only) |
| T4 | Recognition tiers (text tiers, secondary) |
| T5 | Photo EXIF location suggestion (`exifr`) |
| T6 | Reverse geocoding label via Nominatim |
| T7 | Operator merge of two events; reopen resolved event |
| T8 | Route replan ribbon morph animation polish (basic fade/draw is Must) |
| T9 | Before/after side-by-side viewer |
| T10 | Multi-language toggle (EN/HI) for citizen strings |

## 4.3 Future / Post-hackathon

Live traffic API · multi-vehicle / multi-trip VRP (e.g. OR-Tools / VROOM) · image-based clearance verification · weight estimation from images · real forecasting models (seasonality, ward-level covariates) · push/SMS notifications · ward boundaries and municipal ERP integration · fraud detection beyond hash/rate limits · offline-first PWA · citizen appeals.

## 4.4 Official PS feature dossier

### F1 — Geo-tagged waste reporting
- **User problem:** Citizens don't know how to tell the municipality *exactly where* waste is.
- **Interaction:** Photo → confirm location (current location, map pin, or EXIF suggestion if T5) → submit.
- **Backend logic:** Validate coordinates (inside configured service-area bounding box), store GeoJSON, record `locationSource`.
- **Data:** `Report.location`, `locationSource`, `locationAccuracyM?`, `addressText?`.
- **API:** `POST /api/classify`, `POST /api/reports`.
- **UI:** Full-bleed photo, then a map step with a draggable pin and "Confirm location" button. GPS is a *suggestion*, never silently trusted.
- **Prototype:** Browser Geolocation (needs HTTPS on phones) + draggable pin.
- **Limitations:** GPS ≠ where the photo was taken; no address validation; service-area box is illustrative.
- **Future:** EXIF/on-device capture metadata, ward polygons, address search.

### F2 — AI-based waste classification
- **User problem:** Citizens can't be expected to know municipal waste categories; operators need routing-relevant categories.
- **Interaction:** Category appears as a label layered on the photo with a one-line reason; tap to change.
- **Backend logic:** Vision provider adapter returns `{category, shortReason}`; server validates against the enum.
- **Data:** `aiSuggestedCategory`, `aiShortReason`, `aiStatus`, `citizenCategory`, `WasteEvent.category`.
- **API:** `POST /api/classify`.
- **UI:** §6 Report flow step 2.
- **Prototype:** Pretrained vision API (no training).
- **Limitations:** Single-photo classification; may err on mixed piles; no confidence shown.
- **Future:** Fine-tuned model, multi-photo, hazardous-material detection.

### F3 — Duplicate complaint detection
- **User problem:** The same pile is reported repeatedly, wasting trucks.
- **Interaction:** "A report already exists ~40 m away" sheet with photo → **Support existing** / **This is different**.
- **Backend logic:** `$nearSphere` prefilter → Haversine post-check → status/category/time filters.
- **Data:** `Report.role`, `Report.complaintId`, `WasteEvent.supportCount`.
- **API:** `GET /api/complaints/nearby` (auxiliary), `POST /api/reports`, `POST /api/complaints/:id/support`.
- **UI:** Bottom sheet (citizen); linked-reports gallery (operator).
- **Prototype:** Rule-based (§12).
- **Limitations:** Location/category only; no image similarity.
- **Future:** Image embeddings, learned thresholds.

### F4 — Dynamic route optimization (capacity + traffic)
- **User problem (operator):** Which stops fit in the truck, in what order, and what happens when roads clog?
- **Interaction:** Routes lens → preview → assign → simulate congestion → replan.
- **Backend logic:** Compatibility filter → knapsack selection by priority → sequencing on OSRM matrix → congestion multipliers (§14–15).
- **Data:** `Vehicle`, `Route`, `WasteEvent.estimatedWeightKg`.
- **API:** `POST /api/routes/preview`, `/assign`, `/replan`.
- **UI:** Route ribbon + stop chips + capacity bar + deferred list.
- **Prototype:** 1 depot, 1 vehicle, 1 trip; simulated congestion zones.
- **Limitations:** Weight is operator-estimated; single trip; simulated traffic; OSRM has no live traffic.
- **Future:** Multi-vehicle/multi-trip, live traffic feed, time windows.

### F5 — Predictive analytics for recurring hotspots
- **User problem:** Operators react to piles instead of anticipating recurring ones.
- **Interaction:** Forecast lens: NOW / FORECAST toggle, optional week slider.
- **Backend logic:** Grid-cell weekly counts of *unique* incidents → weighted recent-weeks baseline (§16).
- **Data:** `HistoryIncident` (synthetic), plus live `WasteEvent` for the current week display.
- **API:** `GET /api/analytics/hotspots`.
- **UI:** Soft heat zones (history) vs dashed plum rings (forecast).
- **Prototype:** Baseline forecast on ~120 synthetic incidents, hold-out MAE.
- **Limitations:** Synthetic data; no accuracy claim beyond the held-out demo.
- **Future:** Real historical data, seasonality, ward-level features.

---

# 5. COMPLETE SCREEN MAP

## 5.1 Citizen (mobile-first, bottom tab bar: **Home · Reports · ＋Report · Impact**)

| # | Screen | Route | Notes |
|---|---|---|---|
| C0 | Login / Register | `/login` | With demo buttons (non-prod) |
| C1 | Home / Overview | `/` | One dominant action |
| C2 | Report Waste (4-step flow) | `/report` | Step state in URL hash/state |
| C3 | My Reports | `/reports` | |
| C4 | Report Details | `/reports/:id` | |
| C5 | My Civic Impact | `/impact` | |

## 5.2 Municipal Operator (no sidebar; one map canvas, four lenses)

| # | Screen | Route | Notes |
|---|---|---|---|
| M0 | Login (shared) | `/login` | Same page, role decides landing |
| M1 | Live City Map + Needs Attention (default lens **NOW**) | `/ops` | |
| M2 | Waste Event Drawer | overlay on `/ops?event=:id` | Not a page |
| M3 | Collection Planner (lens **ROUTES**) | `/ops/routes` | Bottom route dock |
| M4 | Hotspot Analytics (lens **FORECAST**) | `/ops/forecast` | |
| M5 | Citizen Impact Overview (lens **IMPACT**) | `/ops/impact` | Time-permitting |
| M6 | Full Queue table view | `/ops/queue` | Keyboard/accessibility fallback and dense list |

The four lenses share one Leaflet instance, mounted once in an `OpsShell`, so switching lenses animates layers rather than reloading a page.

---

# 6. DETAILED UI/UX SPECIFICATION

## 6.0 Global patterns (apply to every screen unless overridden)

- **Loading:** skeletons shaped like the final content (photo block, list rows) with a slow contour-line shimmer; buttons show inline spinner only after 300 ms. No full-screen spinners.
- **Error:** inline banner at the top of the affected region: plain sentence + **Try again**; never raw error text or stack. Field errors sit under the field with `aria-describedby`.
- **Success:** 400 ms drawn-check animation + one plain sentence; auto-dismissing toast only for non-critical confirmations (5 s).
- **Empty:** a small contour-pattern panel, one sentence of what this will show, one action.
- **Offline / API failure:** a slim "Can't reach CivicClean. Retrying…" bar; the map remains usable with cached markers.
- **Motion:** every animation must communicate state (see §7.8). `prefers-reduced-motion` disables pulses/flow and swaps to static rings/dashes.
- **Accessibility baseline:** WCAG AA contrast; visible 2 px focus ring; ≥ 44 px touch targets on citizen screens; colour is never the only urgency signal (shape, ring count, text tier); every map has a list alternative; photos have alt text from category/description; status changes announced via `aria-live="polite"`; inputs ≥ 16 px font (prevents iOS zoom).
- **Language:** plain civic words. Citizen UI says "incident", "report", "collected"; operator UI says "waste event", "verify", "deferred". Avoid "complaint", "payload", "ML", "score" on citizen screens.

### Responsive contract (citizen)

| Width | Behaviour |
|---|---|
| **375 px** | 16 px side padding; hero photo 4:5; CTA full-width, min-height 52 px; single column; bottom tab bar 56 px + safe-area inset; map step takes viewport minus 200 px sheet |
| **390 px** | Same layout; hero photo 4:5.2; stat trio stays 3-up with 12 px gap |
| **430 px** | 20 px padding; hero taller (5:6); report cards show a 96 px thumbnail (vs 72 px); impact ring 176 px (vs 160 px) |
| **Tablet 768 px** | Content centred, max-width 640 px; Report step 3 map becomes 60 % height with sheet beside it; tab bar remains |
| **Desktop ≥ 1024 px** | Two-column: left content (max 520 px), right persistent city map (sticky). Bottom tab bar becomes a slim top text nav |

### Responsive contract (municipal)

| Width | Behaviour |
|---|---|
| **≥ 1280 px** | Full-bleed map; left rail 360 px; right drawer 440 px; route dock 220 px bottom; command bar 56 px top |
| **1024–1279 px** | Rail 320 px; drawer 400 px overlays the map |
| **768–1023 px** | Rail collapses to a bottom sheet (peek 96 px); drawer full-height 90 % sheet |
| **< 768 px** | Lens bar becomes bottom tabs; map + bottom sheet; tables become cards; planner is read-mostly (assign allowed) |

---

## 6.1 C0 — Login / Register
1. **Purpose:** Get in quickly. 2. **User:** anyone. 3. **Layout:** photo-strip header (real street photo, 30 % height) above a centred form; logo wordmark top-left. 4. **Navigation:** none. 5. **Header:** wordmark "CivicClean" + subtitle "Smart Waste Reporting and Collection Planning". 6. **Main:** email, password, name (register only). 7. **Primary CTA:** "Sign in" / "Create account". 8. **Secondary:** toggle sign in/register; demo buttons "Continue as demo citizen" / "Continue as demo operator" (hidden when `VITE_SHOW_DEMO_LOGIN=false`). 9. **Components:** text inputs, segmented toggle. 10. **Forms:** email (validated), password ≥ 8. 11. **Tables/lists:** none. 12. **Map:** none. 13. **Empty:** n/a. 14. **Loading:** button spinner. 15. **Error:** "Email or password didn't match." (never reveals which). 16. **Success:** redirect by role. 17. **Mobile:** form below photo; keyboard-safe padding. 18. **Desktop:** photo left half, form right half. 19. **Animation:** none. 20. **A11y:** labels, autocomplete attributes, show-password toggle.

## 6.2 C1 — Citizen Home / Overview
1. **Purpose:** Make "Report waste" the obvious thing; give reassurance about past reports. 2. **User:** citizen. 3. **Layout (top→bottom):** greeting row → hero block (large photograph with contour overlay, headline, primary CTA) → "Your impact" strip → "Latest update" card → "Near you" mini-map strip. 4. **Nav:** bottom tab bar. 5. **Header:** "Good morning, {firstName}" (Fraunces 28) + small avatar. 6. **Main content:**
   - **Hero:** photo is the user's most recently *resolved* contribution (after image) with caption "Cleared on 29 Sep — you helped". If none, a team-supplied street photo. Headline: **"See waste? Report it in under a minute."** (Fraunces 36/32). 
   - **Primary CTA:** **Report waste** (Moss, full width, camera glyph).
   - **Your impact strip:** three numbers — *Unique incidents* · *Resolved* · *Credits* — tap → C5.
   - **Latest update card:** newest status change: thumbnail, "Market Lane pile · Scheduled for collection", timestamp.
   - **Near you:** 160 px static-styled map with 3–5 pulses of nearby active events (no personal data), tap → expands to full map sheet.
7. **Primary CTA:** Report waste. 8. **Secondary:** View all reports; open impact. 9. **Components:** HeroPhoto, ImpactStrip, UpdateCard, MiniMap. 10. Forms: none. 11. Lists: none (1 latest). 12. **Map:** mini-map, non-interactive until tapped; pulses only. 13. **Empty (new user):** hero remains; impact strip shows "0 · 0 · 0" with sentence "Your first verified report will show here." 14. **Loading:** hero photo blur-up; strip skeleton. 15. **Error:** strip shows retry inline; CTA still works. 16. **Success:** n/a. 17. **Mobile:** as above; hero ≈ 62 % of first viewport. 18. **Desktop:** left column content, right sticky map. 19. **Animation:** subtle parallax-free hero fade-in (300 ms); pulses on mini-map. 20. **A11y:** hero image decorative-with-caption; CTA is first focusable after header.

## 6.3 C2 — Report Waste (photo-first, 4 steps)

Progress indicator: 4 thin segments at the top (Photo · Category · Location · Send). Back arrow at each step. State persists if the user backgrounds the app.

### Step 1 — Photo
Purpose: capture. Full-screen "Take photo" / "Choose from gallery" (two large buttons; uses `<input type="file" accept="image/*" capture="environment">` and a plain picker). On selection: client compresses to ≤ 1600 px long side / ≤ ~1.5 MB (canvas), shows it full-bleed, then auto-calls `POST /api/classify`.
- Loading: photo visible immediately; shimmer bar on the bottom of the photo "Looking at your photo…".
- Error: file too large/wrong type → inline message and retake option.

### Step 2 — Category (AI as a layer over the photo)
- The photo occupies the top ~55 % of the screen. Over its lower edge sits a **frosted-paper label** (opaque paper with 1 px border, *not* glassmorphism): category glyph + **"Looks like Plastic"** + one-line reason (`shortReason`, e.g. "Bottles and bags in a loose pile").
- Below: horizontal chips for the 8 categories; the AI suggestion is pre-selected and marked "Suggested". Tapping another chip is a correction (store both values).
- If `aiStatus=UNAVAILABLE`: label reads "We couldn't check this photo. Please choose a category." with **Unknown** preselected. **No fake output.**
- E-waste selection shows a small note "Needs special handling — collected separately."
- Optional description field collapsed under "Add a note".
- **CTA:** "Confirm category" → Step 3.

### Step 3 — Location (interactive map, editable)
- Map fills the screen; a fixed centre-pin with a draggable map (pan under the pin) *or* draggable marker; whichever is chosen must be identical across devices. Recommended: **pan-under-fixed-pin** (better on mobile).
- Buttons on the map: "Use my location" (asks permission; on success recentres, sets `locationSource=GPS`), "Search area" is out of scope (T6 label only).
- Helper text: "Move the pin to where the waste is. Your phone's location may not be where you took the photo."
- If EXIF GPS present (T5): chip "Photo location found — use it".
- Bottom sheet: coordinates-derived label (or Nominatim label T6), **Confirm location** CTA. Location must be inside service-area bounds else inline error "This location is outside the current service area."
- On confirm → client calls `GET /api/complaints/nearby`.

### Step 3b — Possible duplicate (conditional bottom sheet)
- Title: **"This may already be reported"**. Card(s): candidate photo (96 px), category chip, "about 40 m away · reported 2 days ago · 2 neighbours confirmed".
- Two clear choices (equal weight, not one hidden): **"Yes, that's the same one"** (→ Support) and **"No, this is a different pile"** (→ Separate).
- Explainer line: "Confirming helps the team act faster. Your report is still counted."

### Step 4 — Send
- Review card: small photo, category, location label, note. CTA **Submit report**.
- Success screen: drawn check, "Report received", event code (e.g. **WE-0012**), and a preview of impact: "Credits are added once the team verifies your report." Buttons: "Track this report" (→ C4), "Report another".
- Error: keep all input; "Couldn't send. Try again." Retries idempotent via client `requestId`.

Desktop: same steps in a 520 px left column; map is the persistent right column (Step 3 highlights it).
Accessibility: photo controls are real buttons; category chips are a radio group; location step offers a "Enter coordinates" fallback for screen-reader users; step changes announce "Step 2 of 4: Category".

## 6.4 C3 — My Reports
1. **Purpose:** See what happened to everything I submitted. 2. citizen. 3. **Layout:** segmented filter (All · Active · Resolved) → vertical list. 4. tabs. 5. Header "My reports". 6. **Main:** report rows: 72 px thumbnail, category + address label, status chip, role tag ("You reported" / "You supported"), relative time. 7. **CTA:** none (tab bar ＋). 8. Secondary: filter. 9. **Components:** ReportRow, StatusChip. 10. Forms: none. 11. **List:** sorted by latest status change. 12. Map: none. 13. **Empty:** "No reports yet. Your first one takes under a minute." + Report waste. 14. Skeleton rows. 15. Error banner + retry. 16. n/a. 17. Full-width rows. 18. Desktop shows list left and Report Details in right pane. 19. Status chip transition (crossfade 200 ms) on change. 20. Rows are links with full accessible name ("Plastic waste, Market Lane, Scheduled for collection").

## 6.5 C4 — Report Details
1. **Purpose:** Full story of one report. 2. citizen. 3. **Layout:** photo header (16:10) → status headline → timeline → "What your report did" card → location mini-map. 4. Back arrow. 5. Title: category + event code. 6. **Main:**
   - **Status headline** (Fraunces 24): "Scheduled for collection" with sub-line "Estimated: this week" *only if a route is assigned and the operator opts to show it* (default: no ETA).
   - **Timeline:** Received → Verified → Scheduled → Resolved; each with timestamp from `StatusEvent`; unreached steps outlined.
   - **What your report did:** role (Primary/Supporting), "2 neighbours also confirmed this", credit line with state: "10 credits · Verified" or "10 credits · Pending team verification".
   - **Closure:** when resolved: closure photo + operator note; before/after slider (T9).
7. CTA: none (informational); if resolved: "See your impact". 8. Secondary: "View on map". 9–11. Timeline component; supporter count (no names). 12. **Map:** 180 px static pin. 13. n/a. 14. skeleton. 15. "This report isn't available." 16. n/a. 17. single column. 18. right-pane in split. 19. Timeline step "fills" when status advances. 20. Timeline is an ordered list with status text (not colour only).

## 6.6 C5 — My Civic Impact
1. **Purpose:** Answer "What changed because of me?" 2. citizen. 3. **Layout:** headline sentence → Impact Ring + trio → "What changed" feed → (T2) neighbourhood map → (T4) recognition tier line. 4. tabs. 5. Header "My Civic Impact". 6. **Main:**
   - **Headline (Fraunces 32):** "You helped identify **4** unique waste incidents. **3** have been resolved."
   - **Civic Impact Ring:** SVG ring; outer arc = verified credits toward next recognition tier (if tiers off: arc = resolved/unique ratio); centre: big verified-credit number and "Verified credits". Beneath, one light-grey line: "+8 awaiting verification".
   - **Trio:** Unique incidents identified · Supporting contributions · Resolved incidents.
   - **What changed feed:** each row = photo thumb + sentence: "Market Lane pile — cleared on 29 Sep. 2 neighbours confirmed it." + credit chips ("+10 identified", "+5 resolved"), state chip Pending/Verified/Rejected.
   - **Neighbourhood map (T2):** your events as small dots; resolved ones become a moss check, active ones keep a pulse; caption "3 of 4 nearby piles you flagged are gone."
   - **Recognition (T4):** "Contributor · 12 credits to Steward" (text only).
7. CTA: "Report waste". 8. Secondary: "How credits work" opens a modal (plain text: credits count only after the team verifies; duplicates support, not double-count; rejected reports earn nothing). 9. Ring, StatTrio, ChangeRow. 10. none. 11. Feed list. 12. Map (T2). 13. **Empty:** ring at 0, sentence "Verified reports and resolved incidents will show up here." 14. Ring draws from 0 on load (600 ms). 15. retry banner. 16. When a credit flips to verified while the screen is open: ring arc extends smoothly, row chip crossfades. 17. Ring 160/176 px; feed cards full width. 18. Ring + trio left, feed right. 19. Ring draw; number count-up 500 ms (once). 20. Ring has text alternative: "42 verified credits, 8 pending".

## 6.7 M1 — Live City Map + Needs Attention (default lens NOW)

1. **Purpose:** Answer "What needs attention next?" 2. Operator. 3. **Layout (asymmetric):** full-bleed map; **left rail (360 px, paper panel, hairline right border)** = *Needs Attention*; **top command bar (56 px)**; floating **legend** bottom-left; **status strip** bottom-right (SIMULATED CONGESTION tag when active). 4. **Navigation:** command bar holds the lens switch **NOW · ROUTES · FORECAST · IMPACT** as a text segmented control + "Queue" link; no sidebar. 5. **Header:** wordmark left; lens switch centre; operator name + logout right; thin "reports → events → stops" ticker on the far right: `12 reports → 9 events → 7 planned stops` (real counts). 6. **Main content:**
   - **Map:** Waste Pulse markers (§7.7). Category glyph inside marker; tier ring count; dashed outline for `SUBMITTED` (unverified), solid for `VERIFIED`, filled with lagoon inner dot for `SCHEDULED`, check for `RESOLVED` (resolved hidden by default, toggle "Show resolved").
   - **Needs Attention rail:** heading "Needs attention" + count. List of ≤ 8 cards sorted by unverified-first, then priority. Each card: 56 px photo, `WE-0012 · Plastic`, tier label (text), one-line reason ("Large pile · waiting 3 days · 2 confirmations"), tiny "3 reports" badge. Hover highlights the marker; click opens drawer M2. Rail footer: "Open full queue".
   - **Filters:** two compact menus above the list: Status (Needs verification / Verified / Scheduled) and Category. No KPI card row.
7. **Primary CTA:** first card's **Review**. 8. **Secondary:** "Plan collection" (jumps to ROUTES), "Show resolved". 9. **Components:** Marker, AttentionCard, Legend, LensSwitch, TickerStrip. 10. Forms: none. 11. **List:** the rail. 12. **Map behaviour:** initial fit to events + depot; marker clustering off (≤ 12 markers); hover = tooltip with code + tier; click = drawer; map pans so selected marker sits at the centre of the un-occluded area (accounting for rail/drawer). 13. **Empty:** rail says "Nothing needs attention. New reports appear here." with the contour pattern. 14. Skeleton cards; map tiles fade in. 15. Banner "Live updates paused — reconnecting". 16. New event arrives: card slides in at top with 1 s highlight; marker pulses once "hard" (scale ring 3 s). 17. **Mobile:** rail becomes bottom sheet (peek/half/full); lens bar → bottom tabs. 18. Desktop as spec. 19. Waste pulse (2.4 s loop) only for *Critical/High*; marker drop-in on arrival. 20. Marker buttons have `aria-label` ("Critical: plastic, Market Lane, 3 reports"); rail is the screen-reader-friendly equivalent; arrow keys move between cards.

## 6.8 M2 — Waste Event Drawer
1. **Purpose:** Everything needed to decide on one event without leaving the map. 2. Operator. 3. **Layout:** right drawer 440 px (full sheet on mobile), sections in this order, sticky action footer. 4. Close (Esc, ✕); deep-linked `?event=`. 5. **Header:** code + category chip + status chip; small "Copy link". 6. **Main content (exact hierarchy):**
   1. **Photo gallery** — primary photo large (16:10), thumbnails of supporting photos (tap to swap; each captioned "Primary · by Asha K." / "Supporting").
   2. **Location** — address label/coords, mini-map pin, "Open in map" recentre.
   3. **Classification** — Final category (editable select) with line "AI suggested Plastic · citizen changed to Mixed" when they differ. E-waste shows "Special handling".
   4. **Verification form** (only when `SUBMITTED`): Severity (S1 Small / S2 Medium / S3 Large — segmented), Estimated weight (kg; numeric; helper "Operator estimate, not measured"), Sensitive site (None/School/Hospital/Market/Drain), Reject reason select.
   5. **Priority reasoning** — Tier + score and stacked breakdown bar with labelled parts: `Severity +40 · Waiting +11 · Confirmations +8 · Sensitive site +15 = 74 · Critical`, one plain sentence beneath.
   6. **Linked citizen reports** — list "3 reports": name (first name + initial), time, role, credit state; supporting photo thumb.
   7. **Estimated load & vehicle** — "≈ 250 kg · Recommended: Truck A (compatible; 1000 kg capacity)"; or "No compatible vehicle" for E-waste.
   8. **Route** — if scheduled: "Route R-003 · Stop 02 of 07".
   9. **Status history** — vertical timeline from `StatusEvent`.
   10. **Closure evidence** — when resolved: closure photo + note + timestamp; else "Add closure photo" control (visible when scheduled).
7. **Primary CTA (sticky):** context-dependent: **Verify event** (SUBMITTED) → **Add to next route** shortcut (VERIFIED) → **Mark resolved** (SCHEDULED). 8. **Secondary:** Reject, Edit, (T7) Merge/Reopen. 9. Components: Gallery, PriorityBreakdown, LinkedReports, Timeline. 10. **Forms:** as in item 4; inline validation; weight required to verify. 11. Lists: linked reports, history. 12. Map: drawer mini-map; main map dims to 60 % and highlights selection. 13. n/a. 14. Section skeletons. 15. Save error inline at the footer; form preserved. 16. On verify: breakdown bar animates in, tier chip changes, toast "Event verified. 3 contributions credited." 17. Full-height sheet, actions in sticky bottom bar. 18. Drawer slides from right 240 ms. 19. Slide; breakdown bar segment growth 300 ms. 20. Focus trapped in drawer; Esc closes; headings h2/h3; forms labelled; live region announces "Event verified".

## 6.9 M3 — Collection Planner (ROUTES lens)
1. **Purpose:** Build, assign and adapt a collection route. 2. Operator. 3. **Layout:** same map canvas; left rail switches to **Route summary**; **bottom route dock (220 px)** shows the stop sequence horizontally. 4. Lens switch. 5. **Header extras:** vehicle selector ("Truck A · 1000 kg") and **Traffic** control. 6. **Main content:**
   - **Rail (Route summary):** Vehicle name; **Capacity bar** (planned 970 kg of 1000, remaining 30 kg, segment per stop); totals: distance, travel estimate (min), base estimate, "Priority served: 7 of 9 events (all Critical)"; **Deferred (2)** list with reason chips: `E-08 · Capacity — 900 kg does not fit remaining 0 kg`, `E-09 · Incompatible — E-waste needs special vehicle`.
   - **Dock:** `Depot → Stop 01 → 02 → 03 → … → Depot`, each stop a square numbered badge (transit-sign style) with code, category glyph, load, ETA offset. Completed stops show a check and lock icon ("fixed").
   - **Map:** route ribbon (§7.9), stop badges, depot marker, congestion zones as hatched translucent circles.
   - **Buttons:** **Preview route** → **Assign route** → per-stop **Mark resolved** (opens closure mini-form) → **Replan remaining**.
   - **Traffic control (popover):** "Simulated congestion" list; **Add zone**: click map to place centre; radius slider (200–1500 m); factor select (×1.5, ×2, ×3); label "Roadworks". A permanent tag **"SIMULATED — not live traffic"** beside it.
7. **Primary CTA:** Preview → Assign → Replan (changes with state). 8. Secondary: exclude an event from planning (checkbox in stop chip), clear zones. 9. Components: CapacityBar, StopBadge, RouteRibbon, DeferredList, ZoneEditor. 10. Forms: zone editor, closure mini-form. 11. Lists: stops, deferred. 12. **Map:** auto-fit to route; hover stop highlights dock item; zones are draggable (time-permitting). 13. **Empty:** "No verified events waiting. Verify events on the map to plan a route." 14. Preview shows "Planning…" with ribbon drawing progressively. 15. "Routing service is slow — using estimated travel times" (banner, labelled ESTIMATE). 16. Replan success banner: "Replanned after congestion: 46 → 61 min. 3 stops kept, 2 reordered." 17. Rail → sheet; dock → scrollable chips; assign allowed. 18. As specified. 19. **Replan animation:** old ribbon greys to a dashed ghost (400 ms), new ribbon draws in with dash-offset (900 ms), stop badges re-number with a brief slide; zone hatching fades in. 20. Dock is an ordered list; route totals in text; keyboard access to Mark resolved.

## 6.10 M4 — Hotspot Analytics (FORECAST lens)
1. **Purpose:** See where waste recurs and where it is likely next. 2. Operator. 3. **Layout:** same map; rail switches to **Hotspot insights**; **bottom time control**. 4. Lens switch. 5. Header extras: **NOW | FORECAST** segmented toggle; disclaimer chip **"Baseline forecast on synthetic historical data."** 6. **Main content:**
   - **NOW/HISTORY view:** soft heat zones (blurred moss→ochre gradient per grid cell) from the last N weeks of unique incidents; live active events overlay as pulses.
   - **FORECAST view:** dashed plum rings sized by expected incidents next week; labels "≈ 2.4 expected". Live events fade to 35 %.
   - **Rail — Top predicted zones (5):** rank, area label, expected count, a mini 3-bar sparkline of last 3 weeks, and one line: "Weighted from last 3 weeks: 4, 3, 2".
   - **Model card (collapsible):** formula, weights, held-out week result: "Held-out week 12: MAE 0.42 vs last-week baseline 0.61" (real computed values).
   - **Time slider:** weeks 1–12 then **W13 forecast**; playing shows history evolving (T1). One small bar chart (weekly unique incidents, city-wide) is the only chart — justified because trend isn't visible on the map.
7. **Primary CTA:** toggle Now/Forecast; "Plan collection near top zone" (jump to ROUTES). 8. Secondary: play/pause slider. 9. Components: HeatLayer, ForecastRings, ZoneRow, ModelCard. 10. none. 11. Zone list. 12. Map: pan/zoom; hover ring → tooltip with numbers. 13. Empty: "Not enough history yet" (if < 4 weeks). 14. Skeleton rings. 15. Banner + retry. 16. n/a. 17. Rail → sheet; slider full-width. 18. As specified. 19. Ring "breathes" 4 s at low amplitude only in FORECAST; slider playback fades cells (300 ms). 20. Rings have text equivalents in the rail; slider is keyboard operable.

## 6.11 M5 — Citizen Impact Overview (IMPACT lens; time-permitting)
Purpose: show aggregate verified contribution. Layout: rail with **Verified contributions** (numbers: verified transactions, unique events identified, supporting confirmations, resolved through citizen reports), **Top contributors (operator-only, first name + initial, verified credits)**; map colours events by *how many citizens contributed* (ring thickness). Primary CTA: none. Empty: "No verified contributions yet." Loading/error per global. Mobile: rail sheet. A11y: list alternative.

## 6.12 M6 — Queue (table fallback)
Dense, sortable table (Code, Category, Status, Priority tier, Reports, Age, Weight, Route). Row click opens M2 drawer. Keyboard-friendly, used for screen-reader and small-screen fallback. Empty/loading/error per global.

---

# 7. VISUAL DESIGN SYSTEM — "NEO-CIVIC / LIVING CITY"

**Concept.** The city is the interface. The map is the hero on both sides; UI chrome is quiet paper laid over it, like a municipal survey sheet. Typography is editorial; colour is restrained; motion exists only where something in the world changes.

## 7.1 Colour tokens (CSS variables; light only)

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#F5F2EA` | App background |
| `--surface` | `#FFFFFF` | Panels/cards |
| `--surface-2` | `#EFEBE0` | Inset areas, skeletons |
| `--ink` | `#17231C` | Primary text |
| `--ink-2` | `#3F4F45` | Secondary text |
| `--ink-3` | `#5F6D64` | Tertiary text (≥ 4.5:1 on paper — verify) |
| `--line` | `#D9D4C7` | Hairlines |
| `--moss` | `#2E6B4E` | Primary action, verified/resolved |
| `--moss-700` | `#1F4F3A` | Hover/pressed |
| `--moss-100` | `#DCE9DF` | Tints |
| `--lagoon` | `#0E6A78` | Routes, scheduled, focus ring |
| `--lagoon-100` | `#D4ECEF` | Route tints |
| `--clay` | `#C4492F` | Critical / errors |
| `--clay-100` | `#F6DDD5` | Critical tint |
| `--ochre` | `#C48A12` | High / pending / attention |
| `--ochre-100` | `#F6E8C6` | Attention tint |
| `--plum` | `#6B4F8F` | Predicted/forecast only |
| `--plum-100` | `#E9E1F2` | Forecast tint |

Rule: **plum is reserved for prediction**, **lagoon for routes/scheduled**, **clay for urgency and failure**, **moss for good/verified**. The colour of a thing tells you its *kind* of information. Verify all text pairs at AA during polish.

## 7.2 Typography

- **Display/editorial:** *Fraunces* (variable) — page headlines, big numbers, impact sentence.
- **UI/body:** *Inter* (variable), `font-variant-numeric: tabular-nums` for numbers.
- **Codes/IDs:** system monospace stack (`ui-monospace, SFMono-Regular, Menlo, monospace`).
- Load via `@fontsource-variable/*` (self-hosted through npm) — **not** Google Fonts at runtime — so the demo works offline.

| Level | Size/Line | Font/Weight |
|---|---|---|
| Display | 36/40 (mobile 32/36) | Fraunces 600 |
| H1 | 28/34 | Fraunces 600 |
| H2 | 22/28 | Fraunces 500 |
| H3 | 18/24 | Inter 600 |
| Body | 16/24 | Inter 400 |
| Small | 14/20 | Inter 400/500 |
| Caption | 12/16 | Inter 500 (uppercase +0.04em only for map labels) |

Municipal UI uses body 14 with 12 captions; citizen UI never below 14.

## 7.3 Spacing & layout
4 px base: `4, 8, 12, 16, 24, 32, 48, 64`. Citizen page padding 16/20; section gaps 24–32. Municipal panels 16 padding, 12 inner gaps.

## 7.4 Radius, borders, shadows
- Inputs/buttons **8 px**; cards **8 px**; chips/status pills **999 px** (only these); bottom sheets/drawers **16 px** top corners; map controls 8 px. No 24 px+ "bubble" cards.
- Borders: 1 px `--line` everywhere; emphasis via 1 px `--ink` at 20 % opacity.
- Shadows (two only): `sm: 0 1px 2px rgba(23,35,28,.06)`; `panel: 0 8px 24px rgba(23,35,28,.10)` for floating panels/drawers.

## 7.5 Signature motifs (use sparingly)
- **Survey ticks:** tiny 8 px corner ticks on map-adjacent panels (like map registration marks).
- **Contour pattern:** 4 % opacity topographic SVG behind hero/empty states/skeleton shimmer.
- **Route-sign badges:** square numbered stop badges (transit signage feel).
- **Photographic storytelling:** real photos (team-shot or freely licensed, credited) in hero, event drawer, closure. No stock-illustration art.

## 7.6 Components
- **Buttons:** Primary = Moss fill, white text, 8 px radius, min-height 44 (citizen 52 for the main CTA). Secondary = white with `--line` border, ink text. Danger = clay outline; destructive confirm = clay fill. Ghost = text only. Focus ring 2 px lagoon + 2 px offset.
- **Inputs:** 44 px height, 1 px line border, 16 px text, label above, helper below; error = clay border + icon + text.
- **Status chips (icon + text, never colour alone):** Received (outline grey, dot) · Verified (moss-100, check) · Scheduled (lagoon-100, truck) · Resolved (moss solid, check) · Not accepted (clay-100, x) · Predicted (plum dashed border, ring icon).
- **Priority chips:** Critical (clay solid, "!" glyph, double ring on map) · High (ochre, single ring) · Normal (ink outline) · Low (grey outline).
- **Cards:** white surface, 1 px line, radius 8, `shadow-sm`; no card-in-card-in-card.
- **Drawer/modal:** paper surface, `shadow-panel`, 16 px top radius on sheets; scrim `rgba(23,35,28,.35)`; Esc closes; focus trap.
- **Navigation:** citizen bottom tab bar (icons + labels, active = moss underline + filled icon, centre "＋Report" as a raised moss button); municipal command bar with text lens switch (active = ink underline 2 px).

## 7.7 Map language — WASTE PULSE

| State | Marker |
|---|---|
| Unverified event | Dashed circle outline, category glyph, no fill |
| Verified (Normal/Low) | Solid circle (ink 90 %), category glyph white |
| Verified High | Solid circle + **one static ring** + ochre outer stroke |
| Verified Critical | Solid clay circle + **double ring pulsing** (2.4 s) + "!" badge |
| Scheduled | Lagoon inner dot + route badge number |
| Resolved | Moss circle + check (hidden by default) |
| Predicted hotspot | Dashed plum ring, soft plum fill 8 %, label "≈ n expected" |
| Depot | Square ink marker with "D" |
| Vehicle | Lagoon truck glyph positioned at last completed stop |
| Congestion zone | Hatched clay/ochre translucent circle + "×2" label |

Base map: light, low-contrast tiles (CARTO Positron or OSM with a desaturating CSS filter), a 6 % moss multiply tint, an illustrative **service-area outline** (hand-drawn GeoJSON, hairline dashed, captioned "Demo service area (illustrative)"), and a subtle contour overlay. Attribution always visible.

## 7.8 Motion rules
- **Pulse** = high-priority/critical only. **Ribbon flow** = route in progress. **Ring breathing** = forecast. **Draw-in** = route creation/replan. **Count-up / ring draw** = impact numbers, once.
- Durations 200–400 ms UI, ≤ 900 ms route draw, loops ≥ 2.4 s. Max 1 looping animation family per lens. All disabled under `prefers-reduced-motion`.
- Animate with CSS/SVG (`transform`, `opacity`, `stroke-dashoffset`); no animation library required.

## 7.9 Route ribbon
Three stacked polylines: **casing** (10 px, `--surface`), **body** (6 px, lagoon), **flow** (2 px white dashes animating along the line when status `IN_PROGRESS`). Completed segments render in `--moss` at 60 % opacity; ghosted previous plan = dashed grey 3 px. Stop badges anchored to the path. Direction arrows every ~300 px (small chevrons).

## 7.10 Responsive breakpoints
Tailwind screens: `xs 375` (base mobile min), `sm 430`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`. Citizen layouts are designed mobile-first; municipal layouts are designed at `xl` and collapse downward.

---

# 8. SYSTEM ARCHITECTURE

```
┌────────────────────────────── frontend (Vite + React + TS) ──────────────────────────────┐
│  Citizen app (mobile-first)        Operator app (OpsShell, one Leaflet canvas)          │
│  ── shared: API client, auth, design tokens, map layers, status/priority components ──   │
└───────────────┬───────────────────────────────────────────────────────────────────────────┘
                │ HTTPS/JSON (Bearer JWT), multipart for images
┌───────────────▼──────────────────────────── backend (Node + Express) ────────────────────┐
│ routes → controllers → services → engines (pure) → models (Mongoose)                     │
│ engines: geo, duplicates, priority, routing, traffic, forecast, impact                    │
│ adapters: vision (Gemini|Anthropic), storage (Cloudinary|local), routing (OSRM|estimate)  │
└──────┬───────────────┬────────────────┬──────────────────┬────────────────────────────────┘
       │               │                │                  │
   MongoDB Atlas   Cloudinary      Vision API          OSRM server
```

## 8.1 Key decisions
1. **Preserve the brief's stack.** Nothing in it is unreliable for a 1-day build. **Phase 0** checks the repo; if a working equivalent already exists (e.g. Express + Mongo already wired), keep it.
2. **Pure engines.** Duplicate detection, priority, routing, traffic, forecast and impact logic are pure functions (`input → output`) with unit tests and fixtures. This lets agents build them in parallel with UI and makes the demo deterministic.
3. **Adapters for anything external** (vision, storage, routing). Each has a fallback so a dead API never kills the demo.
4. **Mongoose** for schemas/validation and `2dsphere` indexes; **zod** for request validation.
5. **Polling** instead of sockets. Citizen list 15 s, operator 5 s, paused when tab hidden.
6. **Image handling:** browser compresses → `POST /api/classify` (multipart) → server validates, uploads to storage adapter, calls the vision adapter in parallel → returns `imageUrl` + `uploadToken` + classification. `POST /api/reports` references the upload by token (prevents arbitrary URLs).
7. **Maps:** Leaflet with `react-leaflet` optional; markers via `L.divIcon` (HTML + CSS animations) so pulses need no plugin.
8. **Charts:** Recharts only for the weekly-incidents bar in the Forecast lens (and sparklines may be plain SVG). Everything else is SVG/CSS.
9. **Dependencies (frontend):** react, react-dom, react-router-dom, leaflet, (react-leaflet), tailwindcss, recharts, lucide-react, @fontsource-variable/fraunces, @fontsource-variable/inter, (exifr — T5). **Backend:** express, mongoose, zod, jsonwebtoken, bcryptjs, multer, cloudinary, helmet, cors, express-rate-limit, file-type, dotenv, pino or morgan, vitest/node:test. Add nothing else without a reason.
10. **Time:** stored UTC ISO; displayed in `Asia/Kolkata`.

## 8.2 Backend service map

| Service | Responsibility |
|---|---|
| `authService` | register/login/JWT |
| `uploadService` | validate image, hash (SHA-256), store via adapter, sign upload token |
| `visionService` | classify via adapter, validate result against enum |
| `duplicateService` | nearby query + Haversine + filters |
| `reportService` | create report/event, support flow, idempotency |
| `priorityService` | compute breakdown on read/verify |
| `verificationService` | verify/reject event, cascade to impact |
| `routeService` | preview/assign/replan using `routingEngine` + `routingAdapter` |
| `closureService` | resolve, closure photo, cascade to impact |
| `impactService` | create/verify/reject/revoke transactions, aggregates |
| `analyticsService` | weekly buckets + forecast + hold-out metrics |
| `seedService` | seed/reset demo data |

## 8.3 Statuses (single source of truth)

`WasteEvent.status`: `SUBMITTED → VERIFIED → SCHEDULED → RESOLVED`; side exits `REJECTED`, `MERGED` (T7); `REOPENED → VERIFIED` (T7).
Citizen-facing labels: Received · Verified · Scheduled for collection · Resolved · Not accepted.
Allowed transitions are enforced server-side in one transition table; PATCH status with an invalid transition returns `409 INVALID_TRANSITION`.
`Route.status`: `DRAFT → ASSIGNED → IN_PROGRESS → COMPLETED | CANCELLED` (first stop resolved moves ASSIGNED → IN_PROGRESS; last stop resolved → COMPLETED).

---

# 9. DATA MODEL

**Core rule: `Report` ≠ `WasteEvent`.**
A `Report` is one citizen's immutable submission (evidence + contribution). A `WasteEvent` (API path: `/complaints`) is the operational incident the municipality acts on. Many reports → one event. Operators mutate events; nobody mutates a report's evidence (photo, AI output, citizen category, location).

Conventions: Mongo `_id` ObjectId; `createdAt/updatedAt` on all; UTC; GeoJSON `{type:"Point", coordinates:[lng, lat]}` (**lng first**); enums as uppercase strings. **R** = required, **O** = optional.

## 9.1 User
- **Purpose:** identity + role.
- **Fields:** `name` R · `email` R unique lowercase · `passwordHash` R · `role` R (`CITIZEN|OPERATOR`) · `neighbourhoodLabel` O · `isSeed` R (default false).
- **Relationships:** 1—N `Report`, 1—N `ImpactTransaction`, 1—N `StatusEvent` (as actor).
- **Indexes:** `email` unique.
- **Lifecycle:** created at register/seed; never deleted in prototype.

## 9.2 Report (citizen submission)
- **Purpose:** evidence and contribution unit.
- **Fields:** `citizenId` R → User · `complaintId` R → WasteEvent · `role` R (`PRIMARY|SUPPORTING`) · `imageUrl` R · `imagePublicId` R · `imageHash` R (SHA-256) · `location` R GeoJSON · `locationSource` R (`GPS|MAP_PIN|PHOTO_EXIF`) · `locationAccuracyM` O · `addressText` O · `aiSuggestedCategory` O (enum) · `aiShortReason` O (≤ 140 chars) · `aiStatus` R (`OK|UNAVAILABLE`) · `aiProvider` O · `citizenCategory` R (enum; what the citizen confirmed) · `categoryCorrected` R bool (`citizenCategory ≠ aiSuggestedCategory` and AI was OK) · `description` O (≤ 280) · `duplicateDecision` R (`NONE_FOUND|SUPPORT|SEPARATE`) · `state` R (`ACTIVE|REJECTED|WITHDRAWN`) · `requestId` R (client idempotency key) · `isSeed`.
- **Relationships:** N—1 WasteEvent; N—1 User; 1—N ImpactTransaction (by `reportId`).
- **Indexes:** `location` 2dsphere · `{citizenId, createdAt:-1}` · `{complaintId}` · **unique `{citizenId, complaintId}`** (one contribution per person per event) · unique `{citizenId, requestId}`.
- **Lifecycle:** created on submit; `state` becomes `REJECTED` when the event is rejected; never edited otherwise.

## 9.3 WasteEvent (Complaint)
- **Purpose:** the operational incident.
- **Fields:** `code` R unique (`WE-0001`, sequential counter) · `primaryReportId` R · `location` R (= primary report's) · `addressText` O · `category` R (final confirmed) · `aiSuggestedCategory` O (copied from primary for display) · `categoryConfirmedBy` R (`CITIZEN|OPERATOR`) · `status` R · `severity` O (1–3; required to verify) · `sensitiveSite` R (`NONE|SCHOOL|HOSPITAL|MARKET|DRAIN`, default NONE) · `estimatedWeightKg` O (required to verify; > 0, ≤ vehicle capacity × 2) · `supportCount` R (unique supporting citizens, denormalised) · `firstReportedAt` R · `lastReportedAt` R · `verifiedBy`, `verifiedAt` O · `rejectReason` O · `assignedRouteId` O · `resolvedAt`, `resolvedBy` O · `closurePhotoUrl`, `closurePublicId`, `closureNote` O · `priority` O `{score, tier, breakdown[], computedAt}` · `isSeed`.
- **Relationships:** 1—N Report; N—1 Route (via `assignedRouteId`); 1—N StatusEvent; 1—N ImpactTransaction.
- **Indexes:** `location` 2dsphere · `{status, category}` · `{assignedRouteId}` · `{code}` unique.
- **Lifecycle:** created with the first non-supporting report; `SUBMITTED → VERIFIED → SCHEDULED → RESOLVED`; can be `REJECTED`. `priority` is recomputed on read (waiting time changes) and snapshotted at verification and at route generation.

## 9.4 Vehicle (with embedded depot)
- **Purpose:** planning constraints.
- **Fields:** `name` R · `registration` O · `capacityKg` R (default 1000) · `acceptedCategories` R (array; default all except `E_WASTE`, `UNKNOWN`) · `depot` R `{name, location GeoJSON}` · `maxRouteMinutes` R (default 180) · `isActive` R · `isSeed`.
- **Relationships:** 1—N Route.
- **Lifecycle:** seeded; editable in future.

## 9.5 Route
- **Purpose:** one planned trip and its history.
- **Fields:** `vehicleId` R · `depot` R (snapshot) · `status` R · `planVersion` R int · `stops[]` R each `{eventId, seq, weightKg, priorityScore, legDistanceM, legDurationMin, legBaseDurationMin, arrivalOffsetMin, state (PENDING|DONE), completedAt}` · `deferred[]` R each `{eventId, reason (CAPACITY|INCOMPATIBLE|TIME|NO_WEIGHT|EXCLUDED), detail}` · `totals` R `{plannedLoadKg, capacityKg, remainingCapacityKg, distanceM, durationMin, baseDurationMin, priorityServed}` · `geometry` R (array of `[lat,lng]`) · `previousGeometry` O · `congestionZones[]` O each `{id, label, center{lat,lng}, radiusM, factor}` · `trafficMode` R (`NONE|SIMULATED`) · `costSource` R (`OSRM|ESTIMATE`) · `planHistory[]` O each `{version, at, reason, durationMin, stopOrder[]}` · `createdBy` R.
- **Indexes:** `{vehicleId, status}`.
- **Lifecycle:** `DRAFT` (preview) → `ASSIGNED` (events set to `SCHEDULED`) → `IN_PROGRESS` → `COMPLETED`; drafts older than 1 h are ignored/deletable; assigning a route locks its events.

## 9.6 StatusEvent
- **Purpose:** audit trail feeding both timelines.
- **Fields:** `entityType` R (`COMPLAINT|ROUTE`) · `entityId` R · `from` O · `to` R · `actorId` R · `actorRole` R · `note` O · `meta` O (e.g. `{planVersion, reason}`) · `createdAt` R.
- **Indexes:** `{entityId, createdAt}`.
- **Lifecycle:** append-only.

## 9.7 ImpactTransaction
- **Purpose:** the credit ledger. Balances are **derived**, never stored on User.
- **Fields:** `citizenId` R · `complaintId` R · `reportId` O (null for RESOLUTION_BONUS is *not* allowed — attach the citizen's report) · `type` R (`UNIQUE_REPORT|SUPPORTING_REPORT|CLASSIFICATION_CORRECTION|RESOLUTION_BONUS`) · `credits` R int ≥ 0 (snapshot of the configured value at creation) · `status` R (`PENDING|VERIFIED|REJECTED|REVOKED`) · `reason` R (human sentence shown to the citizen) · `createdAt` R · `verifiedAt` O · `closedAt` O (rejected/revoked) · `isSeed`.
- **Indexes:** `{citizenId, status}` · `{complaintId}` · **unique `{reportId, type}`** (idempotent creation).
- **Lifecycle:** §17.

## 9.8 HistoryIncident (synthetic analytics data)
- **Purpose:** small documented dataset for hotspot analytics.
- **Fields:** `date` R · `weekIndex` R (1–12) · `location` R · `cellId` R · `category` R · `source` R (`"SYNTHETIC"`).
- **Indexes:** `{weekIndex, cellId}`.
- **Lifecycle:** written only by the seed script; documented in `backend/seed/README.md` (generation rules and random seed).

## 9.9 Config (not a collection)
`backend/src/config/thresholds.js` exports all defaults; each is overridable by env and exposed read-only through `GET /api/config` so the UI can print "Threshold: 100 m (configurable)".

| Key | Default |
|---|---|
| `DUP_RADIUS_M` | 100 |
| `DUP_WINDOW_DAYS` | 7 |
| `DUP_LOOSE_CATEGORY` | true (Mixed/Unknown match any non-E-waste) |
| `SERVICE_AREA_BBOX` | around the demo depot, ~6 × 6 km |
| `PRIORITY_*` | §13 |
| `CREDITS_*` | §17 |
| `GRID_CELL_DEG` | 0.005 (~550 m) |
| `FORECAST_WEIGHTS` | [0.5, 0.3, 0.2] |
| `FALLBACK_SPEED_KMH` / `FALLBACK_DETOUR` | 22 / 1.35 |

---

# 10. API CONTRACT

**Conventions.** Base `/api`. JSON, camelCase. Auth: `Authorization: Bearer <jwt>`. Errors: `{ "error": { "code": "STRING", "message": "human sentence", "fields": { "field": "msg" } } }` with codes below. IDs are strings. `lat/lng` in bodies are numbers (`{lat, lng}`); stored GeoJSON is internal. Pagination: `?limit=20&cursor=` (only where listed). All list responses `{ items: [], nextCursor? }`.

Shared codes: `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 CONFLICT` (with a specific `code`), `413 FILE_TOO_LARGE`, `415 UNSUPPORTED_MEDIA`, `429 RATE_LIMITED`, `502 UPSTREAM_UNAVAILABLE`, `500 INTERNAL` (generic message only).

## 10.1 Auth & config

**POST /api/auth/register** · public · body `{name, email, password}` · 201 `{token, user{id,name,role}}` · errors: `409 EMAIL_TAKEN`, 400 · validation: email format, password ≥ 8 · role forced to `CITIZEN` · external: none.

**POST /api/auth/login** · public · `{email, password}` → 200 `{token, user}` · 401 `INVALID_CREDENTIALS` (generic) · rate-limit 10/min/IP.

**GET /api/config** · any auth · → `{thresholds{…}, categories[], serviceAreaBbox, tileUrl?, creditValues{…}, features{simulatedTraffic:true, forecast:"BASELINE_SYNTHETIC"}}`.

## 10.2 Reporting

**POST /api/classify** *(uploads photo + classifies)*
- **Auth:** required · **Role:** CITIZEN (operator allowed for testing).
- **Request:** `multipart/form-data` field `image` (jpeg/png/webp, ≤ 5 MB).
- **Response 200:** `{ imageUrl, imagePublicId, uploadToken, imageHash, ai: { status: "OK"|"UNAVAILABLE", category: "PLASTIC"|…, shortReason: "…", provider: "gemini" } }` — when `UNAVAILABLE`: `category:"UNKNOWN"`, `shortReason:null`. **No confidence field.** (If a provider ever returns a meaningful confidence, add it as optional `providerScore` and label it "model score" — never as "accuracy" or percentage; default UI hides it.)
- **Errors:** 413, 415, 429 (10/min/user), storage failure → 502 `UPLOAD_FAILED` (nothing is classified if nothing was stored).
- **Validation:** MIME by magic bytes, size, dimensions ≥ 200 px, image not empty.
- **External:** Cloudinary (or local), Vision API.
- **Notes:** vision failure/timeout (8 s) still returns 200 with `ai.status=UNAVAILABLE` so the citizen can proceed manually.

**GET /api/complaints/nearby** *(auxiliary; needed for the duplicate step)*
- **Auth/Role:** CITIZEN or OPERATOR.
- **Query:** `lat`, `lng`, `category`.
- **Response:** `{ candidates: [{ id, code, category, distanceM, ageHours, supportCount, photoUrl, status }], radiusM }` (max 3, sorted by distance).
- **Errors:** 400 outside service area.
- **External:** none.

**POST /api/reports**
- **Auth:** required · **Role:** CITIZEN.
- **Request:** `{ requestId, uploadToken, imageUrl, imagePublicId, imageHash, location{lat,lng}, locationSource, locationAccuracyM?, addressText?, ai{status,category?,shortReason?}, citizenCategory, description?, duplicateDecision?: "SEPARATE" }`
- **Response 201:** `{ report{…}, complaint{ id, code, status, supportCount }, role: "PRIMARY", impact: [{ type, credits, status:"PENDING" }] }`.
- **Errors:** `409 DUPLICATE_DECISION_REQUIRED` with `{ candidates[] }` (server re-checks; a client cannot skip detection — send `duplicateDecision:"SEPARATE"` to override), `409 DUPLICATE_IMAGE` (same hash already submitted by the user), `429 DAILY_LIMIT` (default 10 reports/day), 400 (bad token, outside service area, invalid category).
- **Validation:** `uploadToken` HMAC matches `{publicId, userId}` and is < 30 min old; `citizenCategory` in enum; coordinates in bbox; description ≤ 280; `requestId` idempotent (repeat returns the original 201).
- **Effects:** creates Report + WasteEvent (+ `StatusEvent SUBMITTED`) + PENDING `UNIQUE_REPORT` and, if `categoryCorrected`, PENDING `CLASSIFICATION_CORRECTION`.
- **External:** none (image already stored).

**POST /api/complaints/:id/support**
- **Auth:** required · **Role:** CITIZEN.
- **Request:** same evidence fields as `POST /api/reports` (photo required — a supporting report must add its *own* evidence) minus `duplicateDecision`.
- **Response 201:** `{ report{role:"SUPPORTING"}, complaint{ id, supportCount, status }, impact:[{type:"SUPPORTING_REPORT",credits,status:"PENDING"}] }`.
- **Errors:** `409 ALREADY_CONTRIBUTED` (own event or already supported), `409 EVENT_CLOSED` (resolved/rejected), `409 DUPLICATE_IMAGE`, `400 TOO_FAR` (> radius from the event), 429.
- **Effects:** increments `supportCount` (unique supporters), updates `lastReportedAt`, may raise priority. Credits for supporters beyond `SUPPORT_CREDIT_CAP` are created with 0 credits (§17).

**GET /api/reports/mine** · CITIZEN · query `status=active|resolved|all`, pagination · → `{ items:[{ id, role, imageUrl, category, addressText, createdAt, complaint{ id, code, status, supportCount, updatedAt }, impact{ credits, state } }] }`.

**GET /api/reports/:id** · CITIZEN (own only, else 404) · → report + complaint summary + `timeline[]` (from `StatusEvent`) + `closure{photoUrl,note,resolvedAt}?` + `impact[]`.

## 10.3 Operator: events

**GET /api/complaints** · OPERATOR · query `status`, `category`, `includeResolved=false`, `sort=attention|priority|age` · → `{ items:[{ id, code, location{lat,lng}, category, status, priority{score,tier,breakdown[]}, severity, estimatedWeightKg, reportCount, supportCount, thumbnailUrl, firstReportedAt, needsCategoryReview, assignedRouteId? }], counts{ reports, events, plannedStops } }` (the `counts` feeds the header ticker).

**GET /api/complaints/:id** · OPERATOR · → full detail: photos[], linked reports[] (`citizenDisplayName` first name + initial), category history (AI/citizen/final), priority breakdown + sentence, status history, closure, route ref, recommended vehicle.

**PATCH /api/complaints/:id** *(verification data & category)*
- **Role:** OPERATOR.
- **Request (any subset):** `{ category?, severity?, estimatedWeightKg?, sensitiveSite?, verify?: true, reject?: { reason } }`.
- **Response:** updated event with recomputed `priority` and `impactEffects[]` summary (`{verified: n, rejected: n}`).
- **Errors:** `409 INVALID_TRANSITION`, 400 (`verify` without severity/weight/category), 404.
- **Effects:** `verify` → `VERIFIED`, snapshot priority, flips PENDING impact transactions to VERIFIED per §17; category change → resolves correction transaction; `reject` → status `REJECTED`, cascades REJECTED credits and Report states.
- **Immutability:** cannot change original report fields.

**PATCH /api/complaints/:id/status**
- **Role:** OPERATOR.
- **Request:** `{ to: "RESOLVED"|"VERIFIED"(reopen, T7), note?, closurePhoto?: { imageUrl, imagePublicId, uploadToken } }`.
- **Response:** updated event; if part of a route, `{ route: { id, status, remainingStops } }`.
- **Errors:** `409 INVALID_TRANSITION`, `409 NOT_SCHEDULED`, 400.
- **Effects:** `RESOLVED` → `resolvedAt`, closure fields, marks the route stop `DONE`, may move route to `IN_PROGRESS`/`COMPLETED`, creates `RESOLUTION_BONUS`. (Scheduling is done **only** through route assignment; the status endpoint cannot set `SCHEDULED`.)

**POST /api/uploads** *(auxiliary, operator closure photo)* · OPERATOR · multipart `image` · → `{ imageUrl, imagePublicId, uploadToken }` · same validation as classify, no AI.

## 10.4 Operator: routes

**POST /api/routes/preview**
- **Role:** OPERATOR.
- **Request:** `{ vehicleId, excludeEventIds?: [], congestionZones?: [{ label, center{lat,lng}, radiusM, factor }], maxRouteMinutes? }`
- **Response 200:** `{ route{ id (DRAFT), vehicle, depot, stops[], deferred[], totals, geometry, congestionZones, trafficMode, costSource, planVersion:1 }, baseline{ naiveDurationMin, naiveDistanceM, method:"FIFO order of the same selected stops" } }`.
- **Errors:** `404 VEHICLE_NOT_FOUND`, `409 NO_ELIGIBLE_EVENTS` (with reasons), `502 ROUTING_UNAVAILABLE` only if fallback also fails (should not happen).
- **Validation:** factor in [1, 5], radius 100–3000, at most 5 zones; only `VERIFIED`, unassigned events with weight set are candidates.
- **External:** OSRM (falls back to estimate; `costSource` says which).

**POST /api/routes/:id/assign** · OPERATOR · `{}` · → `{ route(status ASSIGNED), events[{id,status:"SCHEDULED"}] }` · errors: `409 ROUTE_STALE` (an event changed since preview → re-preview), `409 ALREADY_ASSIGNED`, 404 · effects: events → `SCHEDULED`, `StatusEvent`s written.

**POST /api/routes/:id/replan**
- **Role:** OPERATOR.
- **Request:** `{ congestionZones: [...], reason?: "Simulated congestion" }` (empty array = clear congestion and re-optimise).
- **Response:** `{ route{ planVersion+1, stops[] (completed stops first, fixed), deferred[], totals, geometry, previousGeometry, congestionZones }, delta{ durationBeforeMin, durationAfterMin, reordered:[eventId], newlyDeferred:[…] } }`.
- **Errors:** `409 ROUTE_NOT_ACTIVE` (not ASSIGNED/IN_PROGRESS), 400 (zones invalid).
- **Effects:** completed stops untouched; remaining capacity = capacity − load already collected; appends `planHistory`; `StatusEvent` on the route.
- **External:** OSRM (fallback estimate).

**GET /api/routes/:id** · OPERATOR · full route. **GET /api/routes?status=ASSIGNED,IN_PROGRESS** · OPERATOR · active routes (needed to restore the planner after refresh). **GET /api/vehicles** · OPERATOR · vehicles + depot.

## 10.5 Analytics & impact

**GET /api/analytics/hotspots** · OPERATOR · query `weeks=12` · → `{ label:"Baseline forecast on synthetic historical data", gridCellDeg, weeks:[{ weekIndex, startDate, totalUnique, cells:[{cellId, center{lat,lng}, count}] }], forecast:{ weekIndex:13, method, weights, cells:[{cellId, center, expected, lastWeeks:[n,n,n]}] }, evaluation:{ heldOutWeek:12, maeModel, maeLastWeek, maeMean, note }, liveThisWeek:{ uniqueEvents } }`.
- Errors: 404 if history not seeded (`HISTORY_NOT_SEEDED`).

**GET /api/impact/me** · CITIZEN · → `{ totals{ verifiedCredits, pendingCredits, uniqueIncidents, supportingContributions, resolvedIncidents }, tier?{ name, nextAt }, feed:[{ complaintId, code, photoUrl, sentence, status, transactions:[{type,credits,status,reason}], resolvedAt? }], neighbourhood?:[{ complaintId, lat, lng, status }] }`.

**GET /api/impact/leaderboard** · **OPERATOR only** · query `limit=10` · → `{ contributors:[{ displayName (First L.), verifiedCredits, uniqueIncidents, resolved }], aggregate:{ verifiedTransactions, uniqueEventsIdentified, supportingConfirmations, resolvedThroughCitizenReports } }`.
- Deliberate: citizens have no ranking view (avoids competitive spam incentives). If a citizen calls it → `403 FORBIDDEN`.

## 10.6 Dev/demo only

**POST /api/admin/reset-demo** · OPERATOR · disabled unless `ALLOW_DEMO_RESET=true` and `NODE_ENV≠production` · → `{ ok: true, counts{…} }` · re-seeds the demo DB (§23). **POST /api/admin/simulate/...** intentionally not provided; the real endpoints are used for the demo.

## 10.7 Cross-cutting API rules
- Citizens can never set `status`, `severity`, `estimatedWeightKg`, `priority`, `assignedRouteId`, `credits` — these keys are ignored on citizen payloads (zod `strict()` rejects with 400).
- Object-level authorization: citizen reads only their reports; unknown/foreign ids → 404 (not 403).
- Every state-changing operator endpoint writes a `StatusEvent`.

---

# 11. AI / CLASSIFICATION DESIGN

**Approach.** Pretrained multimodal vision model behind a `visionAdapter` (`classify(imageBuffer, mime) → {category, shortReason}`). No model training.

**Categories (enum).** `ORGANIC, PLASTIC, PAPER, GLASS, METAL, E_WASTE, MIXED, UNKNOWN`. UI labels: Organic, Plastic, Paper, Glass, Metal, E-waste, Mixed, Unknown.

**Prompt contract (spec, not code).** System instruction: you classify a photo of roadside waste for a municipal service; choose exactly one category from the list; if the photo does not clearly show waste or is unusable choose `UNKNOWN`; if multiple materials are visibly mixed choose `MIXED` (unless one is clearly dominant); `shortReason` is one plain sentence ≤ 140 characters describing what is visible; return JSON only. Use the provider's structured-output / JSON-schema mode where available. Server validates: category ∈ enum, `shortReason` string ≤ 140 (truncate), else treat as `UNAVAILABLE`.

**What is stored.** On `Report`: `aiSuggestedCategory`, `aiShortReason`, `aiStatus`, `aiProvider`, and separately `citizenCategory` + `categoryCorrected`. On `WasteEvent`: `category` (final), `categoryConfirmedBy` (`CITIZEN` initially; `OPERATOR` after the operator confirms/edits), `aiSuggestedCategory` from the primary report.

**Confidence.** Not shown. Most hosted LLM vision APIs return no calibrated per-class probability; showing a made-up percentage is disallowed. If a provider returns a real score, expose only as optional `providerScore`, hide by default, never label it "accuracy".

**Who can correct.** Citizen at report time (Step 2). Operator at verification (drawer §3 field). Operator edits never rewrite the report's stored fields; they change `WasteEvent.category` and set `categoryConfirmedBy=OPERATOR`.

**E-waste handling.** Distinct chip with "Special handling"; excluded from the default vehicle's `acceptedCategories` → appears in *Deferred* as `INCOMPATIBLE`; duplicate matching for E-waste is exact-category only; never merged with Mixed.

**Failure behaviour.** Timeout 8 s, one retry; then `aiStatus=UNAVAILABLE`, `UNKNOWN` preselected, citizen must choose. `CLASSIFICATION_CORRECTION` credit is only possible when `aiStatus=OK`.

**Prototype/demo safety.** Test the *exact demo photos* against the provider the night before and keep 2 backup photos. Do not hard-code outputs for the live demo path.

**Limitations to state honestly (PPT footnote):** single-image, prompt-based classification; not a certified waste-audit tool.

---

# 12. DUPLICATE DETECTION DESIGN

**Goal.** Reduce operational duplicates without deleting citizen contribution, and without blind merging.

**Criteria (all configurable in `thresholds.js`).**
1. Candidate event status ∈ {`SUBMITTED`, `VERIFIED`, `SCHEDULED`} (unresolved).
2. Distance ≤ `DUP_RADIUS_M` (100 m) by **Haversine** on the stored coordinates.
3. Category compatible: exact match, or (if `DUP_LOOSE_CATEGORY`) either side is `MIXED`/`UNKNOWN` — never for `E_WASTE`.
4. `firstReportedAt` within `DUP_WINDOW_DAYS` (7 d) of now — beyond that, a persistent pile is treated as a new report to the operator anyway; operators can merge (T7).

**Query strategy.** Mongo `$nearSphere` on the event 2dsphere index with `maxDistance = DUP_RADIUS_M` as prefilter; then compute Haversine in JS to display `distanceM` and enforce the exact threshold; then filters 1, 3, 4. Return max 3 ranked by distance.

**When it runs.** (a) Client: after location confirm, `GET /api/complaints/nearby` shows the choice sheet. (b) Server: `POST /api/reports` re-runs it and returns `409 DUPLICATE_DECISION_REQUIRED` unless `duplicateDecision:"SEPARATE"` is supplied — so the check cannot be bypassed by skipping the client step.

**Outcomes.**
- **Support existing:** citizen submits their own photo to `POST /api/complaints/:id/support` → `Report(role=SUPPORTING)`, `supportCount` +1 (unique citizens), `lastReportedAt` updated, PENDING `SUPPORTING_REPORT` credit, priority may rise (capped, §13).
- **Separate incident:** new `WasteEvent`; the report is `PRIMARY` with `duplicateDecision=SEPARATE`. Operators see a badge "Reporter marked as separate — 62 m from WE-0007" to review.
- **None found:** normal primary flow.

**Consolidation preserved.** Event gallery shows all photos; linked-reports list shows each citizen contribution; impact per report is retained.

**Anti-abuse.** Unique `{citizenId, complaintId}`; SHA-256 image hash rejects re-uploading the same photo; a supporter must be within radius of the event; daily report cap; support credit cap per event (§17); support count for priority counts *unique citizens* and is capped.

**Operator merge (T7).** Move reports of event B to A, recompute `supportCount`, set B `MERGED`, re-point transactions. Guard: both unresolved; A not `SCHEDULED` unless B also unscheduled.

**Limitations.** No image similarity; GPS/pin error can defeat the radius; thresholds not validated.

---

# 13. PRIORITY ENGINE

**Principle.** Explainable additive points, max 100. Never a black box. Only *verified* events get routed, so severity is operator-verified.

| Component | Points | Rule |
|---|---|---|
| **Severity** | 10 / 25 / 40 | S1 / S2 / S3 (operator-verified) |
| **Waiting time** | 0–25 | `25 × min(hoursSinceFirstReport / (24 × WAIT_FULL_DAYS), 1)`, `WAIT_FULL_DAYS = 7` |
| **Community confirmation** | 0–20 | `4 × min(uniqueSupportingCitizens, 5)` |
| **Sensitive site** | 0 or 15 | Operator flags school / hospital / market / drain; a *policy choice*, labelled configurable |

Tiers (configurable): **Critical ≥ 70**, **High 50–69**, **Normal 30–49**, **Low < 30**.

**Output.** `{ score, tier, breakdown:[{key,label,points,detail}] , sentence }`. Example sentence: "Critical because it is a large pile (+40), has been waiting 3 days (+11), 2 neighbours confirmed it (+8) and it is near a school (+15)."

**Spam resistance.** Community points count unique citizens and cap at 5; own-event support blocked; same-image reuse blocked; supporters must be nearby.

**When computed.** On verify and on every read (waiting time drifts); snapshotted at verification and at route generation (the value the planner used is stored on the stop).

**Unverified events.** Show provisional tier "Needs verification" (no score) in the rail; excluded from planning.

**Limitations.** Weights are illustrative; sensitive-site list is operator judgement. State this in the drawer's "How this is calculated" popover.

---

# 14. ROUTE OPTIMIZATION DESIGN

**Name to use everywhere:** *priority-aware, capacity-constrained route planning.* Do **not** say "optimal route" unless the guarantee below holds (see "Guarantees").

## 14.1 Inputs
Depot (vehicle.depot), vehicle (`capacityKg`, `acceptedCategories`, `maxRouteMinutes`), candidate events (`status=VERIFIED`, unassigned), each with `estimatedWeightKg` (operator estimate), `priority.score`, `category`, coordinates; a travel-time matrix; optional congestion zones.

## 14.2 Steps
1. **Eligibility filter.** Exclude events with: incompatible category → deferred `INCOMPATIBLE`; missing weight → `NO_WEIGHT`; operator-excluded → `EXCLUDED`.
2. **Travel-time matrix.** `GET {OSRM}/table/v1/driving/…?annotations=duration,distance` over depot + eligible stops (≤ 13 nodes ⇒ one call). If OSRM fails or times out (6 s): fallback matrix = `haversine × FALLBACK_DETOUR / FALLBACK_SPEED_KMH`; mark `costSource=ESTIMATE` and show it in the UI. Cache matrices by coordinate hash in memory.
3. **Congestion adjustment.** See §15 (applied to the matrix before optimisation).
4. **Selection (which stops fit).** Solve a **0/1 knapsack** over eligible events: maximise Σ `priority.score` subject to Σ `weightKg ≤ capacityKg`. Weights are discretised to 10 kg for the DP; exact for the discretised problem. Ties → lower total weight, then earlier `firstReportedAt`.
5. **Sequencing (visit order).** Objective: minimise `travelTime + α · Σ (arrivalTime_i × priorityWeight_i)` where `priorityWeight_i = score_i / 100` and `α = 0.15` (configurable) so higher-priority stops are visited earlier when it costs little extra travel. For ≤ 8 stops: exhaustive permutations (≤ 40,320) on the matrix. For > 8: nearest-neighbour + 2-opt.
6. **Time limit.** If total duration > `maxRouteMinutes`, drop the lowest priority-per-minute stop and re-solve; dropped events → deferred `TIME`.
7. **Deferred capacity leftovers.** Events that failed the knapsack are deferred `CAPACITY` with `detail` such as "900 kg does not fit remaining 30 kg".
8. **Route geometry.** `GET {OSRM}/route/v1/driving/…?overview=full&geometries=geojson` for the ordered waypoints (depot → stops → depot). Convert `[lng,lat]` to `[lat,lng]` for Leaflet. Fallback: straight lines, flagged "estimated path".
9. **Totals.** `plannedLoadKg`, `remainingCapacityKg`, `distanceM`, `durationMin`, `baseDurationMin` (no congestion), `priorityServed`.
10. **Baseline (for metrics).** Same selected stops in FIFO order (`firstReportedAt` ascending) on the same matrix → `naiveDurationMin`; `improvement = (naive − optimised) / naive` displayed only as a computed value.

## 14.3 Guarantees and wording
- Selection is exact **for the priority-sum objective under discretised weights**.
- Sequencing is **exact for ≤ 8 stops** on the given cost matrix; heuristic beyond.
- The result is **not** a proof of global optimality on real roads: the matrix is an approximation, weights are estimates, and the demo is single-vehicle single-trip.
- Approved PPT phrasing: "capacity-aware, priority-aware route planning using road-network travel times."

## 14.4 Demo shaping
7 compatible events ≈ 970 kg (≤ 1000 kg) → all fit; 1 heavy event (900 kg) deferred `CAPACITY`; 1 E-waste event deferred `INCOMPATIBLE`. The route must visibly show "planned 970 / 1000 kg".

---

# 15. TRAFFIC REPLANNING DESIGN

**Honest scope.** Congestion is **simulated**. The UI shows a persistent tag "SIMULATED — not live traffic" whenever zones exist; the PPT calls it "simulated congestion scenario".

**Representation.** A `congestionZone` is a circle `{center{lat,lng}, radiusM, factor}` (factor ∈ {1.5, 2, 3}). Stored on the route (`congestionZones[]`) and sent in preview/replan requests.

**How it changes cost.**
- `time = baseTime × congestionFactor` where the factor applies to a leg when the leg's path intersects a zone.
- **Matrix stage (for optimisation):** approximate each pair's path by the straight segment; if it intersects a zone circle, multiply that pair's duration by the (largest applicable) factor. Documented as an approximation.
- **Geometry stage (for reporting):** after ordering, fetch actual OSRM leg geometries; recompute each leg's duration = base × factor if any geometry vertex lies within a zone. These are the numbers shown to the operator (`legDurationMin` vs `legBaseDurationMin`).
- If a leg passes multiple zones use the max factor (not the product).

**Replan of the remaining route.**
1. Route must be `ASSIGNED` or `IN_PROGRESS`.
2. **Completed stops are fixed** (`state=DONE`), preserved in order at the start of `stops[]`.
3. **Vehicle position** = last completed stop, else depot.
4. **Remaining capacity** = `capacityKg − Σ weight of DONE stops` (the vehicle has already loaded them). The knapsack runs over *remaining PENDING stops only* (no new events are pulled in; deferred events stay deferred unless the operator re-previews), so previously-committed stops are re-sequenced and, only if the time limit is now violated, the lowest priority-per-minute pending stop is dropped and deferred `TIME`.
5. Recompute the matrix from the vehicle position with congestion applied; resequence pending stops; end at the depot.
6. `planVersion++`; store `previousGeometry`; append `planHistory`; write a `StatusEvent`.
7. Response includes `delta` (before/after minutes, reordered ids, newly deferred).

**UI.** Old ribbon → dashed ghost; new ribbon draws in; banner "Replanned after congestion: 46 → 61 min. 2 stops reordered."

**Future (optional, clearly marked).** Live traffic API (Google Routes traffic-aware, HERE, TomTom, Mapbox) — requires keys and cost review; not part of the prototype.

---

# 16. HOTSPOT FORECASTING DESIGN

**Principle.** Historical heatmap ≠ prediction. We show both, clearly distinct.

**Data.** ~120 `HistoryIncident` rows over 12 weeks generated deterministically (fixed random seed) around 4–5 cluster centres near the depot with a mild weekly pattern and noise; each row is a *unique incident* (not a duplicate submission). Documented in `backend/seed/README.md`. Counts of live events are shown separately as "this week so far".

**Grid.** Cells of `GRID_CELL_DEG = 0.005°` (~550 m): `cellId = floor(lat/g) + ":" + floor(lng/g)`. Weekly count `n[c, w]`.

**Baseline forecast.** For week `t+1`:

```
expected[c] = 0.5 · n[c, t] + 0.3 · n[c, t−1] + 0.2 · n[c, t−2]
```

(weights configurable; recent weeks weigh more). Cells with `expected ≥ 1.5` are drawn as predicted zones; top 5 listed with the three underlying counts.

**Evaluation (real, on the synthetic set).** Train on weeks 1–11 to predict week 12; compare to actual. Report `MAE_model`, `MAE_lastWeek` (naive: predict `n[c, 11]`), `MAE_mean` (mean of weeks 1–11). Display as "Held-out week 12 on synthetic data: model MAE x, last-week baseline y." No accuracy percentage; no real-world claim.

**Current-week handling.** The in-progress week (live events) is shown as "This week so far: N unique events" and excluded from the forecast until complete.

**UI.** History = soft blended zones (moss→ochre); Forecast = dashed plum rings, label "≈ 2.4 expected", disclaimer chip. Time slider (T1) steps through weeks; the final step is the forecast. One small bar chart of weekly unique incidents.

**Limitations.** Synthetic data; no seasonality/weather/population; cell boundaries arbitrary. **Future:** real ward data, seasonal models, spatial smoothing (kernel density), Poisson regression.

---

# 17. CIVIC IMPACT CREDIT ENGINE

**Principle.** Recognise verified outcomes, not activity.

## 17.1 Configurable credit values (defaults)

| Type | Recipient | Credits |
|---|---|---|
| `UNIQUE_REPORT` | Primary reporter | 10 |
| `SUPPORTING_REPORT` | Supporting citizen | 3 (only the first `SUPPORT_CREDIT_CAP = 3` supporters per event; later supporters get a 0-credit transaction with reason "Event already well-confirmed") |
| `CLASSIFICATION_CORRECTION` | Citizen whose correction the operator confirms | 4 |
| `RESOLUTION_BONUS` | Primary reporter | 5 |
| `RESOLUTION_BONUS` | Verified supporters (counted supporters only) | 2 |

Values are prototype defaults, shown in the "How credits work" modal as configurable.

## 17.2 Transaction state machine
`PENDING → VERIFIED` · `PENDING → REJECTED` · `VERIFIED → REVOKED`. Only `VERIFIED` credits count toward totals. `PENDING` credits are displayed separately ("+8 awaiting verification").

## 17.3 When transactions are created / verified / rejected / revoked

| Trigger | Effect |
|---|---|
| Primary report submitted | Create `UNIQUE_REPORT` **PENDING** (idempotent via unique `{reportId,type}`). If `categoryCorrected` and AI was OK: also `CLASSIFICATION_CORRECTION` **PENDING** |
| Supporting report submitted | Create `SUPPORTING_REPORT` **PENDING** (0 credits if beyond cap) |
| Operator **verifies** event | `UNIQUE_REPORT` and all `SUPPORTING_REPORT` for that event → **VERIFIED** (`verifiedAt`). Correction: if final category **equals** the citizen's corrected category → **VERIFIED**; if operator picks a different category → **REJECTED** ("Category corrected by team differently") |
| Supporting report attached to an event that is **already VERIFIED/SCHEDULED** | `SUPPORTING_REPORT` is created directly as **VERIFIED**: the event itself is already operator-verified and the report passed proximity, uniqueness and image-hash checks. Subject to the per-event support cap. An operator can later revoke it (future "Mark invalid" action on a linked report) |
| Operator **rejects** event | All PENDING transactions on that event → **REJECTED**; Reports `state=REJECTED`; status "Not accepted" with reason |
| Event **resolved** | Create `RESOLUTION_BONUS` for primary and for supporters whose `SUPPORTING_REPORT` is VERIFIED with credits > 0; status **VERIFIED** immediately |
| Event **reopened** (T7) or resolution found invalid | `RESOLUTION_BONUS` → **REVOKED** |
| Operator marks a supporting report invalid (future UI) | that transaction → **REVOKED** (API scaffold optional) |

**Never rewarded:** rejected/invalid reports; second contribution by the same person to the same event; own-event support; re-uploaded photo.

## 17.4 Spam prevention (summary of hard rules)
Unique `{citizenId, complaintId}`; SHA-256 image hash; daily report cap (10); support must be within radius; support credits capped per event; priority counts unique supporters and caps at 5; nothing pays for volume; credits only count after operator verification; rate limits on write endpoints.

## 17.5 What the citizen sees
- **Home strip:** verified credits, unique incidents, resolved.
- **My Civic Impact:** ring, trio, "What changed" feed with per-transaction chips and reasons, optional neighbourhood map, text tier.
- **Report Details:** the credit line for that report with state.
- Copy example: "You helped identify **4** unique waste incidents. **3** have been resolved."

## 17.6 What operators see
- Event drawer: per-report credit state (so verification is transparent).
- **IMPACT lens (T3):** aggregate `verifiedTransactions`, `uniqueEventsIdentified`, `supportingConfirmations`, `resolvedThroughCitizenReports`; contributor list (First L., verified credits) — *operator-only*.

## 17.7 Recognition tiers (secondary, T4)
Text only: Observer (0), Contributor (20), Steward (50) verified credits (configurable). No public ranking, no cartoon badges; the tier is a single line under the ring.

## 17.8 Derived stats (definitions)
- `uniqueIncidents` = distinct events where the user has a VERIFIED `UNIQUE_REPORT`.
- `supportingContributions` = count of user's VERIFIED `SUPPORTING_REPORT`.
- `resolvedIncidents` = distinct events (primary *or* supporting, verified) now `RESOLVED`.
- `verifiedCredits` = Σ credits where `status=VERIFIED`; `pendingCredits` = Σ where `PENDING`.

---

# 18. RESOLUTION / CLOSURE FLOW

1. Operator opens a stop (dock or drawer) → **Mark resolved**.
2. Mini-form: optional closure photo (via `POST /api/uploads`), optional note.
3. `PATCH /api/complaints/:id/status {to:"RESOLVED", closurePhoto?, note?}`.
4. Server: validates `SCHEDULED`; sets `resolvedAt`, `resolvedBy`, closure fields; route stop → `DONE`, route `IN_PROGRESS`/`COMPLETED`; `StatusEvent`; `RESOLUTION_BONUS` transactions (VERIFIED); vehicle marker moves to the stop.
5. Citizen (polling) sees: status **Resolved**, closure photo if provided, timeline step filled, ring/feed update.
6. **Verification claims.** The prototype records *operator-confirmed* resolution with optional photo evidence. It does **not** analyse before/after images. If T9 is built, it is a side-by-side viewer only. If someone later adds image comparison, it must be specified and labelled separately in the PPT.
7. Resolution time metric = `resolvedAt − firstReportedAt`.

---

# 19. EXTERNAL API / SERVICE INVENTORY

> Verify current model ids, free-tier limits, pricing and terms of use on each provider's site at setup time. I have deliberately not hard-coded them.

## 19.1 Vision model (AI classification)
- **SERVICE:** Google Gemini API (default). Swappable via `VISION_PROVIDER` (`gemini` | `anthropic`).
- **PURPOSE:** classify a waste photo into the category enum + one-sentence reason.
- **USED BY:** `backend/src/adapters/vision/*` ← `visionService` ← `POST /api/classify`.
- **WHY IT IS NEEDED:** PS requires AI-based classification; training a model is out of scope.
- **API KEY REQUIRED:** Yes.
- **ENV VARIABLE:** `VISION_PROVIDER`, `VISION_MODEL` (a current fast, vision-capable model id), `GEMINI_API_KEY` (or `ANTHROPIC_API_KEY` for the alternate adapter).
- **EXPECTED REQUEST:** HTTPS POST to the provider's generate-content endpoint with the API key in a header (never in the browser); body = one inline image part (base64 + mime type) + the classification instruction; JSON response mode with a schema `{category: enum, shortReason: string}`. Timeout 8 s, one retry.
- **EXPECTED RESPONSE:** model text containing JSON `{ "category": "PLASTIC", "shortReason": "…" }`; adapter parses and validates.
- **FREE/PAID CONSIDERATION:** free tier usually exists but is rate-limited; keep photos ≤ 1600 px to reduce tokens; cap `/classify` at 10/min/user.
- **FALLBACK:** return `ai.status="UNAVAILABLE"`, category `UNKNOWN`; user picks manually. Optional second provider if both keys are configured.
- **FAILURE BEHAVIOUR:** never 5xx the citizen for an AI failure; UI states "We couldn't check this photo".
- **SETUP STEPS:** create key in the provider console → paste into `backend/.env` → run `npm run check:vision` (a script that classifies `backend/seed/photos/sample.jpg` and prints category) → test each demo photo.

## 19.2 Image storage
- **SERVICE:** Cloudinary (default) with **local-disk fallback** (`STORAGE_DRIVER=local`).
- **PURPOSE:** store report/closure photos, deliver resized images.
- **USED BY:** `uploadService`, `seedService`.
- **WHY:** persistent, CDN-served images that work from any phone; avoids storing blobs in Mongo.
- **API KEY REQUIRED:** Yes (cloud name, API key, API secret). Secret stays on the backend only.
- **ENV VARIABLE:** `STORAGE_DRIVER`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER` (default `civicclean`).
- **EXPECTED REQUEST:** server-side SDK upload (stream) of the validated buffer to folder `civicclean/<env>/reports|closures`.
- **EXPECTED RESPONSE:** `secure_url`, `public_id`; store both. Delivery URLs use automatic format/quality and width transforms (e.g. 800 px) for lists.
- **FREE/PAID:** free tier adequate for the demo.
- **FALLBACK:** `local` driver writes to `backend/uploads/` (gitignored) and serves `/uploads/*`.
- **FAILURE BEHAVIOUR:** `502 UPLOAD_FAILED`; report not created; UI keeps the photo and offers retry.
- **SETUP:** create Cloudinary account → copy credentials → `.env`. Seed script uploads `backend/seed/photos/*` (or copies them locally).

## 19.3 Road routing
- **SERVICE:** OSRM-compatible routing server. Default: the public OSRM demo server; alternative: any self-hosted or hosted OSRM.
- **PURPOSE:** travel-time/distance matrix and route geometry.
- **USED BY:** `routingAdapter` ← `routeService`.
- **WHY:** capacity/priority planning needs road travel times, not straight lines.
- **API KEY REQUIRED:** No (demo server). Hosted/self-hosted may require its own auth.
- **ENV VARIABLE:** `OSRM_BASE_URL` (default public demo host), `OSRM_TIMEOUT_MS` (6000), `OSRM_PROFILE` (`driving`).
- **EXPECTED REQUEST:** `GET {base}/table/v1/driving/{lng,lat;lng,lat;…}?annotations=duration,distance` and `GET {base}/route/v1/driving/{coords}?overview=full&geometries=geojson`. **Coordinate order is lng,lat.**
- **EXPECTED RESPONSE:** `durations[][]` (s), `distances[][]` (m); route `geometry.coordinates` `[[lng,lat],…]`, `legs[]`.
- **FREE/PAID:** the public demo server is for light/demo use only with no uptime guarantee; check its usage policy. It has no live traffic.
- **FALLBACK:** haversine × `FALLBACK_DETOUR` ÷ `FALLBACK_SPEED_KMH`, straight-line geometry, `costSource=ESTIMATE` shown in UI.
- **FAILURE BEHAVIOUR:** planner still returns a route; banner "Using estimated travel times".
- **SETUP:** nothing for the default. **Demo hardening:** cache the last successful matrix/geometry for the seed scenario in memory so a flaky network does not change the rehearsed result.

## 19.4 Map tiles
- **SERVICE:** CARTO "Positron" (light) raster tiles built on OpenStreetMap data (default); OpenStreetMap standard tiles with a CSS desaturation filter as fallback.
- **PURPOSE:** base map.
- **USED BY:** frontend Leaflet `TileLayer`.
- **WHY:** light, low-contrast basemap suits the visual system; no API key.
- **API KEY REQUIRED:** No.
- **ENV VARIABLE:** `VITE_TILE_URL`, `VITE_TILE_ATTRIBUTION`.
- **EXPECTED REQUEST:** `{z}/{x}/{y}` image tiles; attribution "© OpenStreetMap contributors © CARTO" must remain visible.
- **FREE/PAID:** free for light use under the provider's terms — **read the terms** (commercial use and volume limits differ). OSM's tile policy forbids heavy use.
- **FALLBACK:** switch env to the alternate tile URL; if tiles fail entirely the app keeps working over the paper-coloured contour background with markers/routes still visible.
- **FAILURE BEHAVIOUR:** tile errors are silent; no user-facing error.
- **SETUP:** none.

## 19.5 Database
- **SERVICE:** MongoDB (Atlas free cluster or local `mongod`).
- **PURPOSE:** persistence, 2dsphere geo queries.
- **USED BY:** all backend services.
- **WHY:** brief's preferred store; geospatial indexes.
- **API KEY REQUIRED:** connection string with credentials.
- **ENV VARIABLE:** `MONGODB_URI`, `MONGODB_DB` (default `civicclean_demo`).
- **EXPECTED REQUEST/RESPONSE:** standard driver via Mongoose.
- **FREE/PAID:** free tier sufficient.
- **FALLBACK:** local MongoDB (`mongodb://127.0.0.1:27017/civicclean_demo`).
- **FAILURE BEHAVIOUR:** `/api/health` returns 503; UI shows the global "Can't reach CivicClean" bar.
- **SETUP:** create cluster → database user → network access rule allowing your hosts (for a time-boxed demo allowing all IPs is easy but should be reverted) → copy URI. Seed with `npm run seed`.

## 19.6 Geocoding (optional, T6)
- **SERVICE:** Nominatim reverse geocoding (OpenStreetMap).
- **PURPOSE:** human-readable location label from coordinates.
- **USED BY:** backend proxy `GET /api/geo/reverse` (optional) to keep a proper User-Agent and rate limit.
- **API KEY:** none; **must** send an identifying User-Agent, ≤ 1 request/second.
- **ENV VARIABLE:** `GEOCODER_URL`, `GEOCODER_UA`.
- **REQUEST/RESPONSE:** `GET /reverse?format=jsonv2&lat=&lon=` → `display_name`.
- **FREE/PAID:** free but strictly rate-limited; not for bulk.
- **FALLBACK:** show `19.2071, 72.8760`-style coordinates or a user-typed landmark.
- **FAILURE:** label silently omitted.
- **SETUP:** none.

## 19.7 Authentication
- **SERVICE:** none external. First-party email/password + JWT (bcrypt hashes).
- **ENV:** `JWT_SECRET`, `JWT_EXPIRES_IN` (24h).
- **FALLBACK/FAILURE:** n/a. Firebase/Auth0/Google Sign-In are future options, not needed for the prototype.

## 19.8 Fonts and icons
- **SERVICE:** none at runtime. Fonts self-hosted through `@fontsource-variable/fraunces` and `@fontsource-variable/inter`; icons via `lucide-react` (bundled).
- **WHY:** demo works without a Google Fonts CDN call.

## 19.9 Hosting (optional but recommended for phone testing)
- **SERVICE:** static host for `frontend/` (Vercel/Netlify) + Node host for `backend/` (Render/Railway or similar).
- **WHY:** phones need **HTTPS** for the Geolocation API; a deployed URL (or an HTTPS tunnel to your laptop) avoids LAN-http failures.
- **ENV:** set the same variables in the host dashboards; frontend `VITE_API_BASE_URL` → backend URL; backend `CORS_ORIGINS` → frontend URL.
- **FAILURE:** free instances may sleep → warm up 5 minutes before the demo. Keep a local run as the fallback.

## 19.10 Environment, Git and secrets

**Root `.gitignore` (minimum):** `node_modules/`, `.env`, `.env.*` (except `.env.example`), `dist/`, `build/`, `coverage/`, `backend/uploads/`, `*.log`, `.DS_Store`, editor folders, `.vercel/`.

**`backend/.env.example`** (commit; **no secrets**):
```
PORT=4000
NODE_ENV=development
MONGODB_URI=
MONGODB_DB=civicclean_demo
JWT_SECRET=change-me
JWT_EXPIRES_IN=24h
UPLOAD_TOKEN_SECRET=change-me-too
CORS_ORIGINS=http://localhost:5173
STORAGE_DRIVER=cloudinary   # cloudinary | local
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=civicclean
VISION_PROVIDER=gemini      # gemini | anthropic
VISION_MODEL=
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
OSRM_BASE_URL=https://router.project-osrm.org
OSRM_TIMEOUT_MS=6000
ALLOW_DEMO_RESET=true       # never true in production
DUP_RADIUS_M=100
DUP_WINDOW_DAYS=7
```
**`frontend/.env.example`:**
```
VITE_API_BASE_URL=http://localhost:4000/api
VITE_TILE_URL=https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png
VITE_TILE_ATTRIBUTION=© OpenStreetMap contributors © CARTO
VITE_SHOW_DEMO_LOGIN=true
VITE_USE_MOCKS=false
```

**Rules:** no keys in Git, chats, or screenshots; only `.env.example` is committed; every teammate creates their own `.env`; if a secret leaks, rotate it. A boot-time check in the backend fails fast with a readable message if required variables are missing.

**Setup instructions (put in root `README.md`):**
1. `git clone` → `cd TCETHACKAthon`.
2. Backend: `cd backend && cp .env.example .env` → fill `MONGODB_URI`, secrets, keys → `npm install` → `npm run seed` → `npm run dev`.
3. Frontend: `cd frontend && cp .env.example .env` → `npm install` → `npm run dev`.
4. Health check: open `http://localhost:4000/api/health`.
5. Demo logins (seed): operator `operator@civicclean.demo`, citizens `asha@civicclean.demo`, `ravi@civicclean.demo` (password documented in README, demo-only).
6. Reset: `npm run demo:reset` (backend) or the operator-only reset endpoint when allowed.
Use relative paths only in docs and scripts; no machine-specific paths.

**Scripts (backend):** `dev`, `start`, `seed`, `seed:history`, `demo:reset`, `check:vision`, `test`. **Scripts (frontend):** `dev`, `build`, `preview`, `lint`, `typecheck`.

---

# 20. REPOSITORY / FOLDER STRUCTURE

Respecting the decided layout `TCETHACKAthon/{frontend,backend}`; root only adds non-code files (`README.md`, `.gitignore`, `docs/`).

```
TCETHACKAthon/
├── README.md
├── .gitignore
├── docs/
│   ├── blueprint.md              # this document
│   ├── api-contract.md           # request/response examples (copied from §10)
│   ├── demo-script.md            # exact clicks, coordinates, timings
│   └── fixtures/                 # JSON examples used by frontend mocks
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── seed/
│   │   ├── README.md             # what the synthetic data is and how it's generated
│   │   ├── photos/               # ≤ ~15 small compressed demo photos (team-shot or licensed)
│   │   ├── demo.data.js          # depot, vehicle, users, events, resolved events
│   │   └── history.generator.js  # deterministic synthetic incidents (fixed seed)
│   ├── scripts/                  # seed.js, resetDemo.js, checkVision.js
│   ├── src/
│   │   ├── server.js             # boot only
│   │   ├── app.js                # express app, middleware, route mounting  [PROTECTED]
│   │   ├── config/               # env.js, thresholds.js                    [PROTECTED]
│   │   ├── middleware/           # auth, role, validate, rateLimit, error
│   │   ├── models/               # User, Report, WasteEvent, Vehicle, Route, StatusEvent, ImpactTransaction, HistoryIncident  [PROTECTED]
│   │   ├── routes/               # one file per resource
│   │   ├── controllers/
│   │   ├── services/             # see §8.2
│   │   ├── engines/              # PURE: geo.js, duplicates.js, priority.js, routing.js, traffic.js, forecast.js, impact.js
│   │   ├── adapters/
│   │   │   ├── vision/           # gemini.js, anthropic.js, index.js
│   │   │   ├── storage/          # cloudinary.js, local.js, index.js
│   │   │   └── routing/          # osrm.js, estimate.js, index.js
│   │   └── utils/
│   └── tests/                    # engines/*.test.js with fixtures; api smoke tests (use a separate test DB)
└── frontend/
    ├── package.json, vite.config.ts, tsconfig.json, tailwind.config.ts, index.html
    ├── .env.example
    ├── public/                   # favicon, seed photos for mocks, contour pattern svg
    └── src/
        ├── main.tsx, App.tsx     # router                                    [PROTECTED]
        ├── styles/               # tokens.css, base.css, map.css (pulse/ribbon animations)  [PROTECTED]
        ├── types/api.ts          # TS types mirroring §10                    [PROTECTED]
        ├── lib/                  # api client, auth, format, i18n (T10), polling hook
        ├── components/           # ui/ (Button, Chip, Sheet, Drawer, Toast), shared/ (StatusChip, PriorityChip, Timeline)
        ├── map/                  # CityMap, layers/ (Pulses, RouteRibbon, Zones, Heat, Forecast), icons
        ├── citizen/              # pages/ (Home, Report, MyReports, ReportDetails, Impact), components/
        ├── ops/                  # OpsShell, lenses/ (Now, Routes, Forecast, Impact), drawer/EventDrawer, components/
        └── mocks/                # fixtures + mock client when VITE_USE_MOCKS=true
```

**Preserve-existing rule (Phase 0):** if the repo already contains equivalents (Express app, Mongoose models, Vite setup), keep them and adapt to this layout by *moving*, not rewriting.

---

# 21. IMPLEMENTATION PHASES

Time boxes are rough targets for a one-night build with 4 people working in parallel; if time collapses, cut in the order given in §29.

### Phase 0 — Repository inspection and decisions (≈ 30 min)
- **Features:** inspect repo; list existing code/deps; reconcile with this blueprint; decide Mongoose/zod/etc.; confirm coordinates for depot; confirm which provider key each person has.
- **Dependencies:** none. **Deliverable:** `docs/phase0-notes.md` (what exists, what changes, open questions).
- **Acceptance:** every conflict with this blueprint is listed with a decision.
- **Must NOT start before:** no code until Phase 0 notes are agreed.

### Phase 1 — Foundation (≈ 1.5 h)
- **Features:** both apps boot; Tailwind tokens (`tokens.css`); fonts; router shell; API client + types file; Express app with health, auth (register/login/JWT), error/validation/role middleware; models; thresholds/env; `.env.example`, `.gitignore`, README; `seed` skeleton; frontend mock mode.
- **Dependencies:** Phase 0. **Deliverable:** clone → install → run works for a new teammate; login works for both roles; `types/api.ts` merged.
- **Acceptance:** `/api/health` OK; demo login lands on the right shell; CI-free lint passes.
- **Must NOT start:** feature screens before tokens and API types are merged.

### Phase 2 — Citizen report flow (≈ 2 h)
- **Features:** C0–C4 basic; camera/gallery upload, compression; upload + storage adapter; location step (GPS/pin); create report → event; My Reports; Report Details with timeline.
- **Dependencies:** Phase 1. **Deliverable:** phone-sized flow from photo to submitted report visible in DB.
- **Acceptance:** at 375/390/430 px the whole flow works one-handed; location editable; result stored with `locationSource`.
- **Must NOT start:** impact UI, duplicate sheet.

### Phase 3 — Municipal dashboard (≈ 2 h, parallel with Phase 2)
- **Features:** OpsShell, command bar, lens switch shell, Leaflet map with tiles + Waste Pulse markers, Needs Attention rail, Event Drawer (view + verify/reject form), Queue table, polling.
- **Dependencies:** Phase 1 (+ seed events). **Deliverable:** operator sees seeded events, opens drawer, verifies an event.
- **Acceptance:** marker states match §7.7; verify requires severity + weight; status history appears.
- **Must NOT start:** planner, analytics.

### Phase 4 — AI + duplicate + priority (≈ 1.5 h)
- **Features:** vision adapter + `/classify` wiring + Step 2 UI; correction storage; `nearby` + duplicate sheet + `/support`; server duplicate re-check; priority engine + breakdown UI.
- **Dependencies:** Phases 2 & 3. **Deliverable:** demo pair — nearby report → support → event `supportCount` and priority change.
- **Acceptance:** engine unit tests pass; AI outage falls back gracefully; no confidence displayed.
- **Must NOT start:** credits (needs stable report/event lifecycle).

### Phase 5 — Route planning (≈ 2.5 h)
- **Features:** vehicle/depot seed; OSRM adapter + fallback; knapsack + sequencing engine; preview/assign endpoints; Planner UI (capacity bar, dock, deferred list, ribbon).
- **Dependencies:** Phase 3, priority engine (Phase 4). **Deliverable:** seeded scenario yields ordered route + 2 deferred with reasons.
- **Acceptance:** planned load ≤ capacity always; incompatible/oversize deferred with reasons; assign sets events `SCHEDULED`; works with OSRM off.
- **Must NOT start:** traffic simulation UI before preview is stable.

### Phase 6 — Traffic simulation and replan (≈ 1.5 h)
- **Features:** zone editor + "Suggest zone on busiest leg"; congestion cost in matrix + leg durations; replan endpoint (fixed completed stops, preserved capacity); animated ribbon transition; `planHistory`.
- **Dependencies:** Phase 5 and resolve-stop (Phase 9 minimal). **Deliverable:** replan changes durations and possibly order.
- **Acceptance:** completed stops unchanged; remaining capacity math correct; UI shows SIMULATED tag and before/after minutes.
- **Must NOT start:** live-traffic integrations.

### Phase 7 — Hotspot analytics (≈ 1.5 h, parallel)
- **Features:** history generator + seed; weekly grid aggregation; forecast + evaluation; endpoint; FORECAST lens (heat, rings, toggle, top zones, model card); slider if time (T1).
- **Dependencies:** Phase 1 models; map layer from Phase 3. **Deliverable:** NOW/FORECAST toggle with labelled disclaimer and held-out MAE.
- **Acceptance:** forecast uses unique incidents only; labels present; numbers reproducible from the seed.
- **Must NOT start:** any real-accuracy claims.

### Phase 8 — Civic Impact Credits (≈ 1.5 h)
- **Features:** `ImpactTransaction` creation hooks in report/support/verify/reject/resolve; `impact` engine; `/impact/me`; C5 screen (ring, trio, feed, modal); operator credit state in drawer; (T3/T2/T4 later).
- **Dependencies:** Phases 4 and 9. **Deliverable:** verified contribution produces a transaction visible in the citizen UI.
- **Acceptance:** rules in §17.3 covered by tests (unique, support cap, duplicate blocked, reject, revoke); derived totals equal ledger.
- **Must NOT start:** leaderboards/tiers before the ledger is correct.

### Phase 9 — Closure / resolution (≈ 1 h; minimal version needed by Phase 6)
- **Features:** `PATCH status` → `RESOLVED`; `/uploads` for closure photo; closure UI in drawer/dock; citizen timeline + closure photo; route stop `DONE`.
- **Dependencies:** Phase 5. **Deliverable:** end-to-end resolve.
- **Acceptance:** resolved event shows in citizen UI within one poll; route progress updates.
- **Must NOT start:** before/after image analysis.

### Phase 10 — UI polish and responsive design (≈ 2 h, overlaps)
- **Features:** design-system pass, motion, empty/loading/error states, 375/390/430/tablet/desktop QA, accessibility pass (contrast, focus, reduced motion), real photography placed.
- **Dependencies:** features working. **Deliverable:** screenshots for PPT.
- **Acceptance:** §27 UI checklist.
- **Must NOT start:** new features.

### Phase 11 — Integration + demo validation (≈ 1.5 h)
- **Features:** full rehearsal on two devices; reset/seed idempotency; fallback drills (AI off, OSRM off, tiles off); screenshot capture; PPT ↔ evidence audit.
- **Deliverable:** rehearsed demo, `docs/demo-script.md`, tagged release.
- **Acceptance:** §26 flow runs twice in a row from a clean reset without manual DB edits.

---

# 22. TEAM PARALLELIZATION PLAN

| Person | Ownership (directories) | First deliverables |
|---|---|---|
| **P1 — Citizen frontend** | `frontend/src/citizen/**`, citizen parts of `components/` | C0–C5 against mocks; camera/location step; impact ring |
| **P2 — Municipal frontend** | `frontend/src/ops/**`, `frontend/src/map/**` | OpsShell, pulses, rail, drawer, planner, forecast lens |
| **P3 — Backend core** | `backend/src/{app,config,models,routes,controllers,services(non-engine)}` | auth, models, report/event/verify/close, impact hooks, seed |
| **P4 — Engines + data + integration + PPT** | `backend/src/engines/**`, `backend/src/adapters/**`, `backend/seed/**`, `backend/tests/**`, `docs/**` | pure engines with fixtures (duplicates, priority, routing/traffic, forecast, impact), OSRM/vision/storage adapters, history generator, then integration and PPT evidence |

*If P4 is overloaded by the PPT today, move adapters to P3 and keep P4 on engines/data/PPT; the PPT owner should not be the same person who is the only owner of routing.*

**Contracts to agree first (before anyone writes feature code, ≈ 45 min):**
1. `frontend/src/types/api.ts` (from §10) and `docs/fixtures/*.json` example payloads.
2. Status/priority/category enums and colours (`tokens.css`).
3. Engine function signatures: `findDuplicates`, `computePriority`, `planRoute`, `applyCongestion`, `replanRoute`, `buildForecast`, `computeImpactEffects` (inputs/outputs documented in file headers and tests).
4. Seed data definition (§23) so everyone works against the same scenario.

**Can be developed independently:** citizen UI (mocks), operator UI (mocks), engines (fixtures), adapters (contract tests), seed and history generator.
**Must be integrated first:** auth + models + `/complaints` list → operator map; `/classify` + `/reports` → citizen flow; then routes; then impact.
**Likely merge conflicts:** `backend/src/app.js`, `models/*`, `types/api.ts`, `App.tsx` routes, `tokens.css`, `tailwind.config.ts`, both `package.json`/lock files, `seed/demo.data.js`.
**Protection rules:** marked `[PROTECTED]` files change only via a small PR reviewed by P3 (backend) or P1+P2 (frontend tokens/types); one person runs the initial dependency install and commits lockfiles in Phase 1; others add dependencies only by telling that person; feature branches (`feat/<area>-<name>`), rebase before PR, merge to `main` in small steps; do not commit `.env`.
**Antigravity usage tip:** give each agent one directory ownership + this blueprint's relevant sections + the contracts; forbid edits to `[PROTECTED]` files without a note.

---

# 23. TEST DATA / RESET STRATEGY

**Policy.** Small, controlled, meaningful. No bulk fake data. Everything created by seed carries `isSeed:true`. Temporary records made by agents/tests must use the **test database** (`MONGODB_DB=civicclean_test`) or carry `isTest:true` and be removed by the same test's teardown; automated tests never write to the demo database.

**Demo scenario (seeded).** Coordinates are computed from one `DEPOT` constant using metre offsets (so relocating the demo needs one edit). Choose a depot point on a road OSRM can snap to near the venue area (verify visually on the map before finalising).

**People:** `operator@civicclean.demo` (OPERATOR) · `asha@civicclean.demo` (history: contributions & resolved events) · `ravi@civicclean.demo` (clean account for the live demo).

**Vehicle:** "Truck A", capacity 1000 kg, accepts Organic/Plastic/Paper/Glass/Metal/Mixed, `maxRouteMinutes` 180, depot at `DEPOT`.

**Active events (10):**

| Code | Category | Status | Severity | Weight | Extra | Reports | Notes |
|---|---|---|---|---|---|---|---|
| WE-0001 | Organic | VERIFIED | S2 | 180 | market | 3 (Asha primary + 2 supporters) | shows consolidation |
| WE-0002 | Plastic | VERIFIED | S2 | 120 | — | 2 | |
| WE-0003 | Mixed | VERIFIED | S3 | 250 | school | 2 (Asha supports) | Critical tier |
| WE-0004 | Paper | VERIFIED | S1 | 60 | — | 1 | |
| WE-0005 | Glass | VERIFIED | S1 | 40 | — | 1 | |
| WE-0006 | Organic | VERIFIED | S2 | 200 | — | 1 | **duplicate target** for the live report |
| WE-0007 | Metal | VERIFIED | S2 | 120 | — | 1 | |
| WE-0008 | Mixed | VERIFIED | S3 | **900** | — | 1 | **capacity-excluded** |
| WE-0009 | **E-waste** | VERIFIED | S2 | 40 | — | 1 | **incompatible** |
| WE-0010 | Plastic | **SUBMITTED** | — | — | — | 1 | for live verification (operator enters ≈ 20 kg) |

Compatible planned weight = 180+120+250+60+40+200+120 = **970 kg**; after verifying WE-0010 at 20 kg → **990 kg** (numbers shown in earlier UI examples are illustrative).
**Resolved events (3):** WE-0011/12/13 — Asha primary, with closure photos, one with a corrected category (so her ledger has a verified `CLASSIFICATION_CORRECTION`). Asha's seeded ledger: 4 unique, 1 supporting, 3 resolved, verified credits = 40 + 3 + 15 + 4 = **62**.
**Live-demo report:** Ravi photographs/uploads an Organic pile ≈ 40–60 m from WE-0006 → duplicate candidate appears → he chooses **Support**.
**Historical data:** ~120 synthetic incidents over 12 weeks around 4–5 clusters, generated by `history.generator.js` with a fixed seed.
**Photos:** ≤ 15 compressed images in `backend/seed/photos/` — team-shot or clearly licensed (record source/licence in `seed/README.md`).

**Reset mechanism.** `npm run demo:reset`: refuses to run if `NODE_ENV=production` or `ALLOW_DEMO_RESET≠true`; deletes only collections owned by the app in the configured DB; re-seeds users, vehicle, events, reports, transactions, history; re-uploads/copies photos (idempotent by public id); prints a summary of counts. Same logic behind `POST /api/admin/reset-demo` for the operator UI's hidden "Reset demo" menu item (development builds only).
**Verification after reset:** counts match the table above (10 active + 3 resolved events, 1 vehicle, 3 users, ~120 history rows).

---

# 24. FEATURE STATUS MATRIX FOR PPT SYNCHRONIZATION

*Status values: Not started · In progress · Working · Demoed. Everything is **Not started** as of this document. Update this table as work lands; the PPT owner may only use claims whose row is Working/Demoed with evidence captured.*

| # | Feature | PPT claim (approved wording) | Prototype requirement | Evidence required | Status |
|---|---|---|---|---|---|
| 1 | Geo-tagged reporting | "Citizens report waste with a photo and an editable, confirmed location." | M2 | Screenshot of location step with draggable pin; DB record with `locationSource` | Not started |
| 2 | AI classification | "A pretrained vision model suggests a waste category; the citizen can correct it." | M3 | Screenshot of category layer + correction; stored `aiSuggestedCategory` vs `citizenCategory` | Not started |
| 3 | Duplicate detection | "Nearby reports of the same waste are detected (≤ 100 m, configurable) and consolidated into one event without discarding contributions." | M4 | Two reports → one event with `reportCount=2` in drawer | Not started |
| 4 | Report vs event model | "Many reports become one operational waste event." | M5 | Header ticker `N reports → M events`; linked reports list | Not started |
| 5 | Explainable priority | "A rule-based priority score with visible reasons." | M8 | Drawer breakdown bar + sentence | Not started |
| 6 | Capacity-aware routing | "Priority-aware, capacity-constrained route planning on road travel times." | M9 | Route preview: capacity bar, planned load, deferred stops with reasons | Not started |
| 7 | Vehicle compatibility | "Incompatible waste types (e.g. E-waste) are excluded and flagged." | M9 | Deferred list shows `INCOMPATIBLE` | Not started |
| 8 | Traffic-aware replanning | "Simulated congestion changes travel costs and the remaining route is replanned." | M10 | Before/after minutes, SIMULATED tag, completed stops unchanged | Not started |
| 9 | Hotspot forecast | "Baseline forecast on synthetic historical data, with held-out error reported." | M13 | Forecast lens + model card with MAE | Not started |
| 10 | Closure evidence | "Resolution is recorded with optional closure photo and visible to the citizen." | M11 | Closure photo in drawer and citizen Report Details | Not started |
| 11 | Civic Impact Credits | "Credits reward verified impact, not report volume." | M12 | `ImpactTransaction` rows PENDING→VERIFIED; citizen impact screen | Not started |
| 12 | Duplicate/spam resistance | "Repeated support and rejected reports earn no credit." | M12 | Unit tests + attempt shown returning `ALREADY_CONTRIBUTED` | Not started |
| 13 | Two connected dashboards | "Citizen and operator dashboards are two views of one loop." | M1–M6 | Live demo: action on one screen appears on the other | Not started |
| 14 | Mobile-first citizen UI | "Designed for one-handed mobile use." | M15 | Screenshots at 375/390/430 | Not started |
| 15 | Operator aggregate impact | "Operators see verified citizen contribution." | T3 | IMPACT lens | Not started (time-permitting) |
| 16 | Hotspot time slider | "Explore weekly change." | T1 | Slider screenshot/video | Not started (time-permitting) |

**Do NOT claim (unless separately built and evidenced):** "optimal routes", live traffic, weight estimation from images, image-based clearance verification, forecast "accuracy %", real-world validated thresholds, city-scale deployment, cost/emission savings percentages, AI confidence percentages, "real-time" (say "near-real-time via polling").

---

# 25. PPT → PROTOTYPE TRACEABILITY

| Slide | Content | Claim/element | Prototype evidence | Demo step |
|---|---|---|---|---|
| **1 Title** | CivicClean · Smart Waste Reporting and Collection Planning · pitch line · team | Product identity | Hero screenshot (citizen Home + map) | — |
| **2 Problem & Root Cause** | Fragmented, duplicated complaints; static collection routes; no feedback to citizens; reactive rather than predictive | Problem framing | **Use only cited sources for any statistic** (put in References); otherwise qualitative framing. Optional: seeded "5 reports → 1 event" as an illustration, labelled prototype | — |
| **3 Proposed Solution** | Civic Impact Loop diagram (9 stages); two connected dashboards; five PS capabilities mapped to screens; Civic Impact Credits | Rows 1–4, 10–13 | Citizen flow screenshots; operator map + drawer; My Civic Impact | 1, 2, 6 |
| **4 Technical Architecture & Methodology** | Architecture diagram (§8); engine methods: Haversine duplicate rule, priority points table, knapsack + sequencing, congestion multiplier, baseline forecast formula; external services list | Rows 5–9 | Screenshots of priority breakdown, route preview (capacity/deferred), replan banner, forecast model card | 2–5, 7 |
| **5 Impact & Benefit** | Measurable prototype metrics (§27.2) computed from the demo dataset, each labelled "prototype, synthetic/seeded data"; citizen benefit (transparency), municipal benefit (fewer duplicate stops, explainable planning) | Rows 3, 6, 8, 9, 11 | Metrics panel/table captured from the app | 2–5 |
| **6 References & Conclusion** | Cited sources for problem statistics; technology credits (OpenStreetMap, OSRM, Leaflet, vision API, Cloudinary, MongoDB); limitations (simulated traffic, synthetic data, estimated weights); future work | Honesty slide | Limitations list from §4.3 | — |

**Rule:** before finalising each slide, the PPT owner links every bullet to a row in §24 whose status is Working/Demoed and attaches the screenshot/recording file name in `docs/evidence/`.

---

# 26. DEMO FLOW (4–5 minutes)

**Setup:** run `npm run demo:reset` → warm the backend → laptop = operator (map on screen), phone = Ravi (HTTPS URL). Pre-loaded: AI and OSRM keys verified, demo photos ready, browser tabs open. Backup: recorded 60-second screen capture of the whole flow.

| Time | Step | Says / shows | Feature proven |
|---|---|---|---|
| 0:00 | Frame | "One loop: citizens report, the city acts, citizens see what changed." Show ticker `11 reports → 10 events`. | Loop, report≠event |
| 0:20 | **Citizen report (phone)** | Ravi takes/selects an organic-waste photo → AI label "Looks like Organic" + reason → confirm → location step (pin adjusted) | F1, F2 |
| 1:00 | **Duplicate** | Sheet: "This may already be reported — 45 m away". Ravi taps **Yes, that's the same one** → success screen | F3 |
| 1:20 | **Operator sees consolidation** | WE-0006 now shows 2 reports, gallery with 2 photos, priority "why" changed | Report→Event, priority |
| 1:50 | **Verify** | Open WE-0010 (unverified) → severity S2, weight 20 kg → Verify → breakdown bar animates | Verification, priority |
| 2:20 | **Route planning** | ROUTES lens → Preview: capacity bar 990/1000 kg, 8 stops, ribbon, **deferred: WE-0008 capacity, WE-0009 E-waste incompatible** → Assign | F4 |
| 3:00 | **Collect + closure** | Mark **WE-0006** resolved with a closure photo | Closure |
| 3:20 | **Simulated congestion → replan** | "Suggest zone on busiest leg" (×2) → Replan: ribbon animates; banner "46 → 61 min"; completed stop unchanged; SIMULATED tag visible | F4 traffic |
| 3:50 | **Citizen impact (phone)** | Ravi's status → Resolved + closure photo; My Civic Impact: verified credits increased, "What changed" feed | Credits, loop close |
| 4:20 | **Hotspots** | FORECAST lens: toggle Now/Forecast, top predicted zone, model card MAE, "baseline on synthetic data" | F5 |
| 4:45 | Close | Three lines: honest scope, what's next | — |

Excluded on purpose: leaderboards, tiers, merge, language toggle, live-traffic talk. If time is short drop the hotspots slider first, then the neighbourhood map.
Live-data caveat: the demo uses polling; wait ≤ 15 s or pull-to-refresh on the phone (add a manual refresh action to be safe).

---

# 27. ACCEPTANCE CRITERIA

## 27.1 System-level
1. Fresh clone + `.env` + `npm run seed` gives the §23 dataset; reset works twice in a row.
2. **Reporting:** photo → category layer → editable location → duplicate sheet (when applicable) → submit; DB stores AI suggestion and citizen category separately and `locationSource`.
3. **Duplicates:** the seeded pair is detected at ≤ 100 m; support creates a linked Report, not a new event; a second support by the same user is rejected; identical image is rejected.
4. **Priority:** every verified event has a breakdown summing to its score; tier thresholds applied; support cap enforced.
5. **Routing:** planned load ≤ capacity for every generated route; incompatible and oversize events appear in `deferred` with reasons; assign sets `SCHEDULED`; works with OSRM disabled (ESTIMATE label).
6. **Traffic:** zone factor increases affected leg durations; replan keeps DONE stops fixed and uses remaining capacity; before/after minutes shown; SIMULATED tag visible.
7. **Forecast:** built only from unique incidents; label and MAE displayed; reproducible from the seed.
8. **Impact:** transactions follow §17.3; totals equal the sum of VERIFIED rows; rejected/duplicate contributions add nothing.
9. **Closure:** resolving stores time/photo/note and citizen sees it after one poll.
10. **Security:** citizen cannot call operator endpoints or set status/priority/credits; foreign report ids → 404; uploads validated by magic bytes and 5 MB limit; rate limits active; no API keys in the frontend bundle; error responses contain no stack traces; `.env` not tracked.
11. **Responsive/UI:** citizen flow completes at 375, 390, 430 px without horizontal scroll; municipal UI usable at 1280 and acceptable at tablet width; no dark theme; reduced-motion respected; AA contrast on text; visible focus states; every map has a list alternative.
12. **Unit tests** (engines): duplicates (radius edge, category rules, window), priority (each component and tiers), routing (capacity, compatibility, ordering on a tiny fixture), traffic (zone intersection, max-factor rule), forecast (weights, MAE), impact (state machine, caps).

## 27.2 Measurable prototype metrics (no invented percentages)

| Metric | Formula | Data source | Baseline | Where shown |
|---|---|---|---|---|
| **Duplicate consolidation** | `(reports − events) / reports`; also "stops avoided" = `reports − events` | `Report`, `WasteEvent` counts | 1 report = 1 task | Ops header ticker; PPT slide 5 (labelled seeded data) |
| **Capacity compliance** | `plannedLoadKg ≤ capacityKg` (pass/fail per route); utilisation = `plannedLoad / capacity` | `Route.totals` | n/a (constraint) | Planner capacity bar; PPT |
| **Route travel estimate** | `durationMin`, `distanceM` from matrix/route; improvement `= (naive − planned)/naive` | `Route.totals`, `baseline` | FIFO order over the *same* stops | Planner rail; PPT |
| **Congestion impact** | `durationAfter − durationBefore` after replan | `delta` | pre-congestion plan | Replan banner |
| **Resolution time** | median `resolvedAt − firstReportedAt` (hours) | resolved events | seeded/simulated (label) | Ops map footer/Impact lens |
| **Forecast error** | MAE on held-out week vs naive last-week and mean baselines | `analytics/hotspots.evaluation` | last-week baseline | Model card; PPT |
| **Verified citizen contributions** | `VERIFIED / (VERIFIED + REJECTED)` transactions; count of verified transactions | `ImpactTransaction` | n/a | Impact lens; PPT |
| **Priority coverage** | share of Critical/High events included in the planned route | route vs events | n/a | Planner rail |

Every displayed metric carries a small "prototype data" note.

---

# 28. RISKS / BOTTLENECKS

| Risk | Impact | Mitigation |
|---|---|---|
| Geolocation blocked on http (phones over LAN) | Location step fails | Deploy over HTTPS or use an HTTPS tunnel; always allow pin placement |
| Public OSRM downtime/rate limit | Routes fail | Estimate fallback + cached seed matrix; label ESTIMATE; rehearse with OSRM off |
| Vision API quota/latency/cost | No AI in demo | 8 s timeout, manual fallback, pre-test photos, second provider key, small images |
| Seeded coordinates not on roads / clusters too spread | Odd routes, long legs | Pick depot and offsets on a real map; verify preview visually; keep all events within ~2 km |
| Scope creep from visual ambition | Core flows unfinished | Visual effects only from §7 list; polish is Phase 10; build order in §29 |
| Leaflet animation jank on low-end laptops | Poor demo feel | Animate only ≤ 12 markers; CSS transforms; disable loops under reduced motion; test on demo hardware |
| Venue Wi-Fi | All external APIs affected | Local Mongo + `STORAGE_DRIVER=local` mode for rehearsal, phone hotspot backup, recorded video |
| Merge conflicts across agents | Broken main | Protected files, contracts first, small PRs |
| Free hosting cold starts | Slow first request | Warm up; local fallback |
| Photo rights | Legal/credibility | Team-shot or licensed photos only; record sources |
| Timezone/date bugs in waiting-time math | Wrong priority | Store UTC; test priority with fixed `now` injection |
| Credit logic edge cases | Inconsistent totals | Ledger-derived totals only; unit tests; idempotent unique index |
| Replan complexity | Incorrect capacity/order | Pure `replanRoute` with fixtures; test "DONE stops fixed" and "remaining capacity" first |
| Over-claiming in PPT | Credibility loss | §24 "Do NOT claim" list + evidence rule |
| Two-device demo sync delays | Awkward pauses | Polling intervals 5/15 s + manual refresh, scripted waits |
| Mongo Atlas network rules | Cannot connect | Configure early; allow needed IPs; local fallback |

---

# 29. FINAL BUILD PRIORITY ORDER

If time runs out, **build strictly in this order**; each item must work before starting the next.

1. **Foundation (Phase 1)** — boot, auth, models, tokens, types, `.env.example`, seed skeleton.
2. **Seed data + operator map with Waste Pulse markers and rail** (Phase 3 core) — makes everything visible early.
3. **Citizen report flow with editable location** (Phase 2).
4. **Event drawer + verify/reject + priority breakdown** (Phase 3 + 4 priority).
5. **AI classification with fallback + correction storage** (Phase 4).
6. **Duplicate detection + support flow** (Phase 4).
7. **Closure/resolve (minimal)** (Phase 9).
8. **Route preview/assign with capacity, deferrals, ribbon** (Phase 5).
9. **Simulated congestion + replan** (Phase 6).
10. **Civic Impact ledger + My Civic Impact** (Phase 8).
11. **Hotspot history + baseline forecast + toggle** (Phase 7).
12. **Polish, motion, responsive QA, accessibility** (Phase 10).
13. **Integration rehearsal, evidence capture, PPT audit** (Phase 11).
14. **Time-permitting, in this order:** hotspot slider (T1) → operator impact lens (T3) → neighbourhood impact map (T2) → recognition tier (T4) → EXIF/reverse geocoding (T5/T6) → merge/reopen (T7) → before/after viewer (T9) → language toggle (T10).

**Cut list if severely late (in this order):** T-items → hotspot slider → ribbon morph polish (keep simple fade/draw) → Queue table → neighbourhood map. **Never cut:** report≠event model, duplicate support flow, capacity + deferral reasons, SIMULATED replan, credit ledger with citizen view, and the honesty labels.
