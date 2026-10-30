# TaxiAereoRural — Aluno 13

Starter React + Vite + Capacitor para capturar localização no Android e registrar check-ins de pontos de pouso rurais.

## Requisitos
- Node.js 22 ou superior
- Android Studio com Android SDK
- Celular Android para testar GPS real

## Instalar
```bash
npm install
```

## Adicionar permissões
No arquivo `android/app/src/main/AndroidManifest.xml`, dentro de `<manifest>` e antes de `<application>`, adicione:
```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-feature android:name="android.hardware.location.gps" />
```

## Executar no Android
```bash
npm run build
npx cap add android
npx cap sync android
npx cap open android
```
Se a pasta `android` já existir, não execute `npx cap add android` novamente; use apenas `npx cap sync android`.

## Depois de alterar o React
```bash
npm run build
npx cap sync android
```

Os registros desta versão são armazenados localmente no aparelho via localStorage; não há banco de dados ou sincronização entre dispositivos.
