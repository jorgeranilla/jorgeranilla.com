/* ===========================
   Site-Wide Search Functionality
   Dynamic Content Search - searches actual page content
   NOTE: This requires the site to be hosted on a web server
   (like GitHub Pages). It won't work with file:// protocol.
=========================== */

// Page list - will fetch actual content dynamically
const searchPages = [
    { title: "Home", url: "index.html" },
    { title: "My Story", url: "family/my-story.html" },
    { title: "The Kids", url: "family/the-kids.html" },
    { title: "Heritage & Roots", url: "family/heritage-roots.html" },
    { title: "Family Tree", url: "family/family-tree.html" },
    { title: "Ancestry", url: "family/ancestry.html" },
    { title: "Victor", url: "family/victor.html" },
    { title: "Sylvia Ines", url: "family/sylvia-ines.html" },
    { title: "Jorge Luis", url: "family/jorge-luis.html" },
    { title: "Shane", url: "family/shane.html" },
    { title: "Maria", url: "family/maria.html" },
    { title: "Jorge", url: "family/jorge.html" },
    { title: "Alyssa", url: "family/alyssa.html" },
    { title: "Family Gallery", url: "gallery/family.html" },
    { title: "Portraits Gallery", url: "gallery/portraits.html" },
    { title: "Travel Gallery", url: "gallery/travel.html" },
    { title: "At a Glance", url: "professional/at-a-glance.html" },
    { title: "Resume", url: "professional/resume.html" },
    { title: "Portfolio", url: "professional/portfolio.html" },
    { title: "Latest Posts", url: "blog/latest-posts.html" },
    { title: "Family Updates", url: "blog/family-updates.html" }
];

// Cache for fetched page content
const pageContentCache = {};

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

// Fetch page content
async function fetchPageContent(url) {
    // Check cache first
    if (pageContentCache[url]) {
        return pageContentCache[url];
    }

    try {
        // Calculate the correct path based on current page depth
        // We determine depth by matching the current URL against our known pages list
        let prefix = '';
        const pathname = window.location.pathname;
        const normalizedPath = pathname.endsWith('/') ? pathname + 'index.html' : pathname;

        // Find which page we are currently on
        const currentPage = searchPages.find(page => {
            return normalizedPath.replace(/\\/g, '/').toLowerCase().endsWith(page.url.toLowerCase());
        });

        if (currentPage) {
            // Count directory depth based on the known relative URL
            // e.g. "family/my-story.html" has 1 slash -> depth 1 -> "../"
            const depth = currentPage.url.split('/').length - 1;
            prefix = depth > 0 ? '../'.repeat(depth) : '';
        } else {
            // Fallback for pages not in the search list (e.g. 404, or new pages)
            // Try to guess depth from path segments, assuming typical structure
            // If path contains 'family', 'gallery', 'professional', 'blog', we assume depth 1
            const pathLower = normalizedPath.toLowerCase();
            if (pathLower.includes('/family/') || pathLower.includes('/gallery/') ||
                pathLower.includes('/professional/') || pathLower.includes('/blog/')) {
                prefix = '../';
            }
        }

        const fullUrl = prefix + url;
        const response = await fetch(fullUrl);
        const html = await response.text();

        // Parse HTML and extract text content
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Remove script and style tags
        const scripts = doc.querySelectorAll('script, style, nav, header');
        scripts.forEach(el => el.remove());

        // Get text content
        const textContent = doc.body.textContent || '';
        const cleanText = textContent.replace(/\s+/g, ' ').trim();

        // Cache it
        pageContentCache[url] = cleanText;
        return cleanText;
    } catch (error) {
        console.error('Error fetching page:', url, error);
        return '';
    }
}

// Extract snippet around match
function extractSnippet(text, query, maxLength = 150) {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return '';

    // Find start and end positions for snippet
    const start = Math.max(0, index - 60);
    const end = Math.min(text.length, index + query.length + 90);

    let snippet = text.substring(start, end);

    // Add ellipsis if needed
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    return snippet;
}

// Perform search with dynamic content
async function performSearch(query) {
    const resultsContainer = document.getElementById('searchResults');
    if (!resultsContainer) return;

    query = query.trim();

    if (query.length === 0) {
        resultsContainer.innerHTML = '<p class="search-hint">Start typing to search across all pages...</p>';
        return;
    }

    if (query.length < 2) {
        resultsContainer.innerHTML = '<p class="search-hint">Type at least 2 characters to search...</p>';
        return;
    }

    // Show loading state
    resultsContainer.innerHTML = '<p class="search-hint">Searching...</p>';

    // Search through all pages
    const searchPromises = searchPages.map(async (page) => {
        const content = await fetchPageContent(page.url);
        const lowerContent = content.toLowerCase();
        const lowerQuery = query.toLowerCase();

        // Check if page title or content contains the query
        if (page.title.toLowerCase().includes(lowerQuery) || lowerContent.includes(lowerQuery)) {
            const snippet = extractSnippet(content, query);
            return {
                ...page,
                snippet: snippet || page.title,
                relevance: page.title.toLowerCase().includes(lowerQuery) ? 2 : 1 // Title matches rank higher
            };
        }
        return null;
    });

    const results = (await Promise.all(searchPromises)).filter(r => r !== null);

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="search-no-results">No results found for "' + escapeHtml(query) + '"</p>';
        return;
    }

    // Calculate current depth for relative URLs
    let prefix = '';
    const pathname = window.location.pathname;
    const normalizedPath = pathname.endsWith('/') ? pathname + 'index.html' : pathname;

    const currentPage = searchPages.find(page => {
        return normalizedPath.replace(/\\/g, '/').toLowerCase().endsWith(page.url.toLowerCase());
    });

    if (currentPage) {
        const depth = currentPage.url.split('/').length - 1;
        prefix = depth > 0 ? '../'.repeat(depth) : '';
    } else {
        const pathLower = normalizedPath.toLowerCase();
        if (pathLower.includes('/family/') || pathLower.includes('/gallery/') ||
            pathLower.includes('/professional/') || pathLower.includes('/blog/')) {
            prefix = '../';
        }
    }

    // Display results
    const resultsHTML = results.map(result => {
        const highlightedTitle = highlightText(result.title, query);
        const highlightedSnippet = highlightText(result.snippet, query);
        const url = prefix + result.url;

        return `
      <a href="${url}" class="search-result-item">
        <div class="search-result-title">${highlightedTitle}</div>
        <div class="search-result-snippet">${highlightedSnippet}</div>
        <div class="search-result-url">${result.url}</div>
      </a>
    `;
    }).join('');

    resultsContainer.innerHTML = `
    <p class="search-results-count">Found ${results.length} result${results.length !== 1 ? 's' : ''}</p>
    ${resultsHTML}
  `;
}

// Highlight matching text
function highlightText(text, query) {
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return escapeHtml(text).replace(regex, '<mark>$1</mark>');
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Escape regex special characters
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Debounce function to avoid too many searches while typing
let searchTimeout;
function debouncedSearch(query) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        performSearch(query);
    }, 300); // Wait 300ms after user stops typing
}

// Set up search input listener
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });

        // Close modal on Escape key
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeSearchModal();
            }
        });
    }

    // Close modal when clicking outside
    const modal = document.getElementById('searchModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeSearchModal();
            }
        });
    }

    // Keyboard shortcut: Ctrl+K or Cmd+K to open search
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openSearchModal();
        }
    });
});
