import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

// 환경변수에서 API 키 가져오기
const getGeminiKey = () => process.env.GEMINI_API_KEY || '';

interface TripData {
    destination: {
        name: string;
        province: string;
        slogan: string;
        highlights: string[];
    };
    duration: number;
    attractions: { title: string; addr1: string }[];
    restaurants: { placeName: string; categoryName: string; addressName: string }[];
}

export async function POST(request: NextRequest) {
    const geminiKey = getGeminiKey();

    if (!geminiKey) {
        return NextResponse.json(
            {
                error: 'Gemini API 키가 설정되지 않았습니다.',
                guide: {
                    title: '🔑 Gemini API 키 발급 방법',
                    steps: [
                        '1. aistudio.google.com 접속',
                        '2. Google 계정으로 로그인',
                        '3. 좌측 메뉴에서 "Get API key" 클릭',
                        '4. "Create API key" 클릭',
                        '5. 생성된 API 키 복사',
                        '6. .env.local 파일에 GEMINI_API_KEY=키값 추가'
                    ],
                    url: 'https://aistudio.google.com/app/apikey'
                }
            },
            { status: 400 }
        );
    }

    try {
        const tripData: TripData = await request.json();

        const { destination, duration, attractions, restaurants } = tripData;

        // AI 프롬프트 구성
        const prompt = `당신은 국내 여행 전문가입니다. 아래 정보를 바탕으로 상세한 여행 계획서를 작성해주세요.

## 여행 정보
- 여행지: ${destination.name} (${destination.province})
- 슬로건: ${destination.slogan}
- 특징: ${destination.highlights.join(', ')}
- 여행 기간: ${duration === 1 ? '당일치기' : `${duration - 1}박 ${duration}일`}

## 선택한 관광지 (${attractions.length}곳)
${attractions.map((a, i) => `${i + 1}. ${a.title} - ${a.addr1}`).join('\n')}

## 선택한 맛집 (${restaurants.length}곳)
${restaurants.map((r, i) => `${i + 1}. ${r.placeName} (${r.categoryName}) - ${r.addressName}`).join('\n')}

## 작성 요청
위 정보를 기반으로 ${duration}일간의 상세 여행 일정을 작성해주세요.

### 형식 요구사항:
1. **일차별 제목**: "### 1일차: [테마 제목]" 형식으로 작성
2. **타임라인**: 각 일정은 시간대별로 작성
   - 🕘 시간: **10:00 ~ 11:30** 형식으로 체류 시간 또는 활동 시간을 범위로 명시 (볼드체)
   - 📍 장소: **[장소명]** 형식
   - 🚗 이동: **11:30 이동**: [이동 수단] (약 00분 소요) 형식으로 출발 시간 명시
   - 🍚 식사: 식당 이름 및 메뉴 추천
   - 💡 팁: 유용한 팁은 별도 항목으로 작성
3. **가독성**: 긴 줄글보다는 불렛 포인트(- )를 활용하여 간결하게 작성
4. **스타일**:
   - 구분선(---, ***)은 사용하지 마세요.
   - 각 장소나 활동 사이에 빈 줄을 넣어 여백 확보
   - 중요 키워드는 **볼드체**로 강조
5. 한국어로 작성
6. Markdown 형식으로 작성

**작성 예시:**

### 1일차: 강릉의 바다와 커피 즐기기

- 🕘 **10:00 ~ 11:30** 📍 **[강문해변]**
  - 바다가 보이는 포토존에서 사진 촬영
  - 해변 산책로 걷기
  - 💡 팁: 아침 햇살이 좋을 때 사진이 가장 잘 나옵니다.

- 🚗 **11:30 이동**: 택시 이용 (약 10분 소요)

- 🕘 **11:40 ~ 12:40** 🍚 **[동화가든]**
  - 강릉의 대표 메뉴 짬뽕순두부 식사
  - 💡 팁: 웨이팅이 길 수 있으니 테이블링 앱 활용 추천

(이어서 작성)

일정은 현실적이고 여유로운 계획이 되도록 해주세요.`;

        const response = await fetch(`${GEMINI_API_URL}?key=${geminiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: prompt }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4096,
                }
            }),
        });

        const data = await response.json();

        if (data.error) {
            console.error('Gemini API Error:', data.error);
            return NextResponse.json({
                error: data.error.message || 'AI 일정 생성 중 오류가 발생했습니다',
                success: false
            }, { status: 500 });
        }

        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return NextResponse.json({
            success: true,
            plan: generatedText,
        });

    } catch (error) {
        console.error('Gemini API Error:', error);
        return NextResponse.json(
            { error: 'AI 일정 생성 중 오류가 발생했습니다', details: String(error) },
            { status: 500 }
        );
    }
}
