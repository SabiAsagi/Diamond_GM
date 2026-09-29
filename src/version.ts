import { version } from '../package.json';
const [major, minor, patch] = version.split('.');
// 새로운 기능 묶음: 1.12.0 → 1.12, 보완: 1.12.1 → 1.12.1 (1.121로 줄이면 1.13보다 커 보여 점으로 구분한다)
export const GAME_VERSION = `${major}.${minor}${patch === '0' ? '' : `.${patch}`}`;
