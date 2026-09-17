/* DESCONEXO v7.0.0 - clean-room architectural and physics rebuild */
(()=>{'use strict';
const VERSION='8.0.0';
const URLs=['https://cdn.babylonjs.com/babylon.js','https://cdn.babylonjs.com/gui/babylon.gui.min.js'];
const CFG=Object.freeze({W:14,D:11,FLOOR:3.4,EYE:1.67,RADIUS:.28,HEIGHT:1.72,WALK:2.35,RUN:5.25,FOCUS:1.25,GRAVITY:-15.5,TERMINAL:-18,STEP:.32,MOUSE:3000,RANGE:2.45});
const SAVE='desconexo-v8-state',PREF='desconexo-v8-pref';
const state=read(SAVE,{wardrobe:false,key:false,bedroomOpen:false,medicineSeen:false,diary:false,tvStage:0,distorted:false,complete:false});
const pref=read(PREF,{sensitivity:1});
function read(k,d){try{return Object.assign({},d,JSON.parse(localStorage.getItem(k)||'{}'))}catch{return Object.assign({},d)}}
function store(){localStorage.setItem(SAVE,JSON.stringify(state))}function storePref(){localStorage.setItem(PREF,JSON.stringify(pref))}
function script(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>no(new Error('Failed to load '+src));document.head.appendChild(s)})}
async function boot(){document.title='DESCONEXO';document.documentElement.style.cssText='width:100%;height:100%;background:#050506';document.body.style.cssText='width:100%;height:100%;margin:0;overflow:hidden;background:#050506';const canvas=document.createElement('canvas');canvas.style.cssText='width:100%;height:100%;display:block;outline:0;touch-action:none';canvas.tabIndex=0;document.body.appendChild(canvas);try{for(const u of URLs){if(u.includes('gui')?!(window.BABYLON&&BABYLON.GUI):!window.BABYLON)await script(u)}run(canvas)}catch(e){console.error(e)}}
function run(canvas){const B=BABYLON,G=B.GUI;const engine=new B.Engine(canvas,true,{stencil:false,preserveDrawingBuffer:false},true);engine.setHardwareScalingLevel(Math.max(1,Math.min(1.5,devicePixelRatio||1)));const scene=new B.Scene(engine);scene.clearColor=new B.Color4(.015,.014,.016,1);scene.skipPointerMovePicking=true;
const camera=new B.UniversalCamera('player',new B.Vector3(10.5,CFG.FLOOR+CFG.EYE,8.4),scene);camera.attachControl(canvas,true);camera.inputs.removeByType('FreeCameraKeyboardMoveInput');camera.inertia=0;camera.angularSensibility=CFG.MOUSE/pref.sensitivity;camera.fov=.8;camera.minZ=.04;
const root1=new B.TransformNode('floor-1',scene),root2=new B.TransformNode('floor-2',scene);root2.position.y=CFG.FLOOR;
const blockers={1:[],2:[]},interactions=[],visual={};const input={w:0,a:0,s:0,d:0,shift:0,q:0,up:0,down:0};const dev={fly:false};let locked=true,current=null,vy=0,grounded=true,bobTime=0,bobX=0,bobY=0,roll=0,subtitleTimer=0;
// CANVAS GUI
const ui=G.AdvancedDynamicTexture.CreateFullscreenUI('ui',true,scene);ui.idealWidth=1920;ui.idealHeight=1080;const U=new G.Container();ui.addControl(U);const text=(v,n=20,c='#eee')=>{const t=new G.TextBlock();t.text=v;t.fontFamily='Arial';t.fontSize=n;t.color=c;t.textWrapping=true;t.isPointerBlocker=false;return t};const rect=(bg='#0b0908ed',line='#66554b')=>{const r=new G.Rectangle();r.background=bg;r.color=line;r.thickness=1;r.cornerRadius=2;return r};
const vig=new G.Image('subtle-vignette');const vg='<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><defs><radialGradient id="v"><stop offset="0" stop-color="black" stop-opacity="0"/><stop offset=".82" stop-color="black" stop-opacity="0"/><stop offset=".96" stop-color="black" stop-opacity=".11"/><stop offset="1" stop-color="black" stop-opacity=".26"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#v)"/></svg>';vig.source='data:image/svg+xml,'+encodeURIComponent(vg);vig.width='100%';vig.height='100%';vig.stretch=G.Image.STRETCH_FILL;vig.alpha=.30;vig.isPointerBlocker=false;U.addControl(vig);
const cross=text('+',27),prompt=text('',19),objective=text('',18),status=text('',16),subtitle=text('',25),devLabel=text('',16,'#ffb34a');cross.width='40px';cross.height='40px';prompt.width='720px';prompt.height='42px';prompt.top='90px';objective.width='640px';objective.height='74px';objective.left='28px';objective.top='32px';objective.horizontalAlignment=G.Control.HORIZONTAL_ALIGNMENT_LEFT;objective.verticalAlignment=G.Control.VERTICAL_ALIGNMENT_TOP;objective.textHorizontalAlignment=G.Control.HORIZONTAL_ALIGNMENT_LEFT;status.width='720px';status.height='35px';status.left='-28px';status.top='25px';status.horizontalAlignment=G.Control.HORIZONTAL_ALIGNMENT_RIGHT;status.verticalAlignment=G.Control.VERTICAL_ALIGNMENT_TOP;status.textHorizontalAlignment=G.Control.HORIZONTAL_ALIGNMENT_RIGHT;subtitle.width='1000px';subtitle.height='90px';subtitle.top='-65px';subtitle.verticalAlignment=G.Control.VERTICAL_ALIGNMENT_BOTTOM;subtitle.alpha=0;devLabel.width='500px';devLabel.height='30px';devLabel.left='-28px';devLabel.top='55px';devLabel.horizontalAlignment=G.Control.HORIZONTAL_ALIGNMENT_RIGHT;devLabel.verticalAlignment=G.Control.VERTICAL_ALIGNMENT_TOP;devLabel.textHorizontalAlignment=G.Control.HORIZONTAL_ALIGNMENT_RIGHT;[cross,prompt,objective,status,subtitle,devLabel].forEach(x=>U.addControl(x));
function say(m,ms=2600){subtitle.text=m;subtitle.alpha=1;clearTimeout(subtitleTimer);subtitleTimer=setTimeout(()=>subtitle.alpha=0,ms)}function button(label,fn,alt=false){const b=G.Button.CreateSimpleButton('btn-'+label,label);b.width='255px';b.height='53px';b.color='#fff';b.background=alt?'#181311':'#7d2029';b.fontSize=18;b.onPointerClickObservable.add(fn);return b}function panel(w='800px',h='630px',paper=false){const p=rect(paper?'#d4cab1':'#0b0908ed');p.width=w;p.height=h;p.isVisible=false;p.isPointerBlocker=true;U.addControl(p);const st=new G.StackPanel();st.width='88%';p.addControl(st);return[p,st]}function add(st,v,n=21,c='#eee',h=65){const t=text(v,n,c);t.height=h+'px';st.addControl(t)}function show(p,on){p.isVisible=on;locked=on;if(on)document.exitPointerLock?.();else canvas.requestPointerLock?.()}
const [menu,menuStack]=panel('830px','670px');menu.isVisible=true;add(menuStack,'DESCONEXO',54,'#eee',90);add(menuStack,'CLEAN REBUILD - V'+VERSION,15,'#b9414c',35);add(menuStack,'Explore the house and survive the first distortion.',23,'#c8bfb5',95);add(menuStack,'WASD move | SHIFT run | Q focus | E interact\nP fly mode | SPACE up | CTRL down',18,'#bdb3aa',80);menuStack.addControl(button('START GAME',()=>{menu.isVisible=false;locked=false;canvas.focus();canvas.requestPointerLock?.()}));menuStack.addControl(button('RESET SAVE',()=>{localStorage.removeItem(SAVE);location.reload()},true));
const [albumPanel,albumStack]=panel('720px','500px');add(albumStack,'WEDDING ALBUM',17,'#b9414c',46);add(albumStack,'A BLOOD-STAINED PAGE',32,'#eee',68);add(albumStack,'A photograph is marked DEMON. A brass key is fixed beside it.',22,'#c8bfb5',125);albumStack.addControl(button('TAKE KEY',()=>{state.key=true;visual.key.forEach(x=>x.isVisible=false);visual.keyLight.intensity=0;store();refreshUI();show(albumPanel,false);say('A brass key. It should open the bedroom door.')}));albumStack.addControl(button('CLOSE',()=>show(albumPanel,false),true));
const [diaryPanel,diaryStack]=panel('850px','690px',true);add(diaryStack,'DIARY PAGE',17,'#8c222d',44);add(diaryStack,'12/03/11',32,'#211d18',56);add(diaryStack,'The day was good. We went to the cinema, had dinner and spent the day together. Sometimes he seems so distant.\n\nThe cinema and dinner were excuses to take him to the doctor. The medication was increased. I hope the doctor is right.',21,'#211d18',425);diaryStack.addControl(button('CLOSE',()=>show(diaryPanel,false)));
// MATERIALS
function material(n,c,e){const m=new B.StandardMaterial(n,scene);m.diffuseColor=B.Color3.FromHexString(c);m.specularColor.set(.02,.02,.02);m.backFaceCulling=false;if(e)m.emissiveColor=B.Color3.FromHexString(e);return m}const M={wall:material('wall','#68645d'),floor:material('floor','#43352f'),wood:material('wood','#4c3025'),dark:material('dark','#11100f'),paper:material('paper','#c9bd9e'),metal:material('metal','#9c7530'),bath:material('bath','#8e9693'),glass:material('dirty-glass','#4e5655','#090a0a'),tv:material('tv','#6e716b','#101410')};M.glass.alpha=.92;
function mesh(n,x,y,z,w,h,d,m,f=1){const q=B.MeshBuilder.CreateBox(n,{width:w,height:h,depth:d},scene);q.position.set(x,y,z);q.material=m;q.parent=f===1?root1:root2;return q}function addBlock(f,n,x,z,w,d){blockers[f].push({n,minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2})}function solid(n,x,y,z,w,h,d,m,f){const q=mesh(n,x,y,z,w,h,d,m,f);addBlock(f,n,x,z,w,d);return q}function wall(f,n,x,z,w,d,h=3.18){const q=mesh(n,x,h/2,z,w,h,d,M.wall,f);addBlock(f,n,x,z,w,d);return q}function interact(q,label,fn,enabled=()=>true,range=CFG.RANGE){interactions.push({q,label,fn,enabled,range})}
const WALL_H=3.18,WALL_T=.18,DOOR_H=2.48,WINDOW_Y=1.60,WINDOW_H=1.25;
function lintelH(f,n,z,c,w){mesh(n+'-lintel',c,DOOR_H+(WALL_H-DOOR_H)/2,z,w,WALL_H-DOOR_H,WALL_T,M.wall,f)}
function lintelV(f,n,x,c,w){mesh(n+'-lintel',x,DOOR_H+(WALL_H-DOOR_H)/2,c,WALL_T,WALL_H-DOOR_H,w,M.wall,f)}
function horizontalWall(f,n,z,x1,x2,openings=[]){
 let cursor=x1;
 for(const o of [...openings].sort((a,b)=>a.c-b.c)){
  const left=o.c-o.w/2,right=o.c+o.w/2;
  if(left>cursor)wall(f,n+'-segment-'+cursor,(cursor+left)/2,z,left-cursor,WALL_T);
  if(o.type==='door')lintelH(f,n+'-'+o.id,z,o.c,o.w);
  if(o.type==='window')windowOpeningH(f,n+'-'+o.id,z,o.c,o.w,o.h||WINDOW_H,o.y||WINDOW_Y);
  cursor=right;
 }
 if(cursor<x2)wall(f,n+'-segment-end',(cursor+x2)/2,z,x2-cursor,WALL_T);
}
function verticalWall(f,n,x,z1,z2,openings=[]){
 let cursor=z1;
 for(const o of [...openings].sort((a,b)=>a.c-b.c)){
  const low=o.c-o.w/2,high=o.c+o.w/2;
  if(low>cursor)wall(f,n+'-segment-'+cursor,x,(cursor+low)/2,WALL_T,low-cursor);
  if(o.type==='door')lintelV(f,n+'-'+o.id,x,o.c,o.w);
  if(o.type==='window')windowOpeningV(f,n+'-'+o.id,x,o.c,o.w,o.h||WINDOW_H,o.y||WINDOW_Y);
  cursor=high;
 }
 if(cursor<z2)wall(f,n+'-segment-end',x,(cursor+z2)/2,WALL_T,z2-cursor);
}
function windowOpeningH(f,n,z,c,w,h,y){
 const bottom=y-h/2,top=y+h/2;
 if(bottom>0)mesh(n+'-wall-bottom',c,bottom/2,z,w,bottom,WALL_T,M.wall,f);
 if(top<WALL_H)mesh(n+'-wall-top',c,top+(WALL_H-top)/2,z,w,WALL_H-top,WALL_T,M.wall,f);
 windowAssembly(f,n,c,z,'horizontal',w,h,y);
}
function windowOpeningV(f,n,x,c,w,h,y){
 const bottom=y-h/2,top=y+h/2;
 if(bottom>0)mesh(n+'-wall-bottom',x,bottom/2,c,WALL_T,bottom,w,M.wall,f);
 if(top<WALL_H)mesh(n+'-wall-top',x,top+(WALL_H-top)/2,c,WALL_T,WALL_H-top,w,M.wall,f);
 windowAssembly(f,n,x,c,'vertical',w,h,y);
}
function windowAssembly(f,n,x,z,axis,w,h,y){
 const frame=.075,depth=.12;
 // The pane also blocks movement, while remaining visually dirty and opaque.
 addBlock(f,n+'-window-block',x,z,axis==='vertical'?.20:w,axis==='vertical'?w:.20);
 mesh(n+'-glass',x,y,z,axis==='vertical'?depth:w-frame*2,h-frame*2,axis==='vertical'?w-frame*2:depth,M.glass,f).isPickable=false;
 if(axis==='horizontal'){
  mesh(n+'-frame-top',x,y+h/2,z,w,frame,depth,M.wood,f);mesh(n+'-frame-bottom',x,y-h/2,z,w,frame,depth,M.wood,f);
  mesh(n+'-frame-left',x-w/2,y,z,frame,h,depth,M.wood,f);mesh(n+'-frame-right',x+w/2,y,z,frame,h,depth,M.wood,f);
  mesh(n+'-mullion',x,y,z,frame*.7,h-frame*2,depth*.8,M.wood,f);
 }else{
  mesh(n+'-frame-top',x,y+h/2,z,depth,frame,w,M.wood,f);mesh(n+'-frame-bottom',x,y-h/2,z,depth,frame,w,M.wood,f);
  mesh(n+'-frame-left',x,y,z-w/2,depth,h,frame,M.wood,f);mesh(n+'-frame-right',x,y,z+w/2,depth,h,frame,M.wood,f);
  mesh(n+'-mullion',x,y,z,depth*.8,h-frame*2,frame*.7,M.wood,f);
 }
}
function closedDoor(f,n,x,z,wallAxis,blocked=true){
 const q=mesh(n,x,DOOR_H/2,z,wallAxis==='vertical'?WALL_T*.72:.94,DOOR_H,wallAxis==='vertical'?.94:WALL_T*.72,M.wood,f);
 if(blocked)addBlock(f,n+'-block',x,z,wallAxis==='vertical'?.20:1.0,wallAxis==='vertical'?1.0:.20);
 return q;
}
function removeBlock(f,n){blockers[f]=blockers[f].filter(b=>b.n!==n)}
function openDoorLeaf(f,n,x,z,wallAxis,side=1){
 // Open leaf sits against the adjacent wall, never across the doorway.
 const q=mesh(n,x,z?DOOR_H/2:DOOR_H/2,z,.94,DOOR_H,WALL_T*.65,M.wood,f);
 if(wallAxis==='horizontal'){q.rotation.y=Math.PI/2;q.position.x=x+side*.54;q.position.z=z+side*.43;}
 else{q.rotation.y=0;q.position.x=x+side*.43;q.position.z=z+side*.54;}
 return q;
}
function buildArchitecture(){
 // Continuous floor surfaces. The only deliberate opening is the stairwell.
 mesh('floor-1',7,-.08,5.5,14,.16,11,M.floor,1);
 mesh('ceiling-1-west',3.35,3.22,5.5,6.7,.12,11,M.dark,1);
 mesh('ceiling-1-east',12.65,3.22,5.5,2.7,.12,11,M.dark,1);
 mesh('ceiling-1-center-south',9.65,3.22,6.72,3.3,.12,8.56,M.dark,1);
 mesh('floor-2-west',3.35,-.08,5.5,6.7,.16,11,M.floor,2);
 mesh('floor-2-east',12.65,-.08,5.5,2.7,.16,11,M.floor,2);
 mesh('floor-2-center-south',9.65,-.08,6.72,3.3,.16,8.56,M.floor,2);
 mesh('roof',7,3.22,5.5,14,.12,11,M.dark,2);
 // Exterior walls are segmented around actual windows and the main door.
 horizontalWall(1,'f1-north',0,0,14,[{id:'kitchen-window',type:'window',c:2.0,w:1.15},{id:'living-window',type:'window',c:11.7,w:1.3}]);
 horizontalWall(1,'f1-south',11,0,14,[{id:'bath1-window',type:'window',c:4.8,w:.72}]);
 verticalWall(1,'f1-west',0,0,11,[{id:'corridor-window',type:'window',c:5.1,w:1.05}]);
 verticalWall(1,'f1-east',14,0,11,[{id:'main-door',type:'door',c:6.15,w:1.0},{id:'living-east-window',type:'window',c:8.45,w:1.35}]);
 horizontalWall(2,'f2-north',0,0,14,[{id:'parents-window',type:'window',c:2.0,w:1.15}]);
 horizontalWall(2,'f2-south',11,0,14,[{id:'bath2-window',type:'window',c:4.5,w:.72},{id:'protagonist-window',type:'window',c:10.3,w:1.65}]);
 verticalWall(2,'f2-west',0,0,11,[]);
 verticalWall(2,'f2-east',14,0,11,[{id:'sala2-window',type:'window',c:3.35,w:.9}]);
 // First floor distribution.
 horizontalWall(1,'f1-kitchen-corridor',4.15,0,7,[{id:'kitchen-door',type:'door',c:3.8,w:1.0}]);
 horizontalWall(1,'f1-corridor-services',6.05,0,7,[{id:'pantry-door',type:'door',c:1.65,w:1.0},{id:'bath1-door',type:'door',c:4.9,w:1.0}]);
 verticalWall(1,'f1-service-living',7,0,11,[{id:'living-door',type:'door',c:5.15,w:1.1}]);
 verticalWall(1,'f1-pantry-bath',3.15,6.05,11,[]);
 openDoorLeaf(1,'kitchen-door-leaf',3.8,4.15,'horizontal',1);openDoorLeaf(1,'pantry-door-leaf',1.65,6.05,'horizontal',-1);openDoorLeaf(1,'bath1-door-leaf',4.9,6.05,'horizontal',1);openDoorLeaf(1,'living-door-leaf',7,5.15,'vertical',1);
 // Second floor distribution, including Sala 2 mini-corridor along the right side.
 verticalWall(2,'f2-parents-sala',4.7,0,5.7,[{id:'parents-door',type:'door',c:3.6,w:1.0}]);
 horizontalWall(2,'f2-upper-lower',5.7,0,12.55,[{id:'bath2-door',type:'door',c:4.45,w:1.0},{id:'bedroom-door',type:'door',c:10.5,w:1.0}]);
 verticalWall(2,'f2-mini-corridor',12.55,5.7,11,[{id:'corridor-bedroom',type:'door',c:8.55,w:1.0}]);
 verticalWall(2,'f2-closet-bath',2.35,5.7,11,[{id:'closet-door',type:'door',c:7.75,w:1.0}]);
 verticalWall(2,'f2-bath-bedroom',6.6,5.7,11,[]);
 const parents=closedDoor(2,'parents-door',4.7,3.6,'vertical',true);interact(parents,'[E] PARENTS ROOM IS LOCKED',()=>say('This door will not open.'));
 openDoorLeaf(2,'bath2-door-leaf',4.45,5.7,'horizontal',-1);openDoorLeaf(2,'closet-door-leaf',2.35,7.75,'vertical',1);openDoorLeaf(2,'mini-corridor-door-leaf',12.55,8.55,'vertical',-1);
 const bedroom=closedDoor(2,'bedroom-door',10.5,5.7,'horizontal',!state.bedroomOpen);if(state.bedroomOpen)bedroom.isVisible=false;else interact(bedroom,()=>state.key?'[E] UNLOCK BEDROOM DOOR':'THE DOOR IS LOCKED',()=>{if(!state.key)return say('Locked. Find the key.');state.bedroomOpen=true;bedroom.isVisible=false;removeBlock(2,'bedroom-door-block');store();refreshUI();say('The bedroom door unlocks.')},()=>!state.bedroomOpen);
 const main=closedDoor(1,'main-door',14,6.15,'vertical',true);interact(main,'[E] TRY MAIN DOOR',()=>say('It will not open.'));
}
const stair={x0:8.0,x1:12.05,zLow:2.55,zHigh:.90,width:1.10,mid:CFG.FLOOR/2,landingX:7.45};
function buildStairs(){
 const n=12,run=stair.x1-stair.x0,t=run/n,rise=stair.mid/n,th=.10;
 // Thin treads and separate risers avoid giant wedge-like columns.
 for(let i=0;i<n;i++){
  const x=stair.x1-t*(i+.5),y=(i+1)*rise;
  mesh('lower-tread-'+i,x,y,stair.zLow,t+.012,th,stair.width,M.wood,1);
  mesh('lower-riser-'+i,x+t/2,y-rise/2,stair.zLow,.055,rise,stair.width,M.wood,1);
 }
 mesh('intermediate-landing',stair.landingX,stair.mid,1.72,1.35,.12,2.42,M.wood,1);
 for(let i=0;i<n;i++){
  const x=stair.x0+t*(i+.5),y=stair.mid+(i+1)*rise;
  mesh('upper-tread-'+i,x,y,stair.zHigh,t+.012,th,stair.width,M.wood,1);
  mesh('upper-riser-'+i,x-t/2,y-rise/2,stair.zHigh,.055,rise,stair.width,M.wood,1);
 }
 // Low edge guards around stairwell, matching the open landing rather than covering it.
 mesh('landing-guard-left',6.78,stair.mid+.48,1.72,.10,.96,2.42,M.wood,1);
 mesh('upper-guard',10.0,CFG.FLOOR+.48,1.55,4.15,.96,.10,M.wood,1);
}
function stairSurface(x,z){
 if(x>=stair.x0&&x<=stair.x1&&z>2.0&&z<3.1)return (stair.x1-x)/(stair.x1-stair.x0)*stair.mid;
 if(x>6.75&&x<8.14&&z>.48&&z<3.05)return stair.mid;
 if(x>=stair.x0&&x<=stair.x1&&z>.30&&z<1.50)return stair.mid+(x-stair.x0)/(stair.x1-stair.x0)*stair.mid;
 return null;
}
function buildProps(){
 solid('kitchen-counter',1.1,.48,1.0,2.0,.96,.65,M.wood,1);solid('pantry-shelf',.55,1.1,8.3,.62,2.2,3.4,M.wood,1);solid('bathroom1-sink',4.8,.5,9.8,1.2,1,.58,M.bath,1);solid('living-sofa',10.5,.55,7.6,2.6,1.1,1,M.wood,1);solid('tv-cabinet',10.6,.55,10.45,2.5,1.1,.62,M.dark,1);visual.tv=mesh('tv-screen',10.6,1.42,10.12,2.25,1.48,.04,M.tv,1);
 solid('parents-bed',2.3,.48,2.2,2.5,.96,3.1,M.wood,2);solid('parents-closet',.7,1.25,8.25,.72,2.5,3.0,M.wood,2);solid('bathroom2-sink',4.45,.5,9.75,1.25,1,.58,M.bath,2);solid('protagonist-bed',10.2,.48,8.5,2.65,.96,3.2,M.wood,2);solid('sala2-sofa',7.05,.55,3.4,2.2,1.1,1,M.wood,2);
 const wardrobe=solid('marked-wardrobe',11.95,1.3,9.25,.72,2.6,2.1,M.wood,2);interact(wardrobe,'[E] INSPECT WARDROBE',()=>{state.wardrobe=true;store();refreshUI();say('Deep scratch marks cover the wood.',3000)});
 const album=mesh('album',10.2,1.02,8.0,.78,.08,.96,M.dark,2),stem=mesh('key-stem',10.2,1.13,8,.1,.04,.45,M.metal,2),ring=B.MeshBuilder.CreateTorus('key-ring',{diameter:.24,thickness:.05,tessellation:16},scene);ring.position.set(10.2,1.17,8.2);ring.parent=root2;ring.material=M.metal;const light=new B.PointLight('key-light',new B.Vector3(10.2,1.65,8),scene);light.parent=root2;light.diffuse.set(.85,.45,.12);light.range=3;light.intensity=state.key?0:1;visual.key=[stem,ring];visual.keyLight=light;visual.key.forEach(x=>x.isVisible=!state.key);interact(album,'[E] INSPECT ALBUM',()=>show(albumPanel,true),()=>!state.key);
 const med=mesh('medication-bottle',4.45,1.13,9.55,.18,.42,.18,M.metal,2);interact(med,()=>state.distorted?'[E] TAKE MEDICATION':'[E] INSPECT MEDICATION',()=>{if(state.distorted){state.distorted=false;state.complete=true;applyReality();say('The house becomes still again.',3300)}else{state.medicineSeen=true;store();refreshUI();say('Medication. The label says twice a day.')}},()=>!state.complete);
 const book=mesh('diary-book',7.05,.82,3.4,.72,.1,.52,M.wood,2),page=mesh('diary-page',7.05,.89,3.4,.64,.025,.44,M.paper,2);book.rotation.y=page.rotation.y=.15;interact(page,'[E] READ DIARY PAGE',()=>{state.diary=true;store();refreshUI();show(diaryPanel,true)});
}
buildArchitecture();buildStairs();buildProps();
// LIGHTING
const ambient=new B.HemisphericLight('ambient',new B.Vector3(0,1,0),scene);ambient.diffuse.set(.8,.77,.69);ambient.groundColor.set(.10,.08,.08);ambient.intensity=.61;const playerLight=new B.PointLight('player-light',B.Vector3.Zero(),scene);playerLight.parent=camera;playerLight.diffuse.set(.7,.63,.53);playerLight.range=5.2;playerLight.intensity=.22;const red=new B.PointLight('distortion-light',new B.Vector3(10,2,8),scene);red.diffuse.set(.8,.01,.01);red.range=16;red.intensity=0;
function floorIndexAtY(y){return y>CFG.EYE+CFG.FLOOR*.5?2:1}function collides(x,z,f){for(const b of blockers[f]){const nx=Math.max(b.minX,Math.min(x,b.maxX)),nz=Math.max(b.minZ,Math.min(z,b.maxZ)),dx=x-nx,dz=z-nz;if(dx*dx+dz*dz<CFG.RADIUS*CFG.RADIUS)return true}return false}
// Ground height provides real gravity and falling into stairwell. Null means open void.
function groundHeight(x,z,currentY){const sy=stairSurface(x,z);if(sy!==null)return sy;const upstairs=currentY>CFG.FLOOR*.58;if(upstairs){const inHole=x>6.68&&x<12.18&&z>.22&&z<3.18;if(inHole)return null;return CFG.FLOOR}return 0}
function moveHorizontal(dx,dz){const f=floorIndexAtY(camera.position.y);if(!collides(camera.position.x+dx,camera.position.z,f))camera.position.x+=dx;if(!collides(camera.position.x,camera.position.z+dz,f))camera.position.z+=dz}
function applyGravity(dt){const floor=groundHeight(camera.position.x,camera.position.z,camera.position.y);if(floor!==null&&camera.position.y<=floor+CFG.EYE+CFG.STEP&&vy<=0){camera.position.y=floor+CFG.EYE;vy=0;grounded=true}else{grounded=false;vy=Math.max(CFG.TERMINAL,vy+CFG.GRAVITY*dt);camera.position.y+=vy*dt;if(camera.position.y<CFG.EYE){camera.position.y=CFG.EYE;vy=0;grounded=true}}}
function applyReality(){ambient.intensity=state.distorted?.14:.61;red.intensity=state.distorted?1.9:0;vig.alpha=state.distorted?.46:.30;M.tv.emissiveColor=state.distorted?new B.Color3(.55,.01,.01):new B.Color3(.08,.1,.08);store();refreshUI()}
function refreshUI(){const f=floorIndexAtY(camera.position.y);status.text=`FLOOR ${f} | KEY ${state.key?'YES':'NO'} | DIARY ${state.diary?'YES':'NO'} | MEDICATION ${state.medicineSeen?'SEEN':'NO'}`;objective.text=!state.wardrobe?'Inspect the wardrobe in the protagonist bedroom.':!state.key?'Inspect the wedding album.':!state.bedroomOpen?'Unlock the bedroom door.':!state.medicineSeen?'Inspect the medication in Bathroom 2.':!state.diary?'Read the diary page in Sala 2.':state.tvStage===0?'Walk downstairs into the living room.':state.distorted?'Escape upstairs and take the medication.':'MVP complete.'}
function setKey(c,v){if(c==='KeyW')input.w=v;if(c==='KeyA')input.a=v;if(c==='KeyS')input.s=v;if(c==='KeyD')input.d=v;if(c==='ShiftLeft'||c==='ShiftRight')input.shift=v;if(c==='KeyQ')input.q=v;if(c==='Space')input.up=v;if(c==='ControlLeft'||c==='ControlRight')input.down=v}
function toggleDev(){dev.fly=!dev.fly;devLabel.text=dev.fly?'DEVELOPMENT MODE: FLY / NOCLIP':'';vy=0;say(dev.fly?'Fly mode enabled.':'Walk mode enabled.',1300);if(!dev.fly){const f=floorIndexAtY(camera.position.y);if(collides(camera.position.x,camera.position.z,f))camera.position.set(10.5,CFG.FLOOR+CFG.EYE,8.4)}}
window.addEventListener('keydown',e=>{if(e.code==='KeyP'&&!e.repeat)return toggleDev();setKey(e.code,1);if(e.code==='KeyE'&&current&&!locked)current.fn();if(e.code==='Minus'){pref.sensitivity=Math.max(.25,pref.sensitivity-.05);camera.angularSensibility=CFG.MOUSE/pref.sensitivity;storePref()}if(e.code==='Equal'){pref.sensitivity=Math.min(2,pref.sensitivity+.05);camera.angularSensibility=CFG.MOUSE/pref.sensitivity;storePref()}});window.addEventListener('keyup',e=>setKey(e.code,0));window.addEventListener('blur',()=>Object.keys(input).forEach(k=>input[k]=0));canvas.addEventListener('click',()=>{if(!locked&&!document.pointerLockElement)canvas.requestPointerLock?.()});
scene.onBeforeRenderObservable.add(()=>{const dt=Math.min(engine.getDeltaTime()/1000,.04);camera.position.y-=bobY;camera.position.x-=bobX;bobX=bobY=0;if(locked){prompt.text='';return}let fw=input.w-input.s,side=input.d-input.a,len=Math.hypot(fw,side);if(len){fw/=len;side/=len}const running=input.shift&&len&&!input.q&&!input.s,speed=dev.fly?(input.shift?14:8):(input.q?CFG.FOCUS:(running?CFG.RUN:CFG.WALK)),yaw=camera.rotation.y,pitch=camera.rotation.x,fx=Math.sin(yaw),fz=Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);if(dev.fly){camera.position.x+=(Math.sin(yaw)*Math.cos(pitch)*fw+rx*side)*speed*dt;camera.position.z+=(Math.cos(yaw)*Math.cos(pitch)*fw+rz*side)*speed*dt;camera.position.y+=(-Math.sin(pitch)*fw+(input.up-input.down))*speed*dt}else{moveHorizontal((fx*fw+rx*side)*speed*dt,(fz*fw+rz*side)*speed*dt);applyGravity(dt)}const targetFov=input.q?.58:(running?.89:.8);camera.fov+=(targetFov-camera.fov)*Math.min(1,dt*12);if(len&&!dev.fly&&grounded){bobTime+=dt*(running?13.5:8.3);bobY=Math.sin(bobTime*2)*(running?.032:.018);bobX=Math.cos(bobTime)*(running?.01:.006);camera.position.y+=bobY;camera.position.x+=bobX}roll+=(((input.d-input.a)*(running?-.012:-.006))-roll)*Math.min(1,dt*12);camera.rotation.z=roll+(state.distorted?Math.sin(performance.now()/170)*.003:0);
 if(!dev.fly&&floorIndexAtY(camera.position.y)===1&&state.medicineSeen&&state.diary&&state.tvStage===0&&camera.position.x>7.2&&camera.position.z>3.5){state.tvStage=1;store();visual.tv.material.emissiveColor=new B.Color3(.22,.22,.2);say('The television turns on by itself.',2500);setTimeout(()=>{if(state.tvStage===1){state.tvStage=2;visual.tv.material.emissiveColor=new B.Color3(.35,.12,.09);say('The person on screen moves faster.',2800)}},3200);setTimeout(()=>{if(state.tvStage===2){state.tvStage=3;state.distorted=true;applyReality();say('TAKE THE MEDICATION.',4200)}},6800)}
 const ray=camera.getForwardRay(CFG.RANGE);let best=null,bestD=99;for(const it of interactions){if(!it.enabled()||!it.q.isEnabled())continue;const h=ray.intersectsMesh(it.q,false);if(h.hit&&h.distance<it.range&&h.distance<bestD){best=it;bestD=h.distance}}current=best;prompt.text=best?(typeof best.label==='function'?best.label():best.label):'';cross.scaleX=cross.scaleY=input.q?.75:1;refreshUI()});
applyReality();refreshUI();engine.runRenderLoop(()=>scene.render());window.addEventListener('resize',()=>engine.resize());window.DESCONEXO={version:VERSION,scene,engine,camera,state,blockers,development:dev,physics:{groundHeight,stairSurface}};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();})();
