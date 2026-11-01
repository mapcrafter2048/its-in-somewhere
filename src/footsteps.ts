/** Local CC0 shoe impacts, with a restrained short stereo warehouse response. */
export class ShoeFootsteps {
 private samples:AudioBuffer[]=[];private request?:Promise<void>;private index=0;private active=new Set<AudioBufferSourceNode>();
 private reflection:ConvolverNode;private echoFilter:BiquadFilterNode;private wet:GainNode;
 constructor(private context:BaseAudioContext,private destination:AudioNode,private voice:(source:AudioBufferSourceNode,started:boolean)=>void=()=>{}){
  const ctx=context;this.reflection=ctx.createConvolver();this.reflection.normalize=false;
  const impulse=ctx.createBuffer(2,Math.ceil(ctx.sampleRate*.32),ctx.sampleRate);let state=61;
  const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296*2-1;};
  for(let channel=0;channel<2;channel++){
   const data=impulse.getChannelData(channel);
   for(let i=Math.floor(ctx.sampleRate*.027);i<data.length;i++){const t=i/ctx.sampleRate;data[i]=random()*.012*Math.exp(-t*18)*Math.min(1,(t-.027)*70);}
   for(const [time,gain]of [[.044,.35],[.083,.16],[.127,.08]])data[Math.floor((time+channel*.009)*ctx.sampleRate)]+=gain;
  }
  this.reflection.buffer=impulse;this.echoFilter=ctx.createBiquadFilter();this.echoFilter.type='lowpass';this.echoFilter.frequency.value=2400;
  this.wet=ctx.createGain();this.wet.gain.value=.23;this.echoFilter.connect(this.reflection).connect(this.wet).connect(destination);
 }
 load(){
  if(this.request)return this.request;
  this.request=Promise.all(Array.from({length:5},async(_,i)=>{
   const response=await fetch(`/audio/footsteps/footstep_concrete_${String(i).padStart(3,'0')}.ogg`);
   if(!response.ok)throw Error('Local footsteps unavailable.');return this.context.decodeAudioData(await response.arrayBuffer());
  })).then(samples=>{for(const sample of samples){let peak=0;for(let channel=0;channel<sample.numberOfChannels;channel++)for(const value of sample.getChannelData(channel))peak=Math.max(peak,Math.abs(value));const scale=.70/Math.max(peak,1e-6);for(let channel=0;channel<sample.numberOfChannels;channel++){const values=sample.getChannelData(channel);for(let i=0;i<values.length;i++)values[i]*=scale;}}this.samples=samples;}).catch(error=>{this.request=undefined;throw error;});return this.request;
 }
 play(running=false,when=this.context.currentTime){
  if(!this.samples.length)return false;if(this.active.size>=8)return true;
  const ctx=this.context,source=ctx.createBufferSource(),gain=ctx.createGain(),pan=ctx.createStereoPanner(),n=this.index++;
  source.buffer=this.samples[n%this.samples.length];source.playbackRate.value=(running?1.035:1)+((n*7)%5-2)*.009;
  gain.gain.value=(running?1.20:.95)*(1+((n*13)%7-3)*.016);pan.pan.value=n%2?.065:-.065;
  source.connect(gain);gain.connect(pan).connect(this.destination);gain.connect(this.echoFilter);
  this.active.add(source);this.voice(source,true);source.onended=()=>{source.disconnect();gain.disconnect();pan.disconnect();this.active.delete(source);this.voice(source,false);};source.start(when);return true;
 }
 stats(){return {samples:this.samples.length,echoSeconds:.32,active:this.active.size,lastSample:this.index?`concrete-${(this.index-1)%5}`:null};}
}
