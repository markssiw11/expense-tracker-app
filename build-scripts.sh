#!/bin/bash

# Build Scripts cho Expense Tracker App
# Chạy: chmod +x build-scripts.sh
# Sau đó: ./build-scripts.sh [command]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if EAS CLI is installed
check_eas() {
    if ! command -v eas &> /dev/null; then
        print_error "EAS CLI chưa được cài đặt"
        echo "Chạy: npm install -g eas-cli"
        exit 1
    fi
    print_success "EAS CLI đã được cài đặt"
}

# Setup
setup() {
    print_header "Setup EAS Build"
    check_eas
    
    echo "Đăng nhập vào Expo..."
    eas login
    
    echo "Cấu hình project..."
    eas build:configure
    
    print_success "Setup hoàn tất!"
}

# Build iOS Preview
build_ios_preview() {
    print_header "Build iOS Preview (TestFlight)"
    check_eas
    
    print_warning "Build này sẽ được dùng cho TestFlight testing"
    eas build --platform ios --profile preview
    
    print_success "iOS Preview build hoàn tất!"
}

# Build iOS Production
build_ios_production() {
    print_header "Build iOS Production (App Store)"
    check_eas
    
    print_warning "Build này sẽ được submit lên App Store"
    read -p "Bạn có chắc chắn? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        eas build --platform ios --profile production
        print_success "iOS Production build hoàn tất!"
    else
        print_warning "Build đã bị hủy"
    fi
}

# Build Android Preview
build_android_preview() {
    print_header "Build Android Preview (APK)"
    check_eas
    
    print_warning "Build này sẽ tạo APK file cho testing"
    eas build --platform android --profile preview
    
    print_success "Android Preview build hoàn tất!"
}

# Build Android Production
build_android_production() {
    print_header "Build Android Production (AAB)"
    check_eas
    
    print_warning "Build này sẽ được submit lên Google Play Store"
    read -p "Bạn có chắc chắn? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        eas build --platform android --profile production
        print_success "Android Production build hoàn tất!"
    else
        print_warning "Build đã bị hủy"
    fi
}

# Build All Platforms
build_all() {
    print_header "Build All Platforms (Production)"
    check_eas
    
    print_warning "Build cả iOS và Android cho production"
    read -p "Bạn có chắc chắn? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        eas build --platform all --profile production
        print_success "Build tất cả platforms hoàn tất!"
    else
        print_warning "Build đã bị hủy"
    fi
}

# Submit iOS
submit_ios() {
    print_header "Submit iOS lên App Store"
    check_eas
    
    print_warning "Submit build mới nhất lên App Store Connect"
    eas submit --platform ios
    
    print_success "iOS đã được submit!"
}

# Submit Android
submit_android() {
    print_header "Submit Android lên Google Play"
    check_eas
    
    print_warning "Submit build mới nhất lên Google Play Console"
    eas submit --platform android
    
    print_success "Android đã được submit!"
}

# Check build status
check_builds() {
    print_header "Kiểm tra Build Status"
    check_eas
    
    eas build:list
}

# Update version
update_version() {
    print_header "Update Version"
    
    echo "Version hiện tại trong app.json:"
    grep -A 1 '"version"' app.json
    
    read -p "Nhập version mới (vd: 1.0.1): " new_version
    
    # Update version in app.json
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/\"version\": \".*\"/\"version\": \"$new_version\"/" app.json
    else
        # Linux
        sed -i "s/\"version\": \".*\"/\"version\": \"$new_version\"/" app.json
    fi
    
    print_success "Version đã được cập nhật thành $new_version"
    print_warning "Nhớ tăng buildNumber (iOS) và versionCode (Android) trong app.json"
}

# Clean and rebuild
clean_rebuild() {
    print_header "Clean và Rebuild"
    
    print_warning "Xóa node_modules và cache..."
    rm -rf node_modules
    
    print_warning "Cài đặt lại dependencies..."
    npm install
    
    print_warning "Clear EAS cache và rebuild..."
    read -p "Build platform nào? (ios/android/all): " platform
    eas build --platform "$platform" --clear-cache
    
    print_success "Clean và rebuild hoàn tất!"
}

# Show help
show_help() {
    echo -e "${BLUE}Expense Tracker App - Build Scripts${NC}"
    echo ""
    echo "Usage: ./build-scripts.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup                 - Setup EAS và cấu hình project"
    echo "  ios-preview          - Build iOS cho TestFlight"
    echo "  ios-production       - Build iOS cho App Store"
    echo "  android-preview      - Build Android APK cho testing"
    echo "  android-production   - Build Android AAB cho Play Store"
    echo "  build-all            - Build cả iOS và Android (production)"
    echo "  submit-ios           - Submit iOS lên App Store"
    echo "  submit-android       - Submit Android lên Play Store"
    echo "  check-builds         - Kiểm tra build status"
    echo "  update-version       - Update version number"
    echo "  clean-rebuild        - Clean cache và rebuild"
    echo "  help                 - Hiển thị help"
    echo ""
    echo "Examples:"
    echo "  ./build-scripts.sh setup"
    echo "  ./build-scripts.sh ios-preview"
    echo "  ./build-scripts.sh build-all"
}

# Main
case "$1" in
    setup)
        setup
        ;;
    ios-preview)
        build_ios_preview
        ;;
    ios-production)
        build_ios_production
        ;;
    android-preview)
        build_android_preview
        ;;
    android-production)
        build_android_production
        ;;
    build-all)
        build_all
        ;;
    submit-ios)
        submit_ios
        ;;
    submit-android)
        submit_android
        ;;
    check-builds)
        check_builds
        ;;
    update-version)
        update_version
        ;;
    clean-rebuild)
        clean_rebuild
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Command không hợp lệ: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
