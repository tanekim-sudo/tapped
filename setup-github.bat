@echo off
REM Setup script for pushing Tapped to GitHub (Windows)
REM Usage: setup-github.bat

echo 🚀 Setting up Tapped for GitHub deployment...

REM Check if git is initialized
if not exist ".git" (
    echo 📦 Initializing git repository...
    git init
    git branch -M main
) else (
    echo ✅ Git repository already initialized
)

REM Add all files
echo 📝 Adding files to git...
git add .

REM Check if there are changes to commit
git diff --staged --quiet
if %errorlevel% equ 0 (
    echo ⚠️  No changes to commit
) else (
    echo 💾 Creating initial commit...
    git commit -m "Initial commit: Tapped networking protocol app"
)

REM Check if remote exists
git remote get-url origin >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Remote 'origin' already exists
    git remote get-url origin
    set /p update_remote="Do you want to update the remote URL? (y/n) "
    if /i "%update_remote%"=="y" (
        set /p repo_url="Enter new GitHub repository URL: "
        git remote set-url origin "%repo_url%"
    )
) else (
    echo 🔗 Adding GitHub remote...
    set /p repo_url="Enter your GitHub repository URL (e.g., https://github.com/tanekim-sudo/tapped.git): "
    
    if "%repo_url%"=="" (
        echo ⚠️  No URL provided. You can add it later with:
        echo    git remote add origin https://github.com/tanekim-sudo/tapped.git
    ) else (
        git remote add origin "%repo_url%"
        echo ✅ Remote added: %repo_url%
    )
)

echo.
echo 📤 Ready to push! Run these commands:
echo.
echo    # If repository doesn't exist on GitHub yet, create it first at:
echo    # https://github.com/new
echo.
echo    git push -u origin main
echo.
echo ✨ After pushing, deploy to Vercel:
echo    1. Go to https://vercel.com/new
echo    2. Import your GitHub repository
echo    3. Add GEMINI_API_KEY environment variable
echo    4. Deploy!
echo.

pause
