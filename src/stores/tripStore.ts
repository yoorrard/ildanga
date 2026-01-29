import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    TripStore,
    Region,
    Attraction,
    Restaurant,
    DaySchedule,
    ScheduleItem,
    TransportInfo,
    TripStyle
} from '@/types';

const initialState = {
    destination: null,
    duration: 1,
    startDate: null,
    tripStyle: null,
    selectedAttractions: [],
    selectedRestaurants: [],
    schedule: [],
    transport: null,
};

export const useTripStore = create<TripStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            // 여행지 설정
            setDestination: (region: Region | null) => set({ destination: region }),
            setDuration: (days: number) => set({ duration: Math.max(1, days) }),
            setStartDate: (date: string | null) => set({ startDate: date }),
            setTripStyle: (style: TripStyle | null) => set({ tripStyle: style }),

            // 관광지 관리
            addAttraction: (attraction: Attraction) =>
                set((state) => {
                    const exists = state.selectedAttractions.some(a => a.id === attraction.id);
                    if (exists) return state;
                    return {
                        selectedAttractions: [...state.selectedAttractions, { ...attraction, isSelected: true }]
                    };
                }),

            removeAttraction: (id: string) =>
                set((state) => ({
                    selectedAttractions: state.selectedAttractions.filter(a => a.id !== id)
                })),

            clearAttractions: () => set({ selectedAttractions: [] }),

            // 맛집 관리
            addRestaurant: (restaurant: Restaurant) =>
                set((state) => {
                    const exists = state.selectedRestaurants.some(r => r.id === restaurant.id);
                    if (exists) return state;
                    return {
                        selectedRestaurants: [...state.selectedRestaurants, { ...restaurant, isSelected: true }]
                    };
                }),

            removeRestaurant: (id: string) =>
                set((state) => ({
                    selectedRestaurants: state.selectedRestaurants.filter(r => r.id !== id)
                })),

            clearRestaurants: () => set({ selectedRestaurants: [] }),

            // 일정 관리
            setSchedule: (schedule: DaySchedule[]) => set({ schedule }),

            updateDaySchedule: (day: number, items: ScheduleItem[]) =>
                set((state) => {
                    const newSchedule = [...state.schedule];
                    const dayIndex = newSchedule.findIndex(d => d.day === day);
                    if (dayIndex >= 0) {
                        newSchedule[dayIndex] = { ...newSchedule[dayIndex], items };
                    }
                    return { schedule: newSchedule };
                }),

            // 자동 일정 생성 (간단한 알고리즘)
            generateSchedule: () => {
                const state = get();
                const { duration, selectedAttractions, selectedRestaurants } = state;

                // 일자별 빈 스케줄 생성
                const schedule: DaySchedule[] = [];
                for (let day = 1; day <= duration; day++) {
                    schedule.push({ day, items: [] });
                }

                // 모든 장소를 합치고 일자별로 분배
                const allPlaces: ScheduleItem[] = [
                    ...selectedAttractions.map((a, idx) => ({
                        id: `attraction-${a.id}`,
                        type: 'attraction' as const,
                        name: a.title,
                        address: a.addr1,
                        lat: a.mapy,
                        lng: a.mapx,
                        image: a.firstImage,
                        duration: 90, // 기본 1.5시간
                    })),
                    ...selectedRestaurants.map((r, idx) => ({
                        id: `restaurant-${r.id}`,
                        type: 'restaurant' as const,
                        name: r.placeName,
                        address: r.addressName,
                        lat: r.y,
                        lng: r.x,
                        duration: 60, // 기본 1시간
                    })),
                ];

                // 장소를 일수에 맞게 분배
                const placesPerDay = Math.ceil(allPlaces.length / duration);
                allPlaces.forEach((place, idx) => {
                    const dayIndex = Math.min(Math.floor(idx / placesPerDay), duration - 1);
                    schedule[dayIndex].items.push(place);
                });

                set({ schedule });
            },

            // 교통편 설정
            setTransport: (transport: TransportInfo | null) => set({ transport }),

            // 전체 초기화
            resetTrip: () => set(initialState),
        }),
        {
            name: 'ildanga-trip-storage',
        }
    )
);
