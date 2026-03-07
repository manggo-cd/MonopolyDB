@echo off

:: Change to the directory where the script is located
cd %~dp0

:: Configure the Oracle Instant Client for this terminal session.
:: Prepend path (without quotes) so Windows loader can resolve OCI DLLs first.
set PATH=C:\Users\danie\Documents\instantclient_19_20;%PATH%

:: Start Node application
node server.js

exit /b 0
