import { createClient, MatrixClient, Room, User } from "matrix-js-sdk";
import { create } from "zustand";

interface IChatClient {
    chatClient?: MatrixClient
    setChatClient: (val: MatrixClient) => void

    publicRooms: string[],
    setPublicRooms: (val: string[]) => void

    rooms: Room[],
    setRooms: (val: Room[]) => void

    user?: User
    setUser: (val: User) => void

}

export const useChatClient = create<IChatClient>((set) => ({
    chatClient: null,
    setChatClient: (val) => set({ chatClient: val }),

    publicRooms: [],
    setPublicRooms: (val) => set({ publicRooms: val }),

    rooms: [],
    setRooms: (val) => set({ rooms: val }),

    user: null,
    setUser: (val) => set({ user: val })
}))