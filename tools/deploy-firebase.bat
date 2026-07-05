@echo off
cd /d "%~dp0.."
REM ============================================================
REM  Firebase Deploy Script — jorgeranilla-site
REM  Handles corporate SSL proxy via NODE_TLS_REJECT_UNAUTHORIZED
REM  Usage: deploy-firebase.bat [target]
REM    target: all | functions | rules | hosting (default: all)
REM ============================================================

set FIREBASE=C:\tmp\firebase-tools\firebase-tools-win.exe
set PROJECT=jorgeranilla-site
set TARGET=%1
if "%TARGET%"=="" set TARGET=all

REM Required for corporate SSL inspection proxy
set NODE_TLS_REJECT_UNAUTHORIZED=0

echo.
echo ====================================================
echo  Firebase Deploy ^| %PROJECT% ^| target: %TARGET%
echo ====================================================

if "%TARGET%"=="all" goto deploy_all
if "%TARGET%"=="functions" goto deploy_functions
if "%TARGET%"=="rules" goto deploy_rules
if "%TARGET%"=="hosting" goto deploy_hosting

echo Unknown target: %TARGET%
echo Usage: deploy-firebase.bat [all^|functions^|rules^|hosting]
exit /b 1

:deploy_all
  call :do_functions
  if %errorlevel% neq 0 exit /b %errorlevel%
  call :do_rules
  if %errorlevel% neq 0 exit /b %errorlevel%
  call :do_hosting
  if %errorlevel% neq 0 exit /b %errorlevel%
  goto done

:deploy_functions
  call :do_functions
  goto done

:deploy_rules
  call :do_rules
  goto done

:deploy_hosting
  call :do_hosting
  goto done

:do_functions
  echo.
  echo -- Deploying Cloud Functions...
  %FIREBASE% deploy --project %PROJECT% --only functions
  if %errorlevel% neq 0 ( echo [ERROR] Functions deploy failed. & exit /b %errorlevel% )
  exit /b 0

:do_rules
  echo.
  echo -- Deploying Firestore Rules...
  %FIREBASE% deploy --project %PROJECT% --only firestore:rules
  if %errorlevel% neq 0 ( echo [ERROR] Rules deploy failed. & exit /b %errorlevel% )
  exit /b 0

:do_hosting
  echo.
  echo -- Deploying Hosting...
  %FIREBASE% deploy --project %PROJECT% --only hosting
  if %errorlevel% neq 0 ( echo [ERROR] Hosting deploy failed. & exit /b %errorlevel% )
  exit /b 0

:done
  echo.
  echo ====================================================
  echo  Deploy complete! https://jorgeranilla.com
echo ====================================================
  pause
