import { createContext } from "react";
import { create } from 'zustand'

export interface IGlobalState {
    ready: boolean
    loading: false
    categories: any[],
    setCategories: (state: any) => void
    setLoading: (state: any) => void
}

export const useGlobalState = create<IGlobalState>((set) => ({
    ready: false,
    loading: false,
    categories: [],
    setCategories: (val) => set(() => ({ categories: val })),
    setLoading: (val) => set(() => ({ loading: val }))
}))

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
        name: '',
        avatar: '',
        authenticated: false
    },
    matrixToken: '',
    setProfile: (val) => set(() => ({ profile: val })),
    setMatrixToken: (val) => set(() => ({ matrixToken: val }))
}))