@echo off
REM ----------------------------------------------------------------------
REM build-release.bat
REM
REM Convenience wrapper that initializes the Visual Studio C++ build
REM environment and then runs `npm run tauri build` to produce the
REM Windows NSIS installer (.exe).
REM
REM Adjust the path to VsDevCmd.bat if your Visual Studio installation
REM lives elsewhere. The default assumes VS 2022 Community.
REM
REM Requirements:
REM   - Node.js 20+
REM   - Rust (stable) with the x86_64-pc-windows-msvc target
REM   - Visual Studio 2017 or later, with the "Desktop development with
REM     C++" workload, including the Windows 10/11 SDK component.
REM ----------------------------------------------------------------------

setlocal
set "VSDIR=C:\Program Files\Microsoft Visual Studio\2022\Community"
if not exist "%VSDIR%\Common7\Tools\VsDevCmd.bat" (
    echo Could not find VsDevCmd.bat at "%VSDIR%\Common7\Tools\VsDevCmd.bat".
    echo Edit build-release.bat to point to your Visual Studio install.
    exit /b 1
)

call "%VSDIR%\Common7\Tools\VsDevCmd.bat" -arch=x64 -host_arch=x64
if errorlevel 1 exit /b 1

pushd "%~dp0"
call npm run tauri build
set "RC=%ERRORLEVEL%"
popd
endlocal & exit /b %RC%
