import { LoginResponse, User } from 'matrix-js-sdk'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'
import { normalizeUserId } from '../utils';

export interface IGlobalState {
    loading: boolean
    showbottomTabBar: boolean
    categories: any[],
    setCategories: (state: any) => void
    setLoading: (state: boolean) => void
    setShowBottomTabBar: (state: boolean) => void
}

export const useGlobalState = create<IGlobalState>((set) => ({
    loading: false,
    categories: [],
    showbottomTabBar: true,
    setCategories: (val) => set(() => ({ categories: val })),
    setLoading: (val) => set(() => ({ loading: val })),
    setShowBottomTabBar: (showbottomTabBar) => set(() => ({ showbottomTabBar }))
}))

export interface IProfile {
    id: number,
    matrixId: string,
    name: string,
    avatar: string,
    authenticated?: boolean,
    token?: string,
    matrixAuth?: LoginResponse,
}
export interface IProfileState {
    profile: Partial<IProfile>,
    hasHydrated: boolean
    login: (bpayUser: IProfile, token: string, chatAuth: LoginResponse, chatProfile: {
        avatar_url?: string;
        displayname?: string;
    }) => Promise<void>,
    logout: () => Promise<void>,
    setHasHydrated: (state: boolean) => void,
    setProfile: (state: Partial<IProfile>) => void
}

export const useProfile = create<IProfileState>()(
    devtools(
        persist((set, get) => ({
            profile: {
                id: 0,
                name: '',
                matrixId: '',
                avatar: ''
            },
            hasHydrated: false,
            login: async (bpayUser: any, token: string, chatAuth: LoginResponse, chatProfile: {
                avatar_url?: string;
                displayname?: string;
            }) => {
                const profile: IProfile = {
                    id: bpayUser.id,
                    matrixId: chatAuth.user_id,
                    name: chatProfile.displayname,
                    avatar: chatProfile.avatar_url,
                    authenticated: true,
                    token,
                    matrixAuth: chatAuth
                }
                set({ profile })
            },
            logout: async () => {
                set(({ profile }) => ({ profile: { ...profile, authenticated: false, matrixAuth: undefined }, hasHydrated: false }))
            },
            setProfile: (state) => set(({ profile }) => ({ profile: { ...profile, ...state } })),
            setHasHydrated: (state) => {
                set({ hasHydrated: state })
            }
        }),
            {
                name: 'bpay-profile',
                storage: createJSONStorage(() => AsyncStorage),
                onRehydrateStorage: () => (state) => {
                    state.setHasHydrated(true)
                }
            }
        ))
)