# check-og-tags.ps1
# Scans all HTML files and reports any missing og:title tags.
# Run before pushing: .\tools\check-og-tags.ps1

$projectRoot = Split-Path -Parent $PSScriptRoot
$missing = @()

Get-ChildItem -Path $projectRoot -Recurse -Filter "*.html" | ForEach-Object {
    $content = [System.IO.File]::ReadAllText($_.FullName, [System.Text.Encoding]::UTF8)
    if ($content -notmatch 'property="og:title"') {
        $rel = $_.FullName.Substring($projectRoot.Length).Replace('\', '/').TrimStart('/')
        $missing += $rel
    }
}

if ($missing.Count -eq 0) {
    Write-Host "All HTML pages have Open Graph tags." -ForegroundColor Green
} else {
    Write-Host ("MISSING OG TAGS on " + $missing.Count + " page(s):") -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    Write-Host ""
    Write-Host "Run .\add-og-tags.ps1 to fix them automatically." -ForegroundColor Cyan
    exit 1
}
