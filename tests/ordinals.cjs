const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
(async()=>{
 const root=path.resolve(__dirname,'../dist');
 const server=http.createServer((req,res)=>{let file=path.join(root,req.url==='/'?'index.html':req.url.split('?')[0]);try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.ttf')?'font/ttf':'text/html');res.end(fs.readFileSync(file))}catch{res.statusCode=404;res.end()}}).listen(0,'127.0.0.1');
 let browser;try{browser=await chromium.launch({headless:true})}catch(e){server.close();throw e}
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port);
 await page.waitForSelector('#art path');
 for(const engine of ['flow','cell','type','op','super','iso']){
 await page.click('[data-engine="'+engine+'"]');
 const result=await page.evaluate(()=>{generate();const a=JSON.stringify(paths);generate();const deterministic=a===JSON.stringify(paths);s.bitcoin.rules[s.engine]={};const spec=ruleSpecs(s)[0];s.bitcoin.rules[s.engine][spec[0]]={enabled:true,min:spec[2],max:spec[3]};const cfg=JSON.stringify(s);const b=effectiveState(s,currentBlock);const inside=b.params[spec[0]]>=spec[2]&&b.params[spec[0]]<=spec[3];return {deterministic,inside,unchanged:cfg===JSON.stringify(s),html:exportHTML(),svg:artworkSVG()}});
 assert(result.deterministic&&result.inside&&result.unchanged);
 const exported=await browser.newPage();let requests=[];
 await exported.route('**/*',route=>{requests.push(route.request().url());return route.abort()});
 await exported.setContent(result.html);assert.equal(await exported.evaluate(()=>artworkSVG()),result.svg);
 assert(!/<script[^>]+src=|<link[^>]+href=/.test(result.html));
 await exported.close();console.log(engine+': deterministic, bounded, standalone export matches preview');
 }
 await page.click('[data-engine="flow"]');await page.click('[data-tab="bitcoin"]');await page.click('#bitcoinPoster');
 const poster=await page.evaluate(()=>{s.poster.blocks[0].text='BLOCK {height}\n</script><img src=x>';s.poster.blocks[0].font='archivo';render();return {html:exportHTML(),svg:artworkSVG()}});
 const artwork=await browser.newPage();const runtimeErrors=[];artwork.on('pageerror',e=>runtimeErrors.push(e.message));let next={height:1,hash:'a'.repeat(64),timestamp:1231469665,transaction_count:1,total_fee:0};const requests=[];
 await artwork.route('**/*',async route=>{const url=new URL(route.request().url());requests.push(url.pathname);if(url.pathname==='/r/blockhash')return route.fulfill({json:next.hash});if(url.pathname==='/r/blockinfo/'+next.hash)return route.fulfill({json:next});return route.abort()});
 await artwork.goto('http://runtime.test/').catch(()=>{});await artwork.setContent(poster.html);await artwork.waitForFunction(()=>currentBlock.height===1);assert.equal(await artwork.locator('img').count(),0);assert(requests.includes('/r/blockhash'));const before=await artwork.locator('#work').innerHTML();
 next={...next,height:2,hash:'b'.repeat(64)};await artwork.evaluate(()=>refresh());assert.notEqual(await artwork.locator('#work').innerHTML(),before);
 next={...next,hash:'c'.repeat(64)};await artwork.evaluate(()=>refresh());assert.equal(await artwork.evaluate(()=>currentBlock.hash),next.hash,'same-height reorg');
 await artwork.unroute('**/*');await artwork.route('**/*',r=>r.abort());const kept=await artwork.locator('#work').innerHTML();await artwork.evaluate(()=>refresh());assert.equal(await artwork.locator('#work').innerHTML(),kept);assert((await artwork.locator('#connection').textContent()).length>0);
 assert.deepEqual(runtimeErrors,[]);await artwork.close();
 await page.evaluate(()=>{currentBlock={...GENESIS};s.poster.blocks[0].text='BLOCK\n{height}';s.poster.blocks[0].font='bebas';render()});
 await page.screenshot({path:'/tmp/ordinals-studio.png',fullPage:true});assert.deepEqual(errors,[]);
 console.log('Poster fonts, script escaping, recursive refresh, same-height reorg and network failure: passed');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
