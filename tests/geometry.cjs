// Numerical and export regression checks. Run: node tests/geometry.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'../dist'),nodes=new Map();
const node=()=>({value:'',checked:true,style:{},classList:{toggle(){},add(){},remove(){}},setAttribute(){},replaceChildren(){},append(){}});
const ctx=vm.createContext({console,performance,structuredClone,document:{getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},querySelectorAll(){return[]},addEventListener(){},body:node()},localStorage:{getItem(){return null}},requestAnimationFrame(){},cancelAnimationFrame(){},innerWidth:1400});
for(const name of ['font-data.js','typography.js','poster.js','geometry-engines.js','core.js','bitcoin.js','app.js'])vm.runInContext(fs.readFileSync(path.join(root,name),'utf8').replace('controls();showFavs();bindPosterUI();initBitcoin();render();',''),ctx);
const run=code=>vm.runInContext(code,ctx);
function setup(engine,overrides={}){run(`s={engine:${JSON.stringify(engine)},seed:230823,format:'portrait',margin:16,paper:'white',palette:'festival',weight:.2,params:{...defaults[${JSON.stringify(engine)}],...${JSON.stringify(overrides)}},points:[]};phase=0;generate()`)}
function validate(){assert(run('paths.length>0'));assert(run('paths.every(p=>p.points.length>1&&p.points.every(v=>v.every(Number.isFinite)&&v[0]>=s.margin-1e-6&&v[1]>=s.margin-1e-6&&v[0]<=dims[0]-s.margin+1e-6&&v[1]<=dims[1]-s.margin+1e-6))'));const svg=run('svgExport()');assert(!/NaN|Infinity|<text|<image/.test(svg));assert(svg.includes('width="210mm"'));return svg;}
for(const engine of ['flow','cell','op','type','super','iso']){setup(engine);validate();const first=run('JSON.stringify(paths)');run('generate()');assert.equal(run('JSON.stringify(paths)'),first);console.log(engine,run('paths.length'),'paths; deterministic, clipped SVG');}
setup('super',{iterations:1,n1:2,n2:2,n3:2});assert(run('paths.every(p=>dist(p.points[0],p.points.at(-1))<1e-8)'));assert(run('Math.max(...paths[0].points.map(v=>Math.hypot(v[0]-105,v[1]-148.5)))-Math.min(...paths[0].points.map(v=>Math.hypot(v[0]-105,v[1]-148.5)))<1e-8'));
setup('super',{columns:4,rows:5,iterations:90,n1:.15,n2:10,n3:.15,a:.3,b:2,morph:1,twist:120});validate();assert(run('paths.length===1800'));console.log('super extreme / 20 shapes:',run('paths.reduce((t,p)=>t+p.points.length,0)'),'points');
setup('iso',{mode:'terrain',cells:1,height:1,occupancy:100,hatch:0});assert.equal(run('paths.length'),9,'one solid cube has 9 visible edges');
const start=performance.now();setup('iso',{cells:22,height:12,occupancy:100,hatch:8,mode:'city'});validate();console.log('iso maximum city:',run('paths.length'),'paths,',Math.round(performance.now()-start),'ms including optimized SVG');
for(const engine of ['super','iso'])for(const effect of ['overlay','reserve','repel']){setup(engine);run(`s.poster.enabled=true;s.poster.effect='${effect}';s.poster.blocks=[{...blockDefaults,font:'archivo',text:'FORM',size:30,x:50,y:40,align:'center'}];generate()`);validate();assert(run('paths.some(p=>p.layer===palette().length)'));console.log(engine,effect,'with vector poster: OK')}
console.log('All geometry checks passed.');

setup('iso',{mode:'blocks',occupancy:75,levels:3,subdivision:68,stacks:2,gap:0});
const blocks=run('isoBlocks(s.params,s.seed)');
assert(new Set(blocks.map(b=>b.size)).size>=3,'mixed cube sizes');
for(let i=0;i<blocks.length;i++)for(let j=i+1;j<blocks.length;j++){
 const a=blocks[i],b=blocks[j];
 assert(!['x','y','z'].every(k=>Math.min(a[k]+a.size,b[k]+b.size)-Math.max(a[k],b[k])>1e-8),'no overlapping volumes');
}
validate();const original=run('JSON.stringify(paths)');run('generate()');assert.equal(run('JSON.stringify(paths)'),original);
run('s.seed++;generate()');assert.notEqual(run('JSON.stringify(paths)'),original);
for(const subdivision of [0,100]){setup('iso',{mode:'blocks',subdivision,occupancy:100,levels:3});validate();assert.equal(run('new Set(isoBlocks(s.params,s.seed).map(b=>b.size)).size'),1)}
setup('iso',{mode:'blocks',levels:3,subdivision:100,stacks:3,occupancy:75,hatch:8,gap:20});validate();
console.log('Mixed cubes: disjoint volumes, 3 sizes, deterministic seed, extremes and SVG OK');

for(const mode of ['blocks','terrain'])for(const format of ['square','portrait','landscape','a3portrait','a3landscape']){
 setup('iso',{mode,occupancy:100,framing:'cover',hatch:0});run(`s.format='${format}';generate()`);
 assert(run('paths.length>0&&paths.every(p=>p.points.every(v=>v[0]>=s.margin-1e-6&&v[1]>=s.margin-1e-6&&v[0]<=dims[0]-s.margin+1e-6&&v[1]<=dims[1]-s.margin+1e-6))'));
 assert(run('Math.min(...paths.flatMap(p=>p.points.map(v=>v[0])))<s.margin+.01'));
 assert(run('Math.max(...paths.flatMap(p=>p.points.map(v=>v[0])))>dims[0]-s.margin-.01'));
 assert(run('Math.min(...paths.flatMap(p=>p.points.map(v=>v[1])))<s.margin+.01'));
 assert(run('Math.max(...paths.flatMap(p=>p.points.map(v=>v[1])))>dims[1]-s.margin-.01'));
}
const aspect=[];for(const cells of [4,12,22]){setup('iso',{mode:'steps',cells,height:6,occupancy:100,hatch:0});aspect.push(run('(()=>{const a=paths.flatMap(p=>p.points),xs=a.map(v=>v[0]),ys=a.map(v=>v[1]);return(Math.max(...ys)-Math.min(...ys))/(Math.max(...xs)-Math.min(...xs))})()'));}
assert(Math.max(...aspect)-Math.min(...aspect)<.08,'grid density must preserve relief proportions');
console.log('Framing: all 5 formats reach all 4 margins; grid proportions stable');
