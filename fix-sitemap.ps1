# fix-sitemap.ps1
# Fixes sitemap.xml:
#   1. Replaces /index.html with / (GitHub Pages redirects index.html to /)
#   2. Removes template/private pages that shouldn't be indexed
#   3. Updates lastmod date to today

$sitemapPath = "c:\Projects\jorgeranilla.com\sitemap.xml"
$today = (Get-Date).ToString("yyyy-MM-dd")

# URLs to REMOVE from sitemap (templates, redirects, private pages)
$removeUrls = @(
    "https://jorgeranilla.com/index.html",
    "https://jorgeranilla.com/gallery/family/person.html",
    "https://jorgeranilla.com/blog/family-updates-individual.html",
    "https://jorgeranilla.com/blog/latest-posts-individual.html",
    "https://jorgeranilla.com/FSBO/buyer-flyer.html",
    "https://jorgeranilla.com/FSBO/index.html",
    "https://jorgeranilla.com/shop/cart.html",
    "https://jorgeranilla.com/shop/contact.html",
    "https://jorgeranilla.com/shop/product.html",
    "https://jorgeranilla.com/shop/shop.html",
    "https://jorgeranilla.com/shop/index.html"
)

$content = [System.IO.File]::ReadAllText($sitemapPath, [System.Text.Encoding]::UTF8)

# Replace index.html with clean URL
$content = $content -replace '<loc>https://jorgeranilla\.com/index\.html</loc>', '<loc>https://jorgeranilla.com/</loc>'

# Replace connect/index.html with clean URL
$content = $content -replace '<loc>https://jorgeranilla\.com/connect/index\.html</loc>', '<loc>https://jorgeranilla.com/connect/</loc>'

# Remove full <url>...</url> blocks for unwanted pages
foreach ($url in $removeUrls) {
    $escapedUrl = [Regex]::Escape($url)
    # Match a <url> block containing this loc (handles whitespace variations)
    $content = $content -replace "(?s)\s*<url>\s*<loc>$escapedUrl</loc>.*?</url>", ""
}

# Update all lastmod dates to today
$content = $content -replace '<lastmod>\d{4}-\d{2}-\d{2}</lastmod>', "<lastmod>$today</lastmod>"

# Add homepage entry near top if not already present
if ($content -notmatch '<loc>https://jorgeranilla\.com/</loc>') {
    $homepageEntry = @"
  <url>
    <loc>https://jorgeranilla.com/</loc>
    <lastmod>$today</lastmod>
    <priority>1.0</priority>
  </url>
"@
    $content = $content -replace '(<urlset[^>]*>)', "`$1`n$homepageEntry"
}

[System.IO.File]::WriteAllText($sitemapPath, $content, [System.Text.Encoding]::UTF8)
Write-Host "sitemap.xml updated successfully."
