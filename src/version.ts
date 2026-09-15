import { version } from '../package.json';
export const GAME_VERSION = version.split('.').slice(0,2).join('.');
