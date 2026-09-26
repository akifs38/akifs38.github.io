@echo off
rem Dokunmatik Kalibrasyon - derleme betigi
rem Ek kurulum gerekmez: Windows 10 ile gelen .NET Framework 4 derleyicisini (csc.exe) kullanir.
setlocal
cd /d "%~dp0"

set "CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if not exist "%CSC%" set "CSC=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe"
if not exist "%CSC%" (
  echo csc.exe bulunamadi. .NET Framework 4.x yuklu olmali ^(Windows 10'da varsayilan olarak gelir^).
  pause
  exit /b 1
)

"%CSC%" /nologo /target:winexe /optimize+ /platform:anycpu ^
  /out:DokunmatikKalibrasyon.exe ^
  /win32manifest:app.manifest ^
  /r:System.dll /r:System.Drawing.dll /r:System.Windows.Forms.dll ^
  src\*.cs
if errorlevel 1 (
  echo.
  echo DERLEME BASARISIZ.
  pause
  exit /b 1
)

echo.
echo Tamam: DokunmatikKalibrasyon.exe olusturuldu.
if /i not "%~1"=="/sessiz" pause
