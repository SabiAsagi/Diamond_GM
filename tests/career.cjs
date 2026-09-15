const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const os=require('node:os');const ts=require('typescript');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'diamond-tests-'));
function compile(folder){for(const item of fs.readdirSync(folder,{withFileTypes:true})){const file=path.join(folder,item.name);if(item.isDirectory())compile(file);else if(file.endsWith('.ts')){const target=path.join(dir,path.relative(path.resolve('src'),file).replace(/\.ts$/,'.js'));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);}}}
compile(path.resolve('src'));fs.symlinkSync(path.resolve('node_modules'),path.join(dir,'node_modules'),process.platform === 'win32' ? 'junction' : 'dir');
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

test('인연 단계 경계에서 기존 훈련 배율과 경기 보정이 유지된다', () => {
  const {scoreToStage,getTrainingEfficiencyMultiplier,getCoachWinProbabilityBonus}=require(path.join(dir,'types/relationship.js'));
  const p=player(); p.relationshipTeam=0;
  for (const [score,stage,multiplier,winBonus] of [
    [0,1,1,0],[34,1,1,0],[35,2,1.03,0],[54,2,1.03,0],
    [55,3,1.03,0],[74,3,1.03,0],[75,4,1.03,.04],
    [89,4,1.03,.04],[90,5,1.08,.04],[100,5,1.08,.04],
  ]) {
    p.relationshipCoach=score;
    assert.equal(scoreToStage(score),stage);
    assert.equal(getTrainingEfficiencyMultiplier(p),multiplier);
    assert.equal(getCoachWinProbabilityBonus(p),winBonus);
  }
  p.relationshipCoach=90; p.relationshipTeam=89;
  assert.equal(getTrainingEfficiencyMultiplier(p),1.08);
  p.relationshipTeam=90;
  assert.equal(getTrainingEfficiencyMultiplier(p),1.18);
});

test('모든 인물의 5단계 효과와 공유 점수·표시 보정·기존 로맨스 대상이 정확하다', () => {
  const {buildBondProfiles,scoreToStage,getTrainingEfficiencyMultiplier}=require(path.join(dir,'types/relationship.js'));
  const p={...player(),grade:2,relationshipCoach:90,relationshipTeam:90,relationshipFriends:100,relationshipFamily:100};
  const profiles=buildBondProfiles(p);
  assert.equal(profiles.length,13);
  for(const profile of profiles) assert.deepEqual(profile.stageEffects.map(e=>e.stage),[1,2,3,4,5]);
  assert.deepEqual(profiles.find(p=>p.id==='coach').stageEffects.map(e=>e.description),[
    '효과 없음','훈련 효율 +3%','효과 없음','경기 승리 확률 보정 +4%p','훈련 효율 추가 +5% (누적 +8%)',
  ]);
  for(const id of ['coach2','teacher','childhood','neighbor','deskmate','mother','father']) {
    assert.ok(profiles.find(p=>p.id===id).stageEffects.every(e=>!e.hasEffect&&e.description==='효과 없음'),id);
  }
  for(const id of ['pe','senior','peer','rival','junior']) {
    const bond=profiles.find(p=>p.id===id);
    assert.equal(bond.scoreKey,'relationshipTeam');
    assert.equal(bond.sharedScore,90);
    assert.deepEqual(bond.stageEffects.filter(e=>e.hasEffect).map(e=>e.description),['훈련 효율 +10% (팀 공통 · 1회 적용)']);
  }
  const rival=profiles.find(p=>p.id==='rival');
  assert.equal(scoreToStage(rival.score),4);
  assert.equal(scoreToStage(rival.sharedScore),5);
  assert.equal(getTrainingEfficiencyMultiplier(p),1.18); // 5명에 대해 중복 가산하지 않는다.
  for(const gender of ['male','female']) {
    const bonds=buildBondProfiles({...p,gender});
    assert.deepEqual(bonds.filter(b=>b.romanceable).map(b=>b.id).sort(),gender==='male'?['childhood','deskmate']:['peer','senior']);
  }
  const zero=buildBondProfiles({...p,relationshipCoach:0,relationshipTeam:0,relationshipFriends:0,relationshipFamily:0});
  assert.ok(zero.every(b=>b.sharedScore===0));
  assert.equal(zero.find(b=>b.id==='coach').score,0);
  assert.equal(zero.find(b=>b.id==='rival').score,5);
  assert.ok(buildBondProfiles({...p,grade:1}).every(b=>b.id!=='junior'));
  assert.ok(buildBondProfiles({...p,grade:3}).every(b=>b.id!=='senior'));
});

