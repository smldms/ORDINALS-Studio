const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'../dist');
function dom(html,fetcher=async()=>{throw Error('offline')},url='https://ord.test/'){const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const d=new JSDOM(html,{url,runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};w.fetch=fetcher;w.AbortSignal=AbortSignal;w.setInterval=(fn,ms)=>{w.__poll=fn;w.__pollMs=ms;return 1};w.clearInterval=()=>{};w.setTimeout=()=>1;w.clearTimeout=()=>{}}});return {d,w:d.window,errors,run:code=>vm.runInContext(code,d.getInternalVMContext())}}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script src="([^"]+)"><\/script>/g,(_,file)=>'<script>'+fs.readFileSync(path.join(root,file),'utf8').replace(/<\/script/gi,'<\\/script')+'</script>');
(async()=>{const studio=dom(html),{w,run}=studio;assert.deepEqual(studio.errors,[]);assert(w.document.querySelector('#art path'));
for(const engine of ['flow','cell','type','op','super','iso']){
 w.document.querySelector(`[data-engine="${engine}"]`).click();assert.equal(run('s.engine'),engine);
 const initial=run('JSON.stringify(s)');const svg=run('artworkSVG()');run("currentBlock={...GENESIS,height:1,hash:'a'.repeat(64)}");assert.notEqual(run('artworkSVG()'),svg,engine+' must change geometry at a new block');run('currentBlock={...GENESIS}');assert.equal(run('artworkSVG()'),svg);assert.equal(run('JSON.stringify(s)'),initial);
 run(`s.bitcoin.rules[s.engine]={};for(const [key,label,min,max] of ruleSpecs(s))s.bitcoin.rules[s.engine][key]={enabled:true,min,max}`);
 assert(run(`Array.from({length:20},(_,i)=>effectiveState(s,{...GENESIS,hash:i.toString(16).padStart(64,'0')})).every(state=>ruleSpecs(s).every(([key,label,min,max])=>state.params[key]>=min&&state.params[key]<=max))`));
 const output=run('exportHTML()');assert(!/<script[^>]+src=|<link[^>]+href=/.test(output));const art=dom(output);assert.deepEqual(art.errors,[]);assert.equal(art.run('artworkSVG()'),run('artworkSVG()'));
 assert.equal(art.run('JSON.stringify(s)'),run('JSON.stringify(s)'));art.w.close();console.log(engine+': controls, deterministic vectors, all parameter bounds, identical autonomous export OK');
}

// Full compositions keep deterministic shared rendering, color and undo semantics.
const seenEngines=new Set(),seenPalettes=new Set(),seenFormats=new Set();
for(let seed=1;seed<=24;seed++){
 run(`s=makeComposition(${seed});controls();render()`);
 seenEngines.add(run('s.engine'));seenPalettes.add(run('s.appearance.key'));seenFormats.add(run('s.format'));
 assert.equal(run(`JSON.stringify(makeComposition(${seed}))`),run(`JSON.stringify(makeComposition(${seed}))`));
 const svg=run('artworkSVG()');assert(!/undefined|NaN|Infinity/.test(svg));assert(run('paths.length>0'));
 assert(run('Object.values(s.bitcoin.rules[s.engine]).every(rule=>rule.min<=rule.max)'));
 if(seed<=8){const a=dom(run('exportHTML()'));assert.deepEqual(a.errors,[]);assert.equal(a.run('artworkSVG()'),svg);assert.equal(a.run('paperColor()'),run('paperColor()'));a.w.close()}
}
assert.equal(seenEngines.size,6);assert(seenPalettes.size>=6);assert(seenFormats.size>=4);
for(const key of run('Object.keys(artDirections)'))for(const mode of ['mono','accent','zones']){
 run(`applyArtDirection('${key}');s.appearance.mode='${mode}';render()`);
 assert(!/undefined|NaN/.test(run('artworkSVG()')));
}
const prior=run('JSON.stringify(s)'),priorSVG=run('artworkSVG()');
w.document.getElementById('randomAll').click();assert.notEqual(run('JSON.stringify(s)'),prior);
w.document.getElementById('undoComposition').click();assert.equal(run('JSON.stringify(s)'),prior);assert.equal(run('artworkSVG()'),priorSVG);
run('locked=true');const lockedSeed=run('s.seed');w.document.getElementById('randomAll').click();assert.equal(run('s.seed'),lockedSeed);run('locked=false');
console.log('24 full compositions, 8 palettes, 3 color modes, autonomous colors, undo and locked seed OK');

// Insert at the selection and persist through the existing textarea input handler.
for(const [engine,target] of [['flow','blockText'],['type','words']]){
 w.document.querySelector('[data-engine="'+engine+'"]').click();const field=w.document.getElementById(target);
 field.value='BLOCK X';field.dispatchEvent(new w.Event('input',{bubbles:true}));field.setSelectionRange(6,7);
 w.document.querySelector('[data-token-target="'+target+'"][data-token="fees"]').click();
 assert.equal(field.value,'BLOCK {fees}');assert.equal(run(target==='words'?'s.params.text':'s.poster.blocks[activeBlock].text'),field.value);
 w.document.getElementById(target+'Token').value='difficulty';field.setSelectionRange(field.value.length,field.value.length);
 w.document.querySelector('[data-token-target="'+target+'"]:not([data-token])').click();assert.equal(field.value,'BLOCK {fees}{difficulty}');
}
const sample={height:1,hash:'a'.repeat(64),timestamp:1231469665,total_fee:123456789,average_fee:123,median_fee:100,min_fee:0,max_fee:999,average_fee_rate:2,min_fee_rate:1,max_fee_rate:10,transaction_count:1234,total_size:10000,total_weight:40000,max_tx_size:1000,subsidy:312500000,difficulty:123.5,nonce:12345,version:1,bits:123,median_time:1231469600,merkle_root:'b'.repeat(64),previous_block:'c'.repeat(64)};
run('currentBlock=validateBlock('+JSON.stringify(sample)+')');
assert.equal(run("resolveText('{fees} {total_fee} {fees_btc} {subsidy_btc} {size} {weight} {nonce} {min_fee}',currentBlock)"),'123456789 123456789 1.23456789 3.12500000 10000 40000 12345 0');
assert(run("BITCOIN_TEXT_FIELDS.every(([key])=>!resolveText('{'+key+'}',currentBlock).includes('N/A'))"));
assert.equal(run("resolveText('{difficulty} {nonce} {fees_btc}',GENESIS)"),'N/A N/A 0.00000000');
run("s.engine='type';s.params={...defaults.type,text:BITCOIN_TEXT_FIELDS.map(([key])=>'{'+key+'}').join(' / '),density:1};s.poster.enabled=false");
const fieldArt=dom(run('exportHTML()'));assert.equal(fieldArt.run('artworkSVG()'),run('artworkSVG()'));assert.deepEqual(fieldArt.errors,[]);fieldArt.w.close();run('currentBlock={...GENESIS}');
w.document.querySelector('[data-engine="flow"]').click();w.document.querySelector('[data-tab="bitcoin"]').click();w.document.querySelector('#bitcoinPoster').click();
for(const family of ['mono','archivo','bebas','roboto','grotesk']){run(`s.poster.blocks[0].font='${family}';s.poster.blocks[0].text='BLOCK {height} / {transactions} / {total_fee}';`);const a=dom(run('exportHTML()'));assert.deepEqual(a.errors,[]);assert.equal(a.run('artworkSVG()'),run('artworkSVG()'));a.w.close()}
run(`s.poster.blocks[0].text='</script><img src=x> {height}';`);const output=run('exportHTML()');const requests=[];let block={height:1,hash:'a'.repeat(64),timestamp:1231469665,transaction_count:1,total_fee:0};let offline=false;
const art=dom(output,async url=>{requests.push(url);if(offline)throw Error('offline');return {ok:true,json:async()=>url==='https://ordinals.com/r/blockheight'?block.height:block}});
await new Promise(r=>setImmediate(r));assert.equal(art.run('currentBlock.height'),1);assert.equal(art.w.document.querySelectorAll('img').length,0);const before=art.w.document.getElementById('work').innerHTML;
block={...block,height:2,hash:'b'.repeat(64)};assert.equal(art.w.__pollMs,30000);await art.w.__poll();assert.equal(art.run('currentBlock.height'),2);assert.notEqual(art.w.document.getElementById('work').innerHTML,before);
block={...block,hash:'c'.repeat(64)};await art.run('refresh()');assert.equal(art.run('currentBlock.hash'),block.hash);
offline=true;const retained=art.w.document.getElementById('work').innerHTML;await art.run('refresh()');assert.equal(art.w.document.getElementById('work').innerHTML,retained);assert(art.w.document.getElementById('connection').textContent.includes('indisponible'));assert(requests.every(u=>u==='https://ordinals.com/r/blockheight'||u.startsWith('https://ordinals.com/r/blockinfo/')));assert.deepEqual(art.errors,[]);
assert.equal(run(`resolveText('{total_fee} {transactions}',{total_fee:0})`),'0 N/A');assert.equal(run(`resolveText('{date} {time}',GENESIS)`),'2009-01-03 18:15:05 UTC');
run('currentBlock={height:5,simulated:true}');assert.throws(()=>run('exportHTML()'),/bloc réel/);
assert.throws(()=>run('validateBlock({height:0,hash:"bad",timestamp:1})'));
run('currentBlock={...GENESIS};s.bitcoin.rules.flow={density:{enabled:true,min:100,max:20}}');assert.throws(()=>run('exportHTML()'),/Limites invalides/);

for(const url of ['file:///tmp/art.html','http://localhost:8080/art.html','https://example.com/art.html','https://ordinals.com/content/'+'d'.repeat(64)+'i0','https://gateway.test/content/'+'d'.repeat(64)+'i0']){
 const calls=[];const sameOrigin=url.startsWith('https://ordinals.com/')||url.startsWith('https://gateway.test/');
 const a=dom(output,async endpoint=>{calls.push(endpoint);return {ok:true,json:async()=>endpoint.endsWith('/r/blockheight')?block.height:block}},url);
 await new Promise(r=>setImmediate(r));assert.equal(a.run('currentBlock.hash'),block.hash,url);
 assert.equal(calls[0],(sameOrigin?'':'https://ordinals.com')+'/r/blockheight',url);assert.deepEqual(a.errors,[]);a.w.close();
}
run('s.bitcoin={seed:false,phase:false,rules:{}}');assert.throws(()=>run('exportHTML()'),/variation/);
if(process.env.ORDINALS_LIVE_TEST){
 const {execFile}=require('node:child_process');
 const live=dom(output,url=>new Promise((resolve,reject)=>execFile('curl',['-fsS','--max-time','20',url],(err,stdout)=>err?reject(err):resolve({ok:true,json:async()=>JSON.parse(stdout)}))),'file:///tmp/art.html');
 for(let i=0;i<60&&live.run('busy');i++)await new Promise(r=>setTimeout(r,500));
 assert(live.run('currentBlock.height')>0);assert.equal(live.w.document.getElementById('connection').textContent,'');assert.deepEqual(live.errors,[]);
 console.log('REAL ordinals.com from standalone file: block '+live.run('currentBlock.height')+', SVG paths '+live.w.document.querySelectorAll('#work path').length);live.w.close();
}
assert.deepEqual(studio.errors,[]);art.w.close();w.close();console.log('Five fonts, dynamic text, HTML escaping, recursive updates, reorg, failure retention, missing data, simulation guard: OK');
})().catch(e=>{console.error(e);process.exitCode=1});
