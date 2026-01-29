import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "일단가 (Ildanga) - 국내 여행 원스톱 솔루션",
  description: "어디로 갈지 고민된다면, 일단 돌려보세요! 전국 시/군 단위 여행지 추천부터 맛집, 교통편 예약 정보, 그리고 최적 동선이 포함된 여행 계획서 생성까지 한 번에 해결하는 원스톱 여행 플랫폼",
  keywords: ["여행", "국내여행", "여행계획", "여행일정", "여행추천", "랜덤여행", "일단가"],
  authors: [{ name: "Ildanga" }],
  openGraph: {
    title: "일단가 (Ildanga) - 국내 여행 원스톱 솔루션",
    description: "어디로 갈지 고민된다면, 일단 돌려보세요!",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansMedium.woff"
        />
        <style dangerouslySetInnerHTML={{
          __html: `
            @font-face {
              font-family: 'GmarketSansMedium';
              src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansMedium.woff') format('woff');
              font-weight: normal;
              font-style: normal;
            }
            @font-face {
              font-family: 'GmarketSansBold';
              src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansBold.woff') format('woff');
              font-weight: bold;
              font-style: normal;
            }
            @font-face {
              font-family: 'GmarketSansLight';
              src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansLight.woff') format('woff');
              font-weight: 300;
              font-style: normal;
            }
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
