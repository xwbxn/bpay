import { createContext } from "react";

export interface IGlobalContext {
    ready: boolean
    categories: any[],
    setCategories: (state: any) => void
}

export const GlobalContext = createContext({ready: false} as IGlobalContext)
  