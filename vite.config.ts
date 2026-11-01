import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import type { OutputChunk } from 'rollup';

// Landing pages dont le code est préchargé dès le HTML (sinon il n'est demandé qu'après l'exécution de vendor.js,
// soit un aller-retour réseau de plus avant l'affichage). Clé : début du chemin ; valeur : fichier source de la page.
const LP_PRELOAD: Record<string, string> = {
  '/lp/pigma-stop-fuites': 'src/LandingPagePigma.tsx',
};

function lpModulePreload(routes: Record<string, string>): Plugin {
  return {
    name: 'lp-module-preload',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        const chunks = Object.values(ctx.bundle).filter((c): c is OutputChunk => c.type === 'chunk');
        const entry = chunks.find(c => c.isEntry);
        if (!entry) return html;
        // déjà chargés par le HTML
        const loaded = new Set([entry.fileName, ...entry.imports]);
        const map: Record<string, string[]> = {};
        for (const [prefix, src] of Object.entries(routes)) {
          const page = chunks.find(c => c.facadeModuleId?.replace(/\\/g, '/').endsWith(src));
          if (!page) continue;
          const files: string[] = [];
          const walk = (c: OutputChunk) => {
            if (loaded.has(c.fileName) || files.includes(c.fileName)) return;
            files.push(c.fileName);
            c.imports.forEach(f => { const dep = chunks.find(x => x.fileName === f); if (dep) walk(dep); });
          };
          walk(page);
          map[prefix] = files.map(f => '/' + f);
        }
        if (!Object.keys(map).length) return html;
        const script = `<script>(function(m){for(var p in m)if(location.pathname.indexOf(p)===0)m[p].forEach(function(h){var l=document.createElement('link');l.rel='modulepreload';l.crossOrigin='';l.href=h;document.head.appendChild(l)})})(${JSON.stringify(map)})</script>`;
        return html.replace('</head>', `  ${script}\n  </head>`);
      },
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), lpModulePreload(LP_PRELOAD)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'es2020',
      cssCodeSplit: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // motion (framer-motion) contient "react" dans son chemin : on le garde à part
              // pour qu'il ne soit chargé que par les pages qui l'utilisent.
              if (/node_modules\/(motion|framer-motion|motion-dom|motion-utils)\//.test(id)) {
                return 'motion';
              }
              if (id.includes('react') ||id.includes('react-dom') || id.includes('react-router')) {
                return 'vendor';
              }
              if (id.includes('lucide-react')) {
                return 'icons';
              }
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
