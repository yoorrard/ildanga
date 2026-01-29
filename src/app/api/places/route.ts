import { NextRequest, NextResponse } from 'next/server';

// 카카오 로컬 API 베이스 URL
const KAKAO_LOCAL_API = 'https://dapi.kakao.com/v2/local';

// 환경변수에서 API 키 가져오기 (서버 사이드)
const getKakaoKey = () => process.env.NEXT_PUBLIC_KAKAO_API_KEY || '';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    // 환경변수에서 키 로드 (서버사이드)
    const kakaoApiKey = getKakaoKey();

    if (!kakaoApiKey) {
        return NextResponse.json(
            {
                error: '카카오 API 키가 설정되지 않았습니다. .env.local 파일에 NEXT_PUBLIC_KAKAO_API_KEY를 설정해주세요.',
                guide: {
                    title: '🔑 카카오 REST API 키 발급 방법',
                    steps: [
                        '1. developers.kakao.com 접속',
                        '2. 카카오 계정으로 로그인',
                        '3. 상단 "앱" 메뉴 클릭',
                        '4. "애플리케이션 추가하기" 클릭',
                        '5. 앱 이름, 회사명 등 입력 후 저장',
                        '6. 생성된 앱 클릭 → "앱 키"에서 REST API 키 복사',
                        '7. .env.local 파일에 NEXT_PUBLIC_KAKAO_API_KEY=키값 추가'
                    ],
                    url: 'https://developers.kakao.com/console/app'
                }
            },
            { status: 400 }
        );
    }

    const headers = {
        Authorization: `KakaoAK ${kakaoApiKey}`,
    };

    try {
        let apiUrl = '';
        const params = new URLSearchParams();

        switch (action) {
            case 'searchKeyword': {
                const query = searchParams.get('query') || '';
                const x = searchParams.get('x') || '';
                const y = searchParams.get('y') || '';
                const radius = searchParams.get('radius') || '5000';
                const page = searchParams.get('page') || '1';
                const size = searchParams.get('size') || '15';
                const sort = searchParams.get('sort') || 'accuracy';

                params.append('query', query);
                if (x && y) {
                    params.append('x', x);
                    params.append('y', y);
                    params.append('radius', radius);
                }
                params.append('page', page);
                params.append('size', size);
                params.append('sort', sort);

                apiUrl = `${KAKAO_LOCAL_API}/search/keyword.json?${params.toString()}`;
                break;
            }

            case 'searchCategory': {
                const categoryGroupCode = searchParams.get('category') || 'FD6';
                const x = searchParams.get('x') || '';
                const y = searchParams.get('y') || '';
                const radius = searchParams.get('radius') || '5000';
                const page = searchParams.get('page') || '1';
                const size = searchParams.get('size') || '15';
                const sort = searchParams.get('sort') || 'distance';

                // 좌표가 없으면 에러 반환
                if (!x || !y) {
                    return NextResponse.json({
                        error: '좌표(x, y)가 필요합니다.',
                        success: false,
                        items: []
                    }, { status: 400 });
                }

                params.append('category_group_code', categoryGroupCode);
                params.append('x', x);
                params.append('y', y);
                params.append('radius', radius);
                params.append('page', page);
                params.append('size', size);
                params.append('sort', sort);

                apiUrl = `${KAKAO_LOCAL_API}/search/category.json?${params.toString()}`;
                break;
            }

            case 'searchAddress': {
                const query = searchParams.get('query') || '';
                params.append('query', query);
                apiUrl = `${KAKAO_LOCAL_API}/search/address.json?${params.toString()}`;
                break;
            }

            case 'coord2Address': {
                const x = searchParams.get('x') || '';
                const y = searchParams.get('y') || '';
                params.append('x', x);
                params.append('y', y);
                apiUrl = `${KAKAO_LOCAL_API}/geo/coord2address.json?${params.toString()}`;
                break;
            }

            default:
                return NextResponse.json(
                    { error: '지원하지 않는 action입니다' },
                    { status: 400 }
                );
        }

        console.log('Kakao API Request URL:', apiUrl);
        console.log('Kakao API Request Headers:', headers);

        const response = await fetch(apiUrl, { headers });
        const data = await response.json();

        // 에러 응답 처리
        if (data.errorType || data.code) {
            console.error('Kakao API Error:', JSON.stringify(data, null, 2));
            return NextResponse.json({
                error: data.message || 'API 호출 중 오류가 발생했습니다',
                details: data,
                success: false,
                items: []
            });
        }

        if (data.documents) {
            return NextResponse.json({
                success: true,
                meta: data.meta,
                items: data.documents.map((doc: Record<string, unknown>) => ({
                    id: doc.id as string,
                    placeName: doc.place_name as string,
                    categoryName: doc.category_name as string,
                    categoryGroupCode: doc.category_group_code as string,
                    categoryGroupName: doc.category_group_name as string,
                    phone: doc.phone as string || '',
                    addressName: doc.address_name as string,
                    roadAddressName: doc.road_address_name as string || '',
                    x: parseFloat(doc.x as string),
                    y: parseFloat(doc.y as string),
                    placeUrl: doc.place_url as string,
                    distance: doc.distance as string || '',
                })),
            });
        }

        return NextResponse.json({
            success: true,
            items: [],
        });

    } catch (error) {
        console.error('Kakao API Error:', error);
        return NextResponse.json(
            { error: 'API 호출 중 오류가 발생했습니다', details: String(error) },
            { status: 500 }
        );
    }
}
