import type { Player } from '../types';

const BASELINES = {1:{mean:24,stdDev:8},2:{mean:38,stdDev:12},3:{mean:52,stdDev:15}} as const;

export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z*z/2);
  const tail = d*t*(0.3193815+t*(-0.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));
  return z >= 0 ? 1-tail : tail;
}
// 실제 로스터 순위가 아닌 동학년 가정 분포의 추정치. 별도 저장하지 않는다.
export function getNationalPercentile(player: Player): {percentile:number;label:string} {
  const grade = player.grade === 2 || player.grade === 3 ? player.grade : 1;
  const {mean,stdDev} = BASELINES[grade];
  const overall = Number.isFinite(player.overall) ? player.overall : mean;
  const percentile = Math.min(99,Math.max(1,Math.round((1-normalCdf((overall-mean)/stdDev))*100)));
  return {percentile,label:`전국 상위 ${percentile}%`};
}
