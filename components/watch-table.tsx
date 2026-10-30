"use client";
import {useState,useTransition} from "react";
import Link from "next/link";
import {Pencil,Trash2,LoaderCircle} from "lucide-react";
import type {Watch} from "@/lib/watches";
import {deleteWatch} from "@/app/admin/actions";

export function WatchTable({watches}:{watches:Watch[]}){
 const [pendingId,setPendingId]=useState("");const [error,setError]=useState("");const [pending,startTransition]=useTransition();
 function remove(id:string,name:string){if(!window.confirm(`Delete “${name}” from the VELMONT catalogue? This action cannot be undone.`))return;setError("");setPendingId(id);startTransition(async()=>{const result=await deleteWatch(id);setPendingId("");if(!result.success)setError(result.error);else window.location.reload()})}
 if(!watches.length)return <div className="admin-empty"><span>No watches in the database yet.</span><Link href="/admin/watches/new">Add your first watch →</Link></div>;
 return <><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Timepiece</th><th>Collection</th><th>Price</th><th>Availability</th><th className="admin-actions-heading">Actions</th></tr></thead><tbody>{watches.map(w=><tr key={w.id}><td><div className="admin-watch-cell"><img src={w.image} alt=""/><div><strong>{w.name}</strong><span>{w.referenceNumber}</span></div></div></td><td>{w.collection}</td><td>{w.price}</td><td><span className={`admin-availability ${w.availability?"is-available":"is-unavailable"}`}><i/>{w.availability?"Available":"Unavailable"}</span></td><td><div className="admin-row-actions"><Link href={`/admin/watches/${w.id}/edit`} aria-label={`Edit ${w.name}`}><Pencil size={15}/><span>Edit</span></Link><button type="button" disabled={pending} onClick={()=>w.id&&remove(w.id,w.name)} aria-label={`Delete ${w.name}`}>{pending&&pendingId===w.id?<LoaderCircle className="admin-spinning" size={15}/>:<Trash2 size={15}/>}<span>Delete</span></button></div></td></tr>)}</tbody></table></div>{error&&<p className="admin-error" role="alert">{error}</p>}</>
}
