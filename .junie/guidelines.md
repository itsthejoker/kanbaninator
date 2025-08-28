# Kanbaninator – Project Development Guidelines

Last updated: 2025-08-27 13:01 local

These notes target advanced contributors and focus on project-specific behaviors, build/run requirements, data formats, and architectural conventions.

## 1) Build and Configuration

- Runtime: Static, no bundler. Vanilla JS + vendored libs (Bootstrap, jKanban, Axios, dom-autoscroller). All logic executes in-browser.
- Serving locally:
  - Serve the project root as the web root. Paths like `/service-worker.js` and `/manifest.json` assume root scope.
  - Any static HTTP server works. Example commands (choose one):
    - Node: `npx http-server -p 8080` or `npx serve -p 8080`
    - Python 3: `python -m http.server 8080`
  - Visit http://localhost:8080 (recommend HTTP while developing to avoid mixed-content warnings when calling http://127.0.0.1 for Joplin).
- Service Worker (PWA):
  - Registered in index.html for scope `/`. Cache list defined in service-worker.js. API calls to 127.0.0.1 are explicitly bypassed by the SW (no offline for Joplin).
  - During dev: caching can mask changes. If assets don’t update, either:
    - Bump `CACHE_NAME` in service-worker.js, or
    - Dev without SW (temporarily comment out registration in index.html), or
    - Hard-reload and/or clear site data: Application > Clear storage > Unregister SW.
- Joplin Web Clipper:
  - Enable in Joplin desktop (Tools > Options > Web Clipper). Default port is often 41184, but user-provided.
  - Auth flow: POST `/auth` → poll GET `/auth/check?auth_token=...` → receive `token`.
  - All API calls go to `http://127.0.0.1:{port}`; the app uses Axios.
  - Mixed content: When the app is served over HTTPS, browsers usually allow HTTP calls to 127.0.0.1 as a secure-local exception. If the browser blocks, serve the app over HTTP in dev.

## 2) Runtime Modes and Configuration

- Normal mode (with Joplin):
  - App stores Joplin `token` and `port_number` in cookies (`joplinToken`, `joplinPort`).
  - A root folder is selected; the project’s configuration note is `.kanbaninator` inside that folder.
  - Board state persistence happens by PUT-ing to the configuration note’s body.
- Browser-only mode (no Joplin):
  - Entered by clicking “Start without Joplin” or importing a board file before authenticating.
  - No writes to Joplin; state is in-memory until explicitly exported. Unsaved changes are tracked and indicated in the UI (button label `Export/Import*`, title ends with `*`, beforeunload confirm).
- Session restore and deep-links:
  - Cookies: `configNoteId`, `joplinToken`, `joplinPort` via CookieManager.
  - URL params: `?configNoteId=...&rootFolder=...` via UrlManager. If present and token/port available (cookies), the app loads that board directly.

## 3) Data Contracts and Storage

- Board JSON schema (rendered by KanbanBoard.renderJSON):
  - `{
      title: string,
      data: [
        {
          id: string,            // jKanban board id (Joplin folder id or generated UUID)
          title: string,         // column title
          item: [
            {
              title: string,     // card title
              id: string,        // note id
              colorClass: string // e.g., col1..col12; default col12
              body?: string      // optional, included if cached/available
            }
          ]
        }
      ]
    }`
- Configuration note format in Joplin:
  - Title: `.kanbaninator`
  - Body: A header line with a quick link, then fenced JSON:
    - Starts with the quick link: `Quick link: https://itsthejoker.github.io/kanbaninator/?configNoteId=...&rootFolder=...`
    - Then:
      ```
      ```json
      { ...board JSON... }
      ```
      ```
  - Loader parses body by finding the first line equal to ```json and the last line equal to ``` and JSON-parsing the slice between. If you change the fence or wrapper text, update the parser in joplin-integration.js:getConfigNote and saver in kanban-board.js:saveBoardState accordingly.
- Note bodies cache (browserOnlyMode or during export):
  - `window.joplinIntegration.noteBodies` is an object keyed by note id with `{ title, body }` used to populate/retain bodies independent of Joplin.
  - Export attempts to ensure every card has a cache entry (body may be empty in browser-only mode, or fetched from Joplin if connected).

## 4) Architecture and Key Modules

- Global managers (attached to `window`):
  - `joplinIntegration`: Auth, folder listing, config note read/write, card CRUD via Joplin API, browserOnlyMode flag, noteBodies cache.
  - `kanbanBoard`: Wrapper around jKanban. Initializes board, serializes to JSON, writes state to Joplin (saveBoardState), maintains color classes and layout.
  - `modalManager`: Initializes Bootstrap modals and exposes show/hide helpers for start, folder, edit, new note, premade, and title modals. Also `spawnTitlePrompt`, `uncheckAllRadios`.
  - `exportImportManager`: Lazy-loaded (script injected by app.js). Adds Start without Joplin and Import section to start modal; provides Export/Import modal, export/download, import/validate, unsaved-change indicator, beforeunload guard. Global helper `addExportImportButton()` places navbar button.
  - `uiManager`: Spinner, responsive relayout on resize, theme support, console timestamps.
  - `cookieManager`, `urlManager`.
  - `modalAnimationManager`: optional, safe no-op provided if missing.
- Third-party (vendored in `static/vendored/`):
  - Axios (HTTP), Bootstrap (UI/modals), jKanban (drag-and-drop kanban), dom-autoscroller (drag-scrolling).
