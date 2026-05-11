import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { QuickCheckInput, QuickCheckResult } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  message: string;
  history: ChatMessage[];
  input: QuickCheckInput;
  result: QuickCheckResult;
}

function buildSystemPrompt(input: QuickCheckInput, result: QuickCheckResult): string {
  const priceMultiplier = (input.estimatedSellingPricePerWah / input.acquisitionPricePerWah).toFixed(1);
  return `You are LANDOS AI, an expert assistant for Thai land development feasibility analysis. You are helping the user understand and explore a specific project.

PROJECT DATA:
- Name: ${input.projectName}
- Location: ${input.location}
- Land Size: ${result.totalLandSizeWah.toLocaleString()} wah² (${input.landSizeRai} rai ${input.landSizeWah} wah²)
- Zoning: ${input.zoning}
- Road Access: ${input.roadAccess}
- Road Deduction: ${input.roadDeductionPercent}%
- Sellable Area: ${result.sellableAreaWah.toFixed(0)} wah²
- Plots: ${input.plotCount} plots (avg ${(result.sellableAreaWah / input.plotCount).toFixed(1)} wah²/plot)

FINANCIAL METRICS:
- Acquisition Price: ฿${input.acquisitionPricePerWah.toLocaleString()}/wah²
- Market Selling Price: ฿${input.estimatedSellingPricePerWah.toLocaleString()}/wah²
- Price Multiplier: ${priceMultiplier}×
- Development Type: ${input.developmentType} (${(input.developmentCostRatio * 100).toFixed(0)}% of land cost)
- Land Cost: ฿${result.acquisitionCostTotal.toLocaleString()}
- Transfer Fee: ฿${result.acquisitionTransferFee.toLocaleString()}
- Infrastructure Cost: ฿${result.infrastructureCostTotal.toLocaleString()}
- Operating Cost: ฿${result.operatingCost.toLocaleString()}
- Total Project Cost: ฿${result.totalProjectCost.toLocaleString()}
- Estimated Revenue: ฿${result.estimatedRevenue.toLocaleString()}
- Gross Profit: ฿${result.grossProfit.toLocaleString()}
- Gross Margin: ${result.grossProfitMargin.toFixed(1)}%
- ROI: ${result.roi.toFixed(1)}%
- LANDOS Score: ${result.landosScore.toFixed(1)}/10
- Recommendation: ${result.recommendation}

GUIDELINES:
- Answer questions about this specific project using the numbers above.
- When asked "what if" questions, calculate the impact clearly and show the new outcome.
- Be concise (2–4 sentences for simple questions, structured bullet points for complex analysis).
- Always reference the actual project numbers, not generic advice.
- If asked something outside this project's scope, briefly answer but redirect to the project data.
- Use ฿ for Thai Baht. Format large numbers with commas.`;
}

function buildConversationPrompt(
  systemPrompt: string,
  history: ChatMessage[],
  message: string
): string {
  let prompt = systemPrompt + "\n\n";
  for (const msg of history.slice(-8)) {
    prompt += msg.role === "user" ? `USER: ${msg.content}\n` : `ASSISTANT: ${msg.content}\n`;
  }
  prompt += `USER: ${message}\nASSISTANT:`;
  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ChatRequestBody;
    const { message, history, input, result } = body;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const systemPrompt = buildSystemPrompt(input, result);
    const prompt = buildConversationPrompt(systemPrompt, history, message);

    const response = await model.generateContent(prompt);
    const text = response.response.text().trim();

    return NextResponse.json({ response: text });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Chat route error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
