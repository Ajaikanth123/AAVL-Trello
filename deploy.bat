@echo off
echo Deploying to Vercel...
git add -A
git commit -m "Update: %date% %time%"
git push
echo.
echo Deployment triggered! Check https://aavl-trello.vercel.app in 2-3 minutes
pause
