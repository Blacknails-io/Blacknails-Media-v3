# Login View

Target home for the finished login experience.

The current login prototype still lives in `client/src/components/LoginScreen.tsx` while LiquidGlass and the visual language are being calibrated. Once accepted, migrate it here with this shape:

```txt
Login.tsx
LoginView.tsx
useLoginLogic.ts
Login.module.css
index.ts
```

Rules for the final version:

- `LoginView` owns structure and callbacks only.
- `useLoginLogic` owns form state, validation, and auth orchestration.
- LiquidGlass is composed through `presentation/ui/surfaces/LiquidGlassSurface`.
- CSS class names stay generic: `.login-panel`, `.login-input`, `.login-button`.
