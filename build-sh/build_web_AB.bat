@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM 强制清理 temp 目录 - 使用多种方法确保彻底清理
echo 开始清理 temp 目录...

REM 终止可能运行的 Cocos Creator 进程
echo 检查并终止 Cocos Creator 进程...
taskkill /f /im "CocosCreator.exe" >nul 2>&1
taskkill /f /im "Creator.exe" >nul 2>&1

call :force_cleanup_temp


echo 开始构建 web 版本
echo 当前分支: %1
echo 当前 common 分支: %2
echo 是否构建 AB 包: %3
echo 环境变量: %4
echo GitHub Token: %5

set "BRANCH=%1"
set "COMMON_BRANCH=%2"
set "BUILD_AB=%3"
set "ENV=%4"
set "GITHUB_TOKEN=%5"

REM 安装 node 依赖
echo Installing dependencies...
call pnpm i
if %errorlevel% neq 0 (
    echo Error installing dependencies
    exit /b 1
)

REM 拉取子模块 - 配置带token的URL
echo Updating submodules with token authentication...
if exist "assets\activity" rmdir /s /q "assets\activity"
if exist "assets\common" rmdir /s /q "assets\common"

REM 设置子模块URL包含token
echo Setting submodule URLs with authentication...
git submodule set-url assets/activity https://%GITHUB_TOKEN%@github.com/InnovaTech-Game/cocos_activity.git
git submodule set-url assets/common https://%GITHUB_TOKEN%@github.com/InnovaTech-Game/cocos-common.git

REM 初始化并更新子模块
echo Initializing and updating submodules...
git submodule update --init --recursive
if %errorlevel% neq 0 (
    echo Error updating submodules
    exit /b 1
)

REM 强制拉取并覆盖本地分支 - activity
echo Updating activity submodule to branch %COMMON_BRANCH%...
cd assets\activity
git fetch --all --prune
git checkout %COMMON_BRANCH% --force
git reset --hard origin/%COMMON_BRANCH%
if %errorlevel% neq 0 (
    echo Error updating activity submodule
    cd ..\..\
    exit /b 1
)
cd ..\..\

REM 强制拉取并覆盖本地分支 - common
echo Updating common submodule to branch %COMMON_BRANCH%...
cd assets\common
git fetch --all --prune
git checkout %COMMON_BRANCH% --force
git reset --hard origin/%COMMON_BRANCH%
if %errorlevel% neq 0 (
    echo Error updating common submodule
    cd ..\..\
    exit /b 1
)
cd ..\..\

REM 根据第四个参数决定构建方式
if /i "%BUILD_AB%"=="true" (
    echo 开始构建AB包...
    goto :build_ab_packages
) else (
    echo 构建单包...
    goto :build_single_package
)

:build_ab_packages
echo 切换到 %BRANCH%.A 分支构建A包...
git checkout %BRANCH%.A --force
git reset --hard origin/%BRANCH%.A
if %errorlevel% neq 0 (
    echo Error switching to %BRANCH%.A branch
    exit /b 1
)

echo "run pre-build.js %ENV%"
node build-sh/pre-build.js %ENV%

echo Building A package...
call :build_with_retry ".\buildConfig_web-mobile_A.json" "A包"


REM 提取A包hash值
call :extract_hash_values "build\web-mobile" "A" A_IMPORT_MAP_HASH A_INDEX_HASH

echo 切换到 %BRANCH%.B 分支构建B包...
git checkout %BRANCH%.B --force
git reset --hard origin/%BRANCH%.B

echo "run pre-build.js %ENV%"
node build-sh/pre-build.js %ENV%

echo Building B package...
call :build_with_retry ".\buildConfig_web-mobile_B.json" "B包"
set "BUILD_RESULT=%errorlevel%"
echo Cocos Creator B package exit code: %BUILD_RESULT%

REM Check if build output exists instead of relying on exit code
if not exist "build\web-mobile\B\web-mobile" (
    echo Error: B package build output not found
    exit /b 1
)
echo B package build completed successfully

REM 将B包文件平铺到A包路径下
call :flatten_b_package

REM 文件平铺后，从B包目录提取B包hash
call :extract_hash_values "build\web-mobile\B\web-mobile" "B" B_IMPORT_MAP_HASH B_INDEX_HASH

REM 注入hash配置
call :inject_hash_config "%A_IMPORT_MAP_HASH%" "%A_INDEX_HASH%" "%B_IMPORT_MAP_HASH%" "%B_INDEX_HASH%"

echo AB包构建完成！Hash配置已直接注入到 build\web-mobile\index.html
goto :end_script

:build_single_package
echo Building single package...

echo 切换到 %BRANCH% 分支构建默认包...
git checkout %BRANCH% --force
git reset --hard origin/%BRANCH%

echo "run pre-build.js %ENV%"
node build-sh/pre-build.js %ENV%

