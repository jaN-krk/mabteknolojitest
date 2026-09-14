import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
function load(file){const exports={};new Function('require','exports',ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(require,exports);return exports}
const {createRemoteDatabase,createRemoteBucket}=load('lib/remote-storage.ts'),{validAdminCredentials}=load('lib/admin-credentials.ts');
const settings={CLOUDFLARE_ACCOUNT_ID:'a'.repeat(32),CLOUDFLARE_D1_DATABASE_ID:'11111111-1111-4111-8111-111111111111',CLOUDFLARE_API_TOKEN:'fake',R2_BUCKET_NAME:'test-bucket',R2_ACCESS_KEY_ID:'test-id',R2_SECRET_ACCESS_KEY:'test-secret'};
const original=globalThis.fetch;let calls=0,mode='db',lastBody;
globalThis.fetch=async(input,options)=>{calls++;if(mode==='db'){assert.equal(new URL(input).hostname,'api.cloudflare.com');assert.equal(options.headers.Authorization,'Bearer fake');lastBody=JSON.parse(options.body);const queries=lastBody.batch||[lastBody];return Response.json({success:true,result:queries.map(()=>({results:[{id:'test',n:1}],success:true,meta:{changes:1}}))})}if(mode==='fail')return new Response('',{status:503});const r=input instanceof Request?input:new Request(input,options);assert.equal(new URL(r.url).hostname,'a'.repeat(32)+'.r2.cloudflarestorage.com');assert(r.headers.get('authorization')?.startsWith('AWS4-HMAC-SHA256'));if(mode==='missing')return new Response('',{status:404});return new Response(r.method==='GET'?'private-file':'',{status:200})};
try{
 assert.equal(createRemoteDatabase({}),undefined);assert.equal(createRemoteBucket({}),undefined);assert.equal(calls,0);
 const db=createRemoteDatabase(settings);assert.equal((await db.prepare('SELECT id WHERE n=?').bind(1).first()).id,'test');assert.deepEqual(lastBody,{sql:'SELECT id WHERE n=?',params:[1]});assert.equal(await db.prepare('SELECT n').first('n'),1);
 const result=await db.batch([db.prepare('UPDATE test SET n=?').bind(2),db.prepare('SELECT changes()')]);assert.equal(result.length,2);assert(Array.isArray(lastBody.batch));assert.deepEqual(lastBody.batch[0].params,[2]);
 mode='fail';await assert.rejects(db.prepare('SELECT 1').all(),/503/);
 mode='storage';const bucket=createRemoteBucket(settings);await bucket.put('requests/test',new TextEncoder().encode('test'));assert.equal(await new Response((await bucket.get('requests/test')).body).text(),'private-file');mode='missing';assert.equal(await bucket.get('requests/missing'),null);mode='fail';await assert.rejects(bucket.put('requests/test',new Uint8Array()),/503/);
 const password='test-password-at-least-24-characters';const auth='Basic '+Buffer.from('admin:'+password).toString('base64');assert(validAdminCredentials(auth,'admin',password));assert(!validAdminCredentials(auth,'other',password));assert(!validAdminCredentials('oai-authenticated-user-id: local_seedy','admin',password));assert(!validAdminCredentials(null,'admin',password));assert(!validAdminCredentials(auth,'admin','short'));assert(!validAdminCredentials('Basic invalid','admin',password));
 console.log('Node adapters: D1 parameters/batch/failure, signed private R2 access/failure, missing config and administrator authentication passed. No external requests sent.');
}finally{globalThis.fetch=original}
