# Hướng dẫn tạo App Icon và Splash Screen

## 🎨 Thiết kế đề xuất

### Màu sắc chủ đạo:

- Gradient: `#667eea` → `#764ba2` (Tím gradient)
- Background: `#667eea`
- Icon: Wallet (ví tiền) màu trắng

---

## 📱 App Icon

### Yêu cầu kích thước:

- **icon.png**: 1024x1024px (iOS & Android)
- **android-icon-foreground.png**: 1024x1024px (Android adaptive icon)
- **android-icon-background.png**: 1024x1024px (Android adaptive icon background)
- **android-icon-monochrome.png**: 1024x1024px (Android monochrome)
- **favicon.png**: 48x48px (Web)

### Thiết kế đề xuất:

#### 1. icon.png (1024x1024px)

```
- Background: Gradient tím (#667eea → #764ba2)
- Icon: Wallet icon màu trắng, kích thước ~60% canvas
- Bo góc: 22.5% (rounded square)
- Shadow: Soft shadow để tạo chiều sâu
```

#### 2. android-icon-foreground.png (1024x1024px)

```
- Background: Transparent
- Icon: Wallet icon màu trắng
- Safe zone: Icon nằm trong vùng 432x432px ở giữa
```

#### 3. android-icon-background.png (1024x1024px)

```
- Background: Solid color #667eea hoặc gradient
- Không có icon
```

#### 4. android-icon-monochrome.png (1024x1024px)

```
- Background: Transparent
- Icon: Wallet icon màu trắng (single color)
- Dùng cho Android 13+ themed icons
```

---

## 🌟 Splash Screen

### Yêu cầu:

- **splash-icon.png**: 1284x1284px (recommended)
- Background color: `#667eea` (đã config trong app.json)

### Thiết kế đề xuất:

```
- Icon: Wallet icon màu trắng
- Kích thước icon: ~400x400px ở giữa canvas
- Background: Transparent (màu nền được set trong config)
```

---

## 🛠️ Công cụ tạo icon

### Option 1: Figma (Recommended)

1. Tạo frame 1024x1024px
2. Thêm gradient background (#667eea → #764ba2)
3. Thêm wallet icon từ Ionicons hoặc tự vẽ
4. Export PNG với quality cao

### Option 2: Online Tools

- **Icon Kitchen**: https://icon.kitchen/
- **App Icon Generator**: https://www.appicon.co/
- **Figma**: https://www.figma.com/

### Option 3: Canva

1. Tạo design 1024x1024px
2. Sử dụng gradient background
3. Thêm wallet icon/emoji 💰 hoặc 💳
4. Download PNG

---

## 📦 Sau khi tạo xong

1. Đặt các file vào thư mục `assets/images/`:

   - icon.png
   - splash-icon.png
   - android-icon-foreground.png
   - android-icon-background.png
   - android-icon-monochrome.png
   - favicon.png

2. Chạy lệnh để generate icons:

   ```bash
   npx expo prebuild --clean
   ```

3. Hoặc sử dụng EAS:
   ```bash
   eas build:configure
   ```

---

## 🎯 Quick Start với Emoji

Nếu muốn nhanh, có thể dùng emoji:

- 💰 (Money bag)
- 💳 (Credit card)
- 💵 (Dollar bill)
- 🏦 (Bank)
- 📊 (Chart)

Tạo icon đơn giản:

1. Background gradient tím
2. Emoji to ở giữa
3. Text "Chi Tiêu" bên dưới (optional)

---

## 📝 Notes

- Icon phải rõ nét, dễ nhận diện ở kích thước nhỏ
- Tránh text quá nhỏ trong icon
- Test icon trên cả nền sáng và tối
- Android adaptive icon: giữ nội dung quan trọng trong safe zone
