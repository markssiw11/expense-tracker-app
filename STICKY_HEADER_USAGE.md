# Sticky Header Component Usage

## Cách 1: Sử dụng ScrollViewWithStickyHeader (Đơn giản nhất)

```tsx
import { ScrollViewWithStickyHeader } from "@/src/components";

export default function MyScreen() {
  return (
    <ScrollViewWithStickyHeader
      title="Báo cáo chi tiêu 📊"
      subtitle="Xem chi tiết chi tiêu của bạn"
      headerContent={
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Tổng chi phí</Text>
          <Text style={styles.summaryAmount}>20.000 ₫</Text>
        </View>
      }
    >
      {/* Nội dung của bạn */}
      <View style={{ padding: 16 }}>
        <Text>Content here...</Text>
      </View>
    </ScrollViewWithStickyHeader>
  );
}
```

## Cách 2: Sử dụng StickyHeader với ScrollView tùy chỉnh

```tsx
import { useRef } from "react";
import { View, Animated } from "react-native";
import { StickyHeader } from "@/src/components";

export default function MyScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <View style={{ flex: 1 }}>
      <StickyHeader
        title="Báo cáo chi tiêu 📊"
        subtitle="Xem chi tiết"
        scrollY={scrollY}
        gradientColors={["#667eea", "#764ba2"]}
      >
        {/* Custom header content */}
        <View>
          <Text>Custom content</Text>
        </View>
      </StickyHeader>

      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Your content */}
      </Animated.ScrollView>
    </View>
  );
}
```

## Props

### ScrollViewWithStickyHeader

- `title` (string, required): Tiêu đề chính
- `subtitle` (string, optional): Tiêu đề phụ
- `headerContent` (ReactNode, optional): Nội dung tùy chỉnh trong header
- `gradientColors` (string[], optional): Màu gradient, mặc định ["#667eea", "#764ba2"]
- `onBackPress` (function, optional): Custom back handler
- `children` (ReactNode, required): Nội dung scroll

### StickyHeader

- `title` (string, required): Tiêu đề chính
- `subtitle` (string, optional): Tiêu đề phụ
- `scrollY` (Animated.Value, required): Animated value từ scroll
- `children` (ReactNode, optional): Nội dung tùy chỉnh trong header
- `gradientColors` (string[], optional): Màu gradient
- `onBackPress` (function, optional): Custom back handler

## Hiệu ứng

Khi scroll:

- Header sẽ thu nhỏ từ ~200px xuống 80px
- Title lớn sẽ fade out
- Title nhỏ (compact) sẽ fade in ở giữa
- Content trong header sẽ fade out
- Back button luôn hiển thị

## Ví dụ thực tế

Xem file `app/expenses/report.tsx` để thấy cách áp dụng vào màn hình report.
