import { redis } from './redis';
export async function recordLoginEvent(status) {
  try {
    await redis.lpush('crn_login_audit', JSON.stringify({time:new Date().toISOString(),status}));
    await redis.ltrim('crn_login_audit',0,499);
  } catch (error) { console.error('Login audit unavailable',error); }
}
export async function listLoginEvents() {
  const items=await redis.lrange('crn_login_audit',0,199);
  return items.map(item=>typeof item==='string'?JSON.parse(item):item);
}
