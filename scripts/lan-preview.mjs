// Local network preview of public pages; the main server stays on loopback.
import http from 'node:http';
const host=process.argv[2];
if(!host||!/^\d{1,3}(\.\d{1,3}){3}$/.test(host))throw Error('Provide the computer LAN IPv4 address.');
http.createServer((req,res)=>{
 let url,path;
 try{url=new URL(req.url,'http://localhost');path=decodeURIComponent(url.pathname)}catch{res.writeHead(400).end();return}
 const publicPath=/^\/(tr|en|ar|ru)(\/|$)/.test(path)||/^\/(media|fonts|_next)\//.test(path)||['/','/favicon.png','/robots.txt','/sitemap.xml'].includes(path);
 const formApi=(path==='/api/request-token'&&req.method==='GET')||(path==='/api/requests'&&req.method==='POST');
 if(formApi&&req.method==='POST'&&req.headers.origin!==`http://${host}:4174`){res.writeHead(403).end();return}
 if(Number(req.headers['content-length']||0)>11*1024*1024){res.writeHead(413).end();return}
 if((!formApi&&(!['GET','HEAD'].includes(req.method)||!publicPath))||url.searchParams.has('preview')||path.includes('..')||path.includes('\\')){res.writeHead(404).end();return}
 const upstream=http.request({hostname:'127.0.0.1',port:4173,path:url.pathname+url.search,method:req.method,headers:{...(formApi&&req.method==='POST'?{'content-type':req.headers['content-type']||'','origin':'http://127.0.0.1:4173',...(req.headers['content-length']?{'content-length':req.headers['content-length']}:{})}:{}),host:'127.0.0.1:4173',accept:req.headers.accept||'*/*','accept-encoding':req.headers['accept-encoding']||'identity'}},incoming=>{
  const headers={...incoming.headers};delete headers['set-cookie'];
  if(headers.location?.startsWith('http://127.0.0.1:4173/'))headers.location=headers.location.replace('http://127.0.0.1:4173',`http://${host}:4174`);
  res.writeHead(incoming.statusCode||502,headers);incoming.pipe(res);
 });
 upstream.on('error',()=>{if(!res.headersSent)res.writeHead(502);res.end('Preview server is unavailable.');});
 res.on('close',()=>upstream.destroy());if(req.method==='POST'){let size=0;req.on('data',chunk=>{size+=chunk.length;if(size>11*1024*1024){upstream.destroy();res.writeHead(413).end();req.destroy()}});req.pipe(upstream)}else upstream.end();
}).listen(4174,host,()=>console.log(`Phone preview: http://${host}:4174/tr`));
