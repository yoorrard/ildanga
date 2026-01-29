'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import regions from '@/data/regions.json';
import type { Region, Attraction, Restaurant, TripStyle } from '@/types';
import { useTripStore } from '@/stores/tripStore';
import styles from './page.module.css';

type Step = 'info' | 'attractions' | 'restaurants';

const STEPS: Step[] = ['info', 'attractions', 'restaurants'];
const STEP_LABELS: Record<Step, string> = {
    info: '1. 여행 설정',
    attractions: '2. 관광지 선택',
    restaurants: '3. 맛집 선택',
};

// 미리 정의된 기간 옵션
const DURATION_OPTIONS = [
    { days: 1, label: '당일치기' },
    { days: 2, label: '1박 2일' },
    { days: 3, label: '2박 3일' },
    { days: 4, label: '3박 4일' },
    { days: 5, label: '4박 5일' },
    { days: 0, label: '직접 입력' },
];

// 여행 스타일 옵션 (성향 중심)
const TRIP_STYLES: { value: TripStyle; label: string; icon: string; desc: string }[] = [
    { value: 'RELAXED', label: '여유롭게', icon: '☕', desc: '카페, 산책, 휴식 위주의 힐링 여행' },
    { value: 'NORMAL', label: '적당히', icon: '⚖️', desc: '관광과 휴식의 균형을 맞춘 정석 여행' },
    { value: 'PACKED', label: '알차게', icon: '🏃‍♂️', desc: '최대한 많은 곳을 다니는 부지런한 여행' },
];

