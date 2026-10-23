"use client";
import {createContext,useContext,type ReactNode} from "react";
import {GLOBAL_PRICE,type RegionalPrice} from "@/lib/pricing";

const Context=createContext<RegionalPrice>(GLOBAL_PRICE);
export function PricingProvider({quote,children}:{quote:RegionalPrice;children:ReactNode}){
 return <Context.Provider value={quote}>{children}</Context.Provider>;
}
export function useRegionalPrice(){return useContext(Context);}
