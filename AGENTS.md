# AI Agent Instructions — jorgeranilla.com

These instructions are mandatory for every AI model, coding agent, automation, and human-assisted agent working in this repository. Protect the current architecture, data integrity, low operating cost, and existing features.

## Production Architecture

- The production website at `https://jorgeranilla.com` is hosted by **GitHub Pages**.
- `CNAME` must remain in the repository root; GitHub Pages requires it there for the custom domain.
- Static website changes become live only after the intended Git commit reaches the GitHub Pages publishing branch. A Firebase Hosting deploy does not update `jorgeranilla.com`.
- Firebase Hosting may exist as a mirror or test target, but it is not the production host. Do not replace GitHub Pages with Firebase Hosting, Vercel, Netlify, or another platform unless Jorge explicitly approves an architecture change.
- Keep the site static-first. Prefer repository HTML, CSS, JavaScript, images, and JSON.
- Use Firebase only when GitHub Pages cannot implement a feature safely or practically.
- Use Firestore only for genuinely dynamic or protected data: authentication, approvals, profile claims, private workflows, or information that cannot reasonably live in static files.
- Never put layouts, navigation, static copy, public metadata, rarely changing public content, analytics, page views, or counters in Firestore.

## Important Repository Contracts

- `index.html`, `style.css`, and `script.js` provide the primary website shell and behavior.
- `search-dynamic.js` is the internal search engine. `search-index.json` is its static data source; they are complementary, not duplicates.
- Rebuild the internal index with `tools/build-search-index.ps1` after adding, removing, renaming, or materially changing searchable pages.
- `sitemap.xml` is for search-engine discovery. It must contain only real, public, canonical URLs. It must not contain login, admin, private, template, cart, or `noindex` pages. A sitemap helps discovery but does not guarantee ranking or immediate indexing.
- `robots.txt`, canonical tags, Open Graph tags, and clean internal links must remain consistent with `https://jorgeranilla.com`.
- Public links should use clean URLs without a visible `.html` suffix. Do not rename the underlying HTML files merely to enforce this.
- `.firebaserc` identifies Firebase project `jorgeranilla-site`.
- `firebase.json` configures Firebase resources and deployment exclusions.
- Realtime Database rules live at `firebase-database.rules.json`.
- Firestore rules live at `family-directory/firestore.rules`.
- Cloud Functions live under `functions/`.
- Maintenance and deployment helpers belong in `tools/`, not scattered through the repository root.
- Do not casually run package-manager installs inside `functions/`. `functions/node_modules` is currently versioned, and an install can create hundreds of unrelated changes. Never commit bulk dependency churn. Inspect the lockfile and diff first.

## Protected Content and Deletion Rules

- Never delete anything in `people/` or `FSBO/` unless Jorge explicitly names the exact file and approves its deletion.
- Never delete or restore files merely because they appear unexpectedly in `git status`; Jorge may be editing or deleting files concurrently.
- Treat a dirty working tree as user-owned. Preserve unrelated changes.
- Before deleting any other unlinked or apparently unused file, provide Jorge a precise candidate list and wait for approval.
- Before deleting, moving, or renaming a file, search all HTML, CSS, JavaScript, JSON, XML, Firebase configuration, and Cloud Functions for direct and dynamic references.
- Never delete, overwrite, bulk-update, or migrate production data without explicit approval, a backup plan, and a rollback plan.

## Firestore Cost Control

Firestore operations must be minimized. Before changing Firestore code, state the expected reads, writes, listeners, triggers, cache behavior, and possible cost impact.

Mandatory rules:

- Never load a full collection without a documented reason. Use filters, limits, pagination, and indexed queries.
- Prefer direct document lookup by stable document ID.
- Use `where()`, `limit()`, cursors, and server-side filtering instead of downloading data and filtering in the browser.
- Avoid N+1 queries, nested per-item reads, and duplicate reads.
- Fetch shared data once per page and derive all views, counts, YouTube items, filters, and badges from that result.
- Reuse already-loaded admin data; do not run a second collection query only to calculate a count.
- Use in-memory caching, static JSON, `sessionStorage`, or `localStorage` when freshness requirements allow it.
- Do not use `onSnapshot()` unless live updates are essential and explicitly justified. Always unsubscribe when the listener is no longer needed.
- Never write to Firestore on ordinary page load unless the workflow explicitly requires it.
- Never use Firestore for analytics, logging, page views, counters, polling, presence, or background tracking without Jorge's approval.
- Do not repeatedly retry expensive profile matching or collection scans during navigation.
- Cloud Functions and triggers must be idempotent. Use stable IDs, completion markers, transactions where appropriate, and guards against loops or duplicate processing.
- Prevent duplicate documents, tags, profiles, approvals, uploads, and automation results.
- Public, cacheable endpoints should use GET and appropriate cache headers. Do not turn cacheable reads into POST requests without a security reason.

