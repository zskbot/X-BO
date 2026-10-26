# Ask OCode.js — Product & Builder Workspace

## Product overview

**Ask OCode.js** is the intended AI-assisted full-stack building workspace for turning a prompt, visual reference, or existing design into a web application scaffold and an iterative development workflow.

This document defines the product direction and interface architecture. It does **not** claim that every capability below is already implemented. Feature status must be verified in code and CI before being advertised as available.

### Target users

- Developers who want to generate and refine application code.
- UI/UX designers translating a visual concept into an implementation.
- Product managers validating a workflow or prototype before engineering handoff.

### Product principles

1. Prompt-first, but never prompt-only: provide visible tasks, project files, code and preview states.
2. Preserve developer control: generated changes should be inspectable, reviewable and reversible.
3. Keep providers, templates, and framework adapters replaceable.
4. Separate preview/staging from production deployment.
5. Make integration status explicit; never label a simulated or unconfigured service as connected.

## 1. Four-layer architecture

```text
Input Layer
  Prompt/chat · visual assets · templates · design tokens
        ↓
AI Orchestration Layer
  Planner · task graph · code generation · integration adapters
        ↓
Interactive Editor Layer
  Live preview · design controls · code/file editor · test output
        ↓
Deployment & Sync Layer
  Git branch/PR · staging preview · explicit production release
```

### Layer A — Input

- **Prompt / chat:** natural-language requirements, follow-up refinements, and optional voice input when implemented.
- **Visual assets:** image/design upload, metadata and safe asset storage. Treat uploaded content as untrusted input.
- **Design system and templates:** reusable page patterns for landing pages, dashboards, forms, calculators and application shells. Templates should declare their supported stack and dependencies.

### Layer B — AI orchestration

- **Agentic planner:** turn the request into a reviewable task list, identify missing requirements, and show progress/failures.
- **Code generator:** produce files compatible with the selected framework, package manager, lint rules and OCODE.js adapter that is actually available.
- **Integration engine:** use explicit adapters for APIs, databases and services; require credentials via secure environment configuration, never generated source files.
- **Task safety:** separate read-only analysis, file edits, external side effects and deployment permissions.

### Layer C — Interactive editor

- **Preview:** show a real isolated build/preview when available; label empty, stale, failed and unavailable preview states.
- **Design mode:** inspect and adjust supported tokens such as colors, spacing, typography and layout; apply changes as inspectable code diffs.
- **Code editor:** file tree, syntax highlighting, diff review and safe save/undo. Avoid silently overwriting user files.
- **Tests:** show command, status, logs and actionable errors. Never mark tests passed without executing them.

### Layer D — Deployment and sync

- **GitHub sync:** connect an authorized account, create a dedicated branch, commit verified files and open a pull request. Do not push secrets or write directly to the default branch by default.
- **OCODE.js deployment:** future adapter contract. Until an authenticated, tested deployment integration exists, do not present a deploy button as working.
- **Release controls:** staging first, explicit production approval, deployment logs and rollback guidance.

## 2. Suggested user workflow

1. **Start:** choose a template or describe the application in the “Ask OCode.js to build…” prompt.
2. **Plan:** review the proposed files, tasks, dependencies, integration requirements and risks.
3. **Generate:** create a patch in a project workspace; preserve existing files and show the diff.
4. **Preview:** run build/tests and open an isolated preview; report failures instead of hiding them.
5. **Refine:** use chat or supported design controls, then rerun relevant checks.
6. **Sync:** create a GitHub branch and PR for review.
7. **Deploy:** use a verified OCODE.js adapter or another explicitly configured target; production deployment requires confirmation.

## 3. Interface specification

### Main workspace

- **Header:** Ask OCode.js branding, current project, provider/model selector, connection state, GitHub and release actions.
- **Left rail:** project files, templates, tasks and recent sessions.
- **Center stage:** prompt-first welcome state; after generation, real preview with Preview / Code / Diff / Logs tabs.
- **Composer:** “Ask x-bo to build…” text input, submit action and template suggestions. Attachments should only be enabled when upload and backend processing are implemented.
- **Right inspector:** selected element/file properties, design tokens, integration settings and task status.
- **Mobile:** collapsible navigation, one main pane at a time, touch-sized controls and no horizontal overflow.