call :build_with_retry ".\buildConfig_web-mobile.json" "单包"
set "BUILD_RESULT=%errorlevel%"
echo Cocos Creator single package exit code: %BUILD_RESULT%

REM Check if build output exists instead of relying on exit code
if not exist "build\web-mobile" (
    echo Error: Single package build output not found
    exit /b 1
)
echo Single package build completed successfully

REM 提取单包的hash值
call :extract_hash_values "build\web-mobile" "单包" SINGLE_IMPORT_MAP_HASH SINGLE_INDEX_HASH

REM 注入hash配置（A包和B包使用相同的hash值）
call :inject_hash_config "%SINGLE_IMPORT_MAP_HASH%" "%SINGLE_INDEX_HASH%" "%SINGLE_IMPORT_MAP_HASH%" "%SINGLE_INDEX_HASH%"

echo 单包构建完成！Hash配置已直接注入到 build\web-mobile\index.html
goto :end_script

REM ========== 函数定义区域 ==========

REM 强制清理 temp 目录的函数
:force_cleanup_temp
set "TEMP_DIR=C:\Users\Administrator\Documents\dev\workspace\mayari-cocos\temp"
set "CLEANUP_ATTEMPTS=0"
set "MAX_ATTEMPTS=5"

:cleanup_retry
set /a CLEANUP_ATTEMPTS+=1
echo 清理尝试 %CLEANUP_ATTEMPTS%/%MAX_ATTEMPTS%...

REM 方法1: 使用 takeown 获取所有权
echo 获取文件所有权...
takeown /f "%TEMP_DIR%" /r /d y >nul 2>&1
icacls "%TEMP_DIR%" /grant administrators:F /t >nul 2>&1

REM 方法2: 使用 rmdir 删除
echo 删除 temp 目录...
rmdir /s /q "%TEMP_DIR%" >nul 2>&1

REM 方法3: 使用 PowerShell 强制删除
echo 使用 PowerShell 强制删除...
powershell -Command "if (Test-Path '%TEMP_DIR%') { Remove-Item '%TEMP_DIR%' -Recurse -Force -ErrorAction SilentlyContinue }" >nul 2>&1

REM 检查是否还有残留文件
if exist "%TEMP_DIR%" (
    echo 警告: temp 目录仍存在，尝试删除残留文件...

    REM 方法4: 逐个删除文件
    for /f "delims=" %%i in ('dir "%TEMP_DIR%" /b /s /a-d 2^>nul') do (
        del "%%i" /f /q >nul 2>&1
    )

    REM 方法5: 使用 robocopy 清空目录
    echo 使用 robocopy 清空目录...
    mkdir "%TEMP_DIR%_empty" >nul 2>&1
    robocopy "%TEMP_DIR%_empty" "%TEMP_DIR%" /mir >nul 2>&1
    rmdir "%TEMP_DIR%_empty" >nul 2>&1
    rmdir "%TEMP_DIR%" /s /q >nul 2>&1

    if exist "%TEMP_DIR%" (
        if %CLEANUP_ATTEMPTS% LSS %MAX_ATTEMPTS% (
            echo 清理失败，等待 2 秒后重试...
            timeout /t 2 /nobreak >nul
            goto :cleanup_retry
        ) else (
            echo 错误: 无法完全清理 temp 目录，但继续构建...
        )
    ) else (
        echo temp 目录清理成功
    )
) else (
    echo temp 目录清理成功
)

REM 确保 temp 目录存在
if not exist "%TEMP_DIR%" (
    mkdir "%TEMP_DIR%" >nul 2>&1
)
goto :eof

REM 带重试机制的构建函数
:build_with_retry
set "CONFIG_PATH=%~1"
set "PACKAGE_NAME=%~2"
set "BUILD_ATTEMPTS=0"
set "MAX_BUILD_ATTEMPTS=3"

:build_retry
set /a BUILD_ATTEMPTS+=1
echo 构建尝试 %BUILD_ATTEMPTS%/%MAX_BUILD_ATTEMPTS% - %PACKAGE_NAME%...

REM 构建前再次清理 temp 目录
echo 构建前清理 temp 目录...
call :force_cleanup_temp

REM 执行构建
"C:\ProgramData\cocos\editors\Creator\3.8.5\CocosCreator.exe" --project .\ --build "configPath=%CONFIG_PATH%"
set "BUILD_RESULT=%errorlevel%"

if %BUILD_RESULT% neq 0 (
    echo 构建失败，退出代码: %BUILD_RESULT%
    if %BUILD_ATTEMPTS% LSS %MAX_BUILD_ATTEMPTS% (
        echo 等待 3 秒后重试...
        timeout /t 3 /nobreak >nul
        goto :build_retry
    ) else (
        echo 错误: %PACKAGE_NAME% 构建失败，已达到最大重试次数
        exit /b 1
    )
) else (
    echo %PACKAGE_NAME% 构建成功
)
goto :eof

