import {Suspense} from "react";
import type {Metadata} from "next";
import {VerifyLink} from "./verify-link";
import "../recover.css";

export const metadata:Metadata={
 title:"LOVORA — Confirm private report recovery",
 robots:{index:false,follow:false,noarchive:true},
 referrer:"no-referrer",
};
export default function VerifyRecoveryPage(){
 return <Suspense fallback={<main className="recovery"/>}><VerifyLink/></Suspense>;
}
