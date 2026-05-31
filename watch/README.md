# watchOS Companion App

## Status: Future Work - PRD Phase 3

This directory is a placeholder for the Apple Watch companion app. Per the
implementation roadmap (PRD Section 19, Phase 3, Weeks 13-18), the watchOS
target is scheduled after the core HealthKit exercise sync is complete on the
iPhone side.

---

## What the Companion App Does

Defined in PRD Sections 9.6, 9.9, and 17 ("watchOS Companion App").

### Complications (Watch Face Widgets)

- Small complication: calories remaining as a number.
- Medium complication: miniature calorie ring plus macro summary (protein,
  carbs, fat remaining).
- Complications reload every time the iPhone syncs food log data or the user
  logs a meal.

### Quick Log Screen

- Displays the last 5 logged food items as tappable buttons. One tap re-logs
  the same item without opening the iPhone app.
- "Scan" button: sends a WatchConnectivity message to the paired iPhone to
  open the camera in scan mode (deep link).
- Water shortcut: a single "+8 oz" tap button logs a glass of water.

### Today Summary Screen

- Full-day at-a-glance view: calories in / burned / remaining, macro bars,
  workouts logged today.
- Designed to be readable from the wrist without pulling out the phone.

---

## Why This Cannot Be Built in Expo / React Native

React Native and the Expo managed workflow compile only to iOS and Android
phone targets. watchOS is a separate operating system with its own SDK.
The companion app must be a **native Xcode target** written in Swift and
SwiftUI. It lives in the same Xcode workspace as any bare-workflow React
Native iOS build, but it is compiled and distributed independently.

Key implications:

- Building the watch app requires switching to the Expo bare workflow (or
  Expo Modules with a custom native module), not the managed workflow.
- The watch app binary is submitted alongside the iPhone binary but reviewed
  as a separate app entity on the App Store.
- There is no React Native equivalent for WatchKit, ClockKit/WidgetKit
  complications, or the WCSession watch-side delegate.

---

## Data Flow

All communication goes through the WatchConnectivity framework (WCSession).
The iPhone app is always the source of truth.

```
iPhone (React Native)
    |
    | After every food log or HealthKit sync:
    | WCSession.default.updateApplicationContext(context)
    |
    v
Apple Watch (SwiftUI / WatchKit)
    |
    | On wake / context received:
    | didReceiveApplicationContext -> update @Published vars
    | -> reload complications via CLKComplicationServer
```

### iPhone to Watch - summary push (background delivery)

Used for dashboard data that does not need to arrive instantly. Called after
every food log entry and after every HealthKit sync (Section 9.6).

```swift
// iPhone side - WatchSyncManager.swift (Section 9.9)
let context: [String: Any] = [
    "caloriesRemaining": caloriesRemaining,
    "proteinRemaining":  proteinRemaining,
    "carbsRemaining":    carbsRemaining,
    "fatRemaining":      fatRemaining,
    "activeCalories":    activeCalories,
    "steps":             steps,
    "updatedAt":         Date().timeIntervalSince1970,
]
try? WCSession.default.updateApplicationContext(context)
```

### Watch to iPhone - quick-log request (real-time)

Used only when the user taps an action on the watch that requires an
immediate confirmation from the phone (e.g., quick-log a food item, open
the camera). `sendMessage` requires the iPhone app to be reachable.

```swift
// Watch side
WCSession.default.sendMessage(
    ["action": "quick_log", "foodId": foodId],
    replyHandler: { reply in /* update local state */ },
    errorHandler: { error in /* show error */ }
)
```

### Watch receiving context

```swift
// Watch side - WatchViewModel.swift (Section 9.9)
func session(_ session: WCSession,
             didReceiveApplicationContext context: [String: Any]) {
    DispatchQueue.main.async {
        self.caloriesRemaining = context["caloriesRemaining"] as? Int ?? 0
        self.proteinRemaining  = context["proteinRemaining"]  as? Int ?? 0
        self.activeCalories    = context["activeCalories"]    as? Int ?? 0
    }
    // Reload all active complications
    CLKComplicationServer.sharedInstance()
        .activeComplications?
        .forEach { CLKComplicationServer.sharedInstance().reloadTimeline(for: $0) }
}
```

---

## Technology Summary

| Concern | Technology |
|---------|-----------|
| Language | Swift |
| UI framework | SwiftUI |
| Watch framework | WatchKit |
| Complications | WidgetKit (ClockKit on older watchOS) |
| iPhone-Watch sync | WatchConnectivity (WCSession) |
| Build toolchain | Xcode (separate target, same workspace) |
| Distribution | App Store - watch extension bundled with iPhone app |

---

## PRD References

- Section 9.6 - Apple Watch Companion App features and WatchConnectivity code
- Section 9.9 - WatchConnectivity iPhone-to-Watch sync implementation
- Section 17 - Mobile app architecture; watchOS Companion App subsection
- Section 19 Phase 3 - Implementation checklist (Weeks 13-18)
- Section 20 - Risk: "watchOS app requires separate Xcode target - not doable
  in Expo managed workflow"
