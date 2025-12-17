# UI Modernization Guide

## Design System

### Color Palette
- **Background**: `bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900`
- **Cards**: `bg-slate-800/50 backdrop-blur border border-slate-700`
- **Primary (Host/Indigo)**: `bg-indigo-600 hover:bg-indigo-700 text-indigo-400`
- **Success (Team/Emerald)**: `bg-emerald-600 hover:bg-emerald-700 text-emerald-400`
- **Warning (Buzzer/Amber)**: `bg-amber-600 hover:bg-amber-700 text-amber-400`
- **Danger (Error/Red)**: `bg-red-600 hover:bg-red-700 text-red-400`
- **Text Primary**: `text-white`
- **Text Secondary**: `text-slate-400`
- **Text Tertiary**: `text-slate-500`

### Typography
- **Headings**: `font-semibold` or `font-bold`
- **Body**: `font-medium` for emphasis, default for regular
- **Sizes**: Use `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`

### Spacing & Borders
- **Rounded**: `rounded-lg` for buttons/inputs, `rounded-xl` for cards
- **Padding**: `p-6` for cards, `p-3` or `p-4` for smaller elements
- **Gaps**: `gap-4` or `gap-6` for grids/flex

### Icons (Lucide React)
Replace emojis with these icons:

```typescript
import {
  Monitor,      // Host
  Users,        // Team
  Eye,          // Spectator
  BookOpen,     // Domain
  HelpCircle,   // Question
  Clock,        // Timer
  CheckCircle,  // Correct
  XCircle,      // Wrong
  Zap,          // Buzzer
  Trophy,       // Leaderboard
  Play,         // Start
  Pause,        // Pause
  RotateCcw,    // Reset
  Award,        // Winner
  AlertCircle,  // Warning
  Info,         // Info
  ChevronRight, // Navigation
  Settings,     // Settings
  LogOut        // Logout
} from 'lucide-react';
```

## Component Patterns

### Card Component
```tsx
<div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
  {/* Content */}
</div>
```

### Button Primary
```tsx
<button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-white transition-colors">
  Button Text
</button>
```

### Input Field
```tsx
<input
  className="w-full px-4 py-3 rounded-lg bg-slate-900/50 text-white border border-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
  placeholder="Placeholder"
/>
```

### Icon Button
```tsx
<button className="p-3 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors">
  <Icon className="w-5 h-5 text-indigo-400" />
</button>
```

### Status Badge
```tsx
<div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
  <span className="text-sm font-medium text-emerald-400">Live</span>
</div>
```

### Toast Notification
```tsx
<div className="fixed top-4 right-4 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
  <div className="flex items-center gap-3">
    <CheckCircle className="w-5 h-5 text-emerald-400" />
    <span className="text-white">Success message</span>
  </div>
</div>
```

## Emoji to Icon Mapping

| Emoji | Icon Component | Usage |
|-------|---------------|-------|
| 🎯 | `Target` | Quiz/Game |
| 🎮 | `Monitor` | Host |
| 👥 | `Users` | Team |
| 📚 | `BookOpen` | Domain |
| ❓ | `HelpCircle` | Question |
| ⏳ | `Clock` | Waiting/Timer |
| ✅ | `CheckCircle` | Correct |
| ❌ | `XCircle` | Wrong |
| ⚡ | `Zap` | Buzzer |
| 🔴 | `Circle` (filled) | Buzz Button |
| 🏆 | `Trophy` | Leaderboard |
| 🥇🥈🥉 | `Award` | Rankings |
| 🎉 | `PartyPopper` or `Award` | Complete |
| ⏱️ | `Timer` | Countdown |
| ⏸️ | `Pause` | Paused |
| 🟢 | `Circle` (filled green) | Live |
| 👁️ | `Eye` | Spectator |

## Quick Replace Patterns

### Background Gradients
```
FROM: bg-gradient-to-r from-purple-600 to-blue-600
TO:   bg-indigo-600 hover:bg-indigo-700

FROM: bg-gradient-to-r from-green-600 to-teal-600
TO:   bg-emerald-600 hover:bg-emerald-700

FROM: bg-gradient-to-r from-orange-600 to-red-600
TO:   bg-amber-600 hover:bg-amber-700
```

### Card Backgrounds
```
FROM: bg-white/10 backdrop-blur-lg rounded-2xl
TO:   bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl
```

### Text Colors
```
FROM: text-gray-300
TO:   text-slate-400

FROM: text-gray-200
TO:   text-slate-300
```

## Implementation Priority

1. ✅ Home page (page.tsx)
2. ✅ HostLogin component
3. ⏳ TeamInterface component (largest, most used)
4. ⏳ SpectatorView component
5. ⏳ HostDashboard component
6. ⏳ HostSessionManager component

## Notes
- Remove all emoji characters
- Use Lucide React icons consistently
- Maintain accessibility (proper labels, focus states)
- Keep hover/active states subtle but visible
- Use transitions for smooth interactions
