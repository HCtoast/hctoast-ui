import type { Metadata } from "next";
import { Gowun_Batang } from "next/font/google";
import "./globals.css";

// 제목 폰트(고운바탕).
// DESIGN.md 는 subsets 에 "korean" 을 요구하지만 next/font/google 의 Gowun Batang 타입은
// latin / latin-ext / vietnamese 만 허용한다(별도 korean 서브셋 파일이 없는 폰트).
// Gowun Batang 의 웨이트 파일 자체가 한글 글리프를 포함하므로 "latin" 만으로도 한글이 렌더된다.
const gowunBatang = Gowun_Batang({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-gowun",
});

export const metadata: Metadata = {
  title: "HCToast UI",
  description: "개인 UI 프레임워크 — day / night / night-city / night-lavender",
};

// 하이드레이션 전에 저장된 테마를 적용해 FOUC / 미스매치를 막는다.
const themeInit = `(function(){try{var t=localStorage.getItem("hctoast-theme");if(t==="day"||t==="night"||t==="night-city"||t==="night-lavender"){document.documentElement.dataset.theme=t;}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={gowunBatang.variable} suppressHydrationWarning>
      <body>
        {/* 하이드레이션 전에 저장된 테마를 <html>에 적용 (FOUC/미스매치 방지) */}
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {children}
      </body>
    </html>
  );
}
