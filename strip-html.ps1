$projectDir = (Get-Item -Path ".\").FullName

# Find all .html, .js, .xml files recursively
$files = Get-ChildItem -Path $projectDir -Recurse -Include *.html, *.js, *.xml -Exclude "node_modules", ".git", ".firebase" | Where-Object { !($_.FullName -match "node_modules|\\.git|\\.firebase") }

$changedFiles = 0

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $originalContent = $content
    $ext = $file.Extension.ToLower()

    if ($ext -eq ".html") {
        # Match href="something.html" but NOT starting with http:// or https://
        $content = [regex]::Replace($content, 'href="(?!(?:http|https)://)([^"?#]+)\.html([?#][^\"]*)?"', 'href="$1$2"')
        # Match onclick="window.location.href='photo-tags.html'"
        $content = [regex]::Replace($content, "window\.location\.href='([^'?#]+)\.html([?#][^']*)?'", 'window.location.href=''$1$2''')
    }
    elseif ($ext -eq ".js") {
        $name = $file.Name.ToLower()
        if ($name -eq "script.js" -and !($file.FullName -match "shop")) {
            $content = [regex]::Replace($content, "buildSectionLink\('([^']*)',\s*'([^']+)\.html'\)", 'buildSectionLink(''$1'', ''$2'')')
            $content = [regex]::Replace($content, '(["''])([^"'']+)\.html\1(?=:\s*\[)', { param($m) $m.Groups[1].Value + $m.Groups[2].Value + $m.Groups[1].Value })
            $content = $content.Replace('const path = window.location.pathname.split("/").pop() || "index.html";', 'const path = window.location.pathname.split("/").pop();')
            $content = $content.Replace('const file = decodeURIComponent(path).toLowerCase();', 'const file = (path ? decodeURIComponent(path).toLowerCase() : "index").replace(/\.html$/, "");')
            $content = $content.Replace('const hierarchyKey = normalizedPath.includes("/gallery/people/") && file === "person.html" ? "people-person.html" : file;', 'const hierarchyKey = normalizedPath.includes("/gallery/people/") && file === "person" ? "people-person" : file;')
            $content = [regex]::Replace($content, '\|\|\s*"index\.html"', '|| "index"')
        }
        elseif ($file.FullName -match "shop\\script\.js" -or $file.FullName -match "shop/script\.js") {
            $content = [regex]::Replace($content, 'href="([^"?#]+)\.html([?#][^\"]*)?"', 'href="$1$2"')
        }
        elseif ($name -eq "search-dynamic.js") {
            $content = [regex]::Replace($content, '\.html\?id=', '?id=')
            $content = [regex]::Replace($content, 'href="([^"#]+)\.html"', 'href="$1"')
        }
    }
    elseif ($ext -eq ".xml") {
        if ($file.Name.ToLower() -eq "sitemap.xml") {
            $content = [regex]::Replace($content, '<loc>([^<]+)\.html</loc>', '<loc>$1</loc>')
        }
    }

    if ($content -cne $originalContent) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        $changedFiles++
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "`nFinished! Updated $changedFiles files."
