/*
 DESCONEXO MVP v4.0.0
 Complete rebuild from the supplied GDD and floor-plan references.
 - Single JavaScript application
 - Babylon GUI only: no HTML text, buttons, menus, HUD, or panels
 - Deterministic kinematic controller: fixed eye height, circle-vs-wall collision
 - Two floor layouts based on the supplied plan
 - Graphics replacement point: buildHouse() and ASSET_HOOKS
*/
(() => {
'use strict';

const VERSION = '4.1.0';
const CDN = {
  core: 'https://cdn.babylonjs.com/babylon.js',
  gui: 'https://cdn.babylonjs.com/gui/babylon.gui.min.js'
};
const SAVE_KEY = 'desconexo-v41-save';
const PREF_KEY = 'desconexo-v4-prefs';
const C = Object.freeze({
  eyeHeight: 1.68,
  radius: 0.29,
  walk: 2.35,
  run: 5.25,
  focus: 1.35,
  mouseBase: 3000,
  interactRange: 2.35,
  floorHeight: 3.65,
  normalFov: 0.80,
  runFov: 0.89,
  focusFov: 0.58,
  colors: {
    wall: '#5c5951', wallTop: '#69655c', floor: '#382d27', trim: '#29211d',
    wood: '#5b3828', dark: '#100e0d', paper: '#c8bc9d', metal: '#98722f',
    blood: '#5b1119', bath: '#8c9494', kitchen: '#605b53'
  }
});
const defaultState = { floor:2, key:false, bedroomOpen:false, diary:false, medicine:false, tv:false, distorted:false, complete:false };
const loadJSON=(key,fallback)=>{try{return Object.assign({},fallback,JSON.parse(localStorage.getItem(key)||'{}'));}catch{return Object.assign({},fallback)}};
const state=loadJSON(SAVE_KEY,defaultState), prefs=loadJSON(PREF_KEY,{sensitivity:1});
const save=()=>localStorage.setItem(SAVE_KEY,JSON.stringify(state));
const savePrefs=()=>localStorage.setItem(PREF_KEY,JSON.stringify(prefs));
const loadScript=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('Failed to load '+src));document.head.appendChild(s)});

async function boot(){
  document.title='DESCONEXO';
  document.documentElement.style.cssText='width:100%;height:100%;background:#050506';
  document.body.style.cssText='width:100%;height:100%;margin:0;overflow:hidden;background:#050506';
  const canvas=document.createElement('canvas');canvas.id='desconexo-canvas';canvas.tabIndex=0;canvas.style.cssText='width:100%;height:100%;display:block;outline:none;touch-action:none';document.body.appendChild(canvas);
  try{
    if(!window.BABYLON) await loadScript(CDN.core);
    if(!window.BABYLON.GUI) await loadScript(CDN.gui);
    createGame(canvas);
  }catch(error){
    console.error('[DESCONEXO]',error);
    const fallback=document.createElement('canvas');fallback.width=960;fallback.height=360;fallback.style.cssText='position:fixed;inset:0;margin:auto;max-width:92%;background:#160b0d';document.body.appendChild(fallback);
    const x=fallback.getContext('2d');x.fillStyle='#eee';x.font='28px Arial';x.fillText('DESCONEXO could not start.',35,80);x.font='17px Arial';x.fillText(String(error.message||error),35,130);x.fillText('Check the internet connection and press Ctrl+F5.',35,175);
  }
}

