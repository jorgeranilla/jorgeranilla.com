# fix-seo.ps1
# Adds <link rel="canonical"> and <meta name="description"> to all public HTML pages.

$root    = "c:\Projects\jorgeranilla.com"
$baseUrl = "https://jorgeranilla.com"

# Pages to SKIP (private/redirect/template pages)
$skipList = @(
    "family-login.html",
    "professional/portfolio.html",
    "blog/family-updates-individual.html",
    "blog/latest-posts-individual.html",
    "gallery/family/person.html",
    "gallery/people/person.html",
    "gallery/family/alyssa/alyssa-photos.html",
    "FSBO/buyer-flyer.html",
    "FSBO/index.html",
    "shop/cart.html",
    "shop/contact.html",
    "shop/product.html",
    "shop/shop.html",
    "shop/index.html",
    "people/patricia-malca-gallery.html",
    "people/index.html"
)

# Page-specific descriptions
$descriptions = @{
    "index.html"                                     = "Jorge Ranilla personal website - family stories, heritage, professional journey, and memories across generations."
    "connect/index.html"                             = "Get in touch with Jorge Ranilla - contact information and links."
    "professional/resume.html"                       = "Jorge Ranilla professional resume - work experience, education, and skills."
    "professional/at-a-glance.html"                  = "Jorge Ranilla at a glance - a quick overview of professional background and accomplishments."
    "professional/family-archive.html"             = "The story of building a digital family archive through website development, historical research, and preservation."
    "gallery/family.html"                            = "Family photo gallery - cherished moments and memories from the Ranilla family."
    "gallery/portraits.html"                         = "Portrait gallery - professional and personal portraits on jorgeranilla.com."
    "blog/family-updates.html"                       = "Family updates and news from the Ranilla family blog."
    "blog/latest-posts.html"                         = "Latest blog posts from jorgeranilla.com - family, heritage, and personal updates."
    "family/family-tree.html"                        = "Ranilla family tree - explore our genealogy and ancestry going back generations."
    "family/ancestry.html"                           = "Ranilla family ancestry - tracing our roots through Peru and beyond."
    "family/heritage-roots.html"                     = "Heritage and roots of the Ranilla family - cultural history and origins."
    "family/extended-family.html"                    = "Extended family of Jorge Ranilla - aunts, uncles, cousins and more."
    "family/jorge-ranilla.html"                      = "Jorge Ranilla - family profile, biography, and memories."
    "family/jorge-ranilla-cateriano.html"            = "Jorge Ranilla Cateriano - family profile and biography."
    "family/oscar-ranilla.html"                      = "Oscar Ranilla - family profile and biography."
    "family/oscar-ranilla-cateriano.html"            = "Oscar Ranilla Cateriano - family profile and biography."
    "family/raul-ranilla.html"                       = "Raul Ranilla - family profile and biography."
    "family/raul-ranilla-cateriano.html"             = "Raul Ranilla Cateriano - family profile and biography."
    "family/janet-ranilla-cateriano.html"            = "Janet Ranilla Cateriano - family profile and biography."
    "family/victor-ranilla.html"                     = "Victor Ranilla - family profile and biography."
    "family/alyssa-ranilla.html"                     = "Alyssa Ranilla - family profile and biography."
    "family/carolina-ranilla.html"                   = "Carolina Ranilla - family profile and biography."
    "family/paola-ranilla.html"                      = "Paola Ranilla - family profile and biography."
    "family/sergio-ranilla-rondon.html"              = "Sergio Ranilla Rondon - family profile and biography."
    "family/sergio-ranilla-ranilla.html"             = "Sergio Ranilla Ranilla - family profile and biography."
    "family/shane-ranilla.html"                      = "Shane Ranilla - family profile and biography."
    "family/maria-ranilla.html"                      = "Maria Ranilla - family profile and biography."
    "family/jorge-astocondor.html"                   = "Jorge Astocondor - family profile and biography."
    "family/alcira-astocondor.html"                  = "Alcira Astocondor - family profile and biography."
    "family/alcira-astocondor-salazar-lopez.html"    = "Alcira Astocondor Salazar Lopez - family profile and biography."
    "family/alcira-lopez-ruiz.html"                  = "Alcira Lopez Ruiz - family profile and biography."
    "family/adriana-astocondor.html"                 = "Adriana Astocondor - family profile and biography."
    "family/alessandra-briceno.html"                 = "Alessandra Briceno - family profile and biography."
    "family/aurora-rondon-perea.html"                = "Aurora Rondon Perea - family profile and biography."
    "family/baptism.html"                            = "Baptism records and ceremony - Ranilla family baptism memories."
    "family/baptism-es.html"                         = "Bautismo - recuerdos y registros de bautismo de la familia Ranilla."
    "family/baptism-godfather.html"                  = "Baptism godfather - Ranilla family baptism ceremony."
    "family/baptism-godfather-es.html"               = "Padrino de bautismo - ceremonia de bautismo de la familia Ranilla."
    "family/baptism-godmother.html"                  = "Baptism godmother - Ranilla family baptism ceremony."
    "family/baptism-godmother-es.html"               = "Madrina de bautismo - ceremonia de bautismo de la familia Ranilla."
    "family/carlota-astocondor-salazar-lopez.html"   = "Carlota Astocondor Salazar Lopez - family profile and biography."
    "family/carlota-ruiz-guevara.html"               = "Carlota Ruiz Guevara - family profile and biography."
    "family/carlota-salazar-mateo.html"              = "Carlota Salazar Mateo - family profile and biography."
    "family/ernesto-herrera.html"                    = "Ernesto Herrera - family profile and biography."
    "family/eugenio-astocondor.html"                 = "Eugenio Astocondor - family profile and biography."
    "family/eugenio-astocondor-fuertes.html"         = "Eugenio Astocondor Fuertes - family profile and biography."
    "family/eugenio-astocondor-salazar.html"         = "Eugenio Astocondor Salazar - family profile and biography."
    "family/eugenio-astocondor-salazar-lopez.html"   = "Eugenio Astocondor Salazar Lopez - family profile and biography."
    "family/fatima-astocondor.html"                  = "Fatima Astocondor - family profile and biography."
    "family/fernando-astocondor-salazar-lopez.html"  = "Fernando Astocondor Salazar Lopez - family profile and biography."
    "family/fernando-pallete.html"                   = "Fernando Pallete - family profile and biography."
    "family/gabriel-astocondor.html"                 = "Gabriel Astocondor - family profile and biography."
    "family/hector-briceno.html"                     = "Hector Briceno - family profile and biography."
    "family/jose-dalicio-lopez-lopez.html"           = "Jose Dalicio Lopez Lopez - family profile and biography."
    "family/lorenzo-lu.html"                         = "Lorenzo Lu - family profile and biography."
    "family/lucila-dongo-salcedo.html"               = "Lucila Dongo Salcedo - family profile and biography."
    "family/luisa-astocondor.html"                   = "Luisa Astocondor - family profile and biography."
    "family/luis-fernando-astocondor.html"           = "Luis Fernando Astocondor - family profile and biography."
    "family/maria-jesus-cateriano-dongo.html"        = "Maria Jesus Cateriano Dongo - family profile and biography."
    "family/milagros-herrera.html"                   = "Milagros Herrera - family profile and biography."
    "family/monica-astocondor.html"                  = "Monica Astocondor - family profile and biography."
    "family/paola-pallete.html"                      = "Paola Pallete - family profile and biography."
    "family/sylvia-astocondor-salazar-lopez.html"    = "Sylvia Astocondor Salazar Lopez - family profile and biography."
    "family/victoriano-cateriano.html"               = "Victoriano Cateriano - family profile and biography."
    "people/alexia-mittrany.html"                    = "Alexia Mittrany - profile and biography on jorgeranilla.com."
    "people/celia-mena.html"                         = "Celia Mena - profile and biography on jorgeranilla.com."
    "people/edwin-mejia.html"                        = "Edwin Mejia - profile and biography on jorgeranilla.com."
    "people/hatairat-rattanapornchai.html"           = "Hatairat Rattanapornchai - profile and biography on jorgeranilla.com."
    "people/ilda-galindo.html"                       = "Ilda Galindo - profile and biography on jorgeranilla.com."
    "people/jennifer-ramirez.html"                   = "Jennifer Ramirez - profile and biography on jorgeranilla.com."
    "people/jeraldin-yupan.html"                     = "Jeraldin Yupan - profile and biography on jorgeranilla.com."
    "people/lucia-mendez.html"                       = "Lucia Mendez - profile and biography on jorgeranilla.com."
    "people/mayumy-garcia.html"                      = "Mayumy Garcia - profile and biography on jorgeranilla.com."
    "people/patricia-malca.html"                     = "Patricia Malca - profile and biography on jorgeranilla.com."
    "people/ricardo-ildefonso.html"                  = "Ricardo Ildefonso - profile and biography on jorgeranilla.com."
    "people/sarai-miguel.html"                       = "Sarai Miguel - profile and biography on jorgeranilla.com."
    "people/yerina-bello.html"                       = "Yerina Bello - profile and biography on jorgeranilla.com."
    "people/yujeong-hong.html"                       = "Yujeong Hong - profile and biography on jorgeranilla.com."
}

