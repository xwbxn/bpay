import { ClientEvent, createClient, EventType, MatrixClient, Room, SyncState, User } from "matrix-js-sdk";
import { create } from "zustand";

interface IMatrixStore {
    client: MatrixClient
    setClient: (client: MatrixClient) => void

    rooms: Room[]
    setRooms: (rooms: Room[]) => void

    user: User
    setUser: (user: User) => void

    unReadCount: number
    setUnreadCount: (num: number) => void
}

const matrixClientStore = create<IMatrixStore>(set => ({
    client: null,
    setClient: (val) => set(() => ({ client: val })),

    rooms: [],
    setRooms: (rooms) => set((state) => {
        let unreadCount = 0
        rooms.forEach(r => {
            const roomUnreadCount = r.getUnreadNotificationCount()
            if (roomUnreadCount > 0) {
                unreadCount += roomUnreadCount
            }
        })
        state.setUnreadCount(unreadCount)
        return { rooms: rooms }
    }),

    user: null,
    setUser: (val) => set(() => ({ user: val })),

    unReadCount: 0,
    setUnreadCount(val) {
        set(() => ({ unReadCount: val }))
    }
}))

export const useMatrixClient = () => {
    const { client, setClient, rooms, setRooms, user, setUser, unReadCount } = matrixClientStore()

    const login = (user: string, password: string) => {
        if (client !== null) {
            console.warn("不能重复登录")
            return
        }

        const _client = createClient({
            baseUrl: 'https://chat.b-pay.life',
            useAuthorizationHeader: true,
            userId: user,
            accessToken: 'syt_YWRtaW4_SLkLkArycjLQUYONdjQm_0QtLrZ'
        })
        _client.usingExternalCrypto = true // hack , ignore encrypt
        setClient(_client)

        _client.on(ClientEvent.Sync, (state) => {
            switch (state) {
                case SyncState.Prepared:
                    setRooms(_client.getRooms())
                    const user = _client.getUser("@admin:chat.b-pay.life")
                    setUser(user)
                    break;
            }
        })

        _client.on(ClientEvent.Event, (evt) => {
            // console.log('evt', evt.event.room_id, evt.event.type, evt.event.content, evt.event.membership)
            switch (evt.event.type) {
                case EventType.RoomMember:
                case EventType.RoomMessage:
                case EventType.Receipt:
                    // console.log('sync', 'refesh room list')
                    setRooms(_client.getRooms())
                    break
            }
        })

        _client.on(ClientEvent.AccountData, (evt) => {
            console.log('accountdata', evt.event.type, evt.event.content)
        })

        _client.startClient({ initialSyncLimit: 5 })
        // AsyncStorage.getItem("CHAT_ACCESS_TOKEN").then(token => {
        //     console.log('login with token: ', 'syt_YWRtaW4_SLkLkArycjLQUYONdjQm_0QtLrZ')
        //     return _client.loginWithToken('syt_YWRtaW4_SLkLkArycjLQUYONdjQm_0QtLrZ')
        // }).then((res) => {
        //     console.log('login with token success')
        //     _client.startClient()
        //     setClient(_client)
        // }).catch(res => {
        //     console.log('login with token failed', res)
        //     console.log('login with password')
        //     return _client.loginWithPassword(user, password)
        // }).then((res: any) => {
        //     console.log('login with password success')
        //     _client.startClient()
        //     setClient(_client)
        //     AsyncStorage.setItem("CHAT_ACCESS_TOKEN", res.access_token)
        //     console.log('set token', res.access_token)
        // }).catch((res) => {
        //     console.log('login with password failed:', res)
        // })
    }

    return {
        client,
        user,
        rooms,
        login,
        unReadCount
    }
}