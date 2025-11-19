# Hướng Dẫn Build với EAS

## Thông tin Project

- **Project ID**: `0163166e-4281-4f07-81a0-25d553edc584`
- **Account**: `@longnguyen1111`
- **Slug**: `ExpenseTrackerApp`

## Các Profile Build

### 1. Development Build

Build để phát triển với development client:

```bash
npm run build:dev
# hoặc
eas build --profile development --platform all
```

### 2. Preview Build (Khuyến nghị để test)

Build APK/IPA để test trước khi release:

```bash
# Build cả iOS và Android
npm run build:preview

# Chỉ Android (APK)
npm run build:preview:android

# Chỉ iOS
npm run build:preview:ios
```

### 3. Production Build

Build cho production (App Store/Play Store):

```bash
# Build cả iOS và Android
npm run build:prod

# Chỉ Android (APK)
npm run build:prod:android

# Chỉ iOS
npm run build:prod:ios
```

## Các Lệnh Hữu Ích

### Kiểm tra thông tin project

```bash
eas project:info
```

### Xem danh sách builds

```bash
eas build:list
```

### Xem chi tiết một build

```bash
eas build:view [BUILD_ID]
```

### Submit lên store

```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

## Lưu Ý

1. **Build đầu tiên**: Lần build đầu tiên sẽ mất khoảng 15-30 phút vì EAS cần setup môi trường.

2. **Credentials**:

   - iOS: EAS sẽ tự động tạo và quản lý certificates/provisioning profiles
   - Android: EAS sẽ tự động tạo keystore

3. **Build Number**:

   - Production profile có `autoIncrement: true` nên build number sẽ tự động tăng
   - Preview và Development cần tăng thủ công nếu cần

4. **Platform Specific**:
   - iOS builds yêu cầu Apple Developer account ($99/năm)
   - Android builds miễn phí

## Workflow Khuyến Nghị

1. **Phát triển**: Dùng `expo start` để test local
2. **Test trên thiết bị thật**: Build preview và cài APK/IPA
3. **Release**: Build production và submit lên store

## Troubleshooting

### Build failed?

```bash
# Xem logs chi tiết
eas build:view [BUILD_ID]
```

### Cần update credentials?

```bash
# iOS
eas credentials

# Android
eas credentials -p android
```

### Clear cache và build lại

```bash
eas build --profile preview --platform android --clear-cache
```

## Links Hữu Ích

- [EAS Build Dashboard](https://expo.dev/accounts/longnguyen1111/projects/ExpenseTrackerApp/builds)
- [EAS Documentation](https://docs.expo.dev/build/introduction/)
- [Submit to Stores](https://docs.expo.dev/submit/introduction/)
