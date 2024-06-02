import { create } from 'zustand'

interface CartItem {
    id: string,
    name: string,
    price: number,
    quantity: number,
    image?: string
}

export interface ICartState {
    items: CartItem[]
    setCartItem: (items: CartItem[]) => void
    getTotal: () => number
}

export const useCart = create<ICartState>((set, get) => ({
    items: [],
    setCartItem: (items: CartItem[]) => set(() => ({ items })),
    getTotal: () => {
        let total = 0
        get().items.forEach(item => {
            total += item.price * item.quantity
        })
        return total
    }
}))
