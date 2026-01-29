'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTripStore } from '@/stores/tripStore';
import styles from './page.module.css';

export default function ResultPage() {
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const [prompt, setPrompt] = useState('');

    const {
        destination, duration, tripStyle,
        selectedAttractions, selectedRestaurants,
        resetTrip
    } = useTripStore();

    // 프롬프트 생성 로직
    useEffect(() => {
        if (!destination) return;

        const styleLabel = tripStyle ? {
            'RELAXED': '여유롭게 (휴양 위주) 🌿',
            'NORMAL': '적당히 (밸런스형) ⚖️',
            'PACKED': '알차게 (바쁘게) 🏃‍♂️'
        }[tripStyle] : '자유 여행';

        const attractionsList = selectedAttractions.map((a, i) =>
            `${i + 1}. ${a.title} (${a.addr1})`
        ).join('\n');

        const restaurantsList = selectedRestaurants.map((r, i) =>
            `${i + 1}. ${r.placeName} (${r.categoryName}, ${r.addressName})`
        ).join('\n');

        const promptText = `# [${destination.name}] ${duration - 1}박 ${duration}일 여행 계획 요청

## 1. 여행 개요
- **여행지**: ${destination.name} ${destination.slogan ? `("${destination.slogan}")` : ''}
- **여행 기간**: ${duration - 1}박 ${duration}일
- **여행 스타일**: ${styleLabel}

## 2. 선택한 장소
### 🏛️ 관광지 (${selectedAttractions.length}곳)
${attractionsList || '(선택한 관광지 없음)'}

### 🍽️ 맛집 (${selectedRestaurants.length}곳)
${restaurantsList || '(선택한 맛집 없음)'}

## 3. 요청 사항
위 정보를 바탕으로 다음 내용을 포함한 여행 계획 문서(Markdown)와 프레젠테이션(PPT) 구성안을 생성해주세요.

1. **상세 여행 일정표 (Markdown Table)**
   - 시간대별 최적의 동선 (이동 시간 포함)
   - 각 장소에서의 예상 체류 시간 및 활동 내용
   - 식사 시간 배분 (맛집 동선 고려)

2. **일자별 상세 가이드**
   - 각 장소 방문 시 유용한 꿀팁
   - 사진 찍기 좋은 포인트
   - 추천 메뉴 및 예산 (대략적)

3. **프레젠테이션 페이지 구성안**
   - 슬라이드 1: 표지 (제목, 기간, 컨셉)
   - 슬라이드 2: 여행 코스 요약 (지도 동선)
   - 슬라이드 3~N: 일차별 상세 일정 및 사진
   - 마지막 슬라이드: 예산 및 준비물 체크리스트

여행 스타일(${styleLabel})에 맞춰서, 너무 빡빡하지 않고 즐길 수 있는 현실적인 일정으로 제안해서 작성해주세요.`;

        setPrompt(promptText);
    }, [destination, duration, tripStyle, selectedAttractions, selectedRestaurants]);

    // 복사 핸들러
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy!', err);
        }
    };

    // 새 여행 시작
    const handleNewTrip = () => {
        resetTrip();
        router.push('/');
    };

    if (!destination) {
        return (
            <div className={styles.emptyState}>
                <h2>여행 일정이 없습니다</h2>
                <p>먼저 여행지를 선택하고 일정을 만들어주세요.</p>
                <button onClick={() => router.push('/')}>
                    여행지 선택하기 →
                </button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* 헤더 */}
            <header className={styles.header}>
                <button className={styles.backButton} onClick={() => router.back()}>
                    ← 뒤로
                </button>
                <h1 className={styles.headerTitle}>✨ AI 프롬프트 생성 완료</h1>
                <button className={styles.newButton} onClick={handleNewTrip}>
                    새 여행 🔄
                </button>
            </header>

            {/* 메인 콘텐츠 */}
            <main className={styles.main}>
                <div className={styles.resultArea}>
                    {/* 타이틀 카드 */}
                    <div className={styles.titleCard}>
                        <div className={styles.titleBadge}>최적화 프롬프트</div>
                        <h2 className={styles.destinationName}>{destination.name}</h2>
                        <p className={styles.destinationProvince}>{destination.province}</p>
                        <p className={styles.tripDuration}>
                            {duration - 1}박 {duration}일 • {tripStyle ? {
                                'RELAXED': '여유롭게',
                                'NORMAL': '적당히',
                                'PACKED': '알차게'
                            }[tripStyle] : '자유'} 여행
                        </p>
                    </div>

                    <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
                        아래 프롬프트를 복사하여 ChatGPT나 Gemini에게 붙여넣으세요.<br />
                        완벽한 여행 계획서와 발표 자료를 만들어줍니다!
                    </p>

                    {/* 프롬프트 박스 */}
                    <div className={styles.promptBox}>
                        <button
                            className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
                            onClick={handleCopy}
                        >
                            {copied ? '✅ 복사됨!' : '📋 프롬프트 복사'}
                        </button>
                        <textarea
                            className={styles.promptTextarea}
                            value={prompt}
                            readOnly
                        />
                    </div>

                    {/* AI 서비스 바로가기 버튼 */}
                    <div className={styles.aiLinkButtons}>
                        <a
                            href="https://gemini.google.com/app"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.aiLinkButton}
                        >
                            ✨ Google Gemini 열기
                        </a>
                        <a
                            href="https://chat.openai.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.aiLinkButton}
                        >
                            🤖 ChatGPT 열기
                        </a>
                        <a
                            href="https://claude.ai/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.aiLinkButton}
                        >
                            🧠 Claude 열기
                        </a>
                        <a
                            href="https://genspark.ai/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.aiLinkButton}
                        >
                            ⚡ Genspark 열기
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
}
