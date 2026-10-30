import Link from "next/link";
import { signOutAdmin } from "@/app/admin/actions";
import { Watch, Plus, ExternalLink, LogOut, LayoutDashboard } from "lucide-react";

export function AdminShell({children,title,subtitle}:{children:React.ReactNode;title:string;subtitle?:string}){
 return <div className="admin-shell"><aside className="admin-sidebar"><Link className="admin-wordmark" href="/admin">VELMONT<span>MANUFACTURE · ADMIN</span></Link><div className="admin-sidebar-label">Workspace</div><nav className="admin-nav"><Link href="/admin"><LayoutDashboard size={17}/> Overview</Link><Link href="/admin#catalogue"><Watch size={17}/> Watches</Link><Link href="/admin/watches/new" className="admin-nav-add"><Plus size={17}/> Add a watch</Link></nav><div className="admin-sidebar-bottom"><Link href="/" target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/> View website</Link><form action={signOutAdmin}><button type="submit"><LogOut size={15}/> Sign out</button></form></div></aside><div className="admin-main"><header className="admin-page-heading"><div><span className="eyebrow gold">VELMONT · WATCH MANAGEMENT</span><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div></header>{children}</div></div>
}
