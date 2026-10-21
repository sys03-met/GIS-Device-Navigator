@echo off
chcp 65001 > nul
title EquipNav Offline System Launcher

echo =========================================================
echo   EquipNav — 오프라인 설비 지도 및 방문 경로 관리 시스템
echo =========================================================
echo.

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

if not exist "%SCRIPT_DIR%node\node.exe" (
    echo [ERROR] %SCRIPT_DIR%node\node.exe 파일을 찾을 수 없습니다.
    echo 포터블 배포 폴더에 node.exe가 포함되어 있는지 확인하십시오.
    pause
    exit /b 1
)

echo [INFO] EquipNav 백엔드 서버를 시작합니다...
start "EquipNav Server Process" /min "%SCRIPT_DIR%node\node.exe" "%SCRIPT_DIR%server\dist\index.js"

echo [INFO] 브라우저 연결을 준비 중입니다... (http://127.0.0.1:8080)
timeout /t 3 > nul

start http://127.0.0.1:8080

echo [SUCCESS] EquipNav 시스템이 정상적으로 시작되었습니다.
echo 시스템을 종료하려면 stop.bat 명령 스크립트를 실행하십시오.
echo.
pause
