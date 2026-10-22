/* Original PLOTR implementations: Gielis radial formula and isometric height fields.
   Creative references: jasonwebb/SuperformulaSVG and wblut/isogrid (see README).
   No third-party source code is embedded. Geometry is in paper millimeters. */
const geometryDefaults={
 super:{m:6,n1:.7,n2:1.7,n3:1.7,a:1,b:1,iterations:36,decay:1.35,twist:24,morph:0,rotation:0,columns:1,rows:1},
 iso:{cells:12,height:6,frequency:2.3,occupancy:65,hatch:3,rotation:0,mode:'blocks',levels:3,subdivision:68,stacks:1,gap:0,framing:'fit',zoom:100,panX:0,panY:0}
};
const geometrySpecs={
 super:[['m','Symétrie · nombre de pointes',2,16,2],['n1','n₁ · tension',.15,10,.05],['n2','n₂ · courbure cosinus',.15,10,.05],['n3','n₃ · courbure sinus',.15,10,.05],['a','a · axe cosinus',.3,2,.05],['b','b · axe sinus',.3,2,.05],['iterations','Contours imbriqués',1,90,1],['decay','Décroissance des contours',.4,3,.05],['twist','Torsion entre contours (°)',-120,120,1],['morph','Variation de forme',0,1,.05],['rotation','Rotation (°)',-180,180,1],['columns','Colonnes',1,4,1],['rows','Rangées',1,5,1]],
 iso:[['levels','Niveaux de tailles · 1 à 3',1,3,1],['subdivision','Subdivision · petits cubes (%)',0,100,1],['stacks','Empilement vertical',1,3,1],['gap','Espacement des cubes (%)',0,20,1],['cells','Grille · cellules par côté',4,22,1],['height','Hauteur du relief · relative',1,12,1],['frequency','Fréquence du relief',.5,5,.1],['occupancy','Occupation (%)',25,100,1],['hatch','Hachures par face',0,8,1],['rotation','Point de vue · quarts de tour',0,3,1],['zoom','Zoom (%)',50,250,5],['panX','Cadrage horizontal (%)',-50,50,1],['panY','Cadrage vertical (%)',-50,50,1]]
};
const superPresets={petal:{m:6,n1:.7,n2:1.7,n3:1.7,a:1,b:1,twist:24,morph:0},star:{m:8,n1:.3,n2:1,n3:1,a:1,b:1,twist:0,morph:.1},square:{m:4,n1:4,n2:4,n3:4,a:1,b:1,twist:35,morph:.3},shell:{m:10,n1:1.7,n2:3,n3:3,a:1,b:1,twist:90,morph:.8}};
function geometryControlsHTML(){if(s.engine==='super')return '<label>Point de départ<select id="shapePreset"><option value="">Réglages libres</option><option value="petal">Corolle</option><option value="star">Étoile</option><option value="square">Carré souple</option><option value="shell">Coquille</option></select></label>';if(s.engine==='iso')return '<label>Construction<select id="mode"><option value="blocks">Cubes multi-échelles · volume ajouré</option><option value="terrain">Relief · strates organiques</option><option value="city">Architecture · tours</option><option value="steps">Gradins · pyramide</option></select></label><label>Cadrage<select id="isoFraming"><option value="fit">Structure entière</option><option value="cover">Remplir la zone · recadrer aux marges</option></select></label>';return ''}
function bindGeometryControls(){if(s.engine==='iso'){$('isoFraming').value=s.params.framing;$('isoFraming').onchange=e=>{s.params.framing=e.target.value;schedule()};const mode=$('mode'),original=mode.onchange,show=()=>{for(const key of ['levels','subdivision','stacks','gap'])document.querySelector('[data-param="'+key+'"]').closest('label').hidden=s.params.mode!=='blocks';for(const key of ['cells','height'])document.querySelector('[data-param="'+key+'"]').closest('label').hidden=s.params.mode==='blocks';document.querySelector('[data-param="frequency"]').closest('label').hidden=s.params.mode!=='terrain'};show();mode.onchange=e=>{original(e);show()}}if($('shapePreset'))$('shapePreset').onchange=e=>{const preset=superPresets[e.target.value];if(!preset)return;Object.assign(s.params,preset);phase=0;controls();schedule()}}
function randomizeGeometry(r){if(s.engine==='super'){const preset=Object.values(superPresets)[Math.floor(r()*4)];Object.assign(s.params,preset,{m:2*(2+Math.floor(r()*5)),iterations:20+Math.floor(r()*45),decay:+(.7+r()*1.3).toFixed(2),rotation:Math.floor(r()*180),twist:Math.floor((r()-.5)*120)});}if(s.engine==='iso')Object.assign(s.params,{cells:8+Math.floor(r()*9),height:3+Math.floor(r()*7),frequency:+(1+r()*3).toFixed(1),occupancy:60+Math.floor(r()*30),subdivision:45+Math.floor(r()*40),rotation:Math.floor(r()*4)});}
function generateSuper(p,colors){
 const [w,h]=dims,m=s.margin,cw=(w-2*m)/p.columns,ch=(h-2*m)/p.rows;
 for(let row=0;row<p.rows;row++)for(let col=0;col<p.columns;col++){
  const cx=m+(col+.5)*cw,cy=m+(row+.5)*ch,curves=[];let maxRadius=0;
  for(let k=0;k<p.iterations;k++){
   const t=p.iterations===1?0:k/(p.iterations-1),size=p.iterations===1?1:Math.pow(1-.93*t,p.decay),n1=p.n1*(1+p.morph*t*3),pts=[];
   const rotation=(p.rotation+p.twist*t)*Math.PI/180+phase*.18,steps=Math.max(96,Math.min(640,Math.floor(240000/(p.columns*p.rows*p.iterations))));
   for(let j=0;j<steps;j++){
    const angle=j/steps*Math.PI*2;
    const sum=Math.pow(Math.abs(Math.cos(p.m*angle/4)/p.a),p.n2)+Math.pow(Math.abs(Math.sin(p.m*angle/4)/p.b),p.n3);
    const radius=Math.exp(Math.max(-20,Math.min(20,-Math.log(Math.max(1e-20,sum))/n1)))*size;
    maxRadius=Math.max(maxRadius,radius);pts.push([Math.cos(angle+rotation)*radius,Math.sin(angle+rotation)*radius]);
   }curves.push(pts);
  }
  const scale=Math.min(cw,ch)*.46/Math.max(maxRadius,1e-12);
  curves.forEach((pts,i)=>{const curve=pts.map(([x,y])=>[cx+x*scale,cy+y*scale]);curve.push(curve[0]);add(curve,(i+row+col)%colors)});
 }
}
// Convex polygon clipping returns the interval of a line inside the face.
function isoInsideInterval(a,b,poly){let lo=0,hi=1;const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];let area=0;for(let i=0;i<poly.length;i++)area+=cross(poly[i],poly[(i+1)%poly.length]);const sign=area>=0?1:-1;
 for(let i=0;i<poly.length;i++){const u=poly[i],v=poly[(i+1)%poly.length],edge=[v[0]-u[0],v[1]-u[1]],f0=sign*cross(edge,[a[0]-u[0],a[1]-u[1]]),f1=sign*cross(edge,[b[0]-u[0],b[1]-u[1]]),df=f1-f0;if(Math.abs(df)<1e-10){if(f0< -1e-8)return null;continue}const t=-f0/df;if(df>0)lo=Math.max(lo,t);else hi=Math.min(hi,t);if(lo>=hi-1e-9)return null;}return[lo,hi]}
