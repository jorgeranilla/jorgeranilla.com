/* ===========================
   Site-Wide Search Functionality
   Auto-discovers pages from search-index.json
   Searches indexed page content and dynamic blog posts
=========================== */

// Cache for fetched page content
const pageContentCache = {};

// Loaded page list (populated from search-index.json)
let searchPages = [];

function loadJsonp(url) {
    return new Promise((resolve, reject) => {
        const callbackName = `searchFeedCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const script = document.createElement('script');
        const separator = url.includes('?') ? '&' : '?';

        window[callbackName] = data => {
            cleanup();
            resolve(data);
        };

        function cleanup() {
            delete window[callbackName];
            script.remove();
        }

        script.onerror = () => {
            cleanup();
            reject(new Error('Unable to load Blogger feed'));
        };

        script.src = `${url}${separator}callback=${callbackName}`;
        document.head.appendChild(script);
    });
}

async function loadBloggerFeed() {
    const fetchUrl = 'https://memoria-efimera.blogspot.com/feeds/posts/default?alt=json&max-results=50';
    const jsonpUrl = 'https://memoria-efimera.blogspot.com/feeds/posts/default?alt=json-in-script&max-results=50';

    try {
        const blogRes = await fetch(fetchUrl);
        if (!blogRes.ok) throw new Error(`Blogger feed returned ${blogRes.status}`);
        return await blogRes.json();
    } catch (e) {
        return loadJsonp(jsonpUrl);
    }
}

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

    // Dynamically fetch latest Blogger posts so search is always 100% up to date automatically
    try {
        const blogData = await loadBloggerFeed();
        
        if (blogData && blogData.feed && blogData.feed.entry) {
            blogData.feed.entry.forEach(entry => {
                const title = entry.title.$t;
                let htmlContent = entry.content ? entry.content.$t : (entry.summary ? entry.summary.$t : '');
                
                // Clean HTML tags to get pure text
                let tmp = document.createElement('DIV');
                tmp.innerHTML = htmlContent;
                const cleanContent = (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
                
                // Extract Post ID
                let postId = '';
                if (entry.id && entry.id.$t) {
                    const idMatch = entry.id.$t.match(/post-(\d+)$/);
                    if (idMatch) postId = idMatch[1];
                }
                
                // Determine Category for the correct URL
                let isFamilyUpdate = false;
                if (entry.category) {
                    isFamilyUpdate = entry.category.some(cat => cat.term === 'Family Updates');
                }
                
                const postUrl = isFamilyUpdate ? `blog/family-updates-individual.html?id=${postId}` : `blog/latest-posts-individual.html?id=${postId}`;
                
                // If this post isn't already in the static search-index.json, add it on the fly!
                if (!searchPages.some(p => p.url === postUrl)) {
                    searchPages.push({
                        title: title,
                        url: postUrl,
                        section: 'Blog',
                        content: cleanContent
                    });
                }
            });
        }
    } catch (e) {
        console.warn('Failed to load dynamic blog posts for search', e);
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
async function fetchPageContent(page) {
    if (page.content !== undefined) return page.content;
    const url = page.url;
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

function normalizeText(text) {
    return (text || '')
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function tokenizeQuery(query) {
    return normalizeText(query)
        .split(/[^a-z0-9]+/i)
        .map(term => term.trim())
        .filter(term => term.length >= 2);
}

function countOccurrences(text, term) {
    if (!term) return 0;
    let count = 0;
    let index = 0;

    while ((index = text.indexOf(term, index)) !== -1) {
        count++;
        index += term.length;
    }

    return count;
}

function scorePage(page, content, query, terms) {
    const title = page.title || '';
    const url = page.url || '';
    const normalizedTitle = normalizeText(title);
    const normalizedUrl = normalizeText(url.replace(/[-_/]+/g, ' '));
    const normalizedContent = normalizeText(content);
    const normalizedQuery = normalizeText(query);
    const searchableText = `${normalizedTitle} ${normalizedUrl} ${normalizedContent}`;

    const matchesEveryTerm = terms.every(term => searchableText.includes(term));
    const phraseMatch = normalizedQuery.length > 1 && searchableText.includes(normalizedQuery);

    if (!matchesEveryTerm && !phraseMatch) return 0;

    let score = 0;
    if (phraseMatch) score += 25;
    if (normalizedTitle.includes(normalizedQuery)) score += 40;
    if (normalizedUrl.includes(normalizedQuery)) score += 15;

    terms.forEach(term => {
        if (normalizedTitle.includes(term)) score += 12;
        if (normalizedUrl.includes(term)) score += 6;
        score += Math.min(countOccurrences(normalizedContent, term), 8);
    });

    return score;
}

// Extract a text snippet around the best matching word
function extractSnippet(text, query, terms) {
    const normalized = normalizeText(text);
    const normalizedQuery = normalizeText(query);
    let idx = normalized.indexOf(normalizedQuery);

    if (idx === -1) {
        const firstTerm = terms.find(term => normalized.includes(term));
        idx = firstTerm ? normalized.indexOf(firstTerm) : -1;
    }

    if (idx === -1) return '';
    const matchLength = normalizedQuery.length > 1 ? normalizedQuery.length : terms[0].length;
    const start = Math.max(0, idx - 80);
    const end = Math.min(text.length, idx + matchLength + 120);
    let snippet = text.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet += '...';
    return snippet;
}

// Highlight matching text
function highlightText(text, query) {
    const terms = [query, ...query.split(/\s+/)].filter(term => term.trim().length >= 2);
    if (terms.length === 0) return escapeHtml(text);

    const regex = new RegExp(`(${terms.map(escapeRegex).join('|')})`, 'gi');
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

    const terms = tokenizeQuery(query);
    if (terms.length === 0) {
        container.innerHTML = '<p class="search-hint">Type at least 2 characters to search...</p>';
        return;
    }

    const results = (await Promise.all(
        searchPages.map(async page => {
            const content = await fetchPageContent(page);
            const relevance = scorePage(page, content, query, terms);
            if (relevance === 0) return null;

            return {
                ...page,
                snippet: extractSnippet(content, query, terms) || page.title,
                relevance
            };
        })
    )).filter(Boolean).sort((a, b) => {
        if (b.relevance !== a.relevance) return b.relevance - a.relevance;
        return (a.title || '').localeCompare(b.title || '');
    });

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
