@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo  TB4L - Push to GitHub
echo  =====================
echo.

set "REPO_URL="

if exist ".github-repo-url" (
  set /p REPO_URL=<.github-repo-url
)

if "!REPO_URL!"=="" (
  echo Paste your GitHub repo URL from the green Code button.
  echo Example: https://github.com/YourName/tb4l-site.git
  echo.
  set /p "REPO_URL=Repo URL: "
)

if "!REPO_URL!"=="" (
  echo.
  echo No URL entered. Cancelled.
  echo Tip: right-click in this window to Paste, then press Enter.
  pause
  exit /b 1
)

echo !REPO_URL!> .github-repo-url
echo.
echo Using repo: !REPO_URL!
echo.

git add .
git diff --cached --quiet
if !errorlevel!==0 (
  echo No new changes to commit.
) else (
  git commit -m "Update TB4L demo site"
  if errorlevel 1 (
    echo Commit failed.
    pause
    exit /b 1
  )
  echo Changes committed.
)
echo.

git remote get-url origin >nul 2>&1
if errorlevel 1 (
  git remote add origin "!REPO_URL!"
  echo Connected to GitHub.
) else (
  git remote set-url origin "!REPO_URL!"
)
echo.

echo Syncing with GitHub first...
git pull origin main --rebase --allow-unrelated-histories
if errorlevel 1 (
  echo.
  echo Could not sync with GitHub. If you uploaded files on github.com,
  echo try again or ask for help in Cursor.
  pause
  exit /b 1
)
echo.

echo Pushing to main...
git push -u origin main
if errorlevel 1 (
  echo.
  echo Push failed. Common fixes:
  echo  - Sign in when Git asks ^(use a Personal Access Token as password^)
  echo  - Make sure the repo exists on GitHub
  echo  - Delete .github-repo-url and run this again if the URL was wrong
  pause
  exit /b 1
)

echo.
echo Done! Your site is on GitHub.
pause
