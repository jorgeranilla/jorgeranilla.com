/* ===========================
   Site-Wide Search Functionality
   Auto-discovers pages from search-index.json
   Searches fetched page content at query time
=========================== */

// Cache for fetched page content
const pageContentCache = {};

// Loaded page list (populated from search-index.json)
let searchPages = [];

// Root prefix: how many ../ levels to reach site root from the current page
function getRootPrefix() {
    const scripts = document.querySelectorAll('script[src*="search-dynamic.js"]');
    if (scripts.length > 0) {
        const src = scripts[0].src;
        const dir = src.substring(0, src.lastIndexOf('/'));
        const pageDir = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
        // Count how many directory levels the page is below the script root
        if (pageDir.startsWith(dir)) {
            const rel = pageDir.substring(dir.length);
            const depth = rel.split('/').filter(Boolean).length;
            return depth > 0 ? '../'.repeat(depth) : '';
        }
    }
    // Fallback: check pathname depth
    const parts = window.location.pathname.split('/').filter(Boolean);
    const depth = parts.length > 0 && parts[parts.length - 1].includes('.') ? parts.length - 1 : parts.length;
    return depth > 1 ? '../'.repeat(depth - 1) : '';
}

// Load page index from search-index.json
async function loadSearchIndex() {
    if (searchPages.length > 0) return; // already loaded
    try {
        const prefix = getRootPrefix();
        const res = await fetch(prefix + 'search-index.json');
        searchPages = await res.json();
    } catch (e) {
        console.warn('search-index.json not found. Search will be unavailable.', e);
        searchPages = [];
    }
}

// Open search modal
window.openSearchModal = function () {
    const modal = document.getElementById('searchModal');
    const input = document.getElementById('searchInput');
    if (modal && input) {
        modal.classList.add('active');
        setTimeout(() => input.focus(), 100);
    }
};

// Close search modal
window.closeSearchModal = function () {
    const modal = document.getElementById('searchModal');
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');
    if (modal) {
        modal.classList.remove('active');
        if (input) input.value = '';
        if (results) results.innerHTML = '<p class="search-hint">Start typing to search across all pages...</p>';
    }
};

// Fetch and cache a page's text content
async function fetchPageContent(url) {
    if (pageContentCache[url]) return pageContentCache[url];
    try {
        const prefix = getRootPrefix();
        const res = await fetch(prefix + url);
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        doc.querySelectorAll('script, style, nav, header').forEach(el => el.remove());
        const clean = (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
        pageContentCache[url] = clean;
        return clean;
    } catch (e) {
        return '';
    }
}

// Extract a text snippet around the matching word
function extractSnippet(text, query) {
    const lower = text.toLowerCase();
    const idx = lower.indexOf(query.toLowerCase());
    if (idx === -1) return '';
    const start = Math.max(0, idx - 60);
    const end = Math.min(text.length, idx + query.length + 90);
    let snippet = text.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet += '...';
    return snippet;
}

// Highlight matching text
function highlightText(text, query) {
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return escapeHtml(text).replace(regex, '<mark>$1</mark>');
}

function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Main search function
async function performSearch(query) {
    const container = document.getElementById('searchResults');
    if (!container) return;

    query = query.trim();
    if (query.length === 0) {
        container.innerHTML = '<p class="search-hint">Start typing to search across all pages...</p>';
        return;
    }
    if (query.length < 2) {
        container.innerHTML = '<p class="search-hint">Type at least 2 characters to search...</p>';
        return;
    }

    container.innerHTML = '<p class="search-hint">Searching...</p>';

    // Make sure index is loaded
    await loadSearchIndex();

    if (searchPages.length === 0) {
        container.innerHTML = '<p class="search-hint">Search index not available.</p>';
        return;
    }

    const lq = query.toLowerCase();

    const results = (await Promise.all(
        searchPages.map(async page => {
            const content = await fetchPageContent(page.url);
            const titleMatch = page.title.toLowerCase().includes(lq);
            const bodyMatch = content.toLowerCase().includes(lq);
            if (!titleMatch && !bodyMatch) return null;
            return {
                ...page,
                snippet: extractSnippet(content, query) || page.title,
                relevance: titleMatch ? 2 : 1
            };
        })
    )).filter(Boolean).sort((a, b) => b.relevance - a.relevance);

    if (results.length === 0) {
        container.innerHTML = `<p class="search-no-results">No results found for "${escapeHtml(query)}"</p>`;
        return;
    }

    const prefix = getRootPrefix();
    container.innerHTML = `
        <p class="search-results-count">Found ${results.length} result${results.length !== 1 ? 's' : ''}</p>
        ${results.map(r => `
            <a href="${prefix}${r.url}" class="search-result-item">
                <div class="search-result-title">${highlightText(r.title, query)}</div>
                <div class="search-result-snippet">${highlightText(r.snippet, query)}</div>
                <div class="search-result-url">${r.url}</div>
            </a>
        `).join('')}
    `;
}

// Debounce: wait 300ms after user stops typing
let searchTimeout;
function debouncedSearch(query) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performSearch(query), 300);
}

// Wire up listeners
document.addEventListener('DOMContentLoaded', () => {
    // Pre-load the index in the background so first search is instant
    loadSearchIndex();

    const input = document.getElementById('searchInput');
    if (input) {
        input.addEventListener('input', e => debouncedSearch(e.target.value));
        input.addEventListener('keydown', e => { if (e.key === 'Escape') closeSearchModal(); });
    }

    const modal = document.getElementById('searchModal');
    if (modal) {
        modal.addEventListener('click', e => { if (e.target === modal) closeSearchModal(); });
    }

    // Ctrl+K / Cmd+K keyboard shortcut
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openSearchModal();
        }
    });
});
