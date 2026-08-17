@echo off
REM ============================================================
REM VetAcademia - Backup Script
REM Creates a timestamped backup of source + .env + (optional) DB
REM ============================================================
setlocal EnableDelayedExpansion

set "PROJECT_DIR=%~dp0"
set "BACKUP_ROOT=%PROJECT_DIR%backups"

REM --- Timestamp (reliable via PowerShell) ---
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "STAMP=%%i"
set "DEST=%BACKUP_ROOT%\%STAMP%"
if not exist "%DEST%" mkdir "%DEST%"

echo ===================================================
echo  VetAcademia Backup  -  %STAMP%
echo ===================================================

REM --- 1. Source code (exclude heavy / regenerable dirs) ---
echo [1/3] Copying source files ...
robocopy "%PROJECT_DIR%." "%DEST%\source" /E /XD node_modules .next backups .git /XF *.log *.zip /NFL /NDL /NJH /NJS
echo       Source copy done.

REM --- 2. Environment / secret config (.env is gitignored) ---
echo [2/3] Copying environment file ...
if exist "%PROJECT_DIR%.env" (
  copy /Y "%PROJECT_DIR%.env" "%DEST%\.env" >nul
  echo       .env copied.
) else (
  echo       .env not found - skipped.
)

REM --- 3. Database dump (optional, needs pg_dump + DATABASE_URL) ---
echo [3/3] Database dump ...
set "DBURL="
for /f "tokens=1* delims==" %%a in ('findstr /b "DATABASE_URL" "%PROJECT_DIR%.env" 2^>nul') do set "DBURL=%%b"
if defined DBURL set "DBURL=%DBURL:"=%"

where pg_dump >nul 2>&1
if errorlevel 1 (
  echo       pg_dump not installed - skipping DB dump.
  goto :done_db
)
if "%DBURL%"=="" (
  echo       DATABASE_URL not found - skipping DB dump.
  goto :done_db
)
pg_dump "%DBURL%" -f "%DEST%\database.sql" >nul 2>&1
if exist "%DEST%\database.sql" (
  echo       DB dump saved.
) else (
  echo       DB dump failed - check DATABASE_URL / network.
)
:done_db

echo ===================================================
echo  Backup complete.
echo  Location: "%DEST%"
echo ===================================================
endlocal
