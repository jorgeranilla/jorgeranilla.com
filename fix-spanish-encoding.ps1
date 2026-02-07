# Fix Spanish character encoding by replacing corrupted characters
$files = Get-ChildItem -Path "c:/Projects/Antigravity/family" -Filter "*-es.html"

# Map of corrupted characters to correct Spanish characters
$replacements = @{
    'ra�ces'     = 'raíces'
    'Ra�ces'     = 'Raíces'
    'T�os'       = 'Tíos'
    'T�as'       = 'Tías'
    't�o'        = 'tío'
    't�a'        = 'tía'
    'Bisabu�los' = 'Bisabuelos'
    'abuelos'    = 'abuelos'
    'Abuelos'    = 'Abuelos'
    'cari�osa'   = 'cariñosa'
    'coraz�n'    = 'corazón'
    'generoso'   = 'generoso'
    'bondad'     = 'bondad'
    'calidez'    = 'calidez'
    'memoria'    = 'memoria'
    'querido'    = 'querido'
    'querida'    = 'querida'
    'Eugenio'    = 'Eugenio'
    'Mar�a'      = 'María'
    'Jos�'       = 'José'
    'Jes�s'      = 'Jesús'
    'V�ctor'     = 'Víctor'
    'Andr�s'     = 'Andrés'
    'In�s'       = 'Inés'
    'Alcira'     = 'Alcira'
    'Carlota'    = 'Carlota'
    'Sabidur�a'  = 'Sabiduría'
    'A�os'       = 'Años'
    'a�os'       = 'años'
    'Espa�a'     = 'España'
    'espa�ol'    = 'español'
    'Per�'       = 'Perú'
    'peruano'    = 'peruano'
    'familia'    = 'familia'
    'Familia'    = 'Familia'
    'historia'   = 'historia'
    'Historia'   = 'Historia'
    'tradici�n'  = 'tradición'
    'Tradici�n'  = 'Tradición'
    'generaci�n' = 'generación'
    'Generaci�n' = 'Generación'
    'pasi�n'     = 'pasión'
    'Pasi�n'     = 'Pasión'
    'educaci�n'  = 'educación'
    'Educaci�n'  = 'Educación'
    'dedicaci�n' = 'dedicación'
    'Dedicaci�n' = 'Dedicación'
    'amor'       = 'amor'
    'Amor'       = 'Amor'
    'ni�os'      = 'niños'
    'Ni�os'      = 'Niños'
    'sue�os'     = 'sueños'
    'Sue�os'     = 'Sueños'
    'm�s'        = 'más'
    'M�s'        = 'Más'
    'tambi�n'    = 'también'
    'Tambi�n'    = 'También'
    'despu�s'    = 'después'
    'Despu�s'    = 'Después'
    'adem�s'     = 'además'
    'Adem�s'     = 'Además'
    'est�'       = 'está'
    'Est�'       = 'Está'
    'ser�'       = 'será'
    'Ser�'       = 'Será'
    'hab�a'      = 'había'
    'Hab�a'      = 'Había'
    'd�a'        = 'día'
    'D�a'        = 'Día'
    'mam�'       = 'mamá'
    'Mam�'       = 'Mamá'
    'pap�'       = 'papá'
    'Pap�'       = 'Papá'
}

foreach ($file in $files) {
    Write-Host "Processing: $($file.Name)"
    
    # Read the file content
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    
    # Replace all corrupted characters
    foreach ($key in $replacements.Keys) {
        $content = $content -replace [regex]::Escape($key), $replacements[$key]
    }
    
    # Save with UTF-8 encoding (no BOM)
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
    
    Write-Host "Fixed: $($file.Name)"
}

Write-Host "`nAll Spanish files have been fixed!"
