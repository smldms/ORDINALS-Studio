/* Studio-only creative controls. Shared colors live in core.js for autonomous export. */
let compositionHistory=[];
function applyArtDirection(key){
 const direction=artDirections[key];if(!direction)return;
 s.appearance={...direction,key,mode:s.appearance?.mode||'accent'};
 if(s.poster)for(const b of s.poster.blocks)b.color=direction.ink;
}
function syncArtDirection(){
 if(!$('artDirection'))return;
 $('artDirection').value=s.appearance?.key||'';
 $('colorMode').value=s.appearance?.mode||'accent';
 for(const key of ['background','ink','accent'])$('color-'+key).value=s.appearance?.[key]||(key==='background'?paperColor():palette()[key==='ink'?0:1]||palette()[0]);
}
function makeComposition(seed){
 const r=random(seed),pick=a=>a[Math.floor(r()*a.length)],range=(a,b)=>a+r()*(b-a),integer=(a,b)=>Math.floor(range(a,b+1));
 const engine=pick(Object.keys(defaults));
 const next={engine,seed,format:pick(['square','portrait','landscape','a3portrait','a3landscape']),margin:integer(14,28),paper:'white',palette:'mono',weight:pick([.15,.2,.25,.3]),params:{...defaults[engine]},points:[],poster:newPoster(),bitcoin:{seed:true,phase:true,rules:{}}};
 const key=pick(Object.keys(artDirections));next.appearance={...artDirections[key],key,mode:pick(['mono','accent','accent','zones'])};
 const p=next.params;
 if(engine==='flow')Object.assign(p,{density:integer(90,220),frequency:+range(.7,3.7).toFixed(1),amplitude:+range(.6,2.8).toFixed(1),octaves:integer(1,4),length:integer(25,60)*5,force:+range(.4,2.5).toFixed(1),field:pick(['vortex','gravity'])});
 if(engine==='cell')Object.assign(p,{density:integer(30,110),offset:integer(5,24),explode:integer(0,18),mode:pick(['voronoi','delaunay'])});
 if(engine==='op')Object.assign(p,{density:integer(45,125),amplitude:integer(8,30),frequency:integer(2,6),mode:pick(['wave','rings'])});
 if(engine==='super')Object.assign(p,pick(Object.values(superPresets)),{m:2*integer(2,6),iterations:integer(20,55),decay:integer(14,36)*.05,twist:integer(-60,60),rotation:integer(-90,90),columns:pick([1,1,2]),rows:pick([1,1,2])});
 if(engine==='iso')Object.assign(p,{mode:pick(['blocks','terrain','city','steps']),cells:integer(8,15),height:integer(3,8),occupancy:integer(55,85),hatch:integer(0,4),rotation:integer(0,3),subdivision:integer(35,75),levels:pick([2,3]),gap:integer(0,7)});
 if(engine==='type')Object.assign(p,{text:pick(['BLOCK {height}','TIME / SPACE','NO SIGNAL','FUTURE MEMORY','PROOF OF TIME']),font:pick(['mono','archivo','bebas','grotesk','roboto']),density:integer(6,16),repeatSize:pick([7,9,11,13]),amplitude:integer(3,16),scale:integer(2,12)/10,tracking:pick([.3,.6,1]),width:integer(70,110)});
 next.poster.enabled=engine!=='type'&&r()<.65;
 next.poster.effect='reserve';next.poster.clearance=2.5;
 const left=next.margin/({a3portrait:297,a3landscape:420,landscape:297}[next.format]||210)*100+1;
 const title=pick(['BLOCK\n{height}','PROOF\nOF TIME','FUTURE\nMEMORY','CHAIN\nREACTION']);
 const layout=integer(0,2),font=pick(['bebas','grotesk','archivo','roboto','mono']);
 next.poster.blocks=[
 {...blockDefaults,text:title,font,size:layout===2?14:19,x:left,y:layout===1?60:16,tracking:.3,leading:1.2,weight:.22,color:next.appearance.ink},
 {...blockDefaults,text:pick(['BLOCK {height}\n{date}','{date}\n{transactions} TX','BLOCK {height}\nFEES {fees} SAT']),font:'mono',size:2.5,x:left,y:layout===1?12:84,tracking:.3,leading:1.7,weight:.18,color:next.appearance.ink}
 ];
 // Restrict the block's movement to a neighborhood of this composition.
 const candidates=specs[engine].filter(([key])=>!['columns','rows','levels','stacks','panX','panY','zoom'].includes(key));
 const spec=pick(candidates),[param,label,min,max,step]=spec,center=p[param],radius=(max-min)*.12;
 const lo=min+Math.max(0,Math.ceil((center-radius-min)/step))*step;
 const hi=min+Math.min(Math.floor((max-min)/step),Math.floor((center+radius-min)/step))*step;
 next.bitcoin.rules[engine]={[param]:{enabled:true,min:+lo.toFixed(5),max:+hi.toFixed(5)}};
 return next;
}
function initArtDirection(){
 $('artDirectionControls').innerHTML=`<label>Atmosphère<select id="artDirection"><option value="">Palette classique / personnalisée</option>${Object.entries(artDirections).map(([key,a])=>`<option value="${key}">${a.name}</option>`).join('')}</select></label><label>Répartition<select id="colorMode"><option value="mono">Monochrome · une seule encre</option><option value="accent">Accent · touches de couleur</option><option value="zones">Bicolore · zones diagonales</option></select></label><div class="color-fields">${[['background','Fond'],['ink','Encre'],['accent','Accent']].map(([key,label])=>`<label>${label}<input type="color" id="color-${key}" aria-label="${label}"></label>`).join('')}</div><p class="tip">Des fonds et encres accordés. Les couleurs sont conservées dans le HTML autonome. Changer l’atmosphère harmonise aussi les textes ; leurs couleurs restent modifiables dans Affiche.</p>`;
 $('artDirection').onchange=e=>{if(e.target.value)applyArtDirection(e.target.value);else delete s.appearance;controls();render()};
 function ensure(){if(!s.appearance)s.appearance={background:paperColor(),ink:palette()[0],accent:palette()[1]||'#b85431',mode:'accent'}}
 $('colorMode').onchange=e=>{ensure();s.appearance.mode=e.target.value;sync();render()};
 for(const key of ['background','ink','accent'])$('color-'+key).oninput=e=>{ensure();const previous=s.appearance.ink;s.appearance[key]=e.target.value;s.appearance.key='';if(key==='ink')for(const b of s.poster.blocks)if(b.color===previous)b.color=e.target.value;sync();posterControls();schedule()};
 $('randomAll').onclick=()=>{
 pause();compositionHistory.push({state:structuredClone(s),phase,study});if(compositionHistory.length>12)compositionHistory.shift();
 const seed=locked?s.seed:1+Math.floor(Math.random()*999998);
 const next=makeComposition(1+Math.floor(Math.random()*999998));next.seed=seed;s=next;phase=0;study++;activeBlock=0;
 $('undoComposition').disabled=false;controls();render();toast('Nouvelle composition · '+artDirections[s.appearance.key].name+(locked?' · seed conservée':''));
 };
 $('undoComposition').onclick=()=>{const previous=compositionHistory.pop();if(!previous)return;pause();s=previous.state;phase=previous.phase;study=previous.study;activeBlock=0;$('undoComposition').disabled=!compositionHistory.length;controls();render();toast('Composition précédente restaurée')};
}
