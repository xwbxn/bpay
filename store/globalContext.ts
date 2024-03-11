import { createClient, MatrixClient } from "matrix-js-sdk";
import { createContext } from "react";
import { create } from 'zustand'

export interface IProfile {
    id: number,
    name: string,
    avatar: string,
    authenticated?: boolean
}
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

export const useProfile = create((set) => ({
    profile: {
        id: 0,
        name: '游客',
        avatar: '',
        authenticated: false
    },
    setProfile: (newState) => set(() => ({ profile: newState })),
}))