function createGame(canvas){
const B=BABYLON, G=B.GUI;
const engine=new B.Engine(canvas,true,{stencil:false,preserveDrawingBuffer:false},true);
engine.setHardwareScalingLevel(Math.max(1,Math.min(1.5,window.devicePixelRatio||1)));
const scene=new B.Scene(engine);scene.clearColor=new B.Color4(.018,.016,.019,1);scene.skipPointerMovePicking=true;
const camera=new B.UniversalCamera('player',new B.Vector3(8.2,C.eyeHeight,9.1),scene);camera.attachControl(canvas,true);camera.inputs.removeByType('FreeCameraKeyboardMoveInput');camera.inertia=0;camera.angularSensibility=C.mouseBase/prefs.sensitivity;camera.minZ=.04;camera.fov=C.normalFov;
const floors={1:{root:new B.TransformNode('floor-1',scene),walls:[],obstacles:[],spawns:{main:new B.Vector3(8.1,C.eyeHeight,7.4),stairs:new B.Vector3(9.3,C.eyeHeight,1.7)}},2:{root:new B.TransformNode('floor-2',scene),walls:[],obstacles:[],spawns:{main:new B.Vector3(8.2,C.eyeHeight,9.1),stairs:new B.Vector3(9.2,C.eyeHeight,1.7)}}};
const interactables=[];let current=null,locked=true,modal=null,subtitleTimer=0;
const input={w:false,a:false,s:false,d:false,shift:false,q:false};
const visuals={};

// ---------- CANVAS GUI ----------
const adt=G.AdvancedDynamicTexture.CreateFullscreenUI('ui',true,scene);adt.idealWidth=1920;adt.idealHeight=1080;
const root=new G.Container('ui-root');adt.addControl(root);
const T=(value,size=22,color='#eee')=>{const t=new G.TextBlock();t.text=value;t.fontFamily='Arial';t.fontSize=size;t.color=color;t.textWrapping=true;t.isPointerBlocker=false;return t};
const R=(background='#0b0908e8',line='#66554b')=>{const r=new G.Rectangle();r.background=background;r.color=line;r.thickness=1;r.cornerRadius=2;return r};
const uiButton=(label,fn,alt=false)=>{const b=G.Button.CreateSimpleButton('button-'+label,label);b.width='250px';b.height='54px';b.color=alt?'#c7bfb5':'#fff';b.background=alt?'#171311':'#7c2029';b.thickness=1;b.fontFamily='Arial';b.fontSize=18;b.onPointerClickObservable.add(fn);b.onPointerEnterObservable.add(()=>b.background=alt?'#2a211d':'#9e2935');b.onPointerOutObservable.add(()=>b.background=alt?'#171311':'#7c2029');return b};
const vignette=new G.Image('subtle-vignette');
const vignetteSvg=`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><defs><radialGradient id="v" cx="50%" cy="48%" rx="72%" ry="76%"><stop offset="0%" stop-color="black" stop-opacity="0"/><stop offset="72%" stop-color="black" stop-opacity="0.01"/><stop offset="91%" stop-color="black" stop-opacity="0.20"/><stop offset="100%" stop-color="black" stop-opacity="0.42"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#v)"/></svg>`;
vignette.source='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(vignetteSvg);vignette.width='100%';vignette.height='100%';vignette.stretch=G.Image.STRETCH_FILL;vignette.alpha=.34;vignette.isPointerBlocker=false;root.addControl(vignette);
const cross=T('+',28,'#ddd');cross.width='42px';cross.height='42px';root.addControl(cross);
const prompt=T('',20);prompt.width='700px';prompt.height='45px';prompt.top='92px';root.addControl(prompt);
const objectiveTitle=T('OBJECTIVE',14,'#b43e4a');objectiveTitle.width='430px';objectiveTitle.height='25px';objectiveTitle.left='28px';objectiveTitle.top='24px';objectiveTitle.horizontalAlignment=G.Control.HORIZONTAL_ALIGNMENT_LEFT;objectiveTitle.verticalAlignment=G.Control.VERTICAL_ALIGNMENT_TOP;objectiveTitle.textHorizontalAlignment=G.Control.HORIZONTAL_ALIGNMENT_LEFT;root.addControl(objectiveTitle);
const objective=T('',19);objective.width='560px';objective.height='74px';objective.left='28px';objective.top='50px';objective.horizontalAlignment=G.Control.HORIZONTAL_ALIGNMENT_LEFT;objective.verticalAlignment=G.Control.VERTICAL_ALIGNMENT_TOP;objective.textHorizontalAlignment=G.Control.HORIZONTAL_ALIGNMENT_LEFT;root.addControl(objective);
const status=T('',17);status.width='650px';status.height='36px';status.left='-28px';status.top='27px';status.horizontalAlignment=G.Control.HORIZONTAL_ALIGNMENT_RIGHT;status.verticalAlignment=G.Control.VERTICAL_ALIGNMENT_TOP;status.textHorizontalAlignment=G.Control.HORIZONTAL_ALIGNMENT_RIGHT;root.addControl(status);
const subtitle=T('',26);subtitle.width='1000px';subtitle.height='90px';subtitle.top='-72px';subtitle.alpha=0;subtitle.verticalAlignment=G.Control.VERTICAL_ALIGNMENT_BOTTOM;root.addControl(subtitle);
function say(message,ms=2600){subtitle.text=message;subtitle.alpha=1;clearTimeout(subtitleTimer);subtitleTimer=setTimeout(()=>subtitle.alpha=0,ms)}
function panel(name,width='760px',height='610px',paper=false){const p=R(paper?'#d4cab1':'#0b0908ed',paper?'#8c826d':'#66554b');p.name=name;p.width=width;p.height=height;p.isVisible=false;p.isPointerBlocker=true;root.addControl(p);const stack=new G.StackPanel(name+'-stack');stack.width='88%';p.addControl(stack);return{p,stack}}
function addText(stack,value,size=22,color='#eee',height=60){const t=T(value,size,color);t.height=height+'px';stack.addControl(t);return t}
function spacer(stack,height=15){const s=new G.Rectangle();s.height=height+'px';s.thickness=0;stack.addControl(s)}
function showPanel(p,show){p.isVisible=show;modal=show?p:null;locked=show;if(show)document.exitPointerLock?.();else canvas.requestPointerLock?.()}
const menu=panel('menu','820px','680px');menu.p.isVisible=true;addText(menu.stack,'DESCONEXO',54,'#eee',92);addText(menu.stack,'3D BROWSER MVP - V'+VERSION,15,'#b43e4a',34);addText(menu.stack,'Explore both floors of the house, recover the key, read the diary, inspect the medicine, and face the television distortion.',22,'#c7beb3',125);addText(menu.stack,'WASD move | SHIFT run | Q focus | E interact\n- and + adjust sensitivity | ESC releases mouse',18,'#bbb1a7',82);spacer(menu.stack,15);menu.stack.addControl(uiButton('START GAME',()=>{menu.p.isVisible=false;locked=false;canvas.focus();canvas.requestPointerLock?.()}));spacer(menu.stack,12);menu.stack.addControl(uiButton('RESET SAVE',()=>{localStorage.removeItem(SAVE_KEY);location.reload()},true));
const album=panel('album','720px','520px');addText(album.stack,'WEDDING ALBUM',17,'#b43e4a',42);addText(album.stack,'A BLOOD-STAINED PAGE',33,'#eee',70);addText(album.stack,'A photograph has been marked with the word DEMON. A brass key is fixed beside it.',22,'#c7beb3',120);album.stack.addControl(uiButton('TAKE KEY',()=>{state.key=true;save();visuals.keyStem.isVisible=false;visuals.keyRing.isVisible=false;visuals.keyLight.intensity=0;updateUI();showPanel(album.p,false);say('A brass key. It should fit the bedroom door.')}));spacer(album.stack,10);album.stack.addControl(uiButton('CLOSE',()=>showPanel(album.p,false),true));
const diary=panel('diary','850px','700px',true);addText(diary.stack,'DIARY PAGE',17,'#8d2530',42);addText(diary.stack,'12/03/11',33,'#201c18',58);addText(diary.stack,'The day was good. We went to the cinema, had dinner and spent the day together. Sometimes he seems so distant.\n\nThe cinema and dinner were excuses to take him to the doctor. The medication was increased. The doctor said the negative effect should not be too great. I hope that is true.',21,'#201c18',420);diary.stack.addControl(uiButton('CLOSE',()=>showPanel(diary.p,false)));

// ---------- MATERIALS AND HOUSE ----------
const mat=(name,hex,emissive)=>{const m=new B.StandardMaterial(name,scene);m.diffuseColor=B.Color3.FromHexString(hex);m.specularColor.set(.025,.025,.025);if(emissive)m.emissiveColor=B.Color3.FromHexString(emissive);return m};
const M={};Object.entries(C.colors).forEach(([k,v])=>M[k]=mat(k,v));M.tv=mat('tv','#74766f','#151915');
function meshBox(name,x,y,z,w,h,d,material,floor,parent=floors[floor].root){const m=B.MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);m.position.set(x,y,z);m.material=material;m.material.backFaceCulling=false;m.parent=parent;m.isPickable=true;return m}
function addObstacle(floor,name,x,z,w,d){floors[floor].obstacles.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,name});}
function solidBox(name,x,y,z,w,h,d,material,floor){const m=meshBox(name,x,y,z,w,h,d,material,floor);addObstacle(floor,name+'-collision',x,z,w,d);return m;}
function doorVisual(floor,name,x,z,rotation=0,material=M.wood){const d=meshBox(name,x,1.25,z,.92,2.5,.12,material,floor);d.rotation.y=rotation;return d;}
function addWall(floor,name,x,z,w,d,h=3.15,material=M.wall){const m=meshBox(name,x,h/2,z,w,h,d,material,floor);floors[floor].walls.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,name});return m}
function addHorizontalWithDoor(f,n,z,x1,x2,doorCenter,doorWidth=.95,t=.16){addWall(f,n+'-a',(x1+doorCenter-doorWidth/2)/2,z,doorCenter-doorWidth/2-x1,t);addWall(f,n+'-b',(doorCenter+doorWidth/2+x2)/2,z,x2-(doorCenter+doorWidth/2),t)}
function addVerticalWithDoor(f,n,x,z1,z2,doorCenter,doorWidth=.95,t=.16){addWall(f,n+'-a',x,(z1+doorCenter-doorWidth/2)/2,t,doorCenter-doorWidth/2-z1);addWall(f,n+'-b',x,(doorCenter+doorWidth/2+z2)/2,t,z2-(doorCenter+doorWidth/2))}
function addInteract(mesh,label,action,enabled=()=>true,range=C.interactRange){interactables.push({mesh,label,action,enabled,range})}
function floorBase(f){meshBox('floor-'+f,6,-.08,5,12,.16,10,M.floor,f);meshBox('ceiling-'+f,6,3.18,5,12,.12,10,M.dark,f);addWall(f,'north-'+f,6,0,12,.16);addWall(f,'south-'+f,6,10,12,.16);addWall(f,'west-'+f,0,5,.16,10);addWall(f,'east-'+f,12,5,.16,10)}
function buildHouse(){
  // FIRST FLOOR: kitchen upper-left, corridor center-left, pantry and bathroom lower-left, living room right, stairs upper-right.
  floorBase(1);
  addHorizontalWithDoor(1,'kitchen-corridor',3.7,0,6.4,4.4,1.05);
  addHorizontalWithDoor(1,'corridor-services',5.55,0,6.4,3.0,1.0);
  addVerticalWithDoor(1,'pantry-bath',3.05,5.55,10,7.1,1.0);
  addVerticalWithDoor(1,'living-divider',6.4,0,10,4.6,1.2);
  solidBox('kitchen-counter',1.25,.48,1.0,2.1,.95,.65,M.kitchen,1);
  solidBox('kitchen-island',4.6,.46,2.0,1.6,.92,.7,M.kitchen,1);
  solidBox('pantry-shelf',.55,1.0,7.8,.55,2.0,3.2,M.wood,1);
  solidBox('bath-sink',4.1,.48,8.8,1.1,.95,.55,M.bath,1);
  solidBox('sofa',9.4,.58,6.4,2.8,1.15,1.05,M.wood,1);
  const tv=solidBox('television',8.4,1.25,9.25,2.8,2.1,.55,M.dark,1);const screen=meshBox('tv-screen',8.4,1.35,8.95,2.25,1.5,.025,M.tv,1);addInteract(screen,'[E] WATCH TELEVISION',()=>{state.tv=true;state.distorted=true;applyReality();say('Take the medicine... Take the medicine...',4700)},()=>state.medicine&&!state.tv,2.8);
  const med=meshBox('medicine',4.3,1.15,8.75,.18,.42,.18,M.metal,1);addInteract(med,()=>state.distorted?'[E] TAKE MEDICINE':'[E] INSPECT MEDICINE',()=>{if(state.distorted){state.distorted=false;state.complete=true;applyReality();say('The noise collapses into silence.',3400)}else{state.medicine=true;save();updateUI();say('The label reads: twice a day.')}},()=>!state.complete);
  const stairs1=meshBox('stairs-1',9.7,.48,1.0,3.2,.96,1.15,M.wood,1);addInteract(stairs1,'[E] GO UPSTAIRS',()=>switchFloor(2,'stairs'));

  // Door leaves make every opening visually explicit. Open leaves sit beside their frames.
  doorVisual(1,'door-kitchen',4.93,3.7,Math.PI/2);
  doorVisual(1,'door-corridor-service',3.53,5.55,Math.PI/2);
  doorVisual(1,'door-pantry',3.05,7.63,0);
  doorVisual(1,'door-living',6.4,5.2,0);
  // SECOND FLOOR: parents room left, sala 2 upper-right, bathroom lower-left-center, protagonist bedroom lower-right, wardrobe niche lower-left, stairs upper-right.
  floorBase(2);
  addVerticalWithDoor(2,'parents-sala',3.75,0,5.55,3.9,1.0);
  addHorizontalWithDoor(2,'upper-lower',5.55,0,12,7.5,1.1);
  addVerticalWithDoor(2,'bath-bedroom',5.2,5.55,10,7.5,1.0);
  addVerticalWithDoor(2,'wardrobe-bath',2.15,5.55,10,8.0,1.0);
  // Parents room must remain inaccessible in the MVP.
  const parentDoor=doorVisual(2,'parents-locked-door',3.75,3.9,0);
  floors[2].walls.push({minX:3.66,maxX:3.84,minZ:3.40,maxZ:4.40,name:'parents-locked-door-collider'});
  addInteract(parentDoor,'PARENTS ROOM IS LOCKED',()=>say('This door will not open.'));
  doorVisual(2,'door-upper-hall',8.05,5.55,Math.PI/2);
  doorVisual(2,'door-bathroom-2',5.2,7.5,0);
  doorVisual(2,'door-wardrobe',2.15,8.0,0);

  solidBox('parents-bed',1.8,.48,2.2,2.4,.95,3.2,M.wood,2);
  solidBox('wardrobe',.72,1.25,8.1,.75,2.5,2.5,M.wood,2);
  solidBox('bath-2-sink',3.35,.48,8.8,1.1,.95,.55,M.bath,2);
  solidBox('protagonist-bed',8.1,.48,8.25,2.6,.95,3.0,M.wood,2);
  const albumMesh=meshBox('album-object',8.1,1.02,7.75,.75,.09,.95,M.blood,2);const stem=meshBox('key-stem',8.1,1.13,7.75,.1,.045,.45,M.metal,2);const ring=B.MeshBuilder.CreateTorus('key-ring',{diameter:.25,thickness:.052,tessellation:16},scene);ring.position.set(8.1,1.17,7.95);ring.rotation.x=Math.PI/2;ring.material=M.metal;ring.parent=floors[2].root;const light=new B.PointLight('key-light',new B.Vector3(8.1,1.7,7.75),scene);light.diffuse.set(.85,.46,.13);light.range=3;light.parent=floors[2].root;light.intensity=state.key?0:1;stem.isVisible=ring.isVisible=!state.key;visuals.keyStem=stem;visuals.keyRing=ring;visuals.keyLight=light;addInteract(albumMesh,'[E] INSPECT ALBUM',()=>showPanel(album.p,true),()=>!state.key);
  const bedroomDoor=meshBox('bedroom-door',7.5,1.25,5.55,1.0,2.5,.14,M.wood,2);if(state.bedroomOpen){bedroomDoor.rotation.y=-Math.PI/2;bedroomDoor.position.x=7.0}addInteract(bedroomDoor,()=>state.key?'[E] UNLOCK BEDROOM DOOR':'THE DOOR IS LOCKED',()=>{if(!state.key)return say('Locked. There must be a key in the room.');state.bedroomOpen=true;bedroomDoor.isVisible=false;removeWallByName(2,'bedroom-door-collider');save();updateUI();say('The lock gives way.')},()=>!state.bedroomOpen,2.5);if(!state.bedroomOpen)floors[2].walls.push({minX:7.0,maxX:8.0,minZ:5.46,maxZ:5.64,name:'bedroom-door-collider'});
  const note=meshBox('diary-object',5.6,1.0,2.4,.62,.05,.45,M.paper,2);addInteract(note,'[E] READ DIARY PAGE',()=>{state.diary=true;save();updateUI();showPanel(diary.p,true)});
  solidBox('sala-sofa',6.2,.55,2.2,2.2,1.1,1.0,M.wood,2);
  const stairs2=meshBox('stairs-2',9.7,.48,1.0,3.2,.96,1.15,M.wood,2);addInteract(stairs2,'[E] GO DOWNSTAIRS',()=>switchFloor(1,'stairs'));
}
function removeWallByName(f,name){floors[f].walls=floors[f].walls.filter(w=>w.name!==name)}
buildHouse();

