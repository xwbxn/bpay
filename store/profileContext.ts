
import { LoginResponse, User } from 'matrix-js-sdk'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'
import { encode as base64_encode } from 'base-64';
import { authenticate, deleteUser, getProfile, register } from '../service/wordpress';
import { useMatrixClient } from './useMatrixClient';

export interface IProfile {
    id: number,
    matrixId: string,
    name: string,
    avatar: string,
    roles: string[],
    authenticated?: boolean,
    token?: string,
    matrixAuth?: LoginResponse,
    membership_level?: { id: string, name: string, enddate: string },
    disableNotify?: boolean
}
export interface IProfileState {
    profile: Partial<IProfile>,
    hasHydrated: boolean
    login: (username: string, password: string, code: string) => Promise<void>,
    loginWithToken: (token: string) => Promise<void>,
    register: (data: { username: string, email: string, password: string, agreement: boolean, code: string }) => Promise<void>,
    logout: () => Promise<void>,
    deleteProfile: (data: { vcode: string }) => Promise<{ result: boolean, message: string }>,
    setHasHydrated: (state: boolean) => void,
    setProfile: (state: Partial<IProfile>) => void
    refreshProfile: () => void
}

export const useProfile = create<IProfileState>()(
    devtools(
        persist((set, get) => ({
            profile: {
                id: 0,
                name: '',
                matrixId: '',
                avatar: '',
                roles: [],
                disableNotify: false
            },
            hasHydrated: false,
            login: async (username: string, password: string, code: string) => {
                await AsyncStorage.removeItem("TOKEN")
                const token = `Basic ${base64_encode(`${username}:${password}`)}`
                const { client, setStore } = useMatrixClient()
                const loginRes = await authenticate({ username, password, code })
                if (!loginRes.result) {
                    throw new Error(loginRes.message);
                }
                console.log('loginRes.message', loginRes.message)
                const bpayUser = loginRes.message
                await AsyncStorage.setItem("TOKEN", token)
                const matrixAuth = await client.loginWithPassword(`@${username.toLowerCase()}:chat.b-pay.life`, loginRes.message.matrix_password)
                const chatProfile = await client.getProfileInfo(matrixAuth.user_id)
                const profile: IProfile = {
                    id: bpayUser.ID,
                    matrixId: matrixAuth.user_id,
                    name: chatProfile.displayname,
                    avatar: chatProfile.avatar_url,
                    roles: bpayUser.roles,
                    authenticated: true,
                    token,
                    matrixAuth: matrixAuth,
                    membership_level: bpayUser.membership_level
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
            async register({ username, password, email, code, agreement }) {
                await AsyncStorage.removeItem("TOKEN")
                const token = `Basic ${base64_encode(`${username}:${password}`)}`
                const regUser = await register({ username, password, email, code, agreement })
                if (!regUser.result) {
                    throw new Error(regUser.message);
                }
                const { client, setStore } = useMatrixClient()
                await AsyncStorage.setItem("TOKEN", token)
                const matrixAuth = await client.loginWithPassword(`@${username}:chat.b-pay.life`, regUser.message.matrix_password)
                const chatProfile = await client.getProfileInfo(matrixAuth.user_id)
                const profile: IProfile = {
                    id: regUser.ID,
                    matrixId: matrixAuth.user_id,
                    name: chatProfile.displayname,
                    avatar: chatProfile.avatar_url,
                    roles: regUser.roles,
                    authenticated: true,
                    token,
                    matrixAuth: matrixAuth
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
            deleteProfile: async ({ vcode }) => {
                const { client } = useMatrixClient()
                client.stopClient()
                const res = await deleteUser({ vcode })
                set(({ profile }) => ({
                    profile: {
                        ...profile,
                        authenticated: false,
                        matrixAuth: undefined,
                        roles: []
                    },
                    hasHydrated: false
                }))
                return res
            },
            setProfile: (state) => set(({ profile }) => ({ profile: { ...profile, ...state } })),
            refreshProfile: () => {
                getProfile().then(res => {
                    if (res.result) {
                        set(({ profile }) => ({ profile: { ...profile, roles: res.message.roles, membership_level: res.message.membership_level } }))
                    }
                })
            },
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