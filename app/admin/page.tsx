import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {Plus,ArrowUpRight,Watch as WatchIcon} from "lucide-react";
import {AdminShell} from "@/components/admin-shell";
import {getAdminSession} from "@/lib/supabase/admin-session";
import {getAdminWatches} from "@/lib/catalog";
import {WatchTable} from "@/components/watch-table";
import type {Watch} from "@/lib/watches";

export const metadata:Metadata={title:"Watch Management | VELMONT Admin"};
export const dynamic="force-dynamic";
export default async function AdminDashboard(){
 const session=await getAdminSession();if(!session)redirect("/admin/login");
 let items:Watch[]=[];let loadError="";
 try{items=await getAdminWatches(session.accessToken)}catch{loadError="The watch database could not be reached. Check the Supabase schema and connection, then refresh."}
 return <AdminShell title="Watch management" subtitle="Manage the timepieces in your VELMONT collection.">
  <div className="admin-metrics"><div><span>Total watches</span><strong>{items.length}</strong><WatchIcon size={17}/></div><div><span>Available</span><strong>{items.filter(item=>item.availability).length}</strong><span className="admin-status-dot"/></div><div><span>Collections</span><strong>{new Set(items.map(item=>item.collection)).size}</strong><span className="admin-metric-label">ACTIVE</span></div></div>
  <section className="admin-panel" id="catalogue"><div className="admin-panel-heading"><div><span className="eyebrow gold">Your catalogue</span><h2>Watches</h2></div><Link className="admin-primary-button" href="/admin/watches/new"><Plus size={16}/> Add a watch</Link></div>
  {loadError?<p className="admin-error admin-table-message" role="alert">{loadError}</p>:<WatchTable watches={items}/>}</section>
  <div className="admin-dashboard-note"><span>Changes appear on the public site as soon as they are saved.</span><Link href="/" target="_blank" rel="noopener noreferrer">Preview VELMONT <ArrowUpRight size={13}/></Link></div>
 </AdminShell>
}
