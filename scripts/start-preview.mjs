import './sites-env.mjs';
import {projectRoot} from './sites-env.mjs';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
const extra=process.argv.slice(2),envFile=path.join(projectRoot,'.env');
const child=spawn(process.execPath,['--import',new URL('./sites-env.mjs',import.meta.url).href,path.join(projectRoot,'node_modules/wrangler/bin/wrangler.js'),'dev','--config','dist/server/wrangler.json','--local','--persist-to','.wrangler/state','--ip','127.0.0.1','--inspector-port','0',...(existsSync(envFile)&&!extra.includes('--env-file')?['--env-file',envFile]:[]),...extra],{cwd:projectRoot,stdio:'inherit',windowsHide:true});
child.on('error',error=>{console.error(error.message);process.exitCode=1});child.on('exit',code=>{process.exitCode=code??1});
