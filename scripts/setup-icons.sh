#!/bin/bash

# Script to setup app icons
# Usage: ./scripts/setup-icons.sh

echo "🎨 Setting up App Icons for Quản Lý Chi Tiêu"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Open HTML generator
echo -e "${BLUE}Step 1: Opening icon generator...${NC}"
open scripts/generate-placeholder-icons.html

echo ""
echo -e "${YELLOW}📋 Instructions:${NC}"
echo "1. Wait for the browser to open"
echo "2. Click 'Download' button for each icon:"
echo "   - icon.png"
echo "   - splash-icon.png"
echo "   - android-icon-foreground.png"
echo "   - android-icon-background.png"
echo "   - favicon.png"
echo ""
echo "3. After downloading all icons, press ENTER to continue..."
read -p ""

# Step 2: Move files from Downloads
echo ""
echo -e "${BLUE}Step 2: Moving icons to assets/images/...${NC}"

DOWNLOADS_DIR="$HOME/Downloads"
ASSETS_DIR="assets/images"

# Check if files exist in Downloads
FILES=("icon.png" "splash-icon.png" "android-icon-foreground.png" "android-icon-background.png" "favicon.png")
MISSING_FILES=()

for file in "${FILES[@]}"; do
    if [ ! -f "$DOWNLOADS_DIR/$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Warning: Some files not found in Downloads:${NC}"
    for file in "${MISSING_FILES[@]}"; do
        echo "   - $file"
    done
    echo ""
    echo "Please download all icons first, then run this script again."
    exit 1
fi

# Move files
for file in "${FILES[@]}"; do
    if [ -f "$DOWNLOADS_DIR/$file" ]; then
        mv "$DOWNLOADS_DIR/$file" "$ASSETS_DIR/$file"
        echo -e "${GREEN}✓${NC} Moved $file"
    fi
done

# Step 3: Create android-icon-monochrome.png (copy from foreground)
echo ""
echo -e "${BLUE}Step 3: Creating monochrome icon...${NC}"
cp "$ASSETS_DIR/android-icon-foreground.png" "$ASSETS_DIR/android-icon-monochrome.png"
echo -e "${GREEN}✓${NC} Created android-icon-monochrome.png"

# Step 4: Verify
echo ""
echo -e "${BLUE}Step 4: Verifying icons...${NC}"
ALL_FILES=("${FILES[@]}" "android-icon-monochrome.png")

for file in "${ALL_FILES[@]}"; do
    if [ -f "$ASSETS_DIR/$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${YELLOW}✗${NC} $file (missing)"
    fi
done

echo ""
echo -e "${GREEN}🎉 Done! Icons are ready.${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Run: ${YELLOW}npx expo prebuild --clean${NC}"
echo "2. Or run: ${YELLOW}npx expo start${NC}"
echo ""
