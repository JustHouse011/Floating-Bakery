import { useEffect, useRef, useState, type ReactNode } from 'react';
export default function StudioPanel({title,kind,children}:{title:string;kind:'tools'|'summary';children:ReactNode}) {
 const panel=useRef<HTMLDetailsElement>(null),dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const [sheet,setSheet]=useState(false);
 useEffect(()=>{const media=matchMedia('(max-width:760px)');const resize=()=>{if(!media.matches){if(panel.current)panel.current.open=true;dialog.current?.close();setSheet(false);}};media.addEventListener('change',resize);return()=>media.removeEventListener('change',resize);},[]);
 useEffect(()=>{if(sheet)dialog.current?.showModal();},[sheet]);
 return <details ref={panel} className={`studio-panel-drawer ${kind}-drawer`} open><summary>{title}</summary><button ref={trigger} className="studio-sheet-trigger" onClick={()=>setSheet(true)}>Open {title.toLowerCase()} drawer</button>{!sheet&&children}<dialog ref={dialog} className="studio-mobile-sheet" aria-label={`${title} drawer`} onClose={()=>{setSheet(false);trigger.current?.focus();}}><div className="studio-sheet-heading"><h2>{title}</h2><button onClick={()=>dialog.current?.close()}>Close {title.toLowerCase()}</button></div>{sheet&&children}</dialog></details>;
}
