'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import regions from '@/data/regions.json';
import type { Region } from '@/types';
import { useTripStore } from '@/stores/tripStore';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();
  const setDestination = useTripStore((state) => state.setDestination);
  const resetTrip = useTripStore((state) => state.resetTrip);

  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);

  // 지역 리스트 타입 캐스팅
  const regionList = regions as Region[];

  // 검색 필터링
  const filteredRegions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return regionList.filter(
      region =>
        region.name.toLowerCase().includes(query) ||
        region.province.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [searchQuery, regionList]);

  // 랜덤 추천
  const handleSpin = useCallback(() => {
    if (isSpinning) return;

    setIsSpinning(true);
    setSelectedRegion(null);

    // 랜덤 회전 각도 (최소 5바퀴 + 랜덤)
    const randomAngle = 1800 + Math.random() * 720;
    setSpinAngle(prev => prev + randomAngle);

    // 랜덤 지역 선택
    const randomIndex = Math.floor(Math.random() * regionList.length);
    const randomRegion = regionList[randomIndex];

    // 애니메이션 후 결과 표시
    setTimeout(() => {
      setSelectedRegion(randomRegion);
      setIsSpinning(false);
    }, 3000);
  }, [isSpinning, regionList]);

  // 지역 선택 핸들러
  const handleSelectRegion = useCallback((region: Region) => {
    resetTrip();
    setDestination(region);
    router.push(`/plan/${region.id}`);
  }, [resetTrip, setDestination, router]);

  // 검색 결과 선택
  const handleSearchSelect = useCallback((region: Region) => {
    setSearchQuery(region.name);
    setShowSuggestions(false);
    setSelectedRegion(region);
  }, []);

  return (
    <div className={styles.container}>
      {/* 히어로 섹션 */}
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            <span className={styles.titleHighlight}>일단가</span>
            <span className={styles.titleSub}>Ildanga</span>
          </h1>
          <p className={styles.subtitle}>
            어디로 갈지 고민된다면, 일단 돌려보세요!<br />
            전국 어디든, 당신만의 여행 계획을 만들어드려요.
          </p>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className={styles.main}>
        {/* 검색 섹션 */}
        <section className={styles.searchSection}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="가고 싶은 도시를 검색하세요"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className={styles.searchInput}
            />
            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
            </svg>

            {/* 검색 자동완성 */}
            {showSuggestions && filteredRegions.length > 0 && (
              <ul className={styles.suggestions}>
                {filteredRegions.map((region) => (
                  <li
                    key={region.id}
                    onClick={() => handleSearchSelect(region)}
                    className={styles.suggestionItem}
                  >
                    <span className={styles.suggestionName}>{region.name}</span>
                    <span className={styles.suggestionProvince}>{region.province}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* 룰렛 섹션 */}
        <section className={styles.rouletteSection}>
          <div className={styles.rouletteWrapper}>
            <div
              className={`${styles.roulette} ${isSpinning ? styles.spinning : ''}`}
              style={{ transform: `rotate(${spinAngle}deg)` }}
            >
              <div className={styles.rouletteInner}>
              </div>
              {/* 룰렛 장식 */}
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className={styles.rouletteSegment}
                  style={{ transform: `rotate(${i * 30}deg)` }}
                />
              ))}
            </div>
            <div className={styles.roulettePointer}>▼</div>
          </div>

          <button
            className={`${styles.spinButton} ${isSpinning ? styles.disabled : ''}`}
            onClick={handleSpin}
            disabled={isSpinning}
          >
            {isSpinning ? '돌아가는 중...' : '🎲 일단 돌려!'}
          </button>
        </section>

        {/* 결과 표시 */}
        {selectedRegion && !isSpinning && (
          <section className={styles.resultSection}>
            <div className={styles.resultCard}>
              <div className={styles.resultBadge}>🎯 추천 여행지</div>
              <h2 className={styles.resultName}>{selectedRegion.name}</h2>
              <p className={styles.resultProvince}>{selectedRegion.province}</p>
              <p className={styles.resultSlogan}>"{selectedRegion.slogan}"</p>

              <div className={styles.resultHighlights}>
                {selectedRegion.highlights.map((highlight, idx) => (
                  <span key={idx} className={styles.highlightTag}>
                    {highlight}
                  </span>
                ))}
              </div>

              <button
                className={styles.startButton}
                onClick={() => handleSelectRegion(selectedRegion)}
              >
                이 곳으로 여행 계획 세우기 →
              </button>
            </div>
          </section>
        )}

        {/* 인기 여행지 그리드 */}
        <section className={styles.popularSection}>
          <h2 className={styles.sectionTitle}>🔥 인기 여행지</h2>
          <div className={styles.regionsGrid}>
            {regionList.slice(0, 8).map((region) => (
              <div
                key={region.id}
                className={styles.regionCard}
                onClick={() => handleSelectRegion(region)}
              >
                <div className={styles.regionCardContent}>
                  <div className={styles.regionCardHeader}>
                    <span className={styles.regionCardProvince}>{region.province}</span>
                    <h3 className={styles.regionCardName}>{region.name}</h3>
                  </div>
                  <p className={styles.regionCardSlogan}>{region.slogan}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className={styles.footer}>
        <p>© 2026 일단가(Ildanga). 국내 여행 원스톱 솔루션.</p>
      </footer>
    </div>
  );
}
