$root = "c:\Projects\Antigravity"
$excludeFolders = @("archive", "babyshower")
$excludeFiles = @("mobile-player.html")
$pages = [System.Collections.Generic.List[object]]::new()

function ConvertTo-SearchableText {
    param([string]$Html)

    $text = [regex]::Replace($Html, '(?is)<(script|style|noscript|svg|nav|header|footer)\b.*?</\1>', ' ')
    $text = [regex]::Replace($text, '(?is)<!--.*?-->', ' ')
    $text = [regex]::Replace($text, '(?is)<[^>]+>', ' ')
    $text = [System.Net.WebUtility]::HtmlDecode($text)
    $text = [regex]::Replace($text, '\s+', ' ').Trim()

    return $text
}

$htmlFiles = Get-ChildItem -Path $root -Filter "*.html" -Recurse | Where-Object {
    $rel = $_.FullName.Substring($root.Length + 1)
    $topFolder = ($rel -split '\\')[0]
    -not ($excludeFolders -contains $topFolder) -and -not ($excludeFiles -contains $rel)
} | Sort-Object FullName

foreach ($file in $htmlFiles) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)

    # Extract title - strip "Jorge Ranilla | " prefix if present
    $titleMatch = [regex]::Match($content, '<title>(?:Jorge Ranilla \| )?([^<]+)</title>')
    $title = if ($titleMatch.Success) { $titleMatch.Groups[1].Value.Trim() } else { $file.BaseName }

    # Relative URL from root with forward slashes
    $relPath = $file.FullName.Substring($root.Length + 1) -replace '\\', '/'
    $section = ($relPath -split '/')[0]
    if ($section -eq "index.html") { $section = "Home" }
    $searchableText = ConvertTo-SearchableText $content

    $pages.Add([PSCustomObject]@{
        title = $title
        url = $relPath
        section = $section
        content = $searchableText
    })
    Write-Host "$relPath --> $title"
}

# Write to search-index.json
$json = $pages | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText("$root\search-index.json", $json, [System.Text.Encoding]::UTF8)
Write-Host "`nDone. $($pages.Count) pages indexed -> search-index.json"
