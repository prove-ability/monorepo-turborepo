"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db, classStockPrices, news } from "@repo/db";
import { withAuth } from "@/lib/safe-action";

interface StockInfo {
  id: string;
  name: string;
  marketCountryCode: string;
  industrySector: string;
}

interface GeneratedGameData {
  days: {
    day: number;
    news: {
      title: string;
      content: string;
      relatedStockIds: string[];
    }[];
    prices: {
      stockId: string;
      price: number;
    }[];
  }[];
}

/**
 * Gemini API를 사용하여 게임 데이터 생성
 */
export const generateGameData = withAuth(
  async (
    user,
    params: {
      classId: string;
      totalDays: number;
      stocks: StockInfo[];
    }
  ): Promise<{ success: boolean; message: string; data?: any }> => {
    try {
      const { classId, totalDays, stocks } = params;

      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
      }

      // Gemini API 클라이언트 초기화
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

      // Gemini 모델 가져오기 (최신 안정 버전)
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // 프롬프트 생성
      const prompt = `
당신은 투자 교육 게임을 위한 데이터를 생성하는 전문가입니다.
아래 주식 정보를 바탕으로 ${totalDays}일간의 현실적인 게임 데이터를 생성해주세요.

**주식 정보:**
${stocks.map((s) => `- ID: ${s.id} | 이름: ${s.name} | 국가: ${s.marketCountryCode} | 산업: ${s.industrySector}`).join("\n")}

**요구사항:**
1. 각 날짜마다 8개의 뉴스를 생성하되, 마지막 날(${totalDays}일)은 뉴스가 없어야 합니다.
2. 각 뉴스는 다음날 주식 가격에 영향을 줘야 합니다.
3. 뉴스는 현실적이고 교육적이어야 하며, 긍정적/부정적 영향을 골고루 포함해야 합니다.
4. 각 뉴스는 1-2개의 관련 주식을 지정해야 합니다.
   - 모든 뉴스는 관련 주식이 반드시 포함되어야 합니다.
   - 모든 뉴스 콘텐츠를 청소년이 뉴스를 보고 투자 학습에 사용되는 뉴스로 적절한 문구를 사용해야 합니다.
   - 모든 뉴스는 존댓말을 사용해야 합니다.
5. 주식 가격은 다음 규칙을 따라주세요:
   - 처음 주식 가격이 실제 가격이랑 비슷하게 해줘
   - 가격 변동폭: -20% ~ +20% 범위 내에서 현실적으로
   - 가격이 최대한 천원 단위로 밑은 없었으면 좋겠어
   - 주식 가격은 첫날을 제외하고 전날 관련 뉴스 영향을 받아야 해
6. 뉴스의 영향력이 다음날 가격에 명확히 반영되어야 합니다.
7. 모든 주식은 매일 가격 정보가 있어야 합니다.

**응답 형식 (JSON):**
{
  "days": [
    {
      "day": 1,
      "news": [
        {
          "title": "뉴스 제목",
          "content": "뉴스 내용 (100-200자)",
          "relatedStockIds": ["위 주식 목록의 정확한 UUID ID 사용"]
        }
      ],
      "prices": [
        {
          "stockId": "위 주식 목록의 정확한 UUID ID 사용",
          "price": 가격숫자
        }
      ]
    }
  ]
}

**중요:** 
- 반드시 위에 명시된 정확한 UUID ID를 stockId와 relatedStockIds에 사용하세요.
- 주식 이름이나 심볼이 아닌, ID 필드의 UUID를 사용해야 합니다.
- 반드시 유효한 JSON 형식으로만 응답하고, 다른 텍스트는 포함하지 마세요.
`;

      // Gemini API 호출
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // JSON 파싱
      let gameData: GeneratedGameData;
      try {
        // JSON 블록에서 추출
        const jsonMatch =
          text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
        gameData = JSON.parse(jsonText);
      } catch (error) {
        console.error("JSON 파싱 실패:", text, error);
        throw new Error("생성된 데이터를 파싱하는데 실패했습니다.");
      }

      // 데이터 검증
      if (!gameData.days || !Array.isArray(gameData.days)) {
        throw new Error("올바른 게임 데이터 형식이 아닙니다.");
      }

      if (gameData.days.length !== totalDays) {
        throw new Error(`${totalDays}일치 데이터가 생성되지 않았습니다.`);
      }

      // 주식 ID 목록 생성 (검증용)
      const validStockIds = new Set(stocks.map((s) => s.id));

      // stockId 검증
      for (const dayData of gameData.days) {
        if (dayData.prices) {
          for (const priceItem of dayData.prices) {
            if (!validStockIds.has(priceItem.stockId)) {
              throw new Error(
                `잘못된 주식 ID: ${priceItem.stockId}. 유효한 ID를 사용해주세요.`
              );
            }
          }
        }
        if (dayData.news) {
          for (const newsItem of dayData.news) {
            if (newsItem.relatedStockIds) {
              for (const stockId of newsItem.relatedStockIds) {
                if (!validStockIds.has(stockId)) {
                  throw new Error(
                    `뉴스의 잘못된 주식 ID: ${stockId}. 유효한 ID를 사용해주세요.`
                  );
                }
              }
            }
          }
        }
      }

      // 마지막 날 뉴스 체크
      const lastDay = gameData.days[totalDays - 1];
      if (lastDay && lastDay.news && lastDay.news.length > 0) {
        lastDay.news = []; // 마지막 날은 뉴스 제거
      }

      // DB에 저장
      for (const dayData of gameData.days) {
        // 뉴스 저장 (마지막 날 제외)
        if (dayData.news && dayData.news.length > 0) {
          for (const newsItem of dayData.news) {
            await db.insert(news).values({
              classId,
              day: dayData.day,
              title: newsItem.title,
              content: newsItem.content,
              relatedStockIds: newsItem.relatedStockIds,
              createdBy: user.id,
              updatedAt: new Date(),
            });
          }
        }

        // 가격 정보 저장
        for (const priceItem of dayData.prices) {
          await db.insert(classStockPrices).values({
            classId,
            stockId: priceItem.stockId,
            day: dayData.day,
            price: priceItem.price.toString(),
            updatedAt: new Date(),
          });
        }
      }

      return {
        success: true,
        message: "게임 데이터가 성공적으로 생성되었습니다.",
        data: gameData,
      };
    } catch (error) {
      console.error("게임 데이터 생성 실패:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "게임 데이터 생성 중 오류가 발생했습니다.",
      };
    }
  }
);
