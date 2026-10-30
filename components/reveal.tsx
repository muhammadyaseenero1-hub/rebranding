"use client";
import { useEffect } from "react";
export function Reveal({children,className=""}:{children:React.ReactNode;className?:string}) { useEffect(()=>{const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("visible");io.unobserve(e.target)}}),{threshold:.13});document.querySelectorAll(".reveal").forEach(el=>io.observe(el));return()=>io.disconnect()},[]);return <div className={`reveal ${className}`}>{children}</div> }
