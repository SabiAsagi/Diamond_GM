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
  const p=player(); p.relationships=Object.fromEntries(Object.keys(p.relationships).map(id=>[id,0]));
  for (const [score,stage,multiplier,winBonus] of [
    [0,1,1,0],[34,1,1,0],[35,2,1.03,0],[54,2,1.03,0],
    [55,3,1.03,0],[74,3,1.03,0],[75,4,1.03,.04],
    [89,4,1.03,.04],[90,5,1.08,.04],[100,5,1.08,.04],
  ]) {
    p.relationships.coach=score;
    assert.equal(scoreToStage(score),stage);
    assert.equal(getTrainingEfficiencyMultiplier(p),multiplier);
    assert.equal(getCoachWinProbabilityBonus(p),winBonus);
  }
  p.relationships.coach=90; p.relationships.peer=89;
  assert.equal(getTrainingEfficiencyMultiplier(p),1.08);
  p.relationships.peer=90;
  assert.equal(getTrainingEfficiencyMultiplier(p),1.18);
});

test('개별 점수·5단계 효과·성별 무관 로맨스와 졸업 인연이 일치한다', () => {
 const {buildBondProfiles,getTrainingEfficiencyMultiplier}=require(path.join(dir,'types/relationship.js'));
 const p=player();p.grade=2;p.relationships={...p.relationships,coach:90,peer:90,rival:12};
 const profiles=buildBondProfiles(p);
 assert.equal(profiles.length,13);
 for(const b of profiles){assert.deepEqual(b.stageEffects.map(e=>e.stage),[1,2,3,4,5]);assert.equal(b.score,p.relationships[b.id]);}
 assert.deepEqual(profiles.find(b=>b.id==='coach').stageEffects.map(e=>e.description),[
  '효과 없음','훈련 효율 +3%','효과 없음','경기 승리 확률 보정 +4%p','훈련 효율 추가 +5% (누적 +8%)']);
 for(const id of ['coach2','teacher','pe','senior','rival','junior','childhood','neighbor','deskmate','mother','father'])assert.ok(profiles.find(b=>b.id===id).stageEffects.every(e=>!e.hasEffect&&e.description==='효과 없음'));
 assert.equal(getTrainingEfficiencyMultiplier(p),1.18);
 p.relationships.rival=100;p.relationships.senior=100;
 assert.equal(getTrainingEfficiencyMultiplier(p),1.18);
 p.relationships.peer=89;assert.equal(getTrainingEfficiencyMultiplier(p),1.08);
 for(const gender of ['male','female']) for(const grade of [1,2,3]) {
  const bonds=buildBondProfiles({...p,gender,grade});
  assert.deepEqual(bonds.filter(b=>b.romanceable).map(b=>b.id).sort(),['childhood','deskmate','peer','senior']);
  assert.equal(bonds.some(b=>b.id==='junior'),grade>1);
  assert.equal(bonds.find(b=>b.id==='senior').score,100);
 }
});

test('실제 경기 판정은 감독 인연 75점부터 표시된 4%p 보정을 사용한다', () => {
  const {resolveMatchPlaceholder}=require(path.join(dir,'store/matchResolver.js'));
  const {battingRating}=require(path.join(dir,'data/playerDevelopment.js'));
  const p={...player(),position:'SS'};p.relationships.coach=74;
  const match=generateSeasonMatches(2026,school,HIGH_SCHOOLS_DATA).find(m=>m.isPlayerTeamMatch);
  const sample=.5+(battingRating(p)-20)*.005+.02;
  const originalRandom=Math.random;
  try {
    Math.random=()=>sample;
    assert.equal(resolveMatchPlaceholder(match,p,school).matchOutcome.won,false);
    const result=resolveMatchPlaceholder(match,{...p,relationships:{...p.relationships,coach:75}},school);
    assert.equal(result.matchOutcome.won,true);
    assert.match(result.logMessage,/승리 확률 보정 \+4%p/);
  } finally { Math.random=originalRandom; }
});


