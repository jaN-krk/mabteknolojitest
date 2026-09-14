import http from 'node:http';
import fs from 'node:fs';
// Test-only local sink. It never forwards email or contacts any external server.
const records=[];let failNext=false;
http.createServer(async(req,res)=>{
 if(req.method==='GET'&&req.url==='/records'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(records));return}
 if(req.method==='POST'&&req.url==='/fail-next'){failNext=true;res.end('ok');return}
 if(req.method!=='POST'||req.url!=='/emails'){res.statusCode=404;res.end();return}
 let raw='';for await(const chunk of req)raw+=chunk;
 if(failNext){failNext=false;res.statusCode=503;res.end(JSON.stringify({error:'Injected test failure'}));return}
 const body=JSON.parse(raw);records.push({id:req.headers['idempotency-key'],to:body.to,subject:body.subject});
 fs.mkdirSync('.sites-runtime',{recursive:true});fs.writeFileSync('.sites-runtime/mock-delivery.json',JSON.stringify(records,null,2));
 res.setHeader('Content-Type','application/json');res.end(JSON.stringify({id:'local-test-'+records.length}));
}).listen(5190,'127.0.0.1',()=>console.log('Test-only email sink at http://127.0.0.1:5190. No external delivery.'));
