export const WALK_SPEED=1.8,RUN_SPEED=3;
/** Distance-driven footfalls with real-time spacing so walking never chatters. */
export class FootstepCadence {
 private travelled=0;private last=-Infinity;
 reset(){this.travelled=0;}
 advance(distance:number,running:boolean,seconds:number){
  if(distance<=0)return false;
  this.travelled+=distance;const stride=running?RUN_SPEED*.34:WALK_SPEED*.48,interval=running?.34:.48;
  if(this.travelled<stride||seconds-this.last<interval)return false;
  this.travelled%=stride;this.last=seconds;return true;
 }
}
