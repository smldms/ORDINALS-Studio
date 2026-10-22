const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'../dist');
function dom(html,fetcher=async()=>{throw Error('offline')}){const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const d=new JSDOM(html,{url:'https://ord.test/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};w.fetch=fetcher;w.AbortSignal=AbortSignal;w.setInterval=()=>1;w.clearInterval=()=>{};w.setTimeout=()=>1;w.clearTimeout=()=>{}}});return {d,w:d.window,errors,run:code=>vm.runInContext(code,d.getInternalVMContext())}}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script src="([^"]+)"><\/script>/g,(_,file)=>'<script>'+fs.readFileSync(path.join(root,file),'utf8').replace(/<\/script/gi,'<\\/script')+'</script>');
(async()=>{const studio=dom(html),{w,run}=studio;assert.deepEqual(studio.errors,[]);assert(w.document.querySelector('#art path'));
for(const engine of ['flow','cell','type','op','super','iso']){
 w.document.querySelector(`[data-engine="${engine}"]`).click();assert.equal(run('s.engine'),engine);
 const initial=run('JSON.stringify(s)');const svg=run('artworkSVG()');assert.equal(run('artworkSVG()'),svg);assert.equal(run('JSON.stringify(s)'),initial);
 run(`s.bitcoin.rules[s.engine]={};for(const [key,label,min,max] of ruleSpecs(s))s.bitcoin.rules[s.engine][key]={enabled:true,min,max}`);
 assert(run(`Array.from({length:20},(_,i)=>effectiveState(s,{...GENESIS,hash:i.toString(16).padStart(64,'0')})).every(state=>ruleSpecs(s).every(([key,label,min,max])=>state.params[key]>=min&&state.params[key]<=max))`));
 const output=run('exportHTML()');assert(!/<script[^>]+src=|<link[^>]+href=/.test(output));const art=dom(output);assert.deepEqual(art.errors,[]);assert.equal(art.run('artworkSVG()'),run('artworkSVG()'));
 assert.equal(art.run('JSON.stringify(s)'),run('JSON.stringify(s)'));art.w.close();console.log(engine+': controls, deterministic vectors, all parameter bounds, identical autonomous export OK');
}
w.document.querySelector('[data-engine="flow"]').click();w.document.querySelector('[data-tab="bitcoin"]').click();w.document.querySelector('#bitcoinPoster').click();
for(const family of ['mono','archivo','bebas','roboto','grotesk']){run(`s.poster.blocks[0].font='${family}';s.poster.blocks[0].text='BLOCK {height} / {transactions} / {total_fee}';`);const a=dom(run('exportHTML()'));assert.deepEqual(a.errors,[]);assert.equal(a.run('artworkSVG()'),run('artworkSVG()'));a.w.close()}
run(`s.poster.blocks[0].text='</script><img src=x> {height}';`);const output=run('exportHTML()');const requests=[];let block={height:1,hash:'a'.repeat(64),timestamp:1231469665,transaction_count:1,total_fee:0};let offline=false;
const art=dom(output,async url=>{requests.push(url);if(offline)throw Error('offline');return {ok:true,json:async()=>url==='/r/blockhash'?block.hash:block}});
await new Promise(r=>setImmediate(r));assert.equal(art.run('currentBlock.height'),1);assert.equal(art.w.document.querySelectorAll('img').length,0);const before=art.w.document.getElementById('work').innerHTML;
block={...block,height:2,hash:'b'.repeat(64)};await art.run('refresh()');assert.equal(art.run('currentBlock.height'),2);assert.notEqual(art.w.document.getElementById('work').innerHTML,before);
block={...block,hash:'c'.repeat(64)};await art.run('refresh()');assert.equal(art.run('currentBlock.hash'),block.hash);
offline=true;const retained=art.w.document.getElementById('work').innerHTML;await art.run('refresh()');assert.equal(art.w.document.getElementById('work').innerHTML,retained);assert(art.w.document.getElementById('connection').textContent.includes('indisponibles'));assert(requests.every(u=>u==='/r/blockhash'||u.startsWith('/r/blockinfo/')));assert.deepEqual(art.errors,[]);
assert.equal(run(`resolveText('{total_fee} {transactions}',{total_fee:0})`),'0 N/A');assert.equal(run(`resolveText('{date} {time}',GENESIS)`),'2009-01-03 18:15:05 UTC');
run('currentBlock={height:5,simulated:true}');assert.throws(()=>run('exportHTML()'),/bloc réel/);
assert.throws(()=>run('validateBlock({height:0,hash:"bad",timestamp:1})'));
run('currentBlock={...GENESIS};s.bitcoin.rules.flow={density:{enabled:true,min:100,max:20}}');assert.throws(()=>run('exportHTML()'),/Limites invalides/);
assert.deepEqual(studio.errors,[]);art.w.close();w.close();console.log('Five fonts, dynamic text, HTML escaping, recursive updates, reorg, failure retention, missing data, simulation guard: OK');
})().catch(e=>{console.error(e);process.exitCode=1});
