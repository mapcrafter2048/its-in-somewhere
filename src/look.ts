export const PITCH_LIMIT=Math.PI/2-0.035;
/** Wrap yaw without restricting how many times the player can turn. */
export function wrapYaw(yaw:number){return ((yaw+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;}
export function lookAngles(yaw:number,pitch:number,dx:number,dy:number,sensitivity:number){return {yaw:wrapYaw(yaw-dx*0.002*sensitivity),pitch:Math.max(-PITCH_LIMIT,Math.min(PITCH_LIMIT,pitch-dy*0.002*sensitivity))};}
