import fs from 'fs';
import path from 'path';
import type { Plugin, ViteDevServer } from 'vite';

interface SyncPayload {
  component: string;
  selector: string;
  overrides: Record<string, string>;
}

export function themeSyncPlugin(): Plugin {
  return {
    name: 'vite-plugin-theme-sync',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/__theme_sync') && req.method === 'GET') {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const component = url.searchParams.get('component');

          let targetFile = '';
          if (component === 'global') {
            targetFile = path.resolve(__dirname, 'src/index.css');
          } else if (component === 'login') {
            targetFile = path.resolve(__dirname, 'src/lab/specimens/LoginSpecimen.module.css');
          } else {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Unsupported component' }));
            return;
          }

          if (!fs.existsSync(targetFile)) {
            res.statusCode = 200;
            res.end(JSON.stringify({ overrides: {} }));
            return;
          }

          let content = fs.readFileSync(targetFile, 'utf-8');
          const startMarker = `/* --- LAB_OVERRIDES_START --- */`;
          const endMarker = `/* --- LAB_OVERRIDES_END --- */`;
          const startIndex = content.indexOf(startMarker);
          const endIndex = content.indexOf(endMarker);

          const overrides: Record<string, string> = {};
          if (startIndex !== -1 && endIndex !== -1) {
            const block = content.substring(startIndex + startMarker.length, endIndex);
            const lines = block.split('\n');
            for (const line of lines) {
              const match = line.match(/^\s*(--[\w-]+)\s*:\s*(.+?)\s*;/);
              if (match) {
                overrides[match[1]] = match[2];
              }
            }
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ overrides }));
          return;
        }

        if (req.url === '/__theme_sync' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const payload: SyncPayload = JSON.parse(body);
              const { component, overrides } = payload;
              
              // Determine file path based on component
              let targetFile = '';
              if (component === 'global') {
                targetFile = path.resolve(__dirname, 'src/index.css');
              } else if (component === 'login') {
                targetFile = path.resolve(__dirname, 'src/lab/specimens/LoginSpecimen.module.css');
              } else {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Unsupported component' }));
                return;
              }

              if (!fs.existsSync(targetFile)) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: `File not found: ${targetFile}` }));
                return;
              }

              let content = fs.readFileSync(targetFile, 'utf-8');
              
              const startMarker = `/* --- LAB_OVERRIDES_START --- */`;
              const endMarker = `/* --- LAB_OVERRIDES_END --- */`;
              
              const startIndex = content.indexOf(startMarker);
              const endIndex = content.indexOf(endMarker);

              if (startIndex === -1 || endIndex === -1) {
                // If markers don't exist, we can't safely inject
                res.statusCode = 400;
                res.end(JSON.stringify({ error: `Markers not found in ${targetFile}` }));
                return;
              }

              // Build the new CSS block
              const lines = Object.entries(overrides)
                .filter(([_, val]) => val !== undefined && val !== null && val !== '')
                .map(([key, val]) => `  ${key}: ${val};`);
                
              const newOverrides = lines.length > 0 ? `\n${lines.join('\n')}\n  ` : '';
              
              const newContent = content.substring(0, startIndex + startMarker.length) + newOverrides + content.substring(endIndex);
              
              fs.writeFileSync(targetFile, newContent, 'utf-8');
              
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}