// ---------- FLOOR VISIBILITY, COLLISION, GAMEPLAY ----------
const ambient=new B.HemisphericLight('ambient',new B.Vector3(0,1,0),scene);ambient.diffuse.set(.78,.75,.68);ambient.groundColor.set(.12,.10,.10);ambient.intensity=.62;
const playerLight=new B.PointLight('player-light',new B.Vector3(0,0,0),scene);playerLight.parent=camera;playerLight.diffuse.set(.72,.66,.56);playerLight.intensity=.24;playerLight.range=5.5;
const nightmare=new B.PointLight('nightmare',new B.Vector3(8,2,7),scene);nightmare.diffuse.set(.75,.01,.02);nightmare.range=16;nightmare.intensity=0;
function setFloorVisibility(){for(const f of [1,2])floors[f].root.setEnabled(f===state.floor)}
function switchFloor(target,spawn='main'){state.floor=target;save();setFloorVisibility();camera.position.copyFrom(floors[target].spawns[spawn]);say(target===1?'You descend to the first floor.':'You climb to the second floor.')}
function applyReality(){ambient.intensity=state.distorted?.13:.62;nightmare.intensity=state.distorted?1.9:0;vignette.alpha=state.distorted?.52:.34;M.tv.emissiveColor=state.distorted?new B.Color3(.55,.01,.01):new B.Color3(.08,.10,.08);save();updateUI()}
function updateUI(){status.text=`FLOOR ${state.floor} | KEY ${state.key?'YES':'NO'} | DIARY ${state.diary?'YES':'NO'} | MEDICINE ${state.medicine?'YES':'NO'}`;objective.text=!state.key?'Search the protagonist bedroom for a key.':!state.bedroomOpen?'Unlock the protagonist bedroom door.':!state.diary?'Read the diary page in Sala 2.':!state.medicine?'Go downstairs and inspect Bathroom 1.':!state.tv?'Investigate the television in the living room.':state.distorted?'Return to Bathroom 1 and take the medicine.':'MVP complete. The house is quiet again.'}
function circleHits(x,z){const r=C.radius;for(const w of floors[state.floor].walls.concat(floors[state.floor].obstacles)){const nx=Math.max(w.minX,Math.min(x,w.maxX)),nz=Math.max(w.minZ,Math.min(z,w.maxZ));const dx=x-nx,dz=z-nz;if(dx*dx+dz*dz<r*r)return true}return false}
function tryMove(delta){const p=camera.position;const nx=p.x+delta.x,nz=p.z+delta.z;if(!circleHits(nx,p.z))p.x=nx;if(!circleHits(p.x,nz))p.z=nz;p.y=C.eyeHeight}
setFloorVisibility();camera.position.copyFrom(floors[state.floor].spawns.main);applyReality();

