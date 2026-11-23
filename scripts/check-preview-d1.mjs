// Validate the Cloudflare Workers preview D1 binding before enabling preview builds.
// Usage: node scripts/check-preview-d1.mjs [path/to/wrangler.toml]
// Requires a distinct preview database ID. Never substitute production D1.
import {readFileSync} from 'node:fs';
const file=process.argv[2]||'wrangler.toml';
const config=readFileSync(file,'utf8');
const production=config.match(/\[\[d1_databases\]\]([\s\S]*?)(?=\n\[|$)/)?.[1]||'';
const preview=config.match(/\[\[previews\.d1_databases\]\]([\s\S]*?)(?=\n\[|$)/)?.[1]||'';
const field=(block,key)=>block.match(new RegExp('^\\s*'+key+'\\s*=\\s*"([^"]+)"','m'))?.[1];
const prodId=field(production,'database_id');
const previewId=field(preview,'database_id');
const previewBinding=field(preview,'binding');
if(!prodId||!previewId||previewId===prodId||previewBinding!=='DB'||!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/.test(previewId)){
  console.error('PREVIEW BLOCKED: configure [[previews.d1_databases]] binding="DB" with a real, separate D1 database_id. Never use production D1.');
  process.exitCode=1;
}else{
  console.log('Preview D1 isolation configured: production and preview database IDs differ.');
}
