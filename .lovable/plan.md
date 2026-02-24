
# Visual Zone Morphing Enhancement

## Overview
Enhance the temperature slider's visual feedback by keeping a clear, color-coded outline of the original baseline zone while the current zone shrinks/shifts. This creates a powerful visual "before/after" comparison without needing words.

## Current State
The codebase already has the foundation:
- Baseline zone outline layer exists (dashed line)
- Loss/gain fill layer exists (shows difference between zones)
- Zone colors change based on temperature

## What Needs Improvement

### Problem 1: Baseline Outline Blends In
The baseline outline currently uses the same color scheme as the current zone and has low opacity (60%), making it hard to distinguish as the "original" reference.

### Problem 2: Loss Area Not Prominent Enough
The filled loss area (the "ring" between baseline and current) could be more visually striking.

### Problem 3: No Visual Anchor
Users need a clear visual anchor showing "this is what you started with."

---

## Implementation Plan

### 1. Update Zone Colors Utility
**File:** `src/utils/zoneMorphing.ts`

Add a dedicated baseline color that stays constant regardless of temperature:
- Agriculture: Bright green outline (#22c55e)
- Coastal: Bright teal outline (#14b8a6)  
- Flood: Bright blue outline (#3b82f6)

The baseline color will NOT change with temperature - it remains the "healthy" reference color.

### 2. Enhance Baseline Outline Layer
**File:** `src/components/dashboard/MapView.tsx`

Update the baseline outline layer paint properties:
- Increase opacity from 0.6 to 0.8 for better visibility
- Use a slightly wider line (2.5px instead of 2px)
- Keep the dashed pattern for visual distinction
- Use the constant baseline color (not temperature-affected)

### 3. Enhance Loss/Gain Fill Layer
**File:** `src/components/dashboard/MapView.tsx`

Make the loss area more visually striking:
- Increase fill opacity from 0.5 to 0.6
- Add a subtle pattern or gradient effect via opacity
- Use warmer red tones for agriculture/coastal loss
- Use expanding blue tones for flood expansion

### 4. Add Baseline Label (Optional Enhancement)
Consider adding a subtle "Baseline" label near the outline to reinforce what the dashed line represents.

---

## Technical Details

### Color Constants (zoneMorphing.ts)
```text
BASELINE_COLORS = {
  agriculture: '#22c55e' (emerald-500)
  coastal: '#14b8a6' (teal-500)
  flood: '#3b82f6' (blue-500)
}

LOSS_COLORS = {
  agriculture: 'rgba(239, 68, 68, 0.5)' (red with higher opacity)
  coastal: 'rgba(239, 68, 68, 0.5)'
  flood: 'rgba(249, 115, 22, 0.5)' (orange for expansion warning)
}
```

### Layer Updates (MapView.tsx)
```text
BASELINE_OUTLINE layer:
  - line-color: constant per mode (not temperature-dependent)
  - line-width: 2.5
  - line-opacity: 0.85
  - line-dasharray: [4, 3]

LOSS_FILL layer:
  - fill-opacity: 0.55
  - fill-color: warm red/orange tones
```

### ZoneColors Interface Update
Add `baselineOutlineColor` property that remains constant regardless of temperature.

---

## Visual Result

When user drags temperature slider:
1. **Dashed outline** stays fixed in the original "healthy" color (green/teal/blue)
2. **Current zone** shrinks inward and shifts to warmer colors (yellow, orange, red)
3. **Loss area** between the two fills with a semi-transparent red/orange
4. The visual contrast clearly shows the "before vs after" without any text

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/utils/zoneMorphing.ts` | Add baseline color constants, update `getZoneColors()` to return separate baseline color |
| `src/components/dashboard/MapView.tsx` | Update layer paint properties for better visibility |

## Estimated Scope
Small enhancement - approximately 30 lines of code changes across 2 files.
