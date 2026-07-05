# add-og-tags.ps1
# Adds Open Graph meta tags to all HTML files that are missing them.
# Run from the project root: .\tools\add-og-tags.ps1

$projectRoot = Split-Path -Parent $PSScriptRoot
$baseUrl = "https://jorgeranilla.com"
$desc = "A space to share family stories, celebrate heritage, and preserve memories across generations."
$img  = "https://jorgeranilla.com/images/og-banner.png"
$modified = 0
$skipped  = 0

Get-ChildItem -Path $projectRoot -Recurse -Filter "*.html" | ForEach-Object {
    $file    = $_
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)

    if ($content -match 'property="og:title"') {
        $skipped++
        return
    }

    $pageTitle = "Jorge Ranilla"
    if ($content -match '<title>([^<]+)</title>') {
        $pageTitle = $Matches[1].Trim()
    }

    $rel = $file.FullName.Substring($projectRoot.Length).Replace('\', '/').TrimStart('/')
    $pageUrl = if ($rel -eq 'index.html') { "$baseUrl/" } elseif ($rel -match '^(.+/)index\.html$') { "$baseUrl/$($Matches[1])" } else { "$baseUrl/$($rel -replace '\.html$', '')" }

    $nl   = "`r`n"
    $ind  = "    "
    $ogBlock  = $nl
    $ogBlock += $ind + "<!-- Open Graph / Social Sharing -->" + $nl
    $ogBlock += $ind + '<meta property="og:type" content="website">' + $nl
    $ogBlock += $ind + '<meta property="og:url" content="' + $pageUrl + '">' + $nl
    $ogBlock += $ind + '<meta property="og:title" content="' + $pageTitle + '">' + $nl
    $ogBlock += $ind + '<meta property="og:description" content="' + $desc + '">' + $nl
    $ogBlock += $ind + '<meta property="og:image" content="' + $img + '">' + $nl
    $ogBlock += $ind + '<meta property="og:image:width" content="1200">' + $nl
    $ogBlock += $ind + '<meta property="og:image:height" content="630">' + $nl
    $ogBlock += $ind + '<meta name="twitter:card" content="summary_large_image">' + $nl
    $ogBlock += $ind + '<meta name="twitter:title" content="' + $pageTitle + '">' + $nl
    $ogBlock += $ind + '<meta name="twitter:description" content="' + $desc + '">' + $nl
    $ogBlock += $ind + '<meta name="twitter:image" content="' + $img + '">'

    # Insert block after the <link rel="icon" ...> tag
    $iconPattern = '(<link rel="icon"[^>]*>)'
    if ($content -match $iconPattern) {
        $newContent = [regex]::Replace($content, $iconPattern, ('$1' + $ogBlock))
        [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.UTF8Encoding]::new($false))
        Write-Host "  [ADDED] $rel" -ForegroundColor Green
        $modified++
    } else {
        Write-Host "  [WARN]  No icon link in: $rel" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host ("Done. Modified: " + $modified + "  |  Already had OG tags: " + $skipped) -ForegroundColor Cyan
