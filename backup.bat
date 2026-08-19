@echo off
set "SRC=D:\VetAcademia (VA)\vetacademia-next"
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set dt=%%I
if "%dt%"=="" set dt=%date:~10,4%%date:~4,2%%date:~7,2%%time:~0,2%%time:~3,2%
set "TS=%dt:~0,4%%dt:~4,2%%dt:~6,2%-%dt:~8,2%%dt:~10,2%"
set "DST=D:\VetAcademia (VA)\vetacademia-next-backup-%TS%"

echo Backing up:
echo   From: %SRC%
echo   To:   %DST%
echo.

robocopy "%SRC%" "%DST%" /E /R:1 /W:1 ^
  /XF backup.bat serverlog.err ^
  /XD node_modules .next

echo.
echo Backup complete: %DST%
pause
