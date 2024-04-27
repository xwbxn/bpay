import { LoginResponse, User } from 'matrix-js-sdk'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'
import { encode as base64_encode } from 'base-64';
import { getAuth, getMatrixAuth } from '../service/wordpress';
import { useMatrixClient } from './useMatrixClient';

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
    roles: string[],
    authenticated?: boolean,
    token?: string,
    matrixAuth?: LoginResponse,
}
export interface IProfileState {
    profile: Partial<IProfile>,
    hasHydrated: boolean
    login: (username: string, password: string) => Promise<void>,
    loginWithToken: (token: string) => Promise<void>,
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
                avatar: '',
                roles: []
            },
            hasHydrated: false,
            login: async (username: string, password: string) => {
                console.log('username, password', username, password)
                const token = `Basic ${base64_encode(`${username}:${password}`)}`
                const { client, setStore } = useMatrixClient()
                await AsyncStorage.removeItem('TOKEN')
                const bpayUser = await getAuth(token)
                await AsyncStorage.setItem("TOKEN", token)
                const chatSecret = await getMatrixAuth()
                const chatAuth = await client.loginWithPassword(`@${chatSecret.username}:chat.b-pay.life`, chatSecret.random_password)
                const chatProfile = await client.getProfileInfo(chatAuth.user_id)
                const profile: IProfile = {
                    id: bpayUser.id,
                    matrixId: chatAuth.user_id,
                    name: chatProfile.displayname,
                    avatar: chatProfile.avatar_url,
                    roles: chatSecret.roles,
                    authenticated: true,
                    token,
                    matrixAuth: chatAuth
                }
                set({ profile })
                client.credentials.userId = profile.matrixAuth.user_id
                client.setAccessToken(profile.matrixAuth.access_token)
                setStore(profile.matrixAuth.user_id)
                if (client.clientRunning) {
                    client.stopClient()
                }
                client.startClient({
                    initialSyncLimit: 30
                })
            },
            loginWithToken: async (token: string) => {
                const { client, setStore } = useMatrixClient()
                const { profile } = get()
                client.credentials.userId = profile.matrixAuth.user_id
                client.setAccessToken(profile.matrixAuth.access_token)
                setStore(profile.matrixAuth.user_id)
                if (client.clientRunning) {
                    client.stopClient()
                }
                client.startClient({
                    initialSyncLimit: 30
                })
            },
            logout: async () => {
                const { client } = useMatrixClient()
                client.stopClient()
                set(({ profile }) => ({
                    profile: {
                        ...profile,
                        authenticated: false,
                        matrixAuth: undefined,
                        roles: []
                    },
                    hasHydrated: false
                }))
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