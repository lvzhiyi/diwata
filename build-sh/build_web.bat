@echo off
REM ========================================
REM Windows Cocos Creator Web 构建脚本
REM ========================================

REM 切换到 UTF-8 防止中文乱码
chcp 65001 >nul

REM 参数检查
if "%~3"=="" (
    echo ❌ 缺少参数，例如： build_web.bat develop develop mytoken
    pause
    exit /b 1
)


set "BRANCH=%~1"
set "COMMON_BRANCH=%~2"
set "TOKEN=%~3"

echo 🚀 开始构建 web 版本
echo 📌 当前分支: %BRANCH%
echo 📌 公共分支: %COMMON_BRANCH%
echo 🔑 Token: %TOKEN%

REM 1. 安装 node 依赖
echo 📦 安装依赖...
call pnpm i
if errorlevel 1 (
    echo ❌ 安装依赖失败
    pause
    exit /b 1
)

REM 2. 构建产物
set "COCOS_PATH=C:\ProgramData\cocos\editors\Creator\3.8.5\CocosCreator.exe"
if not exist "%COCOS_PATH%" (
    echo ❌ 找不到 Cocos Creator: %COCOS_PATH%
    pause
    exit /b 1
)

echo 🏗 正在打包 Cocos 项目...
REM start /wait "" "%COCOS_PATH%" --project .\ --build "configPath=.\buildConfig_web-mobile.json"
"%COCOS_PATH%" --cli --project .\ --build "configPath=.\buildConfig_web-mobile.json"

@REM if errorlevel 1 (
@REM     echo ❌ 构建失败
@REM     pause
@REM     exit /b 1
@REM )

echo ✅ 构建完成!
exit