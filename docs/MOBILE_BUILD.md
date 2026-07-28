# Build para celular — Android e iOS

Expo SDK **57** · EAS Build para ambas plataformas.

IDs de la app:

| Plataforma | Identificador |
|------------|---------------|
| Android | `com.rramis.containers` |
| iOS | `com.rramis.containers` |

Proyecto EAS: ya vinculado en `app.json` (`extra.eas.projectId`).

---

## Resumen rápido

| Querés… | Comando |
|---------|---------|
| Probar en el celu ya | `npm start` + **Expo Go** |
| APK Android (instalar directo) | `npm run mobile:android` |
| IPA iOS (dispositivo físico / TestFlight path) | `npm run mobile:ios` |
| **Las dos plataformas a la vez** | `npm run mobile:all` |
| AAB Android (Play Store) | `npm run mobile:android:prod` |
| iOS App Store / TestFlight | `npm run mobile:ios:prod` |
| Ambas para tiendas | `npm run mobile:all:prod` |

---

## 1) Probar sin build (dev)

```bash
npm install
npm start
```

1. Instalá **Expo Go** ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)).
2. Misma Wi‑Fi que la PC.
3. Escaneá el QR.

Sirve para desarrollo. Para instalar como app “de verdad”, usá EAS.

---

## 2) Requisitos EAS (una vez)

```bash
npm install -g eas-cli
eas login
eas whoami
```

Ya existe [`eas.json`](../eas.json) con perfiles:

| Perfil | Uso |
|--------|-----|
| `preview` | Interno: **APK** Android + build iOS para dispositivo |
| `preview-simulator` | iOS Simulator (Mac / CI) |
| `production` | Tiendas: **AAB** Android + iOS App Store |
| `development` | Dev client (opcional, con `expo-dev-client`) |

---

## 3) Android

### Preview (APK para instalar en el teléfono)

```bash
npm run mobile:android
# = eas build -p android --profile preview
```

Al terminar → link en Expo → **Install** / descargar `.apk`.

### Production (Play Store)

```bash
npm run mobile:android:prod
```

Genera `.aab`. Subir a Play Console requiere cuenta de desarrollador Google (~USD 25 único).

---

## 4) iOS / Apple

### Importante

Para builds iOS en dispositivo real o App Store hace falta:

- Cuenta **Apple Developer Program** (~USD 99/año)
- La primera vez EAS te pide login de Apple y genera certificados / provisioning (podés dejar que EAS los maneje)

Sin cuenta Apple podés:

- Usar **Expo Go** en el iPhone
- Buildear solo para **simulador** (en Mac):

```bash
eas build -p ios --profile preview-simulator
```

### Preview (dispositivo físico / distribución interna)

```bash
npm run mobile:ios
# = eas build -p ios --profile preview
```

EAS registra el UDID del iPhone (te guía) o usás distribución interna según tu plan.

### Production (TestFlight / App Store)

```bash
npm run mobile:ios:prod
```

Luego:

```bash
eas submit -p ios --profile production
```

(TestFlight es el camino habitual antes de publicar.)

---

## 5) Ambas plataformas juntos

```bash
# Preview (equipo / pruebas)
npm run mobile:all

# Production (tiendas)
npm run mobile:all:prod
```

Lanza dos jobs en EAS (Android + iOS). Seguilos en https://expo.dev/builds

---

## 6) Instalar el resultado

1. Abrí el link del build (o `eas build:list`).
2. **Android:** Install / `.apk` en el teléfono.
3. **iOS:** Install desde el dispositivo registrado, o TestFlight si es production submit.

---

## Checklist si falla

1. `npm install` después del último `git pull`
2. `eas whoami` logueado
3. `android.package` e `ios.bundleIdentifier` en `app.json` (ya configurados)
4. iOS: Apple Developer activo y credentials aceptadas en el prompt de EAS
5. Logs: https://expo.dev/builds

---

## Relación con escritorio / web

| Plataforma | Comando |
|------------|---------|
| Celular (dev) | `npm start` + Expo Go |
| Celular Android APK | `npm run mobile:android` |
| Celular iOS | `npm run mobile:ios` |
| Celular ambas | `npm run mobile:all` |
| Escritorio | `npm run desktop` / `desktop:build` (Tauri) |
| Web | `npm run web` |
