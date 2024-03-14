import { createContext } from "react";
import { create } from 'zustand'

export interface IGlobalContext {
    ready: boolean
    categories: any[],
    setCategories: (state: any) => void
}

export interface IGlobalState {
    ready: boolean
    categories: any[],
}

export const GlobalContext = createContext({ ready: false } as IGlobalContext)

export interface IProfile {
    id: number,
    name: string,
    avatar: string,
    authenticated?: boolean,
}
export interface IProfileState {
    profile: IProfile
    matrixToken: string
    setProfile: (IProfile) => void
    setMatrixToken: (string) => void
}

export const useProfile = create<IProfileState>((set) => ({
    profile: {
        id: 0,
        name: '@admin:chat.b-pay.life',
        avatar: '',
        authenticated: false
    },
    matrixToken: 'syt_YWRtaW4_SLkLkArycjLQUYONdjQm_0QtLrZ',
    setProfile: (val) => set(() => ({ profile: val })),
    setMatrixToken: (val) => set(() => ({ matrixToken: val }))
}))