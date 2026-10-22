/**
 * A historic wall-clock birth time must map to exactly one UTC instant.
 * DST spring gaps have no instant, and autumn repeats have two. Neither can
 * safely be silently shifted or guessed for a paid astrological report.
 */
export function resolveBirthUTC(date:string,time:string,zone:string):Date {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new Error("INVALID_BIRTH_TIME");
 const [year,month,day]=date.split("-").map(Number);
 const [hour,minute]=time.split(":").map(Number);
 const wall=Date.UTC(year,month-1,day,hour,minute);
 const check=new Date(wall);
 if(check.getUTCFullYear()!==year||check.getUTCMonth()+1!==month||check.getUTCDate()!==day)throw new Error("INVALID_BIRTH_TIME");
 let formatter:Intl.DateTimeFormat;
 try{
  formatter=new Intl.DateTimeFormat("en-GB",{
   timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",
   hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23",
  });
 }catch{throw new Error("UNSUPPORTED_BIRTH_TIMEZONE");}
 const parts=(instant:number)=>{
  const values=Object.fromEntries(formatter.formatToParts(new Date(instant)).map(p=>[p.type,p.value]));
  return [Number(values.year),Number(values.month),Number(values.day),Number(values.hour),Number(values.minute),Number(values.second)];
 };
 const offset=(instant:number)=>{
  const p=parts(instant);
  return Date.UTC(p[0],p[1]-1,p[2],p[3],p[4],p[5])-Math.floor(instant/1000)*1000;
 };
 // Sampling before and after the birth moment captures both DST sides and
 // unusual half-hour timezone transitions without assuming a current offset.
 const offsets=new Set<number>();
 for(let hours=-36;hours<=36;hours+=6)offsets.add(offset(wall+hours*3600000));
 const matching=new Set<number>();
 for(const minutesOffset of offsets){
  const candidate=wall-minutesOffset;
  const p=parts(candidate);
  if(p[0]===year&&p[1]===month&&p[2]===day&&p[3]===hour&&p[4]===minute)matching.add(candidate);
 }
 if(matching.size!==1)throw new Error("AMBIGUOUS_BIRTH_TIME");
 return new Date([...matching][0]);
}
