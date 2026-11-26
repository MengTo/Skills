/* A Vite plugin that previews one demo window alone:
   /preview?entry=<absolute path to an entry .jsx> mounts that file in a
   bare page, so each window (and each helper agent's work) is checked
   without the site around it.

   // vite.config.js (or a scratch config that extends it)
   import { htmlDemoPreview } from './skills/html-demo/scripts/preview-plugin.mjs';
   export default { plugins: [react(), htmlDemoPreview()], server: { fs: { strict: false } } };

   An entry imports the page's styles and renders the window at the width
   the page will show it:

   import { createRoot } from 'react-dom/client';
   import '/src/styles.css';
   import StepWindow from '/skills/html-demo/scripts/StepWindow.jsx';
   import { STEPS } from '/src/demos/import.jsx';
   createRoot(document.getElementById('root')).render(
     <div style={{ width: 820, padding: 40 }}><StepWindow steps={STEPS} /></div>,
   );

   Run it with its own cache folder and port, so it never fights the
   project's own dev server:
   npx vite --config scratch/vite.preview.mjs  (cacheDir: 'scratch/cache') */
export function htmlDemoPreview({ theme = 'dark' } = {}) {
  return {
    name: 'html-demo-preview',
    configureServer(server) {
      server.middlewares.use('/preview', async (req, res) => {
        const entry = new URL(req.url, 'http://x').searchParams.get('entry');
        if (!entry) {
          res.statusCode = 400;
          return res.end('Add ?entry=<absolute path to an entry .jsx>');
        }
        const html = await server.transformIndexHtml(
          req.url,
          `<!doctype html><html lang="en" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>preview</title></head><body style="margin:0;background:#060607"><div id="root"></div><script type="module" src="/@fs${entry}"></script></body></html>`,
        );
        res.setHeader('Content-Type', 'text/html');
        res.end(html);
      });
    },
  };
}
