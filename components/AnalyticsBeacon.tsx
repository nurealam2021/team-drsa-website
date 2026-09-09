"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
export default function AnalyticsBeacon(){const pathname=usePathname();useEffect(()=>{if(!pathname||pathname.startsWith("/admin"))return;const body=JSON.stringify({path:pathname});if(navigator.sendBeacon){navigator.sendBeacon("/api/analytics",new Blob([body],{type:"application/json"}));return;}fetch("/api/analytics",{method:"POST",headers:{"content-type":"application/json"},body,keepalive:true}).catch(()=>undefined);},[pathname]);return null}
