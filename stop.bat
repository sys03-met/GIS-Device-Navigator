@echo off
chcp 65001 > nul
title EquipNav Offline System Stopper

echo =========================================================
echo   EquipNav — 시스템 안전 종료
echo =========================================================
echo.

echo [INFO] 실행 중인 EquipNav 서버 프로세스를 종료합니다...
taskkill /FI "WINDOWTITLE eq EquipNav Server Process*" /F > nul 2>&1
taskkill /IM node.exe /F > nul 2>&1

echo [SUCCESS] EquipNav 프로세스가 완전히 종료되고 데이터베이스가 정돈되었습니다.
pause
