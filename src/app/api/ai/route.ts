import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateExecutiveSummary, generateRiskNote } from "@/lib/calculations";
import type { QuickCheckInput, QuickCheckResult } from "@/lib/types";

interface AIRequestBody {
  input: QuickCheckInput;
  result: QuickCheckResult;
}

function buildPrompt(input: QuickCheckInput, result: QuickCheckResult): string {
  return `You are a professional Thai land development analyst writing investor-grade feasibility reports.
Analyze this land acquisition project and provide exactly two sections.

PROJECT DATA:
- Name: ${input.projectName}
- Location: ${input.location}
- Land Size: ${result.totalLandSizeWah.toLocaleString()} wah² (${input.landSizeRai} rai ${input.landSizeWah} wah²)
- Acquisition Price: ${input.acquisitionPricePerWah.toLocaleString()} THB/wah²
- Market Selling Price: ${input.estimatedSellingPricePerWah.toLocaleString()} THB/wah²
- Price Multiplier: ${(input.estimatedSellingPricePerWah / input.acquisitionPricePerWah).toFixed(1)}×
- Development Type: ${input.developmentType} (${(input.developmentCostRatio * 100).toFixed(0)}% of land cost)
- Plot Count: ${input.plotCount} plots
- Zoning: ${input.zoning}
- Road Access: ${input.roadAccess}
- Road Deduction: ${input.roadDeductionPercent}%
- Sellable Area: ${result.sellableAreaWah.toLocaleString()} wah²
- Total Project Cost: ${result.totalProjectCost.toLocaleString()} THB
- Revenue Estimate: ${result.estimatedRevenue.toLocaleString()} THB
- Gross Profit: ${result.grossProfit.toLocaleString()} THB
- Gross Profit Margin: ${result.grossProfitMargin.toFixed(1)}%
- ROI: ${result.roi.toFixed(1)}%
- LANDOS Score: ${result.landosScore.toFixed(1)}/10
- Recommendation: ${result.recommendation}

Respond in EXACTLY this format with no other text before or after:
EXECUTIVE_SUMMARY: [2-3 sentences, professional investment tone, reference the specific numbers above, suitable for an investor memo]
RISK_NOTE: [1-2 sentences, identify the most significant specific risk factors based on the numbers, actionable language]`;
}

function parseAIResponse(text: string): { executiveSummary: string; riskNote: string } {
  const execMatch = text.match(/EXECUTIVE_SUMMARY:\s*([\s\S]+?)(?=RISK_NOTE:|$)/);
  const riskMatch = text.match(/RISK_NOTE:\s*([\s\S]+?)$/);
  return {
    executiveSummary: execMatch?.[1]?.trim() ?? "",
    riskNote: riskMatch?.[1]?.trim() ?? "",
  };
}

export async function POST(request: NextRequest) {
  let input: QuickCheckInput | undefined;
  let result: QuickCheckResult | undefined;

  try {
    const body = await request.json() as AIRequestBody;
    input = body.input;
    result = body.result;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const response = await model.generateContent(buildPrompt(input, result));
    const text = response.response.text();
    const parsed = parseAIResponse(text);

    if (!parsed.executiveSummary || !parsed.riskNote) {
      throw new Error("Incomplete AI response");
    }

    return NextResponse.json({
      executiveSummary: parsed.executiveSummary,
      riskNote: parsed.riskNote,
    });
  } catch (error) {
    console.error("AI route error:", error);

    if (input && result) {
      const acqRatio = input.estimatedSellingPricePerWah / input.acquisitionPricePerWah;
      return NextResponse.json({
        executiveSummary: generateExecutiveSummary(
          result.roi,
          result.grossProfitMargin,
          acqRatio,
          input.roadDeductionPercent,
          result.landosScore
        ),
        riskNote: generateRiskNote(
          result.grossProfitMargin,
          input.roadDeductionPercent,
          result.roi,
          input.developmentCostRatio
        ),
      });
    }

    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
