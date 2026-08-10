@echo off
cd /d "%~dp0"
call node_modules\.bin\next.cmd build
