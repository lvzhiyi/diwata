@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

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
echo Cleaning temp folder before build...
if exist "temp" rmdir /s /q "temp"
if exist "library" rmdir /s /q "library"
timeout /t 2 /nobreak >nul
"C:\ProgramData\cocos\editors\Creator\3.8.5\CocosCreator.exe" --project .\ --build "configPath=.\buildConfig_web-mobile_A.json" --clear


REM 提取A包hash值
call :extract_hash_values "build\web-mobile" "A" A_IMPORT_MAP_HASH A_INDEX_HASH

echo 切换到 %BRANCH%.B 分支构建B包...
git checkout %BRANCH%.B --force
git reset --hard origin/%BRANCH%.B

echo "run pre-build.js %ENV%"
node build-sh/pre-build.js %ENV%

echo Building B package...
echo Cleaning temp folder before build...
if exist "temp" rmdir /s /q "temp"
if exist "library" rmdir /s /q "library"
timeout /t 2 /nobreak >nul
"C:\ProgramData\cocos\editors\Creator\3.8.5\CocosCreator.exe" --project .\ --build "configPath=.\buildConfig_web-mobile_B.json" --clear
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

echo Cleaning temp folder before build...
if exist "temp" rmdir /s /q "temp"
if exist "library" rmdir /s /q "library"
timeout /t 2 /nobreak >nul
"C:\ProgramData\cocos\editors\Creator\3.8.5\CocosCreator.exe" --project .\ --build "configPath=.\buildConfig_web-mobile.json" --clear
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