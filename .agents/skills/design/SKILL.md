---
name: design
description: "Design advisor: gives color palette, typography, page structure and anti-patterns for any project type"
---
# Design Advisor

## Overview
Provide industry-specific UI/UX recommendations before building.
Search design data files to give actionable recommendations
with hex codes, font pairings, layout patterns, and anti-pattern warnings.

## Workflow
1. Identify the industry/product type from the user's request
2. Search relevant CSV data files in ~/.claude/skills/ui-ux-pro-max/data/
3. Cross-reference with design vocabulary for proper terminology
4. Search 21st.dev for real component examples (if MCP available)
5. Present structured recommendations with implementation details

## Output Format
Structure your response as:
- Style Direction
- Color Palette (hex codes with roles)
- Typography (font pairing with Google Fonts link)
- Page Structure
- Key Effects
- Anti-Patterns
- 21st.dev Examples
- Next Step