test('v4 awards use real records and stages, and remain earned after reload or season rollover', async () => {
  const {buildAchievements,buildTournamentTrophies,captureAchievements}=require(path.join(dir,'data/achievements.js'));
  let p=player(); p.fame=100; p.relationships.coach=89; p.pitches=[{type:'curve',rating:79,potential:80,xp:0}];
  let awards=buildAchievements(p);
  assert.equal(awards.find(a=>a.id==='ach_first_match').unlocked,false);
  assert.equal(awards.find(a=>a.id==='ach_coach_trust').unlocked,false);
  assert.equal(awards.find(a=>a.id==='ach_pitch_master').unlocked,false);
  p.relationships.coach=90;p.pitches=trainPitch(p,'curve',100);p.academics=90;
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


test('구 저장 변환은 표시 점수를 보존하며 0점·부분 저장·재접속·학년 전환에 멱등이다', async()=>{
 const {getBondScores,applyBondChanges}=require(path.join(dir,'types/bondScores.js'));
 const legacy={...player(),relationships:undefined,relationshipCoach:40,relationshipTeam:60,relationshipFriends:75,relationshipFamily:28};
 const original=structuredClone(legacy);
 const migrated=normalizePlayer(legacy);
 assert.equal(migrated.relationships.coach2,40);assert.equal(migrated.relationships.rival,60);
 assert.equal(migrated.relationships.childhood,75);assert.equal(migrated.relationships.father,28);
 assert.deepEqual(legacy,original);
 for(const key of ['relationshipCoach','relationshipTeam','relationshipFriends','relationshipFamily'])assert.equal(key in migrated,false);
 let updated=applyBondChanges(migrated,{peer:5,mother:-99});
 assert.equal(updated.relationships.peer,65);assert.equal(updated.relationships.rival,60);
 assert.equal(updated.relationships.mother,0);assert.equal(updated.relationships.father,28);
 assert.deepEqual(normalizePlayer(updated),updated);
 assert.equal(getBondScores({...legacy,relationships:{childhood:0}}).childhood,0);
 await useGameClockStore.getState().initClock(updated);assert.deepEqual(saved.relationships,updated.relationships);
 await useGameClockStore.getState().initClock({...saved,grade:3});assert.deepEqual(saved.relationships,updated.relationships);
});

test('모든 인물별 활동은 그 인물만 변경하고 밤 저장·상한·하한이 안전하다',async()=>{
 const {SUB_ACTIVITY_POOL,evaluateActivityWithGating,isActivityAvailable}=require(path.join(dir,'types/activity.js'));
 const {applyBondChanges}=require(path.join(dir,'types/bondScores.js'));
 const all=Object.values(SUB_ACTIVITY_POOL).flat();
 for(const option of all)assert.ok(Object.keys(option.statChanges).every(k=>!k.startsWith('relationship')),option.id);
 const talks=all.filter(o=>o.id.startsWith('bond_talk_'));assert.equal(talks.length,13);
 for(const option of talks){
  const p={...player(),grade:2};const before=structuredClone(p.relationships);
  const result=evaluateActivityWithGating(option,100,100);const next=applyBondChanges(p,result.relationshipTargets);
  const target=Object.keys(option.relationshipTargets)[0];
  for(const id of Object.keys(before))assert.equal(next.relationships[id],before[id]+(id===target?6:0));
  assert.deepEqual(p.relationships,before);
 }
 const junior=talks.find(o=>o.id==='bond_talk_junior');
 assert.equal(isActivityAvailable(junior,'SS','afternoon',1),false);assert.equal(isActivityAvailable(junior,'SS','afternoon',2),true);
 for(const slot of ['afternoon','night']){
  const p=player();p.currentSlot=slot;p.relationships[slot==='night'?'mother':'rival']=98;
  await useGameClockStore.getState().initClock(p);
  const target=slot==='night'?'mother':'rival';
  await useGameClockStore.getState().selectActivity(slot,'relationship','bond_talk_'+target);
  assert.equal(saved.relationships[target],100);
  for(const id of Object.keys(p.relationships))if(id!==target)assert.equal(saved.relationships[id],p.relationships[id]);
  assert.deepEqual(useGameClockStore.getState().lastActionResult.relationshipTargets,{[target]:2});
  assert.equal(saved.currentSlot,slot==='night'?'morning':'night');
 }
 const low=applyBondChanges(player(),{rival:-1000});assert.equal(low.relationships.rival,0);
});

test('컷신 대상·데이트 조건·단체 행사·외출 모두 공유 점수에 의존하지 않는다',async()=>{
 const {CUTSCENE_EVENTS_POOL}=require(path.join(dir,'data/cutsceneEvents.js'));
 const {resolveAcademicEvent}=require(path.join(dir,'store/eventResolver.js'));
 const {getOutdoorLocations}=require(path.join(dir,'types/outdoorMap.js'));
 const date=CUTSCENE_EVENTS_POOL.find(e=>e.id==='childhood_date');
 for(const gender of ['male','female']){
  const p={...player(),gender,relationshipFriends:100};p.relationships.childhood=74;p.relationships.deskmate=100;
  assert.equal(date.conditions(p),false);p.relationships.childhood=75;assert.equal(date.conditions(p),true);
 }
 const targets={homeroom_checkin:'teacher',childhood_date:'childhood',junior_advice:'junior',coach_one_point_lesson:'coach',senior_secret_pep_talk:'senior',graduated_senior_call:'senior',pitch_grip_discovery:'coach2'};
 for(const [eventId,target] of Object.entries(targets)){
  const p={...player(),grade:2,pendingEventId:eventId};
  await useGameClockStore.getState().initClock(p);await useGameClockStore.getState().resolveCutscene('learn');
  assert.ok(saved.relationships[target]>p.relationships[target],eventId);
  for(const id of Object.keys(p.relationships))if(id!==target)assert.equal(saved.relationships[id],p.relationships[id],eventId+' '+id);
  const once=structuredClone(saved.relationships);await useGameClockStore.getState().resolveCutscene('learn');assert.deepEqual(saved.relationships,once);
 }
 const result=resolveAcademicEvent({type:'field_trip',label:'수학여행'},player());
 assert.deepEqual(result.relationshipTargets,{deskmate:10,peer:6});
 const p={...player(),currentSlot:'night',money:50000};await useGameClockStore.getState().initClock(p);
 await useGameClockStore.getState().visitOutdoorLocation(getOutdoorLocations('서울').find(l=>l.id==='karaoke'));
 assert.equal(saved.relationships.neighbor,p.relationships.neighbor+3);
 for(const id of Object.keys(p.relationships))if(id!=='neighbor')assert.equal(saved.relationships[id],p.relationships[id]);
});


test('전국 추정 퍼센타일은 평균에서 50%, 높은 OVR일수록 작아지고 학년별로 재계산된다',()=>{
 const {getNationalPercentile,normalCdf}=require(path.join(dir,'data/nationalRanking.js'));
 assert.ok(Math.abs(normalCdf(0)-.5)<.000001);assert.ok(Math.abs(normalCdf(1)-.8413447)<.000001);
 for(const [grade,mean] of [[1,24],[2,38],[3,52]]) {
  let prev=100;
  for(let overall=0;overall<=100;overall++){
   const rank=getNationalPercentile({...player(),grade,overall}).percentile;
   assert.ok(rank>=1 && rank<=99 && rank<=prev);prev=rank;
  }
  assert.equal(getNationalPercentile({...player(),grade,overall:mean}).percentile,50);
 }
 assert.ok(getNationalPercentile({...player(),grade:1,overall:40}).percentile<getNationalPercentile({...player(),grade:3,overall:40}).percentile);
});

test('라이벌은 연도·월당 한 번 성장하고 잠재력을 넘지 않으며 같은 달 재진입은 멱등이다',()=>{
 const {initializeRival,growRivalIfNeeded}=require(path.join(dir,'data/rival.js'));
 const p=player();p.rivalProgress=initializeRival(p,{year:2026,month:12},()=>.5);
 assert.equal(p.rivalProgress.overall,p.overall);
 let calls=0;const random=()=>{calls++;return .5;};
 assert.deepEqual(growRivalIfNeeded(p,12,2026,random),p.rivalProgress);assert.equal(calls,0);
 p.rivalProgress=growRivalIfNeeded(p,1,2027,random);assert.equal(calls,1);assert.ok(p.rivalProgress.overall>20);
 assert.deepEqual(growRivalIfNeeded(p,1,2027,random),p.rivalProgress);assert.equal(calls,1);
 p.rivalProgress=growRivalIfNeeded(p,1,2028,random);assert.equal(calls,13);
 p.rivalProgress={...p.rivalProgress,overall:76,potential:76};
 assert.equal(growRivalIfNeeded(p,2,2028,()=>1).overall,76);
});

test('월말 어떤 활동에도 리포트를 저장하고 한 달 전체 성장량·재접속·닫힘을 유지한다',async()=>{
 const store=useGameClockStore;
 for(const category of [undefined,'rest','study','training','relationship']){
  const p=player();p.currentSlot='night';p.gameDate={year:2026,month:12,day:31,weekday:4,grade:1};
  p.rivalProgress={overall:30,potential:80,lastUpdatedYear:2026,lastUpdatedMonth:12,playerMonthStartOverall:12};
  await store.getState().initClock(p);
  await store.getState().advanceSlot({statChanges:{},staminaDelta:0,logMessage:'월말 검증',activityCategory:category});
  assert.equal(saved.rivalProgress.lastUpdatedYear,2027);assert.equal(saved.rivalProgress.lastUpdatedMonth,1);
  assert.ok(saved.rivalProgress.overall>30);assert.equal(saved.pendingRivalReport.playerDelta,overallRating(saved)-12);
  const report=structuredClone(saved.pendingRivalReport),rival=structuredClone(saved.rivalProgress);
  await store.getState().initClock(saved);assert.deepEqual(saved.pendingRivalReport,report);assert.deepEqual(saved.rivalProgress,rival);
  await store.getState().dismissRivalReport();assert.equal(saved.pendingRivalReport,undefined);
  await store.getState().initClock(saved);assert.equal(saved.pendingRivalReport,undefined);assert.deepEqual(saved.rivalProgress,rival);
 }
});
