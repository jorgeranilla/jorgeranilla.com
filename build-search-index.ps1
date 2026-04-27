$root = "c:\Projects\Antigravity"
$excludeFolders = @("babyshower")
$pages = [System.Collections.Generic.List[object]]::new()

$htmlFiles = Get-ChildItem -Path $root -Filter "*.html" -Recurse | Where-Object {
    $rel = $_.FullName.Substring($root.Length + 1)
    $topFolder = ($rel -split '\\')[0]
    -not ($excludeFolders -contains $topFolder)
} | Sort-Object FullName

foreach ($file in $htmlFiles) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)

    # Extract title - strip "Jorge Ranilla | " prefix if present
    $titleMatch = [regex]::Match($content, '<title>(?:Jorge Ranilla \| )?([^<]+)</title>')
    $title = if ($titleMatch.Success) { $titleMatch.Groups[1].Value.Trim() } else { $file.BaseName }

    # Relative URL from root with forward slashes
    $relPath = $file.FullName.Substring($root.Length + 1) -replace '\\', '/'

    $pages.Add([PSCustomObject]@{ title = $title; url = $relPath })
    Write-Host "$relPath --> $title"
}

# Write to search-index.json
$json = $pages | ConvertTo-Json -Depth 2
[System.IO.File]::WriteAllText("$root\search-index.json", $json, [System.Text.Encoding]::UTF8)
Write-Host "`nDone. $($pages.Count) pages indexed -> search-index.json"
