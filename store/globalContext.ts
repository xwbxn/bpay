import { Room } from 'matrix-js-sdk'
import { create } from 'zustand'

export interface IGlobalState {
    loading: boolean
    categories: any[],
    setCategories: (state: any) => void
    setLoading: (state: any) => void
}

export const useGlobalState = create<IGlobalState>((set) => ({
    loading: false,
    categories: [],
    setCategories: (val) => set(() => ({ categories: val })),
    setLoading: (val) => set(() => ({ loading: val })),
}))

export interface IProfile {
    id: number,
    name: string,
    avatar: string,
    authenticated?: boolean,
}
export interface IProfileState {
    profile: IProfile
    setProfile: (IProfile) => void
}

export const useProfile = create<IProfileState>((set) => ({
    profile: {
        id: 0,
        name: '',
        avatar: '',
        authenticated: false
    },
    setProfile: (val) => set(() => ({ profile: val })),
}))