# Visual Lab Workflow & Architecture

The Visual Lab is a parameterized development utility built into the client, enabling developers and designers to interactively calibrate UI styling variables, color palettes, and component variants in real-time.

---

## 1. Core Architecture

The lab is instantiated inside **[main.tsx](../../../client/src/main.tsx)** when the `?lab` query parameter is present in the URL:

```tsx
<VisualLab 
  stylesDef={[frostedGlassStyle]} 
  specimens={[calibrationSpecimen, logoSpecimen, loginSpecimen]} 
/>
```

- **Styles (`stylesDef`)**: Define styling variables, controls (sliders, toggles, color pickers), background wrappers, and CSS mappings (e.g. `frosted-glass` style).
- **Specimens (`specimens`)**: Specific UI components rendered inside the lab to test changes (e.g. `calibration`, `logo`, `login`).

---

## 2. Real-time Theme Synchronization (`__theme_sync`)

The lab supports bidirectional theme synchronization with the running server using the `/__theme_sync` local endpoint:
- **On Mount**: The lab queries `GET /__theme_sync?component=<name>` to fetch existing codebase overrides.
- **On Deploy**: Clicking the **Deploy Theme** button executes `POST /__theme_sync` with the modified overrides, persisting them directly back to the project theme files on disk.

---

## 3. Creating a New Specimen

To add a new UI component to the lab:
1. Create your component files in `client/src/lab/specimens/` (e.g., `MyComponentSpecimen.tsx`).
2. Implement the `LabSpecimen` interface from `client/src/lab/core/types.ts`.
3. Export the specimen definition:

```typescript
export const myComponentSpecimen: LabSpecimen<any, any> = {
  id: 'my-component',
  name: 'My Component Specimen',
  variants: [{ id: 'default', name: 'Default View' }],
  Component: ({ variantId, config }) => {
    return <MyComponent {...config} />;
  }
};
```

4. Import and add it to the `specimens` array in **[main.tsx](../../../client/src/main.tsx)**.
5. Access it via: `http://localhost:3000/?lab=my-component` (using the specimen `id` as the query parameter value).

---

## 4. Visual Calibration Best Practices

- **Keep Lab-Only Code Isolated**: Sliders, toggles, mock data, and synchronization overlays belong strictly in `client/src/lab/`.
- **Theme Variable Neutrality**: visual theme modifications (like updating text transparency or accent glow colors) must be synchronized through theme files (`presentation/themes/`) rather than hardcoded into component CSS sheets.
- **Hermetic Testing**: Before deploying variables, verify that changes do not degrade readability on other specimens.
