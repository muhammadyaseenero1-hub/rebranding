"use client";
import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
export function PublicFooter(){const pathname=usePathname();return pathname.startsWith("/admin")?null:<SiteFooter/>}
