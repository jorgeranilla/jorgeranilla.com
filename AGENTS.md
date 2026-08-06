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

## Runtime Data-Source Map

Use the existing owner for each kind of content. Do not copy the same data into a second system merely for convenience.

| Content or feature | Source of truth | Runtime path |
| --- | --- | --- |
| Page layout, navigation, profile biography text, public metadata, and local images | This Git repository | GitHub Pages serves the committed static files |
| Shared header, footer, social rail, breadcrumbs, and profile helper links | `script.js` plus page `data-*` attributes | Injected in the browser without a database read |
| Internal site search | Generated `search-index.json` | Queried locally by `search-dynamic.js` |
| Family and People gallery media | Google Drive folders configured in the gallery pages | Google Drive API lists files; Drive thumbnail and preview URLs serve the media |
| Gallery identity and approval metadata | Firestore `familyPhotoTags` | Public galleries read only approved tag documents and cache them temporarily |
| Family directory, claims, approvals, and protected workflows | Firestore, Firebase Authentication, and Cloud Functions | Dynamic only where authentication or moderation is required |
| Latest Posts and Life Updates | The public Blogger feed for `memoria-efimera.blogspot.com` | Static pages load Blogger JSONP directly; Firestore is not involved |
| Production hosting and custom domain | GitHub Pages and root `CNAME` | `https://jorgeranilla.com` |

Do not place Google Drive media binaries, Blogger posts, or Firestore records into generated duplicate collections unless Jorge approves a migration and rollback plan. Never place API keys, service-account files, tokens, or other secrets in this document or in public client files.

## Shared Page Shell and Breadcrumb Contract

- Public pages load the shared root `style.css`, `script.js`, and, where appropriate, `search-dynamic.js`. Preserve each page's correct relative path to these files.
- Pages provide `<div id="social-rail-placeholder"></div>` and `<div id="header-placeholder"></div>`. `script.js` injects the common social rail and site header. It also supplies the standard footer when the page does not already contain `footer.site-footer`.
- A page that participates in the family hierarchy uses:

  ```html
  <div class="breadcrumb-bar">
    <nav id="breadcrumbs" class="breadcrumb-container" aria-label="Breadcrumb"></nav>
  </div>
  ```

- The page `<body>` supplies the section and current title, for example `<body data-section="Family" data-title="Jorge Ranilla">` or `<body data-section="People" data-title="Alexia Mittrany">`.
- `script.js` builds breadcrumbs from the clean filename, the body attributes, and `PAGE_HIERARCHY`. When adding or moving a page that needs more than the fallback `Home / Section / Title`, add its clean path to `PAGE_HIERARCHY` and verify every ancestor link.
- Keep breadcrumb labels, canonical URLs, navigation links, and `PAGE_HIERARCHY` synchronized. Use clean public links without `.html`, but keep the actual static `.html` file unless an approved migration says otherwise.
- Never hand-copy a different header, footer, or breadcrumb implementation into one profile. Reuse the shared shell so all profiles change together.

## Family and People Profile Page Contract

Every new or modified person profile should follow an existing profile in the same section. Use `family/jorge-ranilla.html` as a family-profile reference and a current file under `people/` as a People-profile reference.

Required profile structure and metadata:

1. Use a stable, lowercase, hyphenated filename and identity slug. Do not casually change a published slug because the profile URL, gallery query, photo tags, claims, search index, and external links may depend on it.
2. Include a descriptive `<title>`, meta description, canonical clean URL, and matching Open Graph/Twitter metadata. Family canonicals use `/family/slug`; People canonicals use `/people/slug`.
3. Set the correct body attributes and include the shared placeholders and breadcrumb markup described above.
4. Keep the standard content hierarchy: `main.page-content`, `section.about-section`, `h2.page-title.page-title--sm`, `div.about-grid`, `div.about-photo-card` containing `img.about-photo`, and `div.about-text` containing the biography.
5. Write meaningful image `alt` text, normally the person's display name. Do not leave a broken image, an empty source, or an externally hotlinked placeholder.
6. When no real portrait exists, use the appropriate repository sample image: `images/placeholder-avatar.jpg` or `images/placeholder-avatar-female.jpg`. From `family/` or `people/`, the normal relative path is `../images/...`. Replace the placeholder only when a real approved photo is available.
7. Family portrait assets normally belong under `images/bios/` or `images/extended-family/`. Existing People portrait assets normally live beside their `people/*.html` profile. Follow the current section convention and do not duplicate an existing image under a new name.
8. Keep profile names standardized and emoji-free for matching. Preserve valid aliases, family relationships, directory identity, and profile-claim behavior.

Profile gallery links use the shared dynamic album rather than a separate static album page:

```html
<p class="bio-album-actions">
  <a href="../gallery/family/person?person=stable-slug&amp;name=Display%20Name&amp;alias=stable-alias" class="bio-album-link">View Photo Album</a>
</p>
```