$defaultDescription = "A page on jorgeranilla.com - family stories, heritage, and memories across generations."

function Get-CanonicalUrl($relPath) {
    $urlPath = $relPath.Replace("\", "/")
    if ($urlPath -eq "index.html")              { return "$baseUrl/" }
    if ($urlPath -match "^(.+/)index\.html$")   { return "$baseUrl/$($Matches[1])" }
    return "$baseUrl/$urlPath"
}

$files = Get-ChildItem -Path $root -Recurse -Filter "*.html" |
    Where-Object { $_.FullName -notmatch "\\(archive|family-directory|functions|umsteadgrove)\\" }

$changed = 0
$skipped = 0

foreach ($file in $files) {
    $relPath  = $file.FullName.Substring($root.Length + 1)
    $relSlash = $relPath.Replace("\", "/")

    if ($skipList -contains $relSlash) {
        Write-Host "SKIP  $relSlash"
        $skipped++
        continue
    }

    $canonicalUrl = Get-CanonicalUrl $relPath
    $description  = if ($descriptions.ContainsKey($relSlash)) { $descriptions[$relSlash] } else { $defaultDescription }

    $content  = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $modified = $false

    # Add canonical if missing
    if ($content -notmatch '<link\s+rel="canonical"') {
        $canonTag = "    <link rel=`"canonical`" href=`"$canonicalUrl`">"
        $content  = $content -replace '(</head>)', "$canonTag`n`$1"
        $modified = $true
    }

    # Add meta description if missing
    if ($content -notmatch '<meta\s+name="description"') {
        $descTag = "    <meta name=`"description`" content=`"$description`">"
        $content = $content -replace '(</head>)', "$descTag`n`$1"
        $modified = $true
    }

    if ($modified) {
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host "FIXED $relSlash"
        $changed++
    } else {
        Write-Host "OK    $relSlash"
    }
}

Write-Host ""
Write-Host "Done. $changed files updated, $skipped skipped."
