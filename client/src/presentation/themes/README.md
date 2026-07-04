# Presentation Themes

Themes define tokens and reusable visual materials. Components consume tokens; themes provide values.

Avoid one-off component styling for materials that will be reused across views.

Use theme subfolders for material-specific implementations and presets:

```txt
<theme-name>/
  glass/
    presets.ts
    palette.ts
```

Component CSS must use role and surface language (`panel`, `content`, `surface`, `state`, `accent`) rather than material names. The material name may appear in theme file/folder paths, shared technical wrappers, and external library types.
