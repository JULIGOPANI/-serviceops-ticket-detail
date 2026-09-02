import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig(({ command }) => ({
  // On GitHub Pages the site is served from /<repo-name>/, so the production
  // build needs that base path. Local dev (`vite`) keeps the root base.
  /* ⚠️ Must match the REPO NAME exactly — GitHub Pages serves a project site from
     /<repo>/, and a mismatch here is a blank page with a 404 on every asset rather than
     an error you can read. The leading hyphen is not a typo; the repository is literally
     named `-serviceops-ticket-detail`. Rename the repo and this line changes with it. */
  base: command === 'build' ? '/-serviceops-ticket-detail/' : '/',
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  server: {
    /* Bound to every interface, and the tunnel domains trusted, so this dev server can be shared
       over a reverse tunnel (ssh -R to localhost.run, or ngrok).
       ⚠️ A LIST, not `true`. Vite rejects unknown Host headers to stop a malicious page in your
          browser driving this server via DNS rebinding; `true` drops that guard for the whole
          internet while the server is publicly reachable. Naming the tunnel wildcards keeps it. */
    host: true,
    allowedHosts: ['.lhr.life', '.localhost.run', '.ngrok-free.app', '.ngrok-free.dev', '.ngrok.io'],
    watch: {
      /* Dropping a file into the project root — a screenshot, a spec — kills the dev server:
       * the tool writing it holds a lock, Chokidar's watch() throws EBUSY on Windows, and the
       * FSWatcher error is fatal. It has happened three times.
       *
       * Tradeoff: this stops watching images everywhere, including src/assets and src/imports,
       * so replacing one of those needs a manual refresh. They are Figma exports that do not
       * change mid-session, which is a cheap price for a dev server that stays up. */
      ignored: [
        '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.webp',
        '**/*.zip', '**/*.pdf',
        // Reference docs and briefs live in the root and are edited outside the app.
        '**/BOM-DESIGN-SYSTEM.md', '**/SHORTCUTS.md', '**/ATTRIBUTIONS.md',
        '**/ServiceOps_Global_Search_Claude_Prompt.md',
        '**/Add Tiered Filtering to ServiceOps Global Search.md',
      ],
    },
  },
}))
