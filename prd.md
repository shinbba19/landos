```text id="landos-prd-ai-report-final"
==================================================
LANDOS — PRODUCT DIRECTION UPDATE
==================================================

IMPORTANT PRODUCT POSITIONING:

LANDOS is NOT a generic dashboard application.

LANDOS must be positioned and designed as:

"Land Development Intelligence and Investor Reporting System"

The core experience of LANDOS is:
- investor-ready reports
- executive feasibility sheets
- subdivision intelligence sheets
- acquisition analysis presentation
- land storytelling

The dashboard exists mainly to:
- generate reports
- manage projects
- run calculations
- compare scenarios

The FINAL OUTPUT is the most important part of the system.

==================================================
CORE PRODUCT PHILOSOPHY
==================================================

LANDOS transforms:
- raw land information
- zoning data
- subdivision plans
- financial assumptions

into:
- executive-level feasibility intelligence
- investor-oriented reports
- acquisition decision support

==================================================
VISUAL DIRECTION
==================================================

LANDOS must visually feel like:
- CBRE investment memo
- land acquisition report
- subdivision feasibility sheet
- executive project summary
- premium developer presentation

NOT:
- generic SaaS dashboard
- spreadsheet software
- accounting system

==================================================
REPORT-FIRST UX
==================================================

LANDOS should adopt:
"Report-First User Experience"

Meaning:
- users input data
- system analyzes feasibility
- system generates presentation-ready reports

The reports are the PRIMARY product output.

==================================================
PRIMARY SYSTEM OUTPUTS
==================================================

6 tabs are currently built. 1 is planned.

1. INVESTOR SUMMARY (Summary tab) — BUILT
   Executive one-page overview: hero metrics, LANDOS score,
   acquisition intelligence, subdivision overview, AI insights.

2. FEASIBILITY REPORT — BUILT
   Full financial feasibility with simple and advanced
   infrastructure cost modes. Live financial summary that
   updates as the user adjusts assumptions.

3. SUBDIVISION ANALYSIS — BUILT
   Three-scenario comparison (compact / balanced / spacious),
   efficiency table, allocation bar, per-scenario financial output.

4. DETAIL SHEET — BUILT
   Land proportion breakdown, acquisition cost table, per-plot
   table (equal-plot model), financial summary. Development type
   dropdown lets user switch cost ratio without leaving the tab.

5. DETAIL SHEET 2 — COST BREAKDOWN — BUILT
   Same structure as Detail Sheet, but Section 2 is replaced by
   an editable infrastructure line-item table. User can adjust
   quantities; unit prices are fixed. All totals auto-calculate.

6. SENSITIVITY ANALYSIS — BUILT
   5×5 ROI matrix (selling price vs acquisition price),
   development cost comparison table across all three types,
   break-even selling price and maximum acquisition price cards.

7. SALES KIT / PRESENTATION SHEET — PLANNED (not yet built)
   Investor PDF, social presentation, executive briefing sheet.

==================================================
WORKFLOW SYSTEM
==================================================

--------------------------------------------------
STEP 1 — PROJECT CREATION & QUICK CHECK
--------------------------------------------------

Purpose:
Fast land screening and preliminary acquisition analysis.

User inputs:
- land size (rai + wah²)
- acquisition price per wah²
- zoning
- road access
- road deduction %
- estimated selling price per wah²
- development type
- plot count

Outputs:
- estimated ROI
- LANDOS score
- recommendation
- full project stored in localStorage

--------------------------------------------------
STEP 2 — INVESTOR SUMMARY
--------------------------------------------------

Purpose:
Generate visually readable investment intelligence.

Layout includes:
- branded report header
- hero stats bar (ROI, gross margin, revenue, total cost)
- Return Summary + LANDOS Score card
- Acquisition Intelligence + Subdivision Overview
- Road Access Observation
- AI Insights (Executive Summary + Risk Analysis)
- Revenue Estimate banner

Design priority:
- readability
- premium appearance
- investor communication

--------------------------------------------------
STEP 3 — EXECUTIVE FEASIBILITY SHEET
--------------------------------------------------

Purpose:
Generate detailed development intelligence with live adjustments.

Includes:
- total development cost breakdown
- infrastructure cost (simple ratio mode or advanced line-item mode)
- revenue estimation
- profit projection
- gross margin and ROI
- live financial summary that updates on input change

--------------------------------------------------
STEP 4 — SUBDIVISION ANALYSIS
--------------------------------------------------

Purpose:
Analyze land subdivision strategy.

Includes:
- three scenario comparison (compact / balanced / spacious)
- road deduction impact
- sellable area per scenario
- average plot size per scenario
- efficiency metrics
- per-scenario financial output

--------------------------------------------------
STEP 5 — SENSITIVITY ANALYSIS
--------------------------------------------------

Purpose:
Quantify how financial outcomes shift with market changes.

Includes:
- 5×5 ROI matrix: selling price ±20% vs acquisition price ±20%
- color-coded cells (green ≥30%, gold ≥20%, yellow ≥10%, red <10%)
- base case highlighted with gold ring
- development cost comparison table for all three types
- break-even selling price per wah²
- maximum supportable acquisition price

--------------------------------------------------
STEP 6 — SALES KIT (PLANNED)
--------------------------------------------------

Purpose:
Generate presentation-ready materials for investors and partners.

Planned outputs:
- investor PDF
- social presentation
- sales presentation
- executive briefing sheet

==================================================
DEVELOPMENT COST MODEL
==================================================

LANDOS uses a ratio-based development cost model.

Infrastructure cost is calculated as:
  infrastructureCostTotal = acquisitionCostTotal × developmentCostRatio

Three development types:
- Land Subdivision (การจัดสรรที่ดิน): 10% of land cost
- Standard Housing (โครงการบ้านมาตรฐาน): 25% of land cost
- Premium Project (โครงการพรีเมียม): 35% of land cost

The user selects the development type during project creation.
The type (and thus ratio) can also be changed in Detail Sheet
and Detail Sheet 2 without returning to the input form.

In Detail Sheet 2, the user can further break the ratio-derived
total into individual infrastructure line items by editing
quantities. Unit prices per item are fixed system constants.

==================================================
VALIDATION ENGINE
==================================================

LANDOS validates inputs before report generation and flags
suspicious or inconsistent assumptions.

Reality checks include:
- selling price below acquisition price (flagged as a loss scenario)
- road deduction above 40% (unusually high deduction warning)
- plot count inconsistent with land size (average plot too small)
- ROI below 0% (project is loss-making at stated assumptions)

Warnings are shown inline before the user proceeds to reports.
The goal is to prevent garbage-in / garbage-out feasibility sheets
from being presented to investors.

==================================================
REALITY-FIRST SYSTEM
==================================================

LANDOS must prioritize:
- real land images
- real zoning maps
- real subdivision plans
- real calculations
- transparent assumptions

LANDOS must NOT:
- generate fake renderings
- fabricate land conditions
- hallucinate development visuals

==================================================
REPORT LAYOUT REQUIREMENTS
==================================================

Reports should contain:

--------------------------------------------------
TOP SECTION
--------------------------------------------------

- LANDOS branding
- hero image
- project name
- location
- land size
- zoning summary
- road access image

--------------------------------------------------
MIDDLE SECTION
--------------------------------------------------

- ROI summary
- development cost
- revenue estimate
- acquisition score
- market estimate
- key takeaways

--------------------------------------------------
BOTTOM SECTION
--------------------------------------------------

- legal observations
- infrastructure assumptions
- subdivision insight
- AI strategic recommendation
- LANDOS score

==================================================
AI-ASSISTED INTELLIGENCE LAYER
==================================================

LANDOS integrates AI as an assistive intelligence layer embedded within executive feasibility reports.

AI is used ONLY for:
- strategic interpretation
- summarization
- recommendation
- risk explanation

AI must NOT:
- calculate ROI
- calculate sellable area
- calculate infrastructure cost
- override deterministic formulas
- fabricate land information

All financial calculations remain:
- deterministic
- rule-based
- transparent

==================================================
AI FEATURE 1 — AI EXECUTIVE SUMMARY
==================================================

Generate executive-level feasibility summaries automatically.

AI analyzes:
- ROI
- profitability
- infrastructure burden
- subdivision efficiency
- acquisition attractiveness

Then generates:
- executive summary
- investment insight
- strategic interpretation

Example output:

"The project demonstrates strong subdivision potential with favorable acquisition economics and balanced infrastructure burden."

Display inside:
- investor summary
- executive feasibility sheet
- dashboard overview

==================================================
AI FEATURE 2 — AI SCENARIO RECOMMENDATION
==================================================

AI compares:
- subdivision configurations
- ROI
- infrastructure burden
- road deduction
- sellable efficiency

AI recommends the best strategy.

Example output:

"The 7-plot configuration provides the strongest balance between profitability and road allocation efficiency."

Display inside:
- subdivision analysis sheet
- scenario comparison section
- executive report

==================================================
AI FEATURE 3 — AI RISK ANALYSIS
==================================================

AI explains:
- profitability risks
- excessive road burden
- aggressive assumptions
- market concerns
- infrastructure sensitivity

Example output:

"This project may experience reduced margin sensitivity if infrastructure costs exceed preliminary assumptions."

Display inside:
- executive feasibility sheet
- acquisition section
- investor report

==================================================
AI FEATURE 4 — AI PROJECT ASSISTANT (CHAT)
==================================================

Purpose:
Context-aware conversational assistant that knows the
specific project's numbers and can answer questions,
run what-if scenarios, and explain results in plain language.

Implementation:
- Floating action button (bottom-right, gold) on every project page
- Opens a chat panel (full-screen on mobile, 380×520px floating on desktop)
- Multi-turn conversation with history (last 8 turns sent to model)
- System prompt is generated per-project, embedding all financial metrics

Capabilities:
- Answer direct questions about the project's ROI, margin, costs
- Explain why a metric is at its current level
- Calculate "what if" scenarios on request (e.g. "what if selling price drops 10%?")
- Suggest improvements (e.g. "how can I improve gross margin?")
- Compute break-even prices on demand

Powered by:
- Google Gemini 1.5 Flash via @google/generative-ai
- API route: /api/chat (POST)
- Suggested starter questions shown on empty state

Boundaries:
- AI interprets and calculates contextually; it does not write to project state
- All saved project data remains deterministic and formula-based

==================================================
LANDOS SCORE SYSTEM
==================================================

Generate overall project score.

Example:
8.4 / 10

Factors:
- ROI
- acquisition attractiveness
- road efficiency
- zoning suitability
- market liquidity
- subdivision efficiency

==================================================
ZONING SYSTEM
==================================================

Support:
- uploaded zoning screenshots
- DPT zoning maps
- zoning color interpretation

Display:
- zoning type
- zoning suitability
- zoning observations

==================================================
ROAD ACCESS SYSTEM
==================================================

Support:
- uploaded road photos
- frontage analysis
- road width notes
- accessibility comments

==================================================
SUBDIVISION SYSTEM
==================================================

Support:
- uploaded subdivision sketches
- land office plans
- conceptual subdivision diagrams

Display:
- plot count
- average plot size
- road deduction
- sellable area

==================================================
LEGAL OBSERVATION SECTION
==================================================

Support:
- ownership duration
- transfer fee assumptions
- tax assumptions
- legal caution notes

==================================================
TECH STACK
==================================================

Frontend:
- Next.js (App Router)
- TypeScript
- Tailwind CSS v4 (CSS-based @theme, no tailwind.config.js)
- shadcn/ui

Data Persistence:
- localStorage (client-side only, no backend database)
- migrateProject() for backward-compatible schema changes

AI:
- Google Gemini 1.5 Flash (@google/generative-ai)
- GEMINI_API_KEY environment variable

PDF Export:
- window.print() with print: Tailwind utility classes
- No third-party PDF library

Charts:
- Not yet implemented

Deployment:
- Render.com (render.yaml — Node runtime, npm run build / npm start)

==================================================
FINAL PRODUCT POSITIONING
==================================================

LANDOS is:

"A Land Development Intelligence and Investor Reporting System designed to transform raw land information into acquisition intelligence, subdivision feasibility analysis, and executive-level development reports."

==================================================
KEY DIFFERENTIATOR
==================================================

LANDOS is NOT:
- a spreadsheet replacement
- a GIS platform
- a generic dashboard
- an AI chatbot

LANDOS IS:
- acquisition intelligence system
- subdivision feasibility platform
- investor communication system
- executive land analysis platform
- report-driven development intelligence engine
```
