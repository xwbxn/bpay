import { ClientEvent, createClient, MatrixClient, Room, User } from "matrix-js-sdk";
import { useEffect, useState } from "react";
import { create } from "zustand";

interface IMatrixStore {
    client: MatrixClient
    rooms: Room[]
    setClient: (client: MatrixClient) => void
    setRooms: (rooms: Room[]) => void
    user: User
    setUser: (user: User) => void
}

const matrixClientStore = create<IMatrixStore>(set => ({
    client: null,
    rooms: [],
    setClient: (val) => set(() => ({ client: val })),
    setRooms: (val) => set(() => ({ rooms: val })),
    user: null,
    setUser: (val) => set(() => ({ user: val }))
}))

export const useMatrixClient = () => {
    const { client, setClient, rooms, setRooms, user, setUser } = matrixClientStore()

    const init = (client: MatrixClient) => {
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
    }

    useEffect(() => {
        const client = createClient({
            baseUrl: 'https://chat.b-pay.life',
            useAuthorizationHeader: true,
            userId: "@admin:chat.b-pay.life",
            accessToken: "syt_YWRtaW4_QUAdKRdXtXFhHHMNUKWY_3uebAn"
        })
        init(client)
        client.startClient()
        setClient(client)

        return () => {
            client.stopClient()
        }
    }, [])

    return {
        client,
        rooms,
        user
    }
}