- Script load order (index.html):
  1) Vendored libs (axios, bootstrap.js, jkanban, dom-autoscroller)
  2) App modules: utility-managers, joplin-integration, kanban-board, context-menu, color-picker, modal-animations, modal-manager, template-manager, accessibility, app.js
  3) export-import.js is not in index.html; app.js dynamically injects it when needed (first-run or user opens start modal).
- UI bootstrap (app.js): creates a navbar, nav slot `#exportImportButtonContainer` for export/import button, initializes managers, attempts session restore via cookies/URL; otherwise it loads export-import.js and shows start modal.

## 5) Implementation Notes and Gotchas

- IDs and UUIDs:
  - When creating template columns/cards without Joplin data, ids may be generated via `crypto.randomUUID()` (see template-manager.js). Ensure target browsers support it or provide a fallback if you add features relying on UUIDs in additional places.
- Color classes and defaults:
  - Valid `colorClass` values are `col1`..`col12`. Missing or invalid classes default to `col12`. CSS theming resides in `static/styles.css`.
- Drag/drop and autoscroll:
  - jKanban is configured with `dragBoards: false`, autoscroll is set up on `.kanban-container`. If you modify DOM structure, review dom-autoscroller initialization in kanban-board.js.
- Persistence behavior:
  - In browserOnlyMode, saveBoardState is a no-op (logs and returns). Unsaved changes are tracked in exportImportManager and reflected in the nav button and document title.
  - In normal mode, every mutation path should call `window.kanbanBoard.saveBoardState()` to push to Joplin.
- Service worker:
  - SW caches assets listed in RESOURCES_TO_CACHE and ignores requests to 127.0.0.1. Bump `CACHE_NAME` when changing static assets to reliably deploy.
  - SW is registered after window load. If debugging, you can temporarily comment out the registration block in index.html or use DevTools to unregister/skip waiting/etc.
- Security/Privacy:
  - The Joplin `token` and `port` persist in cookies (not Secure/HttpOnly). They’re used only for requests to 127.0.0.1; do not share captured cookies.
  - Shared board links (URL params) do not contain the token; they carry `configNoteId` and `rootFolder` only. Users still need an active local token.
- Mixed content and localhost allowances:
  - If serving the app over HTTPS and calling `http://127.0.0.1:PORT`, most modern browsers allow it as a secure local exception. If blocked in your environment, serve the app over HTTP during dev.

## 6) Extending the App

- New templates:
  - Add a method to `TemplateManager` and wire a corresponding button in the premade modal (index.html). Use `buildTemplate()` to construct `window.joplinIntegration.config` and re-init the board.
- New context menu actions:
  - Extend `ContextMenuManager` (static/context-menu.js). Use existing patterns: get `noteId` from `.kanban-item` dataset; use `window.joplinIntegration` for note IO.
- Additional card metadata:
  - If you add new per-card fields beyond `title`, `id`, `colorClass`, and `body`, update both `renderJSON()` (serialization), validators in `export-import.js:isValidBoardState`, and any code relying on the schema (import/export, cache, editors).
- Config note wrapper changes:
  - If you change the markdown wrapper around the JSON in `.kanbaninator`, update both the loader in `joplin-integration.js:getConfigNote` (the fence scanning) and saver in `kanban-board.js:saveBoardState` (the writer).

## 7) Debugging Checklist

- Joplin connectivity:
  - Verify Web Clipper enabled and port number correct.
  - Check network calls to `http://127.0.0.1:{port}` and auth flow in console. Re-run auth if token invalid (app does this automatically).
- SW cache issues:
  - Bump `CACHE_NAME`, or unregister SW/clear caches. Confirm in DevTools > Application.
- State anomalies:
  - For browserOnlyMode, ensure `exportImportManager.hasUnsavedChanges` toggles with drags and edits; button text ends with `*`.
  - Verify `window.joplinIntegration.noteBodies` updated on export/import and when editing notes.
- Layout issues:
  - Use `UiManager` resize handling to force relayout. Confirm `.kanban-container` grid classes from `rowatize()` are applied.

## 8) File Map (high-level)

- index.html: Structure (modals, containers), script order, SW registration.
- static/utility-managers.js: CookieManager, UrlManager, UiManager.
- static/joplin-integration.js: Auth, folder selection, config load/create, note body IO, browserOnlyMode handling, cache.
- static/kanban-board.js: jKanban wrapper, layout, color classes, serialize & persist.
- static/export-import.js: Start modal import section, Start without Joplin, export/import flows, unsaved-change indicator, navbar button injection.
- static/modal-manager.js, modal-animations.js: Modals and animations.
- static/context-menu.js, color-picker.js, accessibility.js: UI/UX helpers.
- service-worker.js, manifest.json, static/styles.css: PWA + styles.

## 9) Testing Scenarios (manual)

- Normal mode:
  - Authenticate, select folder, ensure `.kanbaninator` exists, add/move cards, verify Joplin config note updates and quick link works.
  - Reload via deep link with existing cookies; board loads without re-auth.
- Browser-only mode:
  - Start without Joplin; create/move cards; confirm unsaved indicator and beforeunload prompt. Export; reload; import; confirm state restored.
- SW behavior:
  - Go offline; app shell loads; Joplin calls fail (expected). Reconnect; ensure network resumes.

——
This document is intentionally project-specific. If you adjust data schemas, SW caching, or the config note wrapper, please update this guide accordingly.
