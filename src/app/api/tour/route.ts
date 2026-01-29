import { NextRequest, NextResponse } from 'next/server';

// TourAPI 기본 설정 - KorService2 (버전 2) 사용
const TOUR_API_BASE = 'http://apis.data.go.kr/B551011/KorService2';

// 환경변수에서 API 키 가져오기 (서버 사이드)
const getServiceKey = () => process.env.NEXT_PUBLIC_TOUR_API_KEY || '';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    // 환경변수에서 키 로드 (서버사이드)
    const rawServiceKey = getServiceKey();

    if (!rawServiceKey) {
        return NextResponse.json(
            {
                error: 'TourAPI 키가 설정되지 않았습니다.',
                success: false,
                items: []
            },
            { status: 400 }
        );
    }

    // 서비스 키 URL 인코딩 (공공데이터포털 가이드 준수)
    const serviceKey = encodeURIComponent(rawServiceKey);

    try {
        let apiUrl = '';

        // 기본 파라미터 설정
        const baseParams = `serviceKey=${serviceKey}&MobileOS=ETC&MobileApp=Ildanga&_type=json`;

        switch (action) {
            case 'areaBasedList': {
                const areaCode = searchParams.get('areaCode') || '';
                const sigunguCode = searchParams.get('sigunguCode') || '';
                const contentTypeId = searchParams.get('contentTypeId') || '12';
                const numOfRows = searchParams.get('numOfRows') || '20';
                const pageNo = searchParams.get('pageNo') || '1';

                let params = `${baseParams}&areaCode=${areaCode}&contentTypeId=${contentTypeId}&numOfRows=${numOfRows}&pageNo=${pageNo}&arrange=P`;
                if (sigunguCode) params += `&sigunguCode=${sigunguCode}`;

                apiUrl = `${TOUR_API_BASE}/areaBasedList2?${params}`;
                break;
            }

            case 'locationBasedList': {
                const mapX = searchParams.get('mapX') || '';
                const mapY = searchParams.get('mapY') || '';
                const radius = searchParams.get('radius') || '10000';
                const contentTypeId = searchParams.get('contentTypeId') || '12';
                const numOfRows = searchParams.get('numOfRows') || '30';

                const params = `${baseParams}&mapX=${mapX}&mapY=${mapY}&radius=${radius}&contentTypeId=${contentTypeId}&numOfRows=${numOfRows}&arrange=E`;

                apiUrl = `${TOUR_API_BASE}/locationBasedList2?${params}`;
                break;
            }

            case 'searchKeyword': {
                const keyword = searchParams.get('keyword') || '';
                const contentTypeId = searchParams.get('contentTypeId') || '';
                const numOfRows = searchParams.get('numOfRows') || '20';

                let params = `${baseParams}&keyword=${encodeURIComponent(keyword)}&numOfRows=${numOfRows}`;
                if (contentTypeId) params += `&contentTypeId=${contentTypeId}`;

                apiUrl = `${TOUR_API_BASE}/searchKeyword2?${params}`;
                break;
            }

            case 'detailCommon': {
                const contentId = searchParams.get('contentId') || '';

                const params = `${baseParams}&contentId=${contentId}&defaultYN=Y&firstImageYN=Y&areacodeYN=Y&catcodeYN=Y&addrinfoYN=Y&mapinfoYN=Y&overviewYN=Y`;

                apiUrl = `${TOUR_API_BASE}/detailCommon2?${params}`;
                break;
            }

            case 'areaCode': {
                const areaCode = searchParams.get('areaCode') || '';
                let params = `${baseParams}&numOfRows=100`;
                if (areaCode) params += `&areaCode=${areaCode}`;

                apiUrl = `${TOUR_API_BASE}/areaCode2?${params}`;
                break;
            }

            default:
                return NextResponse.json(
                    { error: '지원하지 않는 action입니다', success: false, items: [] },
                    { status: 400 }
                );
        }

        console.log('TourAPI Request URL:', apiUrl.replace(serviceKey, '***'));

        const response = await fetch(apiUrl);
        const text = await response.text();

        // XML 응답 체크 (오류일 경우 XML로 반환됨)
        if (text.startsWith('<?xml') || text.includes('<OpenAPI_ServiceResponse>') || text.includes('<resultCode>')) {
            console.error('TourAPI returned XML error:', text.substring(0, 500));

            // 에러 코드 추출 시도
            const errorMatch = text.match(/<returnAuthMsg>([^<]+)<\/returnAuthMsg>/);
            const errorMsg = errorMatch ? errorMatch[1] : 'API 인증 오류';

            return NextResponse.json({
                error: `TourAPI 오류: ${errorMsg}`,
                success: false,
                items: []
            });
        }

        // JSON 파싱
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            console.error('JSON parse error:', text.substring(0, 300));
            return NextResponse.json({
                error: 'API 응답 파싱 오류',
                success: false,
                items: []
            });
        }

        // 정상 응답 처리
        if (data.response?.body?.items?.item) {
            const items = Array.isArray(data.response.body.items.item)
                ? data.response.body.items.item
                : [data.response.body.items.item];

            return NextResponse.json({
                success: true,
                totalCount: data.response.body.totalCount,
                items: items.map((item: Record<string, unknown>) => ({
                    id: item.contentid as string,
                    contentId: item.contentid as string,
                    contentTypeId: item.contenttypeid as string,
                    title: item.title as string,
                    addr1: item.addr1 as string || '',
                    addr2: item.addr2 as string || '',
                    tel: item.tel as string || '',
                    firstImage: item.firstimage as string || '',
                    firstImage2: item.firstimage2 as string || '',
                    mapx: parseFloat(item.mapx as string) || 0,
                    mapy: parseFloat(item.mapy as string) || 0,
                    overview: item.overview as string || '',
                })),
            });
        }

        // 빈 결과
        return NextResponse.json({
            success: true,
            totalCount: 0,
            items: [],
        });

    } catch (error) {
        console.error('TourAPI Error:', error);
        return NextResponse.json(
            { error: 'API 호출 중 오류가 발생했습니다', success: false, items: [] },
            { status: 500 }
        );
    }
}
