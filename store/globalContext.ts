import { create } from 'zustand'

export interface IGlobalState {
    loading: boolean
    showbottomTabBar: boolean
    categories: any[]
    membershipLevels: any
    setCategories: (state: any) => void
    setMembershipLevels: (state: any) => void
    setLoading: (state: boolean) => void
    setShowBottomTabBar: (state: boolean) => void
}

export const useGlobalState = create<IGlobalState>((set) => ({
    loading: false,
    categories: [],
    membershipLevels: [],
    showbottomTabBar: true,
    setCategories: (val) => set(() => ({ categories: val })),
    setMembershipLevels: (val) => set(() => ({ membershipLevels: val })),
    setLoading: (val) => set(() => ({ loading: val })),
    setShowBottomTabBar: (showbottomTabBar) => set(() => ({ showbottomTabBar }))
}))
