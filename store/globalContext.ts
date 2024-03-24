import { Room } from 'matrix-js-sdk'
import { create } from 'zustand'

export interface IGlobalState {
    ready: boolean
    loading: false
    categories: any[],
    setCategories: (state: any) => void
    setLoading: (state: any) => void
    loadingErrorFn: () => void
    room: Room
    setRoom: (state: any) => void
}

export const useGlobalState = create<IGlobalState>((set) => ({
    ready: false,
    loading: false,
    categories: [],
    loadingErrorFn: null,
    setCategories: (val) => set(() => ({ categories: val })),
    setLoading: (val) => set(() => ({ loading: val })),
    room: null,
    setRoom: (val) => set(() => ({ room: val }))
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