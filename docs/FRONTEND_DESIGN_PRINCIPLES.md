# Planned frontend design principles

Planned uses the same evidence-led design principles applied to Mudaala, while retaining its own family-finance identity, blue brand colour, product language, and child-friendly tone. The principle is consistency without sameness: reuse the design reasoning, not another product's visual skin.

## The 12 principles

1. **Law of Proximity** — keep information, controls, and feedback that belong together physically close.
2. **Progressive Disclosure** — show the next useful decision first; move advanced settings, history, and explanations behind a deliberate reveal.
3. **Recognition Over Recall** — use explicit labels, familiar actions, visible status, and contextual help instead of making people remember hidden rules.
4. **Law of Common Region** — use spacing, restrained surfaces, and borders to make meaningful groups clear. Do not turn every item into a card.
5. **Law of Similarity** — preserve consistent button hierarchy, form controls, status treatments, spacing, and navigation behavior.
6. **Aesthetic–Usability Effect** — make the experience calm, polished, legible, and trustworthy; visual quality must support comprehension.
7. **Cognitive Load** — reduce simultaneous choices, competing emphasis, repeated explanations, and unnecessary decoration.
8. **Von Restorff Effect** — reserve strong emphasis for the one primary action or exceptional state that needs attention.
9. **Serial Position Effect** — put the most important information and action at the beginning; keep useful secondary information at the end.
10. **Peak-End Rule** — make important flows end with clear confirmation, next steps, and reassuring recovery options.
11. **Occam's Razor** — remove interface elements that do not help someone understand, decide, or act.
12. **Law of Prägnanz** — make each page's structure understandable at a glance.

## Planned-specific implementation rules

- Preserve Planned's blue identity and family-money vocabulary. Do not copy Mudaala's green/mango palette.
- Parent and child experiences may look related without being identical. A child's interface should feel encouraging and understandable, not like a reduced admin console.
- Keep financial amounts, balances, and transaction states highly legible. Never use colour alone to communicate financial status.
- Use one dominant action per page or workflow; secondary actions should be quieter.
- Group a goal's progress, target, contribution action, and forecast together.
- Group each approval request's child, amount, reason, date, and decision controls together.
- Keep family navigation predictable. On mobile, reveal navigation only when requested and make it easy to dismiss.
- Use cards only where a distinct object or task benefits from a boundary. Prefer whitespace and grouped lists for related records.
- Use explicit empty states that explain what belongs here and offer the next useful action.
- Keep destructive actions visually distinct and require confirmation where consequences are material.
- Maintain readable contrast, keyboard focus, reduced-motion support, touch-sized controls, and responsive layouts.
- Preserve good existing pages. Apply principles where they solve a real comprehension or interaction problem; do not force all 12 into every screen.

## Review checklist

For every page and key workflow, ask:

- Can someone identify the page purpose and primary action within a few seconds?
- Are related facts and controls grouped together?
- Is the next decision obvious without exposing every option at once?
- Are labels and status understandable without remembering previous screens?
- Is emphasis reserved for the most important action or state?
- Does the mobile layout preserve hierarchy and avoid cramped controls?
- Does the flow end with a clear outcome and a sensible next step?
- Can any decoration, repeated text, or competing element be removed?
