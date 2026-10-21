@echo off
chcp 65001 > NUL
title EquipNav 종료

echo EquipNav 프로세스를 종료합니다...
taskkill /f /im node.exe >nul 2>&1

echo 종료되었습니다.
pause
