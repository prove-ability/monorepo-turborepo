"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createNews } from "@/actions/newsActions";
import { createStockPrice } from "@/actions/gameActions";
import { getClasses } from "@/actions/classActions";
import { getStocks } from "@/actions/stockActions";

const newsTemplates = [
  { title: "글로벌 반도체 수요 급증", content: "AI 및 데이터센터 확장으로 인해 반도체 수요가 전년 대비 35% 증가했습니다.", sectors: ["반도체", "기술"] },
  { title: "전기차 배터리 기술 혁신", content: "새로운 고체 배터리 기술이 상용화 단계에 진입하면서 전기차 산업에 큰 변화가 예상됩니다.", sectors: ["자동차", "에너지"] },
  { title: "글로벌 금리 인상 단행", content: "주요 중앙은행들이 물가 안정을 위해 기준금리를 0.5%p 인상했습니다.", sectors: ["금융", "부동산"] },
  { title: "바이오 신약 임상 성공", content: "국내 바이오 기업의 항암제 임상 3상이 성공하며 FDA 승인 가능성이 높아졌습니다.", sectors: ["바이오", "제약"] },
  { title: "원유 가격 급등", content: "중동 지역 불안으로 국제 유가가 배럴당 90달러를 돌파했습니다.", sectors: ["에너지", "화학"] },
  { title: "반도체 공급 과잉 우려", content: "메모리 반도체 재고가 증가하면서 가격 하락 압력이 커지고 있습니다.", sectors: ["반도체"] },
  { title: "AI 플랫폼 기업 실적 호조", content: "주요 AI 서비스 기업들이 분기 실적에서 예상을 크게 상회하는 성과를 발표했습니다.", sectors: ["기술", "소프트웨어"] },
  { title: "친환경 정책 강화", content: "정부가 탄소 배출 규제를 강화하면서 친환경 기업들에 대한 투자가 증가하고 있습니다.", sectors: ["환경", "에너지"] },
];

export default function SeedDataPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const seedGameData = async () => {
    setLoading(true);
    setLogs([]);
    
    try {
      addLog("🎮 게임 데이터 시드 시작...");

      // 1. 클래스 가져오기
      const classesResponse = await getClasses();
      
      // ActionState 타입 체크 (인증 실패)
      if (!("data" in classesResponse)) {
        addLog(`❌ 클래스 조회 실패: ${"message" in classesResponse ? classesResponse.message : "알 수 없는 오류"}`);
        return;
      }
      
      const classes = classesResponse.data || [];
      
      if (classes.length === 0) {
        addLog("❌ 클래스가 없습니다. 먼저 클래스를 생성해주세요.");
        return;
      }

      const firstClass = classes[0]!; // length > 0이므로 안전
      addLog(`📚 클래스: ${firstClass.name} (${firstClass.id})`);

      // 2. 주식 가져오기
      const stocks = await getStocks();
      
      if (stocks.length === 0) {
        addLog("❌ 주식이 없습니다. 먼저 주식을 생성해주세요.");
        return;
      }

      addLog(`📈 주식 ${stocks.length}개 발견`);

      // 3. 8일치 데이터 생성
      for (let day = 1; day <= 8; day++) {
        addLog(`\n📅 Day ${day} 데이터 생성 중...`);

        // 각 날짜마다 8개의 뉴스 생성
        const newsItems = [];
        for (let i = 0; i < 8; i++) {
          const template = newsTemplates[i % newsTemplates.length]!;
          
          const relatedStockIds = stocks
            .filter(s => template.sectors.some(sector => s.industrySector.includes(sector)))
            .slice(0, 3)
            .map(s => s.id);

          const newsItem = await createNews({
            classId: firstClass.id,
            day: day,
            title: `[Day ${day}] ${template.title}`,
            content: template.content,
            relatedStockIds: relatedStockIds,
          });

          newsItems.push(newsItem);
          addLog(`  ✅ 뉴스 ${i + 1}: ${template.title}`);
        }

        // 각 주식에 대한 가격 설정
        for (const stock of stocks) {
          const basePrice = 10000;
          const variation = Math.floor(Math.random() * 4000) - 2000;
          const price = basePrice + variation * day;

          await createStockPrice({
            classId: firstClass.id,
            stockId: stock.id,
            day: day,
            price: price.toString(),
          });
        }

        addLog(`  ✅ ${stocks.length}개 주식 가격 설정 완료`);
      }

      addLog("\n✨ 게임 데이터 시드 완료!");
      addLog(`총 ${8 * 8}개의 뉴스와 ${8 * stocks.length}개의 가격 데이터가 생성되었습니다.`);
    } catch (error) {
      addLog(`❌ 에러 발생: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>게임 데이터 시드</CardTitle>
          <CardDescription>
            8일치 게임 데이터를 자동으로 생성합니다 (각 일자별 8개 뉴스 + 주식 가격)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={seedGameData} 
            disabled={loading}
            size="lg"
          >
            {loading ? "생성 중..." : "데이터 생성 시작"}
          </Button>

          {logs.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">실행 로그</h3>
              <div className="space-y-1 font-mono text-sm max-h-96 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="whitespace-pre-wrap">{log}</div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