// Disjoint octree leaves: subdivision changes width, depth and height together.
// Missing leaves make real 3D cavities, not just lower height-map columns.
function isoBlocks(p,seed){
 const extent=2**p.levels,blocks=[],rng=random(seed);
 function visit(x,y,z,size,depth){
  const split=rng(),keep=rng();
  if(depth<p.levels&&(depth===0||split<p.subdivision/100)){
   const half=size/2;
   for(let i=0;i<2;i++)for(let j=0;j<2;j++)for(let k=0;k<2;k++)visit(x+i*half,y+j*half,z+k*half,half,depth+1);
  }else if(keep<p.occupancy/100)blocks.push({x,y,z,size});
 }
 for(let level=0;level<p.stacks;level++)visit(0,0,level*extent,extent,0);
 // A sparse seed should still produce a composition.
 if(!blocks.length)blocks.push({x:0,y:0,z:0,size:extent/2});
 return blocks.map(block=>{let {x,y,z,size}=block;for(let q=0;q<p.rotation;q++)[x,y]=[extent-y-size,x];const inset=size*p.gap/200;return{x:x+inset,y:y+inset,z:z+inset,size:size-2*inset}});
}
function isoHull(points){
 const sorted=points.map(v=>[v[0],v[1]]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]).filter((p,i,a)=>!i||p[0]!==a[i-1][0]||p[1]!==a[i-1][1]);
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const half=list=>{const h=[];for(const p of list){while(h.length>1&&cross(h.at(-2),h.at(-1),p)<=0)h.pop();h.push(p)}return h.slice(0,-1)};
 return [...half(sorted),...half([...sorted].reverse())];
}
function generateIso(p,colors){
 const N=p.cells,reliefHeight=p.height,r=random(s.seed),noise=noiseFactory(s.seed),grid=Array.from({length:N},()=>Array(N).fill(0));
 for(let x=0;x<N;x++)for(let y=0;y<N;y++){
  const u=(x+.5)/N,v=(y+.5)/N;let f;
  if(p.mode==='city')f=.12+.88*r();else if(p.mode==='steps')f=1-Math.max(Math.abs(u-.5),Math.abs(v-.5))*2;else f=.5+.35*noise(u*p.frequency+4,v*p.frequency+7)+.15*noise(u*p.frequency*2+9,v*p.frequency*2);
  grid[x][y]=r()*100<p.occupancy?Math.max(1,Math.min(reliefHeight,Math.ceil(f*reliefHeight))):0;
 }
 let heights=grid;for(let q=0;q<p.rotation;q++){const old=heights;heights=Array.from({length:N},(_,x)=>Array.from({length:N},(_,y)=>old[N-1-y][x]));}
 const faces=[],c=Math.sqrt(3)/2,project=([x,y,z])=>[(x-y)*c,(x+y)*.5-z,x+y+z];
 const face=(verts,side)=>{
  const poly=verts.map(project),[a,b,d]=poly,dx=b[0]-a[0],dy=b[1]-a[1],ex=d[0]-a[0],ey=d[1]-a[1],det=dx*ey-dy*ex;
  const A=((b[2]-a[2])*ey-(d[2]-a[2])*dy)/det,B=(dx*(d[2]-a[2])-ex*(b[2]-a[2]))/det;
  faces.push({poly,side,A,B,C:a[2]-A*a[0]-B*a[1],box:[Math.min(...poly.map(v=>v[0])),Math.min(...poly.map(v=>v[1])),Math.max(...poly.map(v=>v[0])),Math.max(...poly.map(v=>v[1]))]});
 };
 if(p.mode==='blocks'){for(const {x,y,z,size:d} of isoBlocks(p,s.seed)){
  face([[x,y,z+d],[x+d,y,z+d],[x+d,y+d,z+d],[x,y+d,z+d]],0);
  face([[x+d,y,z],[x+d,y+d,z],[x+d,y+d,z+d],[x+d,y,z+d]],1);
  face([[x,y+d,z],[x+d,y+d,z],[x+d,y+d,z+d],[x,y+d,z+d]],2);
 }}else {const unit=12/N;
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){const H=heights[i][j];if(!H)continue;const x=i*unit,y=j*unit;
   face([[x,y,H],[x+unit,y,H],[x+unit,y+unit,H],[x,y+unit,H]],0);
   for(let z=(i+1<N?heights[i+1][j]:0);z<H-1e-9;z+=unit){const top=Math.min(H,z+unit);face([[x+unit,y,z],[x+unit,y+unit,z],[x+unit,y+unit,top],[x+unit,y,top]],1)}
   for(let z=(j+1<N?heights[i][j+1]:0);z<H-1e-9;z+=unit){const top=Math.min(H,z+unit);face([[x,y+unit,z],[x+unit,y+unit,z],[x+unit,y+unit,top],[x,y+unit,top]],2)}
  }
 }
 if(!faces.length)return;
 // Projected spatial buckets keep visibility queries local, even for tall cities.
 const buckets=new Map,unit=2;
 const bins=box=>{const keys=[];for(let x=Math.floor(box[0]/unit);x<=Math.floor(box[2]/unit);x++)for(let y=Math.floor(box[1]/unit);y<=Math.floor(box[3]/unit);y++)keys.push(x+','+y);return keys};
 faces.forEach((f,i)=>bins(f.box).forEach(key=>{if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(i)}));
 const allBox=[Math.min(...faces.map(f=>f.box[0])),Math.min(...faces.map(f=>f.box[1])),Math.max(...faces.map(f=>f.box[2])),Math.max(...faces.map(f=>f.box[3]))];
 const center=[(allBox[0]+allBox[2])/2,(allBox[1]+allBox[3])/2],width=dims[0]-2*s.margin,height=dims[1]-2*s.margin;
 let scale=.94*Math.min(width/(allBox[2]-allBox[0]),height/(allBox[3]-allBox[1]));
 if(p.framing==='cover'){
  // Fit the printable rectangle inside the projected convex hull, not merely
  // its bounding box: a diamond's corners otherwise leave broad blank wedges.
  const hull=isoHull(faces.flatMap(f=>f.poly));scale=0;
  for(let i=0;i<hull.length;i++){const a=hull[i],b=hull[(i+1)%hull.length],dx=b[0]-a[0],dy=b[1]-a[1],distance=dx*(center[1]-a[1])-dy*(center[0]-a[0]);
   if(distance>1e-8)scale=Math.max(scale,(Math.abs(dx)*height/2+Math.abs(dy)*width/2)/distance);
  }
 }
 scale*=p.zoom/100;
 const paper=v=>[dims[0]/2+(v[0]-center[0])*scale+width*p.panX/100,dims[1]/2+(v[1]-center[1])*scale+height*p.panY/100],seen=new Set;
 const visible=(a,b,owner)=>{
  let intervals=[[0,1]];const candidates=new Set(bins([Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])]).flatMap(k=>buckets.get(k)||[]));
  for(const id of candidates){const f=faces[id];if(f===owner)continue;let range=isoInsideInterval(a,b,f.poly);if(!range)continue;
   // Occlude only where the other face is nearer along the viewing ray.
   const da=f.A*a[0]+f.B*a[1]+f.C-a[2]-1e-7,db=f.A*b[0]+f.B*b[1]+f.C-b[2]-1e-7,diff=db-da;
   if(Math.abs(diff)<1e-10){if(da<=0)continue}else if(diff>0)range[0]=Math.max(range[0],-da/diff);else range[1]=Math.min(range[1],-da/diff);
   const [lo,hi]=range;if(hi<=lo)continue;const out=[];for(const [u,v]of intervals){if(hi<=u||lo>=v)out.push([u,v]);else{if(lo>u)out.push([u,lo]);if(hi<v)out.push([hi,v])}}intervals=out;if(!intervals.length)break;
  }
  for(const [u,v]of intervals){if(v-u<1e-7)continue;const lerp=t=>a.map((x,k)=>x+(b[k]-x)*t),aa=paper(lerp(u)),bb=paper(lerp(v)),key=[aa.map(x=>x.toFixed(5)).join(','),bb.map(x=>x.toFixed(5)).join(',')].sort().join('|');if(seen.has(key))continue;seen.add(key);add([aa,bb],owner.side%colors)}
 };
 for(const f of faces){for(let i=0;i<4;i++)visible(f.poly[i],f.poly[(i+1)%4],f);const count=f.side===0?0:f.side===1?p.hatch:Math.floor(p.hatch/2);for(let k=1;k<=count;k++){const t=k/(count+1),mix=(a,b)=>a.map((v,j)=>v+(b[j]-v)*t);visible(mix(f.poly[0],f.poly[1]),mix(f.poly[3],f.poly[2]),f)}}
}
