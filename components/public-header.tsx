"use client";
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
export function PublicHeader({watches}:{watches:{name:string;slug:string}[]}){const pathname=usePathname();return pathname.startsWith("/admin")?null:<SiteHeader watches={watches}/>}
