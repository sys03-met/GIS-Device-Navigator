@echo off
chcp 65001 > NUL
title EquipNav - 오프라인 설비 지도 및 방문 경로 관리 시스템

echo ===========================================================
echo  EquipNav 시스템을 가동합니다.
echo ===========================================================

set PATH=%CD%\node;%PATH%

if not exist node\node.exe (
    where node >nul 2>nul
    if errorlevel 1 (
        echo [오류] node\node.exe 파일 및 시스템 Node.js를 찾을 수 없습니다.
        pause
        exit /b 1
    )
)

start /b "" node server\dist\server.js > logs\app.log 2>&1

echo.
echo 서버가 성공적으로 가동되었습니다!
echo 브라우저를 열고 http://localhost:8080 로 접속하세요.
echo.
pause
