import { createContext } from "react";

export interface IProfile {
    id: number,
    name: string,
    avatar: string,
}
export interface IGlobalContext {
    ready: boolean
    categories: any[],
    setCategories: (state: any) => void

    profile: IProfile
    setProfiles: (state: IProfile) => void
}

export const GlobalContext = createContext({ ready: false } as IGlobalContext)