export default function PlanPage() {
    const params = useParams();
    const router = useRouter();
    const regionId = parseInt(params.regionId as string);

    // 스토어 상태
    const {
        destination, setDestination, duration, setDuration,
        tripStyle, setTripStyle,
        selectedAttractions, addAttraction, removeAttraction,
        selectedRestaurants, addRestaurant, removeRestaurant,
        // generateSchedule // 이제 결과 페이지에서 처리하므로 여기서 호출 안 함
    } = useTripStore();

    // 로컬 상태
    const [currentStep, setCurrentStep] = useState<Step>('info');
    const [attractions, setAttractions] = useState<Attraction[]>([]);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 페이지네이션 & 필터 상태
    const [restaurantPage, setRestaurantPage] = useState(1);
    const [hasMoreRestaurants, setHasMoreRestaurants] = useState(true);

    // 커스텀 기간 입력
    const [selectedOption, setSelectedOption] = useState<number>(2); // 기본값 1박 2일
    const [customDays, setCustomDays] = useState<string>('');

    // 지역 데이터 로드
    const region = (regions as Region[]).find(r => r.id === regionId);

    useEffect(() => {
        if (region && (!destination || destination.id !== region.id)) {
            setDestination(region);
        }
    }, [region, destination, setDestination]);

    // 지역이 없으면 홈으로
    useEffect(() => {
        if (!region) {
            router.push('/');
        }
    }, [region, router]);

    // 기간 옵션 변경 핸들러
    const handleDurationChange = (days: number) => {
        setSelectedOption(days);
        if (days > 0) {
            setDuration(days);
            setCustomDays('');
        }
    };

    // 커스텀 기간 입력 핸들러 (최대 30일 제한 해제)
    const handleCustomDaysChange = (value: string) => {
        setCustomDays(value);
        const parsed = parseInt(value);
        if (parsed > 0) {
            setDuration(parsed);
        }
    };

    // 관광지 로드 (초기 100개 로드)
    const loadAttractions = useCallback(async () => {
        if (!region) return;

        setLoading(true);
        setError(null);

        try {
            // numOfRows를 100으로 늘려 최대한 많이 가져옴
            const response = await fetch(
                `/api/tour?action=locationBasedList&mapX=${region.lng}&mapY=${region.lat}&radius=20000&numOfRows=100`
            );
            const data = await response.json();

            if (data.error) {
                console.error('Tour API Error:', data.error);
                setError('관광지 정보를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.');
                return;
            }

            setAttractions(data.items || []);
        } catch (err) {
            setError('관광지 정보를 불러오는데 실패했습니다. 네트워크 연결을 확인해주세요.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [region]);

    // 맛집 로드 (페이징 지원, 기본 인기순)
    const loadRestaurants = useCallback(async (page: number, isLoadMore: boolean = false) => {
        if (!region) return;

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                action: 'searchKeyword',
                query: `${region.name} 맛집`,
                size: '15', // 한 번에 15개씩
                page: String(page),
                sort: 'accuracy' // 정확도순 (인기도 반영)
            });

            const response = await fetch(`/api/places?${params.toString()}`);
            const data = await response.json();

            if (data.error) {
                console.error('Kakao API Error:', data.error);
                setError(`맛집 정보를 불러오는데 실패했습니다: ${data.error}`);
                return;
            }

            const newItems = data.items || [];

            if (newItems.length < 15) {
                setHasMoreRestaurants(false);
            } else {
                setHasMoreRestaurants(true);
            }

            if (isLoadMore) {
                setRestaurants(prev => [...prev, ...newItems]);
            } else {
                setRestaurants(newItems);
            }

        } catch (err) {
            setError('맛집 정보를 불러오는데 실패했습니다. 네트워크 연결을 확인해주세요.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [region]);

    // 단계 변경시 데이터 로드 초기화
    useEffect(() => {
        if (currentStep === 'attractions' && attractions.length === 0) {
            loadAttractions();
        } else if (currentStep === 'restaurants' && restaurants.length === 0) {
            // 처음 진입 시 1페이지 로드
            setRestaurantPage(1);
            loadRestaurants(1);
        }
    }, [currentStep, loadAttractions, loadRestaurants, attractions.length, restaurants.length]);

    // 맛집 더 보기
    const handleLoadMoreRestaurants = () => {
        const nextPage = restaurantPage + 1;
        setRestaurantPage(nextPage);
        loadRestaurants(nextPage, true);
    };

    // 지도 링크 열기
    const openMapLink = (e: React.MouseEvent, url: string) => {
        e.stopPropagation(); // 카드 선택 이벤트 방지
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            alert('지도를 열 수 있는 링크가 없습니다.');
        }
    };

    // 선택 토글
    const toggleAttraction = (attraction: Attraction) => {
        const isSelected = selectedAttractions.some(a => a.id === attraction.id);
        if (isSelected) {
            removeAttraction(attraction.id);
        } else {
            addAttraction(attraction);
        }
    };

    const toggleRestaurant = (restaurant: Restaurant) => {
        const isSelected = selectedRestaurants.some(r => r.id === restaurant.id);
        if (isSelected) {
            removeRestaurant(restaurant.id);
        } else {
            addRestaurant(restaurant);
        }
    };

    // 현재 스텝 인덱스
    const currentIndex = STEPS.indexOf(currentStep);

    // 다음 단계로
    const handleNext = () => {
        if (currentIndex < STEPS.length - 1) {
            setCurrentStep(STEPS[currentIndex + 1]);
        } else {
            // 마지막 단계에서는 결과 페이지로 이동 (일정 생성 API는 결과 페이지에서 처리하지 않음)
            router.push('/result');
        }
    };

    // 이전 단계로
    const handleBack = () => {
        if (currentIndex > 0) {
            setCurrentStep(STEPS[currentIndex - 1]);
        }
    };

    if (!region) return null;

    return (
        <div className={styles.container}>
            {/* 헤더 */}
            <header className={styles.header}>
                <button className={styles.backButton} onClick={() => router.push('/')}>
                    ← 처음으로
                </button>
                <div className={styles.headerInfo}>
                    <h1 className={styles.headerTitle}>{region.name}</h1>
                    <p className={styles.headerProvince}>{region.province}</p>
                </div>
                <div style={{ width: '80px' }} />
            </header>

            {/* 진행 바 */}
            <div className={styles.progressContainer}>
                {STEPS.map((step, index) => {
                    const isActive = currentStep === step;
                    const isCompleted = currentIndex > index;
                    return (
                        <div
                            key={step}
                            className={`${styles.progressStep} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}
                        >
                            <div className={styles.progressDot}>
                                {isCompleted ? '✓' : index + 1}
                            </div>
                            <span className={styles.progressLabel}>
                                {STEP_LABELS[step]}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* 메인 컨텐츠 */}
            <main className={styles.main}>
                {/* Step 1: 기본 정보 (기간 + 스타일) */}
                {currentStep === 'info' && (
                    <section className={styles.stepSection}>
                        <h2 className={styles.stepTitle}>📅 여행 기간을 정해주세요</h2>
                        <div className={styles.durationSelector}>
                            {DURATION_OPTIONS.map(opt => (
                                <button
                                    key={opt.days}
                                    className={`${styles.durationButton} ${selectedOption === opt.days ? styles.selected : ''}`}
                                    onClick={() => handleDurationChange(opt.days)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* 커스텀 기간 입력 (최대 제한 없음) */}
                        {selectedOption === 0 && (
                            <div className={styles.customDuration}>
                                <label>여행 일수를 입력하세요</label>
                                <div className={styles.customInputRow}>
                                    <input
                                        type="number"
                                        min="1"
                                        value={customDays}
                                        onChange={(e) => handleCustomDaysChange(e.target.value)}
                                        placeholder="예: 7"
                                        className={styles.customInput}
                                    />
                                    <span>일</span>
                                </div>
                                {customDays && parseInt(customDays) > 1 && (
                                    <p className={styles.customNote}>
                                        {parseInt(customDays) - 1}박 {customDays}일 여행
                                    </p>
                                )}
                            </div>
                        )}

                        <div style={{ height: '40px' }} />

                        <h2 className={styles.stepTitle}>🎨 여행 스타일은 어떠신가요?</h2>
                        <div className={styles.styleGrid}>
                            {TRIP_STYLES.map((style) => (
                                <div
                                    key={style.value}
                                    className={`${styles.styleCard} ${tripStyle === style.value ? styles.selected : ''}`}
                                    onClick={() => setTripStyle(style.value)}
                                >
                                    <div className={styles.styleIcon}>{style.icon}</div>
                                    <div className={styles.styleLabel}>{style.label}</div>
                                    <div className={styles.styleDesc}>{style.desc}</div>
                                </div>
                            ))}
                        </div>

                        <div className={styles.infoCard} style={{ marginTop: '40px' }}>
                            <h3>{region.name} 여행 팁 💡</h3>
                            <p>&quot;{region.slogan}&quot;</p>
                            <div className={styles.highlights}>
                                {region.highlights.map((h, i) => (
                                    <span key={i} className={styles.highlightBadge}>{h}</span>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Step 2: 관광지 선택 */}
                {currentStep === 'attractions' && (
                    <section className={styles.stepSection}>
                        <h2 className={styles.stepTitle}>🏛️ 가볼만한 곳을 선택하세요</h2>

                        {loading && attractions.length === 0 && <div className={styles.loading}>🔍 관광지 정보를 불러오는 중...</div>}
                        {error && <div className={styles.error}>⚠️ {error}</div>}

                        <div className={styles.selectedCount}>
                            선택된 장소: <strong>{selectedAttractions.length}</strong>개
                        </div>

                        <div className={styles.placeGrid}>
                            {attractions.map((attraction) => {
                                const isSelected = selectedAttractions.some(a => a.id === attraction.id);
                                return (
                                    <div
                                        key={attraction.id}
                                        className={`${styles.placeCard} ${isSelected ? styles.selected : ''}`}
                                        onClick={() => toggleAttraction(attraction)}
                                    >
                                        <div className={styles.placeImage}>
                                            {attraction.firstImage ? (
                                                <img src={attraction.firstImage} alt={attraction.title} />
                                            ) : (
                                                <div className={styles.placePlaceholder}>🏛️</div>
                                            )}
                                            {/* 카카오맵 링크 버튼 (상세 정보 검색) */}
                                            <button
                                                className={styles.mapLinkButton}
                                                onClick={(e) => {
                                                    // TourAPI는 PlaceUrl이 없으므로 카카오맵 검색 결과 페이지로 유도
                                                    const mapUrl = `https://map.kakao.com/link/search/${encodeURIComponent(attraction.title)}`;
                                                    openMapLink(e, mapUrl);
                                                }}
                                                title="카카오맵 상세/검색 확인"
                                            >
                                                🔗
                                            </button>
                                            <button className={styles.selectButton}>
                                                {isSelected ? '✓' : '+'}
                                            </button>
                                        </div>
                                        <div className={styles.placeInfo}>
                                            <h3>{attraction.title}</h3>
                                            <p>{attraction.addr1}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {!loading && attractions.length === 0 && !error && (
                            <div className={styles.empty}>
                                이 지역의 관광지 정보가 없습니다.
                            </div>
                        )}
                    </section>
                )}

                {/* Step 3: 맛집 선택 */}
                {currentStep === 'restaurants' && (
                    <section className={styles.stepSection}>
                        <h2 className={styles.stepTitle}>🍽️ 맛집을 선택하세요</h2>

                        <div className={styles.selectedCount}>
                            선택된 맛집: <strong>{selectedRestaurants.length}</strong>개
                        </div>

                        {loading && restaurants.length === 0 && <div className={styles.loading}>🔍 맛집 정보를 불러오는 중...</div>}
                        {error && <div className={styles.error}>⚠️ {error}</div>}

                        <div className={styles.placeGrid}>
                            {restaurants.map((restaurant) => {
                                const isSelected = selectedRestaurants.some(r => r.id === restaurant.id);
                                return (
                                    <div
                                        key={restaurant.id}
                                        className={`${styles.placeCard} ${isSelected ? styles.selected : ''}`}
                                        onClick={() => toggleRestaurant(restaurant)}
                                    >
                                        <div className={styles.placeImage}>
                                            <div className={styles.placePlaceholder}>🍽️</div>
                                            <button
                                                className={styles.mapLinkButton}
                                                onClick={(e) => openMapLink(e, restaurant.placeUrl)}
                                                title="카카오맵에서 보기"
                                            >
                                                🔗
                                            </button>
                                            <button className={styles.selectButton}>
                                                {isSelected ? '✓' : '+'}
                                            </button>
                                        </div>
                                        <div className={styles.placeInfo}>
                                            <h3>{restaurant.placeName}</h3>
                                            <p>{restaurant.categoryName}</p>
                                            <p className={styles.address}>{restaurant.addressName}</p>
                                            {restaurant.phone && <p className={styles.phone}>📞 {restaurant.phone}</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {loading && restaurants.length > 0 && (
                            <div className={styles.loadingMore}>
                                데이터 불러오는 중...
                            </div>
                        )}

                        {!loading && hasMoreRestaurants && (
                            <button className={styles.loadMoreButton} onClick={handleLoadMoreRestaurants}>
                                👇 더 보기 ({restaurants.length}개 +)
                            </button>
                        )}

                        {!loading && restaurants.length === 0 && !error && (
                            <div className={styles.empty}>
                                이 지역의 맛집 정보가 없습니다.
                            </div>
                        )}
                    </section>
                )}
            </main>

            {/* 하단 네비게이션 */}
            <footer className={styles.footer}>
                {currentStep !== 'info' && (
                    <button className={styles.prevButton} onClick={handleBack}>
                        ← 이전
                    </button>
                )}
                <div className={styles.footerSpacer} />
                <button
                    className={styles.nextButton}
                    onClick={handleNext}
                    disabled={currentStep === 'info' && (selectedOption === 0 && (!customDays || parseInt(customDays) < 1))}
                >
                    {currentStep === 'restaurants' ? '🤖 AI 프롬프트 생성하기' : '다음 →'}
                </button>
            </footer>
        </div>
    );
}
