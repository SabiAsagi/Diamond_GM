import Dexie, { type Table } from 'dexie';
import type { Player, Team, LeagueSeason } from './types';

export class DiamondGMDexie extends Dexie {
  players!: Table<Player, number>;
  teams!: Table<Team, number>;
  leagueSeasons!: Table<LeagueSeason, number>;

  constructor() {
    super('DiamondGMDatabase');
    this.version(1).stores({
      players: '++id, name, age, position, status, teamId',
      teams: '++id, name, city',
      leagueSeasons: '++id, year'
    });
  }
}

export const db = new DiamondGMDexie();

export async function initDummyDataIfNeeded() {
  const teamCount = await db.teams.count();
  if (teamCount === 0) {
    await db.teams.bulkAdd([
      { name: 'Seoul Tigers', city: 'Seoul', budget: 10000000, fanBase: 90 },
      { name: 'Busan Gulls', city: 'Busan', budget: 8500000, fanBase: 85 },
      { name: 'Incheon Wyverns', city: 'Incheon', budget: 7000000, fanBase: 70 }
    ]);
    
    await db.players.bulkAdd([
      {
        name: 'Kim Min-su',
        age: 18,
        position: 'P',
        status: 'HighSchool',
        uniformNumber: 1,
        highSchool: '덕수고',
        handedness: 'R/R',
        pitchingForm: 'Overhand',
        pitcherRole: 'Starter',
        battingForm: 'None',
        overall: 20,
        contact: 15,
        power: 10,
        eye: 15,
        speed: 20,
        defense: 20,
        stuff: 20,
        control: 20,
        stamina: 20,
        potential: 80,
        condition: 100,
        academics: 70,
        relationshipFamily: 50,
        relationshipFriends: 50,
        relationshipTeam: 50,
        relationshipCoach: 50
      },
      {
        name: 'Lee Seung-yeop',
        age: 22,
        position: '1B',
        status: 'Pro',
        teamId: 1, // Seoul Tigers
        uniformNumber: 36,
        highSchool: '경북고',
        handedness: 'L/L',
        pitchingForm: 'None',
        pitcherRole: 'None',
        battingForm: 'Open',
        overall: 80,
        contact: 85,
        power: 90,
        eye: 75,
        speed: 40,
        defense: 70,
        stuff: 0,
        control: 0,
        stamina: 0,
        potential: 95,
        condition: 80,
        academics: 50,
        relationshipFamily: 50,
        relationshipFriends: 50,
        relationshipTeam: 50,
        relationshipCoach: 50
      }
    ]);
    
    await db.leagueSeasons.add({
      year: 2024,
      currentStage: 'Offseason'
    });
  }
}
