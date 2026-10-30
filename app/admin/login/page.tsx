import type {Metadata} from "next";
import {redirect} from "next/navigation";
import {getAdminSession} from "@/lib/supabase/admin-session";
import {isSupabaseConfigured} from "@/lib/supabase/config";
import {AdminLoginForm} from "@/components/admin-login-form";

export const metadata:Metadata={title:"Administrator sign in | VELMONT"};
export const dynamic="force-dynamic";
export default async function AdminLoginPage(){
 if(await getAdminSession())redirect("/admin");
 const configured=isSupabaseConfigured();
 return <section className="admin-login-page"><div className="admin-login-brand"><span className="serif">VELMONT</span><small>GENEVE · SWITZERLAND</small></div><div className="admin-login-card"><span className="eyebrow gold">Private access</span><h1>Administrator<br/>sign in</h1><p>Manage the VELMONT watch collection.</p>{configured?<AdminLoginForm/>:<div className="admin-setup-note"><strong>Supabase configuration required</strong><span>Add <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> to the server environment, then run the setup script in <code>supabase/setup.sql</code>.</span></div>}<a className="admin-back-link" href="/">← Return to VELMONT</a></div><div className="admin-login-foot">AUTHORIZED VELMONT PERSONNEL ONLY</div></section>
}
