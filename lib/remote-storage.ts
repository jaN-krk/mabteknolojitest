import {AwsClient} from 'aws4fetch';
type Settings=Record<string,string|undefined>;
type Query={sql:string;params:unknown[]};
type Result={results:Record<string,unknown>[];success:boolean;meta:Record<string,unknown>};

/** The subset of D1 used by the application, transported through its HTTPS API. */
export function createRemoteDatabase(settings:Settings):D1Database|undefined{
 const {CLOUDFLARE_ACCOUNT_ID:account,CLOUDFLARE_D1_DATABASE_ID:database,CLOUDFLARE_API_TOKEN:token}=settings;
 if(!account||!database||!token)return undefined;
 if(!/^[a-f0-9]{32}$/i.test(account)||!/^[a-f0-9-]{36}$/i.test(database))throw Error('Invalid database configuration');
 const endpoint=`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`;
 async function execute(queries:Query[]){
  const response=await fetch(endpoint,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(queries.length===1?queries[0]:{batch:queries}),cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error(`Database request failed (${response.status})`);
  const data=await response.json() as {success:boolean;result:Result[]};
  if(!data.success||!Array.isArray(data.result)||data.result.length!==queries.length||data.result.some(r=>!r.success))throw Error('Database operation failed');
  return data.result;
 }
 class Statement{
  constructor(readonly sql:string,readonly params:unknown[]=[]){ }
  bind(...params:unknown[]){return new Statement(this.sql,params)}
  async all(){return (await execute([{sql:this.sql,params:this.params}]))[0]}
  async run(){return this.all()}
  async first(column?:string){const row=(await this.all()).results[0];return column?(row?.[column]??null):(row??null)}
  async raw(){return (await this.all()).results.map(row=>Object.values(row))}
 }
 return {prepare:(sql:string)=>new Statement(sql),batch:(statements:Statement[])=>execute(statements.map(s=>({sql:s.sql,params:s.params})))} as unknown as D1Database;
}

/** Private S3-compatible R2 objects; credentials and signed requests stay server-side. */
export function createRemoteBucket(settings:Settings):R2Bucket|undefined{
 const {CLOUDFLARE_ACCOUNT_ID:account,R2_BUCKET_NAME:bucket,R2_ACCESS_KEY_ID:accessKeyId,R2_SECRET_ACCESS_KEY:secretAccessKey}=settings;
 if(!account||!bucket||!accessKeyId||!secretAccessKey)return undefined;
 if(!/^[a-f0-9]{32}$/i.test(account)||!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket))throw Error('Invalid object storage configuration');
 const client=new AwsClient({accessKeyId,secretAccessKey,service:'s3',region:'auto',retries:0});
 const url=(key:string)=>`https://${account}.r2.cloudflarestorage.com/${bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;
 return {
  async put(key:string,bytes:Uint8Array,options?:{httpMetadata?:{contentType?:string};customMetadata?:{filename?:string}}){
   const response=await client.fetch(url(key),{method:'PUT',body:new Uint8Array(bytes),headers:{'Content-Type':options?.httpMetadata?.contentType||'application/octet-stream'},signal:AbortSignal.timeout(20000)});
   if(!response.ok)throw Error(`Attachment upload failed (${response.status})`);
   return {key};
  },
  async get(key:string){const response=await client.fetch(url(key),{method:'GET',signal:AbortSignal.timeout(20000)});if(response.status===404)return null;if(!response.ok)throw Error(`Attachment download failed (${response.status})`);return{body:response.body}},
 } as unknown as R2Bucket;
}
