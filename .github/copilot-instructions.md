# GitHub Copilot Instructions

The canonical repository instructions are in [`AGENTS.md`](../AGENTS.md). Read and follow that file before proposing or applying any change.

Critical constraints:

- Production is hosted on GitHub Pages; keep `CNAME` in the repository root.
- Keep the site static-first and use Firestore only for genuinely dynamic or protected workflows.
- Minimize Firestore reads and writes; prohibit duplicate reads, N+1 queries, unnecessary listeners, page-load writes, analytics, counters, and logging.
- Never delete anything in `people/` or `FSBO/` without Jorge explicitly approving the exact file.
- Preserve the existing gallery, tag, directory, profile-claim, cache, sitemap, and search-index optimizations documented in `AGENTS.md`.
- Make the smallest possible change and report regression risks, Firestore cost impact, tests, and deployment target.