- A Family profile points to `../gallery/family/person`; a People profile points to `../gallery/people/person`.
- `person` is the canonical stable identity slug, `name` is the URL-encoded display label, and optional `alias` is a stable supported alias. These values must agree with photo-tag identity data.
- `script.js` can inject a missing Family album link and the profile-management/claim prompt. Preserve an intentional explicit album link; do not add a second one.
- Claims route to `family-directory/profile` with identity and source context and remain approval-based. A submitted claim must never alter a published profile automatically.
- After adding or changing a public profile, rebuild `search-index.json`, verify the profile appears in internal search, and add the canonical URL to `sitemap.xml` only if the page is public and indexable.

## Google Drive Gallery and Photo-Tag Pipeline

The gallery is a combined Drive-plus-Firestore view. Google Drive owns the media files; Firestore owns only the approved identity/tag metadata needed to filter those files.

- The shared renderer is `gallery/family/smart-family-gallery.js`.
- `gallery/family.html` starts the all-family gallery and contains the configured Family Google Drive master-folder ID.
- `gallery/family/person.html` is the reusable filtered Family album. It reads `person`, `name`, and optional `alias` from the URL instead of requiring one HTML album per person.
- `gallery/people/person.html` is the reusable People album and contains the configured People Google Drive folder ID. It returns to the matching `people/slug` profile.
- Do not move, replace, or duplicate these folder IDs without tracing every consumer. Folder IDs are stable infrastructure identifiers, not display text.

At runtime, the Drive API lists non-trashed image and video children of the configured folder with pagination. Images use Drive thumbnail URLs, and Drive videos use Drive preview URLs. YouTube entries are not Drive files; they are derived from the same already-loaded approved tag result and embedded from YouTube.

The Firestore collection `familyPhotoTags` connects media to people and albums:

- A Drive item's tag document ID corresponds to the stable Drive file ID. YouTube entries use their existing stable derived IDs.
- Public galleries display only documents whose `status` is `approved`.
- Identity may be represented by the existing `people`, `peopleAliases`, `personIds`, `peopleLabels`, and related fields. Preserve the current schema and stable values rather than inventing a parallel identity list.
- Album membership uses the existing `albums` data. Do not infer permanent identity solely from a filename.
- The saved Drive fingerprint helps detect a replaced or changed file. Do not allow a new file body to inherit stale approved tags blindly.
- Approved tag data is cached in `localStorage` for a limited period and reused for filters and YouTube items. Preserve the single-query approach; do not add per-photo reads or a second query for YouTube.

`family-directory/photo-tags.html` and its JavaScript are the administrative tagging workflow. Suggestions and public tag options pass through the existing Cloud Functions and security rules. Manual photo-tag identities must survive automated synchronization. Never delete a manual identity merely because it is absent from a Drive scan, directory scan, or automation input.

When changing a gallery, test all-gallery mode, one Family person album, one People album, an untagged item, an approved tagged item, Drive image/video rendering, YouTube rendering, back links, URL encoding, and the empty-state message. Record the actual Firestore query count.

## Blogger, Latest Posts, and Life Updates Pipeline

Blogger is the publishing source for blog content. The public feed comes from `https://memoria-efimera.blogspot.com/feeds/posts/default`. Because the production site is static GitHub Pages, blog pages use Blogger's public JSONP feed; they do not copy posts into Firestore.

- `blog/latest-posts.html` loads Blogger entries in paginated batches, builds summary cards, and excludes entries labeled `Life Updates` so the two sections do not duplicate each other.
- `blog/latest-posts-individual.html?id=BLOGGER_POST_ID` loads one Blogger entry by its stable numeric Blogger post ID and renders the full article.
- `blog/life-updates.html` loads the Blogger label feed for `Life Updates`. To publish an entry in this section, assign the exact Blogger label `Life Updates`.
- `blog/life-updates-individual.html?id=BLOGGER_POST_ID` loads the individual update by the same stable numeric ID.
- The home page loads the most recent Life Update separately and excludes Life Updates from its general/random blog selection.
- `Family Updates` is a legacy label. The public section name is `Life Updates`; do not reintroduce the old name in visible UI.
- Do not show `Life Updates` or legacy `Family Updates` as a redundant badge on cards or individual posts. Additional meaningful Blogger labels may appear as sub-tags.
- Preserve the existing content cleanup that removes Blogger inline font, color, and background styles so site typography remains consistent. Do not remove semantic article content while sanitizing presentation.
- Card and share links must continue using the stable Blogger post ID. Do not derive permanent links from a mutable title.

Changes to Blogger feed code should be tested with a normal post, a Life Update, a post with multiple labels, a post with inline images/styles, pagination, an invalid ID, and sharing. Expected Firestore activity for all Blogger pages is zero reads, zero writes, zero listeners, and zero triggers.

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
