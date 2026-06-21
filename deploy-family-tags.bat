@echo off
REM ============================================================
REM  Deploy familyPhotoTagOptions, rules, and hosting
REM  Run this AFTER: C:\tmp\firebase-tools\firebase-tools-win.exe login --reauth
REM ============================================================

set FIREBASE=C:\tmp\firebase-tools\firebase-tools-win.exe
set PROJECT=jorgeranilla-site

echo.
echo ====================================================
echo  Step 1: Deploying Cloud Functions
echo  (familyPhotoTagOptions + submitFamilyPhotoTagSuggestion)
echo ====================================================
%FIREBASE% deploy --project %PROJECT% --only functions:familyPhotoTagOptions,functions:submitFamilyPhotoTagSuggestion
if %errorlevel% neq 0 (
  echo.
  echo [ERROR] Functions deployment failed. Check output above.
  pause
  exit /b %errorlevel%
)

echo.
echo ====================================================
echo  Step 2: Deploying Firestore Security Rules
echo ====================================================
%FIREBASE% deploy --project %PROJECT% --only firestore:rules
if %errorlevel% neq 0 (
  echo.
  echo [ERROR] Firestore rules deployment failed.
  pause
  exit /b %errorlevel%
)

echo.
echo ====================================================
echo  Step 3: Deploying Hosting (gallery + family-directory)
echo ====================================================
%FIREBASE% deploy --project %PROJECT% --only hosting
if %errorlevel% neq 0 (
  echo.
  echo [ERROR] Hosting deployment failed.
  pause
  exit /b %errorlevel%
)

echo.
echo ====================================================
echo  ALL DONE! Deployed:
echo    - Cloud Functions: familyPhotoTagOptions
echo    - Cloud Functions: submitFamilyPhotoTagSuggestion
echo    - Firestore rules
echo    - Hosting
echo ====================================================
pause
