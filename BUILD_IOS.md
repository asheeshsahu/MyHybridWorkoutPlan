# Build Hybrid Fit for iOS (Install on Phone)

## Option 1: Local build (phone connected via USB)

**Requirements:** Mac with Xcode, CocoaPods, iPhone connected via USB cable

### Install CocoaPods (if needed)

```bash
sudo gem install cocoapods
# or: brew install cocoapods
```

### Build and install

```bash
# Connect your iPhone via USB, unlock it, and trust the computer
npx expo run:ios --device
```

This builds and installs the app directly on your connected iPhone. No Expo account needed.

---

## Option 2: EAS Build (cloud build, install via link)

**Requirements:** Expo account (free), Apple Developer account ($99/year) for production, or device registration for preview

### Step 1: Log in to Expo

```bash
npx eas-cli login
```

### Step 2: Register your iPhone (for preview/internal build)

```bash
npx eas-cli device:create
```

Open the URL on your iPhone, download the profile, go to **Settings → General → VPN & Device Management** and install it.

### Step 3: Build for iOS

```bash
npx eas-cli build --platform ios --profile preview
```

When the build finishes, you'll get a link to download the `.ipa`. Open it on your iPhone to install.

### Step 4 (optional): Production build for App Store

```bash
npx eas-cli build --platform ios --profile production
```

---

## Quick start (recommended)

If you have Xcode and your iPhone handy:

```bash
cd /Users/asheesh.sahu/.cursor/worktrees/HybridFitApp/eae
npx expo run:ios --device
```
