import { version } from '../package.json';
const [major, minor, patch] = version.split('.');
// 같은 계열의 보완: 1.8.1 → 1.81, 새로운 기능 묶음: 1.9.0 → 1.9
export const GAME_VERSION = `${major}.${minor}${patch === '0' ? '' : patch}`;
