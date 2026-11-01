/** Decorative office records. All charts are clearly labelled fictional examples. */
export const ART_WIDTH=768,ART_HEIGHT=384;
export const WALL_ART_TITLES=['A view from outside','Archive floor plan','Time spent finding the form','Safety notice','Paper versus shelving','Retention review','Pinned correspondence','Meeting notice'];
export function drawArchiveWallArt(c:CanvasRenderingContext2D,wing:number){
 const ink='#414a3a',muted='#6b6f5a',green='#667f69',ochre='#9b8054';
 for(let i=0;i<8;i++){
  c.save();c.translate(i%4*ART_WIDTH,Math.floor(i/4)*ART_HEIGHT);
  c.fillStyle=['#b6af93','#b7bba5','#c2b89c','#b6b299'][i%4];c.fillRect(0,0,ART_WIDTH,ART_HEIGHT);
  c.strokeStyle='#655f4b';c.lineWidth=9;c.strokeRect(12,12,ART_WIDTH-24,ART_HEIGHT-24);
  const text=(value:string,x:number,y:number,size=22,color=ink)=>{c.fillStyle=color;c.font=`${size}px monospace`;c.fillText(value,x,y);};
  const heading=(value:string)=>{c.fillStyle=ink;c.font='bold 27px monospace';c.fillText(value,38,56);text(`W${wing+1} / RECORDS & RETENTION`,38,84,16,muted);};
  const footer=(value:string)=>text(value,38,ART_HEIGHT-30,16,muted);
  if(i===0){
   c.fillStyle='#8f9d97';c.fillRect(29,29,710,248);c.fillStyle='#a9aa8c';c.beginPath();c.arc(586,100,30,0,Math.PI*2);c.fill();
   for(let ridge=0;ridge<2;ridge++){c.fillStyle=ridge?'#64705d':'#78866e';c.beginPath();c.moveTo(29,277);for(let n=0;n<10;n++)c.lineTo(29+n*79,175+ridge*36+Math.sin(n*1.7+wing+ridge)*37);c.lineTo(739,277);c.closePath();c.fill();}
   text('SOMEWHERE OUTSIDE',38,316,25);footer('An approved destination. Leave the files here.');
  }else if(i===1){
   heading('ARCHIVE FLOOR PLAN');c.strokeStyle=muted;c.lineWidth=3;
   for(let n=0;n<4;n++){const x=65+n%2*210,y=110+Math.floor(n/2)*103;c.strokeRect(x,y,186,84);text(['W1 / ADMIN','W2 / COMM','W4 / EXEC','W3 / TECH'][n],x+12,y+35,18);for(let row=0;row<3;row++){c.fillStyle='#8b9276';c.fillRect(x+13,y+47+row*9,158,3);}}
   text('CONNECTED',505,155,22);text('IN A LOOP.',505,185,22);text('YOU ARE HERE.',505,242,18);text('THE FILE MAY',505,267,18);text('DISAGREE.',505,292,18);footer('Map selection is informational. Walking remains mandatory.');
  }else if(i===2){
   heading('TIME SPENT FINDING THE FORM');c.strokeStyle=muted;c.lineWidth=2;c.beginPath();c.moveTo(90,110);c.lineTo(90,295);c.lineTo(688,295);c.stroke();
   for(let n=0;n<5;n++){const h=42+n*25+(wing+n)%3*9;c.fillStyle=n===4?ochre:green;c.fillRect(126+n*108,294-h,60,h);text(String(8+n*7),139+n*108,283-h,18);text(['MON','TUE','WED','THU','FRI'][n],135+n*108,320,17);}
   text('MIN',38,127,16);footer('FICTIONAL SAMPLE / The request was marked "quick question".');
  }else if(i===3){
   heading('SAFETY / KEEP DOORS CLEAR');
   text('1. Leave the doorway clear.',43,140,25);text('2. Close one drawer at a time.',43,184,25);text('3. Report damaged shelving.',43,228,25);
   c.strokeStyle=ochre;c.lineWidth=3;c.beginPath();c.moveTo(43,258);c.lineTo(710,258);c.stroke();text('Paper does not count as fireproofing.',43,300,24);footer('Yes, this includes the fire-safety paperwork.');
  }else if(i===4){
   heading('PAPER RETAINED / SHELVES AVAILABLE');c.strokeStyle='#92937b';c.lineWidth=1;
   for(let n=0;n<4;n++){const y=127+n*49;c.beginPath();c.moveTo(90,y);c.lineTo(691,y);c.stroke();text(String(150-n*50),39,y+5,15);}
   for(const [values,color] of [[[260,243,221,172,130],green],[[251,250,249,248,247],ochre]] as const){c.strokeStyle=color;c.lineWidth=4;c.beginPath();values.forEach((y,n)=>{if(n)c.lineTo(100+n*143,y);else c.moveTo(100,y);});c.stroke();values.forEach((y,n)=>{c.fillStyle=color;c.beginPath();c.arc(100+n*143,y,4,0,Math.PI*2);c.fill();});}
   for(let n=0;n<5;n++)text(String(2021+n),80+n*143,300,16);text('PAPER',100,326,17,green);text('SHELVES',270,326,17,ochre);footer('ILLUSTRATIVE DATA / Capacity review: optimistically pending.');
  }else if(i===5){
   const marks=['✉ / ADMINISTRATION','▤ / COMMERCIAL RECORDS','⚙ / TECHNICAL SERVICES','§ / EXECUTIVE DEPOSITORY'];
   const titles=['CORRESPONDENCE REGISTER','SHIPMENT CONTROL','SERVICE DIAGRAM','POLICY CIRCULAR'];
   const lines=[['Incoming → checked → retained','Keep the complete thread.','One sentence may omit the context.'],['Order → received → reconciled','Count units, not packaging.','Keep the receiver signature.'],['Report → isolate → inspect','Asset number before diagnosis.','A service promise is not a repair.'],['Original → amendment → approval','Retain the superseded issue.','Authority requires a dated signature.']];
   heading(titles[wing]);text(marks[wing],43,137,25);
   lines[wing].forEach((line,n)=>text(line,43,195+n*43,24));
   footer('DEPARTMENT LANDMARK / Historic procedures retained.');
  }else if(i===6){
   heading('CORRESPONDENCE / PLEASE RETAIN');
   const notes=[['The missing file','has been moved','to a safer','missing location.'],['PLEASE DO NOT','FILE THIS','NOTICE.','— Records'],['If found, return','my pen. It is','not an archive','accession. —Tess']];
   notes.forEach((lines,n)=>{c.save();c.translate(49+n*229,121+n%2*13);c.rotate((n-1)*.026);c.fillStyle='#6e6b52';c.fillRect(4,5,210,185);c.fillStyle=['#d3c6a4','#c8c9ac','#c7bda1'][n];c.fillRect(0,0,210,185);c.fillStyle='#865347';c.beginPath();c.arc(106,10,5,0,Math.PI*2);c.fill();lines.forEach((line,k)=>{c.font='19px Georgia, serif';c.fillStyle=ink;c.fillText(line,14,44+k*33);});c.restore();});footer('Pinned by hand. Removed by nobody.');
  }else{
   heading('MEETING TO REDUCE MEETINGS');
   text('POSTPONED',43,154,42,ochre);text('The meeting room is unavailable.',43,203,27);text('A further meeting will establish why.',43,246,25);text('Minutes will be filed under "Hours".',43,303,24);footer('No response is required. Three reminders will follow.');
  }
  // Deterministic fading, staple holes and handling stains; never randomise text.
  c.fillStyle='rgba(92,74,43,.08)';c.fillRect(26,ART_HEIGHT-21,ART_WIDTH-52,9);c.fillStyle='#79745c';for(const x of [24,ART_WIDTH-24])for(const y of [24,ART_HEIGHT-24]){c.beginPath();c.arc(x,y,1.5,0,Math.PI*2);c.fill();}c.restore();
 }
}
