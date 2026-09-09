const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const os=require('node:os');const ts=require('typescript');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'diamond-tests-'));
function compile(folder){for(const item of fs.readdirSync(folder,{withFileTypes:true})){const file=path.join(folder,item.name);if(item.isDirectory())compile(file);else if(file.endsWith('.ts')){const target=path.join(dir,path.relative(path.resolve('src'),file).replace(/\.ts$/,'.js'));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);}}}
compile(path.resolve('src'));fs.symlinkSync(path.resolve('node_modules'),path.join(dir,'node_modules'),'dir');
let saved;
require.cache[path.join(dir,'db.js')]={id:path.join(dir,'db.js'),filename:path.join(dir,'db.js'),loaded:true,exports:{db:{players:{put:async p=>{saved=structuredClone(p);}}}}};
const {HIGH_SCHOOLS_DATA}=require(path.join(dir,'data/highSchools.js'));
const {generateSeasonMatches,progressTournament,advanceOtherTournamentMatches}=require(path.join(dir,'types/tournament.js'));
const {normalizePlayer,trainPitch,overallRating}=require(path.join(dir,'data/playerDevelopment.js'));
const {sampleSubActivities}=require(path.join(dir,'types/activity.js'));
const {useGameClockStore}=require(path.join(dir,'store/gameClockStore.js'));
const school=HIGH_SCHOOLS_DATA[0];
function player(){return normalizePlayer({id:1,name:'검증선수',gender:'male',age:16,position:'TwoWay',status:'HighSchool',uniformNumber:17,highSchool:school.name,handedness:'R/R',pitchingForm:'Overhand',pitcherRole:'Starter',battingForm:'Straight',overall:20,potential:80,stuff:20,control:20,stamina:20,contact:20,power:20,eye:20,speed:20,defense:20,condition:100,academics:50,relationshipFamily:50,relationshipFriends:50,relationshipTeam:50,relationshipCoach:50,gameDate:{year:2026,month:3,day:3,weekday:2,grade:1},currentSlot:'afternoon'});}
test('new pitch learns at 100 XP; remaining XP and ceiling are preserved',()=>{
 let p=player();p.pitches=trainPitch(p,'curve',240);const c=p.pitches.find(x=>x.type==='curve');assert.deepEqual(c,{type:'curve',rating:4,potential:80,xp:40});
 p.pitches=[{type:'curve',rating:79,potential:80,xp:90}];assert.deepEqual(trainPitch(p,'curve',40)[0],{type:'curve',rating:80,potential:80,xp:0});
});
test('64 teams progress through qualifiers to a unique champion, with no duplicate opponents',()=>{
 let matches=generateSeasonMatches(2028,school,HIGH_SCHOOLS_DATA);let played=[];
 for(let i=0;i<8;i++){const m=matches.find(m=>m.tournamentId==='emart_spring'&&m.isPlayerTeamMatch&&!m.result);if(!m)break;played.push(m);const before=matches;matches=progressTournament(matches,{matchId:m.id,tournamentId:m.tournamentId,won:true},school,HIGH_SCHOOLS_DATA);assert.deepEqual(progressTournament(matches,{matchId:m.id,tournamentId:m.tournamentId,won:true},school,[]),matches);assert.notDeepEqual(matches,before);}
 assert.deepEqual(played.map(m=>m.round),['조 예선 1차전','조 예선 결정전','16강전','8강전','4강 준결승','결승전']);
 assert.equal(new Set(played.map(m=>m.homeSchoolId===school.id?m.awaySchoolId:m.homeSchoolId)).size,6);
 const final=played.at(-1);const result=matches.find(m=>m.id===final.id);assert.equal(result.result,final.homeSchoolId===school.id?'home':'away');
 assert.ok(matches.every(m=>m.year===undefined||m.year===2028));
});
test('elimination prevents reentry; other schools finish only on scheduled dates',()=>{
 let matches=generateSeasonMatches(2026,school,HIGH_SCHOOLS_DATA);const m=matches.find(m=>m.tournamentId==='emart_spring'&&m.isPlayerTeamMatch);
 matches=progressTournament(matches,{matchId:m.id,tournamentId:m.tournamentId,won:false},school,[]);
 assert.equal(matches.filter(x=>x.tournamentId===m.tournamentId&&x.isPlayerTeamMatch).length,1);
 assert.ok(!matches.some(x=>x.round==='결승전'));
 matches=advanceOtherTournamentMatches(matches,{year:2026,month:4,day:30,weekday:4,grade:1},school);
 assert.equal(matches.filter(x=>x.tournamentId===m.tournamentId&&x.round==='결승전'&&x.result).length,1);
});
test('night training never includes scrimmages or new pitches',()=>{for(let i=0;i<100;i++)assert.ok(sampleSubActivities('training',100,'TwoWay','night').every(o=>o.id!=='train_team_scrimmage'&&!o.pitchTraining));});
test('store saves pitch growth, rejects wrong slots, resumes draws and pending event exactly once',async()=>{
 const store=useGameClockStore;await store.getState().initClock(player());const original=structuredClone(store.getState().seasonMatches);
 await store.getState().selectActivity('night','training','pitch_curve');assert.equal(store.getState().player.pitches.some(x=>x.type==='curve'),false);
 await store.getState().selectActivity('afternoon','training','pitch_curve');assert.equal(saved.pitches.find(x=>x.type==='curve').xp,40);assert.equal(saved.currentSlot,'night');
 if(store.getState().activeCutscene)await store.getState().resolveCutscene('reflect');
 const p=structuredClone(saved);await store.getState().initClock(p);assert.deepEqual(store.getState().seasonMatches,original);
 await store.getState().revealTournament('emart_spring');assert.ok(saved.savedMatches.filter(m=>m.tournamentId==='emart_spring').every(m=>m.drawn));
 await store.getState().initClock({...saved,pendingEventId:'pitch_grip_discovery'});const movement=store.getState().player.movement;
 await store.getState().resolveCutscene('learn');assert.equal(saved.movement,movement+2);assert.equal(saved.pendingEventId,undefined);
 await store.getState().resolveCutscene('learn');assert.equal(saved.movement,movement+2);assert.equal(saved.overall,overallRating(saved));
});
process.on('exit',()=>fs.rmSync(dir,{recursive:true,force:true}));
