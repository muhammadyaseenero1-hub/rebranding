"use client";
import { useActionState } from "react";
import { signInAdmin } from "@/app/admin/actions";
import { LockKeyhole, ArrowRight } from "lucide-react";

export function AdminLoginForm(){
 const [state,action,pending]=useActionState(signInAdmin,{error:""});
 return <form className="admin-login-form" action={action}>
  <label>Email address<input name="email" type="email" autoComplete="username" required placeholder="admin@velmont.com"/></label>
  <label>Password<input name="password" type="password" autoComplete="current-password" required placeholder="Your password"/></label>
  {state.error&&<p className="admin-error" role="alert">{state.error}</p>}
  <button className="admin-primary-button" type="submit" disabled={pending}><LockKeyhole size={16}/>{pending?"Verifying access":"Sign in securely"}<ArrowRight size={15}/></button>
 </form>
}
