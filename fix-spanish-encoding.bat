@echo off
setlocal enabledelayedexpansion

echo Fixing Spanish HTML file encoding...
echo.

cd /d "c:\Projects\Antigravity\family"

for %%f in (*-es.html) do (
    echo Processing: %%f
    powershell -Command "[System.IO.File]::ReadAllText('%%f', [System.Text.Encoding]::GetEncoding('ISO-8859-1')) | Out-File -FilePath '%%f' -Encoding UTF8 -NoNewline"
    echo Fixed: %%f
    echo.
)

echo All Spanish files have been re-encoded to UTF-8!
pause