## Existing Firestore Optimizations That Must Be Preserved

- The family gallery loads approved tag documents once, caches them locally for a limited time, and derives approved YouTube entries from the same result. Do not restore a separate duplicate YouTube Firestore query.
- The public family directory must query only `status == "approved"` members.
- The admin directory may read all members once when moderation requires it. Pending counts must be derived from that already-loaded result, not from a second collection read.
- Automatic profile-claim attempts are limited per browser session unless the URL contains explicit claim context.
- Expensive fallback profile scans run only with explicit claim context and must remain tightly limited.
- Public photo-tag options are cacheable. Preserve the GET request and server/CDN cache headers.

Any change that weakens one of these protections requires Jorge's explicit approval and a written cost estimate.

## Family Data Integrity

- Never delete manually created photo-tag profiles during automated synchronization.
- Avoid duplicate family profiles and duplicate photo tags.
- Keep standardized names clean and emoji-free for identity matching and tagging.
- Preserve valid profile URLs, photo-tag links, biographies, family relationships, family-tree links, gallery references, aliases, and stable IDs.
- Photo tags may link only to valid profiles or explicitly supported gallery-only identities.
- Profile claims remain approval-based. A user submission must never publish profile changes automatically.
- YouTube, Google Drive, Google APIs, Firebase, and GitHub automations must use stable external IDs and completion markers so retries cannot duplicate work.
- Do not change security rules merely to make a client-side operation succeed. Fix the access design and retain least privilege.

## Known Product Decisions

- “Life Updates” is the section name. Do not show a redundant “Life Updates” badge inside every Life Updates post card.
- The expired America250 carousel slide and its dedicated asset/styles were removed. Do not restore them. The July 2026 sliding announcement is: `★ July 2026 · Honoring 250 years of the American story—past, present, and still being written.`
- The internal search must continue to include every public profile under `people/`.
- Private pages, admin tools, login flows, dynamic templates, and checkout/cart pages should not be added to the Google sitemap merely to increase its URL count.

## Safe Change Workflow

Before editing:

1. Inspect `git status` and assume unrelated changes belong to Jorge.
2. Identify every file, page, collection, rule, Function, and workflow that may be affected.
3. Trace callers and consumers before modifying shared JavaScript, CSS, Firebase helpers, navigation, profile identity data, or route configuration.
4. Describe the main regression risks.
5. State the expected Firestore reads, writes, listeners, triggers, and cost impact, including “zero” when applicable.
6. Explain why the selected implementation is the lowest-cost static-first option.

During editing:

- Make the smallest possible change.
- Do not rewrite, rename, refactor, reorganize, replace, or delete unrelated code.
- Preserve clean URLs, relative paths, canonical URLs, IDs, CSS hooks, existing accessibility behavior, and mobile behavior.
- Do not silently add dependencies, paid services, database listeners, background jobs, or new hosting platforms.
- If concurrent user changes appear, stop modifying overlapping files and reassess instead of restoring or overwriting them.

Before deployment:

- Validate syntax for every changed JavaScript, JSON, XML, rules, and script file.
- Test the changed page and closely related pages.
- Test navigation, clean links, missing assets, and browser-console errors.
- When relevant, test family profiles, `people/` profiles, family directory, gallery, photo tags, biographies, family tree, Life Updates, authentication, and approval flows.
- Test desktop and mobile layouts.
- Verify actual Firestore query counts and confirm no new duplicate read/write path was introduced.
- Compile/validate Firestore and Realtime Database rules.
- Confirm `sitemap.xml` contains no nonexistent URLs and `search-index.json` includes all intended public pages.
- Confirm the correct deployment target. Static production changes require GitHub Pages publication; Firebase Functions and rules require a Firebase deploy. Do not confuse the Firebase mirror with the production domain.
- Never deploy, commit, push, or publish unrelated working-tree changes without confirming scope.

After editing, report:

1. What was modified.
2. What was tested and the result.
3. The resulting Firestore reads, writes, listeners, triggers, and cost impact.
4. Remaining risks, assumptions, and follow-up work.
5. What was deployed and to which platform. Never say `jorgeranilla.com` is updated based only on a Firebase Hosting success message; verify the GitHub Pages production URL.

## Required Communication Format

Before every change, explain:

1. Affected files, pages, collections, or workflows.
2. Main regression risks.
3. Expected Firestore reads, writes, listeners, and triggers.
4. Why the approach is the lowest-cost option.

After every change, summarize:

1. What changed.
2. What was tested.
3. Whether any Firestore cost impact was introduced.
4. Remaining risks or follow-up work.

Do not guess, silently change architecture, introduce paid services, or choose a Firestore-heavy solution when a static GitHub Pages solution is available.
