import type {Metadata} from "next";import {redirect} from "next/navigation";import {AdminShell} from "@/components/admin-shell";import {AdminWatchForm} from "@/components/admin-watch-form";import {getAdminSession} from "@/lib/supabase/admin-session";
export const metadata:Metadata={title:"Add a watch | VELMONT Admin"};export const dynamic="force-dynamic";
export default async function NewWatchPage(){if(!await getAdminSession())redirect("/admin/login");return <AdminShell title="Add a watch" subtitle="Create a new timepiece for the VELMONT collection."><AdminWatchForm/></AdminShell>}
