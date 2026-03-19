@echo off
echo ========================================
echo WINDOWS TTS FIX SCRIPT
echo ========================================
echo.

echo 1. Starting Windows Speech Services...
net start "Windows Audio"
net start "Windows Audio Endpoint Builder"
net start "Multimedia Class Scheduler"

echo.
echo 2. Registering Speech Components...
regsvr32 /s sapi.dll
regsvr32 /s sapidv.dll

echo.
echo 3. Opening Windows Speech Settings...
start "" "ms-settings:speech"

echo.
echo 4. Opening Sound Settings...
start "" "ms-settings:sound"

echo.
echo ========================================
echo MANUAL STEPS TO DO:
echo ========================================
echo 1. In Speech Settings:
echo    - Turn ON "Online speech recognition"
echo    - Set speech rate to MIDDLE
echo    - Click "Listen to preview" - should hear voice!
echo.
echo 2. In Sound Settings:
echo    - Check volume is up (50%% or higher)
echo    - Make sure device is not muted
echo    - Test system sounds
echo.
echo 3. RESTART your browser after these changes!
echo ========================================
pause