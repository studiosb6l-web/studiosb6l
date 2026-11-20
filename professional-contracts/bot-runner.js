// Fail-closed, opt-in automation runner. No external side effects.
import {contractBots} from './bots-registry.js';
export function planBotRun({enabledIds=[],context={}}={}){
 const allow=new Set(enabledIds);
 const selected=contractBots.filter(bot=>allow.has(bot.id));
 if(selected.some(bot=>bot.enabled!==false)) throw new Error('REGISTRY_EXPECTED_DISABLED');
 if(context.environment!=='staging') throw new Error('STAGING_ONLY');
 if(context.authorized!==true) throw new Error('AUTHORIZATION_REQUIRED');
 return selected.map(bot=>({id:bot.id,mode:'dry-run',action:bot.action,decision:'not-executed'}));
}
export function assertProductionBlocked(){throw new Error('PRODUCTION_BOT_EXECUTION_DISABLED');}
