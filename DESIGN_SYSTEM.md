# Digital PM - Design System Bible
**Version 1.0** | Last Updated: Oct 5, 2025

---

## Core Philosophy
**"The system is the PM. Erick is the CEO."**

This design system reflects a professional, efficient operations platform that automates the doing while empowering decision-making. The visual language should feel:
- **Trustworthy** - This handles their money and their reputation
- **Efficient** - Zero confusion, instant clarity
- **Modern** - But not trendy. Built to last.
- **Accessible** - Robert's laborers need this to be "Bonobo-Simple"

---

## Color Palette (THE BIBLE)

### Primary Colors
These are the backbone. Use these 90% of the time.

```
Brand Blue (Primary Action)
- Primary:    #2563EB (rgb(37, 99, 235))
- Hover:      #1D4ED8 (rgb(29, 78, 216))
- Active:     #1E40AF (rgb(30, 64, 175))
- Light:      #DBEAFE (rgb(219, 234, 254))
- Usage: Primary buttons, active states, links, brand elements

Neutral Grays (Structure)
- Gray 50:    #F9FAFB (rgb(249, 250, 251)) - Backgrounds
- Gray 100:   #F3F4F6 (rgb(243, 244, 246)) - Subtle backgrounds
- Gray 200:   #E5E7EB (rgb(229, 231, 235)) - Borders
- Gray 300:   #D1D5DB (rgb(209, 213, 219)) - Borders (stronger)
- Gray 400:   #9CA3AF (rgb(156, 163, 175)) - Disabled text
- Gray 500:   #6B7280 (rgb(107, 114, 128)) - Secondary text
- Gray 600:   #4B5563 (rgb(75, 85, 99))   - Body text
- Gray 700:   #374151 (rgb(55, 65, 81))   - Headings
- Gray 800:   #1F2937 (rgb(31, 41, 55))   - Strong headings
- Gray 900:   #111827 (rgb(17, 24, 39))   - Sidebar, dark surfaces
```

### Semantic Colors
These communicate status. Use consistently.

```
Success (Completed, Confirmed)
- Primary:    #10B981 (rgb(16, 185, 129)) - Green 500
- Hover:      #059669 (rgb(5, 150, 105))  - Green 600
- Light:      #D1FAE5 (rgb(209, 250, 229)) - Green 100
- Usage: Completed tasks, confirmations, success states

Warning (Needs Attention, Pending)
- Primary:    #F59E0B (rgb(245, 158, 11)) - Amber 500
- Hover:      #D97706 (rgb(217, 119, 6))  - Amber 600
- Light:      #FEF3C7 (rgb(254, 243, 199)) - Amber 100
- Usage: Unassigned tasks, pending actions, warnings

Error (Conflicts, Critical Issues)
- Primary:    #EF4444 (rgb(239, 68, 68))  - Red 500
- Hover:      #DC2626 (rgb(220, 38, 38))  - Red 600
- Active:     #B91C1C (rgb(185, 28, 28))  - Red 700
- Light:      #FEE2E2 (rgb(254, 226, 226)) - Red 100
- Usage: Scheduling conflicts, errors, critical alerts, resolve buttons

Info (System Messages, AI Assistance)
- Primary:    #3B82F6 (rgb(59, 130, 246)) - Blue 500
- Light:      #DBEAFE (rgb(219, 234, 254)) - Blue 100
- Usage: AI assistant, informational messages
```

### Accent Colors (Quick Actions Only)
Use sparingly for the quick action wheel. Each module gets ONE accent.

```
Purple (Estimate/Planning)
- Primary:    #8B5CF6 (rgb(139, 92, 246))
- Usage: Estimate module icon only

Orange (Calendar/Scheduling)
- Primary:    #F97316 (rgb(249, 115, 22))
- Usage: Calendar module icon only

Cyan (Reports/Analytics)
- Primary:    #06B6D4 (rgb(6, 182, 212))
- Usage: Reports module icon only

Pink (Reminders/Notifications)
- Primary:    #EC4899 (rgb(236, 72, 153))
- Usage: Reminders module icon only
```

---

## Typography

### Font Family
```
Primary: Inter, system-ui, -apple-system, sans-serif
Monospace (for numbers/data): "SF Mono", Monaco, monospace
```

### Type Scale
```
Display:      32px / 2rem     - font-bold   - Main page titles
Heading 1:    24px / 1.5rem   - font-bold   - Section headers
Heading 2:    20px / 1.25rem  - font-bold   - Card titles
Heading 3:    18px / 1.125rem - font-semibold - Subsection titles
Body Large:   16px / 1rem     - font-normal - Primary body text
Body:         14px / 0.875rem - font-normal - Default text
Small:        12px / 0.75rem  - font-medium - Labels, captions
Tiny:         10px / 0.625rem - font-medium - Timestamps, metadata
```

### Line Heights
```
Tight:    1.25  - Headlines only
Normal:   1.5   - Body text default
Relaxed:  1.625 - Long-form content
```

---

## Spacing System
Based on 4px base unit. Use Tailwind classes.

```
0.5 = 2px   (gap-0.5, p-0.5)
1   = 4px   (gap-1, p-1)
2   = 8px   (gap-2, p-2)
3   = 12px  (gap-3, p-3)  ← Most common for tight spacing
4   = 16px  (gap-4, p-4)  ← Standard card padding
6   = 24px  (gap-6, p-6)  ← Section spacing
8   = 32px  (gap-8, p-8)  ← Page padding
12  = 48px  (gap-12, p-12) ← Large section breaks
```