window.addEventListener('keydown',e=>{setKey(e.code,true);if(e.code==='KeyE'&&current&&!locked)current.action();if(e.code==='Minus'||e.code==='BracketLeft'){prefs.sensitivity=Math.max(.25,prefs.sensitivity-.05);camera.angularSensibility=C.mouseBase/prefs.sensitivity;savePrefs();say(`Mouse sensitivity: ${Math.round(prefs.sensitivity*100)} percent`,1000)}if(e.code==='Equal'||e.code==='BracketRight'){prefs.sensitivity=Math.min(2,prefs.sensitivity+.05);camera.angularSensibility=C.mouseBase/prefs.sensitivity;savePrefs();say(`Mouse sensitivity: ${Math.round(prefs.sensitivity*100)} percent`,1000)}});
window.addEventListener('keyup',e=>setKey(e.code,false));window.addEventListener('blur',()=>Object.keys(input).forEach(k=>input[k]=false));canvas.addEventListener('click',()=>{if(!locked&&!document.pointerLockElement)canvas.requestPointerLock?.()});
function setKey(code,value){if(code==='KeyW')input.w=value;if(code==='KeyA')input.a=value;if(code==='KeyS')input.s=value;if(code==='KeyD')input.d=value;if(code==='ShiftLeft'||code==='ShiftRight')input.shift=value;if(code==='KeyQ')input.q=value}
let bobTime=0,bobY=0,bobX=0,roll=0;
scene.onBeforeRenderObservable.add(()=>{
  const dt=Math.min(engine.getDeltaTime()/1000,.04);
  camera.position.y-=bobY;camera.position.x-=bobX;bobY=bobX=0;
  if(locked){prompt.text='';return}
  let forward=(input.w?1:0)-(input.s?1:0),side=(input.d?1:0)-(input.a?1:0);const length=Math.hypot(forward,side);if(length>0){forward/=length;side/=length}
  const running=input.shift&&length>0&&!input.q&&!input.s;const speed=input.q?C.focus:(running?C.run:C.walk);
  const yaw=camera.rotation.y;const fx=Math.sin(yaw),fz=Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);tryMove(new B.Vector3((fx*forward+rx*side)*speed*dt,0,(fz*forward+rz*side)*speed*dt));
  const targetFov=input.q?C.focusFov:(running?C.runFov:C.normalFov);camera.fov+=(targetFov-camera.fov)*Math.min(1,dt*12);
  if(length>0){const freq=running?13.5:8.4,amp=running?.035:.020;bobTime+=dt*freq;bobY=Math.sin(bobTime*2)*amp;bobX=Math.cos(bobTime)*(amp*.32)}else if(input.q){bobTime+=dt;bobY=Math.sin(bobTime)*.0025}
  camera.position.y+=bobY;camera.position.x+=bobX;roll+=(((input.d?1:0)-(input.a?1:0))*(running?-.014:-.007)-roll)*Math.min(1,dt*12);camera.rotation.z=roll+(state.distorted?Math.sin(performance.now()/170)*.003:0);
  cross.scaleX=cross.scaleY=input.q?.74:1;
  const ray=camera.getForwardRay(C.interactRange);let best=null,bestD=Infinity;for(const item of interactables){if(!item.enabled()||!item.mesh.isEnabled())continue;const hit=ray.intersectsMesh(item.mesh,false);if(hit.hit&&hit.distance<=item.range&&hit.distance<bestD){best=item;bestD=hit.distance}}current=best;prompt.text=best?(typeof best.label==='function'?best.label():best.label):'';
});
window.addEventListener('resize',()=>engine.resize());engine.runRenderLoop(()=>scene.render());
window.DESCONEXO=Object.freeze({version:VERSION,scene,engine,camera,state,config:C,floors,ASSET_HOOKS:{buildHouse}});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
