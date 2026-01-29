// 여행 스타일 타입
export type TripStyle =
  | 'RELAXED'   // 여유롭게 (휴양 위주)
  | 'NORMAL'    // 적당히 (밸런스형)
  | 'PACKED';   // 알차게 (많은 곳 방문)

// 지역 데이터 타입
export interface Region {
  id: number;
  name: string;
  province: string;
  slogan: string;
  lat: number;
  lng: number;
  thumbnail: string;
  highlights: string[];
}

// 관광지 타입 (TourAPI 응답 기반)
export interface Attraction {
  id: string;
  contentId: string;
  contentTypeId: string;
  title: string;
  addr1: string;
  addr2?: string;
  tel?: string;
  firstImage?: string;
  firstImage2?: string;
  mapx: number;
  mapy: number;
  overview?: string;
  homepage?: string;
  useTime?: string;
  restDate?: string;
  parking?: string;
  isSelected?: boolean;
}

// 맛집 타입 (카카오 로컬 API 기반)
export interface Restaurant {
  id: string;
  placeName: string;
  categoryName: string;
  phone?: string;
  addressName: string;
  roadAddressName?: string;
  x: number;
  y: number;
  placeUrl: string;
  distance?: string;
  isSelected?: boolean;
}

// 일정 아이템 타입
export interface ScheduleItem {
  id: string;
  type: 'attraction' | 'restaurant' | 'transport';
  name: string;
  address: string;
  lat: number;
  lng: number;
  image?: string;
  duration: number; // 체류 시간 (분)
  memo?: string;
}

// 일정 (일자별)
export interface DaySchedule {
  day: number;
  date?: string;
  items: ScheduleItem[];
}

// 교통편 정보
export interface TransportInfo {
  type: 'car' | 'public' | 'walk';
  origin: string;
  destination: string;
  distance?: number; // km
  duration?: number; // 분
  cost?: number; // 원
}

// 전체 여행 상태
export interface TripState {
  // 기본 정보
  destination: Region | null;
  duration: number; // 여행 일수
  startDate: string | null;
  tripStyle: TripStyle | null; // 여행 스타일

  // 선택된 장소들
  selectedAttractions: Attraction[];
  selectedRestaurants: Restaurant[];

  // 일정
  schedule: DaySchedule[];

  // 교통편
  transport: TransportInfo | null;
}

// 스토어 액션
export interface TripActions {
  // 여행지 설정
  setDestination: (region: Region | null) => void;
  setDuration: (days: number) => void;
  setStartDate: (date: string | null) => void;
  setTripStyle: (style: TripStyle | null) => void;

  // 관광지 관리
  addAttraction: (attraction: Attraction) => void;
  removeAttraction: (id: string) => void;
  clearAttractions: () => void;

  // 맛집 관리
  addRestaurant: (restaurant: Restaurant) => void;
  removeRestaurant: (id: string) => void;
  clearRestaurants: () => void;

  // 일정 관리
  setSchedule: (schedule: DaySchedule[]) => void;
  updateDaySchedule: (day: number, items: ScheduleItem[]) => void;
  generateSchedule: () => void;

  // 교통편 설정
  setTransport: (transport: TransportInfo | null) => void;

  // 전체 초기화
  resetTrip: () => void;
}

export type TripStore = TripState & TripActions;