**Golden Rule:** Card padding = p-4 to p-6. Section gaps = gap-4 to gap-6.

---

## Component Guidelines

### Buttons

**Primary (Call to Action)**
```tsx
className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium
           hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
```

**Danger (Resolve, Delete)**
```tsx
className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium
           hover:bg-red-600 active:bg-red-700 transition-colors shadow-sm"
```

**Success (Confirm, Complete)**
```tsx
className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium
           hover:bg-green-600 active:bg-green-700 transition-colors shadow-sm"
```

**Ghost (Secondary Actions)**
```tsx
className="border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-lg
           font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
```

### Cards

**Standard Card**
```tsx
className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6"
```

**Interactive Card (Hover State)**
```tsx
className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6
           hover:shadow-md transition-shadow cursor-pointer"
```

**Alert Card (Error/Warning)**
```tsx
className="bg-red-50 rounded-xl border border-red-200 p-4"
```

### Icons

**Sizes**
- Small:  w-4 h-4  (16px) - Inside small buttons, inline with text
- Medium: w-5 h-5  (20px) - Standard icons
- Large:  w-6 h-6  (24px) - Section headers, feature icons
- XL:     w-8 h-8  (32px) - Quick action circles

**Colors**
- Match semantic meaning (green for success, red for errors)
- Use gray-600 for neutral icons
- Use white for icons inside colored backgrounds

### Badges & Status Indicators

**Success Badge**
```tsx
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs
           font-medium bg-green-100 text-green-800"
```

**Warning Badge**
```tsx
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs
           font-medium bg-amber-100 text-amber-800"
```

**Error Badge**
```tsx
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs
           font-medium bg-red-100 text-red-800"
```

---

## Layout Principles

### Sidebar Navigation
```
Width: 256px (w-64)
Background: bg-gray-900
Text: text-white
Active Item: bg-blue-600 with shadow-lg shadow-blue-600/30
Hover: hover:bg-gray-800
```

### Main Content Area
```
Desktop: ml-64 (offset by sidebar)
Mobile: ml-0 (full width, sidebar slides over)
Padding: p-4 sm:p-6 lg:p-8
Max Width: max-w-7xl mx-auto
```

### Responsive Breakpoints
```
Mobile:  < 640px   (sm:)
Tablet:  640-1024  (md:, lg:)
Desktop: > 1024px  (lg:, xl:)
```

---

## Key UI Patterns

### Quick Action Wheel
- 6 circular buttons in grid (3x2 mobile, 6x1 desktop)
- Each icon: w-14 h-14, rounded-2xl
- Gradient backgrounds from accent colors
- Labels: text-xs font-medium text-gray-700

### Stat Cards (Circular Design)
- Circular gradient icon: w-12 h-12 rounded-full
- Number: text-2xl font-bold text-gray-900
- Label: text-xs font-medium text-gray-600
- Shadow on icon: shadow-lg shadow-{color}-500/30

### Labor Card (Mobile Worker View)
- Large touch targets (min 44px height)
- Primary action button full-width on mobile
- Clear visual hierarchy (big number, small label)
- Icons for quick scanning (Maps, Clock)

### Alert/Notification Cards
- Colored background (50 shade)
- Colored border (200 shade)
- Icon in circle (100 background)
- Timestamp with clock icon

---

## Accessibility Requirements

1. **Color Contrast:** All text must meet WCAG AA (4.5:1 for normal, 3:1 for large)
2. **Touch Targets:** Minimum 44x44px on mobile
3. **Focus States:** Visible focus rings (ring-2 ring-blue-500)
4. **Semantic HTML:** Use proper heading hierarchy
5. **Alt Text:** All images/icons with meaning need alt text

---

## Mobile-First Principles

1. **Navigation:** Hamburger menu, sticky header
2. **Forms:** Full-width inputs, large touch targets
3. **Cards:** Stack vertically on mobile
4. **Tables:** Convert to cards on mobile
5. **Modals:** Full-screen on mobile

---

## Animation/Transitions

**Standard Transition**
```tsx
className="transition-colors duration-200"
```

**Transform (Buttons)**
```tsx
className="active:scale-95 transition-transform"
```

**Slide In (Sidebar)**
```tsx
className="transition-transform duration-300"
```

Keep animations subtle and fast. Never longer than 300ms.

---

## Don'ts (Common Mistakes)

❌ Don't use more than 3 colors on one screen (excluding grays)
❌ Don't use accent colors for buttons (only icons in quick actions)
❌ Don't mix rounded-lg and rounded-xl in same section
❌ Don't use light gray text on white backgrounds (min gray-600)
❌ Don't create custom colors outside this palette
❌ Don't use emojis in production UI (only in docs/internal)

---

## File Naming Conventions

```
Components:    PascalCase    (StatCard.tsx, AlertCard.tsx)
Utilities:     camelCase     (formatDate.ts, calculateCost.ts)
Types:         PascalCase    (DashboardStats, ActiveProject)
Constants:     UPPER_SNAKE   (MAX_WORKERS, API_ENDPOINTS)
```

---

## This is Law.

When in doubt, reference this document. If it's not in here, ask before creating.
Every deviation weakens the system. Consistency = Trust = Money.

**Questions? Update this doc and commit it.**