REM 提取hash值的函数
:extract_hash_values
set "BASE_PATH=%~1"
set "PACKAGE_NAME=%~2"
set "IMPORT_VAR=%~3"
set "INDEX_VAR=%~4"

echo 提取%PACKAGE_NAME%包hash值...

REM 查找import-map文件并提取hash
set "IMPORT_HASH="
for /f "delims=" %%f in ('dir /b "%BASE_PATH%\src\import-map.*.json" 2^>nul') do (
    set "IMPORT_FILE=%%f"
    for /f "tokens=2 delims=." %%h in ("%%f") do (
        set "IMPORT_HASH=%%h"
    )
)

REM 查找index文件并提取hash
set "INDEX_HASH="
for /f "delims=" %%f in ('dir /b "%BASE_PATH%\index.*.js" 2^>nul') do (
    set "INDEX_FILE=%%f"
    for /f "tokens=2 delims=." %%h in ("%%f") do (
        set "INDEX_HASH=%%h"
    )
)

echo %PACKAGE_NAME%包 import-map hash: !IMPORT_HASH!
echo %PACKAGE_NAME%包 index hash: !INDEX_HASH!

REM 返回值通过环境变量
set "%IMPORT_VAR%=!IMPORT_HASH!"
set "%INDEX_VAR%=!INDEX_HASH!"
goto :eof

REM 注入hash配置到HTML的函数
:inject_hash_config
set "A_IMPORT_MAP_HASH=%~1"
set "A_INDEX_HASH=%~2"
set "B_IMPORT_MAP_HASH=%~3"
set "B_INDEX_HASH=%~4"

echo 注入hash值到HTML... %A_IMPORT_MAP_HASH% %A_INDEX_HASH% %B_IMPORT_MAP_HASH% %B_INDEX_HASH%

REM 创建临时的hash配置脚本内容
set "TEMP_HASH_FILE=%TEMP%\hash_config.js"
(
echo // 构建时自动生成的hash配置
echo window.BUILD_HASHES = {
echo   A: {
echo     importMap: "%A_IMPORT_MAP_HASH%",
echo     index: "%A_INDEX_HASH%"
echo   },
echo   B: {
echo     importMap: "%B_IMPORT_MAP_HASH%",
echo     index: "%B_INDEX_HASH%"
echo   }
echo };
echo console.log('Build hashes loaded:', window.BUILD_HASHES^);
) > "%TEMP_HASH_FILE%"

REM 使用PowerShell进行文本替换（更可靠的方式）
powershell -Command "$content = Get-Content 'build\web-mobile\index.html' -Raw; $hashContent = Get-Content '%TEMP_HASH_FILE%' -Raw; $content = $content -replace '{{ buildHashes }}', ('<script>' + $hashContent + '</script>'); Set-Content 'build\web-mobile\index.html' -Value $content -Encoding UTF8"

del "%TEMP_HASH_FILE%"
goto :eof

REM 将B包文件平铺到A包路径下
:flatten_b_package
echo 将B包文件平铺到A包路径下...

set "B_PACKAGE_DIR=build\web-mobile\B\web-mobile"
set "A_PACKAGE_DIR=build\web-mobile"

if not exist "%B_PACKAGE_DIR%" (
    echo Warning: B package directory not found: %B_PACKAGE_DIR%
    goto :eof
)

echo B包目录: %B_PACKAGE_DIR%
echo A包目录: %A_PACKAGE_DIR%

REM 使用robocopy命令进行文件复制，更可靠
echo 使用robocopy复制B包文件到A包目录...
robocopy "%B_PACKAGE_DIR%" "%A_PACKAGE_DIR%" /E /XO /R:3 /W:1 /NFL /NDL /NJH /NJS

REM 检查robocopy的退出代码
set "ROBOCOPY_EXIT_CODE=%errorlevel%"
echo robocopy exit code: %ROBOCOPY_EXIT_CODE%

REM robocopy的退出代码含义：
REM 0 = 没有文件需要复制
REM 1 = 所有文件复制成功
REM 2 = 有额外文件或目录
REM 3 = 有额外文件和目录
REM 4 = 有错误
REM 5 = 有错误和额外文件
REM 6 = 有额外文件和目录，有错误
REM 7 = 有文件复制成功，有错误，有额外文件
REM 8 = 有文件复制成功，有错误

if %ROBOCOPY_EXIT_CODE% GTR 7 (
    echo Error: robocopy failed with exit code %ROBOCOPY_EXIT_CODE%
    exit /b 1
) else (
    echo robocopy completed successfully
)

REM 验证复制结果
echo 验证文件复制结果...
if exist "%A_PACKAGE_DIR%\index.html" (
    echo A包index.html存在
) else (
    echo Warning: A包index.html不存在
)

if exist "%A_PACKAGE_DIR%\src" (
    echo A包src目录存在
) else (
    echo Warning: A包src目录不存在
)

echo B包文件平铺完成
goto :eof

:end_script
echo 构建完成！
exit /b 0