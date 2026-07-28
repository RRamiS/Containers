# Build para celular (Expo / EAS)

Guía para generar e instalar la app en un teléfono Android (y notas iOS).

Expo SDK: **57** — docs: https://docs.expo.dev/versions/v57.0.0/

---

## 1) Probar sin build (más rápido)

Ideal para desarrollo día a día.

```bash
npm install
npm start
```

1. Instalá **Expo Go** en el celular ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)).
2. Celular y PC en la **misma Wi‑Fi**.
3. Escaneá el QR del terminal.

Limitación: Expo Go no incluye todo lo de un build nativo custom; para distribución real usá EAS.

---

## 2) APK instalable con EAS Build (recomendado)

### Requisitos

- Cuenta gratis en [expo.dev](https://expo.dev/signup)
- Node + este repo con `npm install`

### Pasos (una vez)

```bash
# CLI
npm install -g eas-cli

# Login
eas login
eas whoami

# Configura eas.json + proyecto en Expo
eas build:configure
```

En [`app.json`](../app.json) tiene que existir un package Android único, por ejemplo:

```json
"android": {
  "package": "com.rramis.containers",
  "adaptiveIcon": { "...": "..." }
},
"ios": {
  "bundleIdentifier": "com.rramis.containers",
  "supportsTablet": true
}
```

### Generar APK para instalar en el celu (sin Play Store)

```bash
eas build -p android --profile preview
```

Cuando termine, Expo te da un link → **Install** / descargar `.apk` → abrirlo en el teléfono (permitir “orígenes desconocidos” si pide).

Perfil `preview` suele generar **APK**. `production` genera **AAB** para Play Store.

### Build de producción (Play Store)

```bash
eas build -p android --profile production
```

Subir a Play requiere cuenta de desarrollador Google (pago único).

### iOS

```bash
eas build -p ios --profile preview
```

Hace falta **Apple Developer Program** (~USD 99/año). La instalación en dispositivo físico suele ir por TestFlight o perfil ad-hoc.

---

## 3) Build nativo en tu PC (opcional)

Más pesado; útil si no querés EAS cloud.

```bash
# Android (necesita Android Studio + SDK)
npx expo run:android

# iOS (solo macOS + Xcode)
npx expo run:ios
```

---

## Scripts sugeridos (cuando exista eas.json)

Agregar a `package.json`:

```json
"mobile:android": "eas build -p android --profile preview",
"mobile:android:prod": "eas build -p android --profile production",
"mobile:ios": "eas build -p ios --profile preview"
```

---

## Checklist si el build falla

1. ¿Corriste `npm install` después del último `git pull`?
2. ¿Está definido `android.package`?
3. ¿`eas whoami` muestra tu usuario?
4. Revisá el log en https://expo.dev/builds
5. Dependencias nativas nuevas → a veces hace falta `npx expo install --fix`

---

## Relación con escritorio

| Plataforma | Comando |
|------------|---------|
| Celular (dev) | `npm start` + Expo Go |
| Celular (APK) | `eas build -p android --profile preview` |
| Escritorio | `npm run desktop` / `npm run desktop:build` (Tauri) |
| Web debug | `npm run web` |
