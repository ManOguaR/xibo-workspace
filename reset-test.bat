@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0reset-test.ps1" %*
exit /b %ERRORLEVEL%