test('실제 경기 판정은 감독 인연 75점부터 표시된 4%p 보정을 사용한다', () => {
  const {resolveMatchPlaceholder}=require(path.join(dir,'store/matchResolver.js'));
  const {battingRating}=require(path.join(dir,'data/playerDevelopment.js'));
  const p={...player(),position:'SS',relationshipCoach:74};
  const match=generateSeasonMatches(2026,school,HIGH_SCHOOLS_DATA).find(m=>m.isPlayerTeamMatch);
  const sample=.5+(battingRating(p)-20)*.005+.02;
  const originalRandom=Math.random;
  try {
    Math.random=()=>sample;
    assert.equal(resolveMatchPlaceholder(match,p,school).matchOutcome.won,false);
    const result=resolveMatchPlaceholder(match,{...p,relationshipCoach:75},school);
    assert.equal(result.matchOutcome.won,true);
    assert.match(result.logMessage,/승리 확률 보정 \+4%p/);
  } finally { Math.random=originalRandom; }
});


test('v4 awards use real records and stages, and remain earned after reload or season rollover', async () => {
  const {buildAchievements,buildTournamentTrophies,captureAchievements}=require(path.join(dir,'data/achievements.js'));
  let p=player(); p.fame=100; p.relationshipCoach=89; p.pitches=[{type:'curve',rating:79,potential:80,xp:0}];
  let awards=buildAchievements(p);
  assert.equal(awards.find(a=>a.id==='ach_first_match').unlocked,false);
  assert.equal(awards.find(a=>a.id==='ach_coach_trust').unlocked,false);
  assert.equal(awards.find(a=>a.id==='ach_pitch_master').unlocked,false);
  p.relationshipCoach=90;p.pitches=trainPitch(p,'curve',100);p.academics=90;
  assert.equal(buildAchievements(p).find(a=>a.id==='ach_pitch_master').unlocked,true);
  let matches=generateSeasonMatches(2026,school,HIGH_SCHOOLS_DATA);
  p.savedMatches=matches;
  assert.ok(buildTournamentTrophies(p).every(t=>!t.unlocked));
  for(let i=0;i<6;i++) {
    const m=matches.find(m=>m.tournamentId==='emart_spring'&&m.isPlayerTeamMatch&&!m.result);
    matches=progressTournament(matches,{matchId:m.id,tournamentId:m.tournamentId,won:true},school,HIGH_SCHOOLS_DATA);
  }
  p.savedMatches=matches;p.savedSeasonYear=2026;
  assert.equal(buildTournamentTrophies(p).filter(t=>t.unlocked).length,3);
  captureAchievements(p);
  p.academics=10;p.savedMatches=[];
  assert.equal(buildAchievements(p).find(a=>a.id==='ach_academic_excellence').unlocked,true);
  assert.equal(buildTournamentTrophies(p).filter(t=>t.unlocked).length,3);
  await useGameClockStore.getState().initClock(p);
  assert.equal(saved.earnedTrophyIds.length,3);
  assert.ok(saved.earnedAchievementIds.includes('ach_academic_excellence'));
});

test('v4 activities cover each category, enforce positions and slots in sampling and execution', async () => {
  const {SUB_ACTIVITY_POOL,isActivityAvailable}=require(path.join(dir,'types/activity.js'));
  const all=Object.values(SUB_ACTIVITY_POOL).flat();
  assert.equal(new Set(all.map(a=>a.id)).size,all.length);
  for(const category of ['study','rest','relationship','special','training']) assert.ok(SUB_ACTIVITY_POOL[category].length>=10,category);
  const block=all.find(a=>a.id==='train_catcher_block');
  assert.equal(isActivityAvailable(block,'C','afternoon'),true);
  for(const position of ['P','SS','TwoWay']) assert.equal(isActivityAvailable(block,position,'afternoon'),false);
  assert.equal(isActivityAvailable(block,'C','night'),false);
  for(const position of ['P','C','SS','TwoWay']) {
    const choices=sampleSubActivities('training',1000,position,'afternoon');
    assert.equal(choices.some(a=>a.id===block.id),position==='C');
  }
  const store=useGameClockStore;
  await store.getState().initClock(player());
  const before=structuredClone(store.getState().player);
  await store.getState().selectActivity('afternoon','training',block.id);
  assert.deepEqual(store.getState().player,before);
  await store.getState().initClock({...player(),position:'C'});
  await store.getState().selectActivity('afternoon','training',block.id);
  assert.equal(saved.defense,player().defense+2);
  assert.equal(saved.currentSlot,'night');
});
