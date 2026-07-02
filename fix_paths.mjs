import Database from 'better-sqlite3';
const db = new Database('./data/blacknails.db');

console.log('Fixing paths in database...');
const replaceHostPath = '/srv/storage/ai-lab/Blacknails-Media-v3/library';
const replaceDockerPath = '/home/node/app/library';

db.prepare(`UPDATE assets SET thumbnail_path = REPLACE(thumbnail_path, '${replaceHostPath}', '${replaceDockerPath}') WHERE thumbnail_path LIKE '${replaceHostPath}%'`).run();
db.prepare(`UPDATE assets SET ai_thumbnail_path = REPLACE(ai_thumbnail_path, '${replaceHostPath}', '${replaceDockerPath}') WHERE ai_thumbnail_path LIKE '${replaceHostPath}%'`).run();
db.prepare(`UPDATE assets SET video_preview_path = REPLACE(video_preview_path, '${replaceHostPath}', '${replaceDockerPath}') WHERE video_preview_path LIKE '${replaceHostPath}%'`).run();
db.prepare(`UPDATE assets SET sidecar_path = REPLACE(sidecar_path, '${replaceHostPath}', '${replaceDockerPath}') WHERE sidecar_path LIKE '${replaceHostPath}%'`).run();
db.prepare(`UPDATE media_files SET current_path = REPLACE(current_path, '${replaceHostPath}', '${replaceDockerPath}') WHERE current_path LIKE '${replaceHostPath}%'`).run();
console.log('Done');
