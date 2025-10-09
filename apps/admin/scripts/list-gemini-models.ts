import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

// ESM에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env.local 파일 로드
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY가 설정되지 않았습니다.");
    console.log("📝 .env.local 파일에 GEMINI_API_KEY를 추가해주세요.");
    process.exit(1);
  }

  console.log("🔍 Gemini API 모델 목록 조회 중...\n");

  try {
    // REST API로 직접 모델 목록 조회
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const models = data.models || [];
    
    console.log("✅ 사용 가능한 Gemini 모델 목록:\n");
    
    for (const model of models) {
      console.log(`📦 모델: ${model.name}`);
      console.log(`   표시 이름: ${model.displayName || "N/A"}`);
      console.log(`   설명: ${model.description || "N/A"}`);
      console.log(`   지원 메서드: ${model.supportedGenerationMethods?.join(", ") || "N/A"}`);
      console.log(`   입력 토큰 제한: ${model.inputTokenLimit || "N/A"}`);
      console.log(`   출력 토큰 제한: ${model.outputTokenLimit || "N/A"}`);
      console.log("");
    }

    // generateContent를 지원하는 모델만 필터링
    const contentModels = models.filter((m: any) => 
      m.supportedGenerationMethods?.includes("generateContent")
    );

    console.log("\n🎯 generateContent를 지원하는 모델:\n");
    contentModels.forEach((m: any) => {
      console.log(`   - ${m.name.replace("models/", "")}`);
    });

  } catch (error) {
    console.error("❌ 모델 목록 조회 실패:", error);
    process.exit(1);
  }
}

listModels();