### Visual language

- Dark, low-distraction developer workspace.
- Near-black surfaces with subtle blue/violet accents and restrained glow.
- Clear hierarchy, compact metadata, readable contrast and visible keyboard focus.
- Prefer square or lightly rounded controls and precise spacing over decorative gradients.
- Empty, loading, error, offline and permission-denied states must be designed explicitly.

## 4. Template starter set

| Template | Initial scope |
| --- | --- |
| SaaS landing page | Hero, benefits, pricing and responsive navigation |
| Analytics dashboard | KPI cards, charts and filters with sample data clearly labeled |
| Contact form | Validation, accessible labels and submit/error states |
| Finance calculator | Inputs, computed outputs and boundary tests |
| Admin workspace | Sidebar, table, search and detail panel |

Templates are starter scaffolds, not production-ready applications by default. Authentication, authorization, real data, accessibility, security and deployment configuration must be reviewed for each project.

## 5. Integration contracts

- **Provider adapter:** provider ID, supported models, configuration validation, timeout/error handling and streaming capability.
- **Framework adapter:** file conventions, build command, test command and dependency policy for the chosen stack.
- **Database/API adapter:** schema-aware operations, secret references, explicit permission scopes and redacted logs.
- **GitHub adapter:** least-privilege OAuth, branch-based writes, diff preview and PR creation.
- **Deployment adapter:** environment validation, staging preview, explicit release approval, health check and rollback status.

Adapters should expose capabilities and readiness; the UI should hide or disable actions that are not configured and tested.

## 6. Security and reliability checklist

- [ ] Treat prompts, uploaded files, repositories and generated code as untrusted.
- [ ] Never expose provider tokens in frontend code, prompts, generated files or logs.
- [ ] Keep credentials in server-side environment variables or a managed secret store.
- [ ] Validate uploads and restrict size/type; scan or sandbox content before processing.
- [ ] Run generated code in an isolated workspace with resource and network limits.
- [ ] Require explicit confirmation for destructive edits, external writes and production deployment.
- [ ] Use branch/PR workflow and show the full diff before syncing.
- [ ] Run lint, type checks, tests and production build before release.
- [ ] Provide timeout handling, retry boundaries, cancellation and useful errors.
- [ ] Verify accessibility, keyboard navigation and mobile layouts.

## 7. Current implementation boundary

The existing X-BO repository contains a React/Vite UI and an API-backed text chat panel with provider selection. This change improves the prompt-first entry experience and documents the product architecture. A true visual upload pipeline, autonomous task planner, generated-code preview/editor, GitHub write integration and OCODE.js deployment adapter must be implemented and tested separately before being presented as working product capabilities.

## 8. Acceptance criteria for future implementation

1. A user can submit a prompt and receive an API response with useful error states.
2. Templates prefill actionable prompts and do not imply that generation already occurred.
3. A generated workspace lists actual files and provides a real diff.
4. Preview is tied to a successful isolated build and shows build failures.
5. GitHub sync creates a branch and PR without secrets.
6. Deployment actions remain disabled until the target integration is configured and validated.
7. Mobile viewport, keyboard access, error states and automated checks pass.


## Verified UI behavior and implementation boundaries

The prompt-first screen provides starter prompt cards, a provider selector populated from the frontend's configured option list, and a send action. The selector is a request parameter; it does not guarantee that a provider is configured or reachable. Backend credentials must remain server-side.

- The prompt composer sends on **Ctrl/Cmd + Enter**; **Shift + Enter** inserts a newline.
- The client preserves the prompt after a request failure and displays an actionable error state.
- Client tests cover empty prompt/provider validation, successful JSON responses, HTTP errors, malformed JSON, and empty response payloads.
- The browser-side draft planner is a planning aid only. It does not create or modify project files.
- Do not claim that templates generate complete applications, that a live preview exists, or that GitHub write-back/deployment works unless those paths have dedicated implementation and passing integration checks.
