# 3D Flip Book by Digi18 STUDIOS (HS) - GitHub Pages Ready

This directory contains the complete, production-ready static web application ready for deployment on **GitHub Pages**.

---

## 📂 Folder Contents

- `index.html` - Main HTML application entry point
- `manifest.json` - PWA Manifest for mobile & desktop installation
- `sw.js` - Service Worker for offline PWA caching
- `.nojekyll` - Prevents GitHub Pages Jekyll build processing
- `assets/` - HD 3D Background Environment Textures (Wooden, White Marble, Blue Marble, White Bricks)
- `css/` - Custom Glassmorphic Design System (`style.css`)
- `js/` - Audio Synthesizer, PDF.js Engine Parser, StPageFlip 3D Physics Controller, Main App Logic
- `vendor/` - Offline bundled Mozilla PDF.js, StPageFlip, Lucide Icons

---

## 🚀 How to Host on GitHub Pages (Step-by-Step)

### Option 1: Via GitHub Website UI (Drag & Drop or Push)

1. Create a new repository on [GitHub](https://github.com/new) (e.g. `3d-flipbook`).
2. Upload all files and folders inside `dist/github/` to your repository.
3. Go to **Settings** > **Pages** in your GitHub repository.
4. Under **Source**, select `Deploy from a branch`.
5. Select branch `main` (or `master`) and folder `/ (root)`, then click **Save**.
6. Wait 1-2 minutes! Your live 3D Flip Book web app URL will be ready at:
   `https://<your-username>.github.io/<repository-name>/`

---

### Option 2: Via Git CLI Command Line

```bash
cd "e:\Google Antigravity\Flip Book 3D\dist\github"
git init
git add .
git commit -m "Initial commit for 3D FlipBook GitHub Pages"
git branch -M main
git remote add origin https://github.com/<your-username>/<repository-name>.git
git push -u origin main
```
Then enable **GitHub Pages** from Repository Settings > Pages.
