import { ClientEvent, createClient, IRoomTimelineData, MatrixClient, MatrixEvent, Room, RoomEvent, RoomMember, User } from "matrix-js-sdk";
import { useEffect, useState } from "react";
import { create } from "zustand";

interface IMatrixStore {
    client: MatrixClient
    rooms: Room[]
    setClient: (client: MatrixClient) => void
    setRooms: (rooms: Room[]) => void
    user: User
    setUser: (user: User) => void
    currentRoom: Room
    setCurrentRoom: (room: Room) => void
    messages: any[]
    setMessages: (messages: any[]) => void
}

const matrixClientStore = create<IMatrixStore>(set => ({
    client: null,
    rooms: [],
    setClient: (val) => set(() => ({ client: val })),
    setRooms: (val) => set(() => ({ rooms: val })),
    user: null,
    setUser: (val) => set(() => ({ user: val })),
    currentRoom: null,
    setCurrentRoom: (val) => set(() => ({ currentRoom: val })),
    messages: [],
    setMessages: (val) => set(() => ({ messages: val }))
}))

export const useMatrixClient = () => {
    const { client, setClient, rooms, setRooms, user, setUser, currentRoom, setCurrentRoom } = matrixClientStore()

    const initClient = async () => {
        const client = createClient({
            baseUrl: 'https://chat.b-pay.life',
            useAuthorizationHeader: true,
        })

        client.usingExternalCrypto = true // hack , ignore encrypt
        client.on(ClientEvent.Sync, (state) => {
            switch (state) {
                case 'PREPARED':
                    const rooms = client.getRooms().sort((a, b) => b.getLastLiveEvent().localTimestamp - a.getLastLiveEvent().localTimestamp)
                    setRooms(rooms)
                    const user = client.getUser("@admin:chat.b-pay.life")
                    setUser(user)
                    break;
            }
        })
        // client.on(RoomEvent.Timeline, (event: MatrixEvent, room: Room, toStartOfTimeline: boolean, removed: boolean, data: IRoomTimelineData) => {
        //     if (currentRoom == null) {
        //         return
        //     }
        //     if (currentRoom.roomId != room.roomId) {
        //         return
        //     }
        //     console.log('event', event)
        // })

        await client.loginWithPassword("@admin:chat.b-pay.life", "8675309Abcd!@#")
        await client.startClient
        return client
    }

    useEffect(() => {
        initClient().then(client => {
            setClient(client)
        })
        return () => {
            client.stopClient()
        }
    }, [])

    return {
        client,
        rooms,
        user,
        currentRoom,
        setCurrentRoom
    }
}