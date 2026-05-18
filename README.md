# 👁️ VisionGuard

[![MIT License](https://img.shields.io/badge/license-MIT-emerald.svg?style=flat-square)](LICENSE)
[![Platform Support](https://img.shields.io/badge/platform-Windows-blue.svg?style=flat-square)](https://www.microsoft.com/windows)
[![Electron Version](https://img.shields.io/badge/Electron-v35.0.0-47848F.svg?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![C# Installer](https://img.shields.io/badge/C%23-Native_Installer-blueviolet.svg?style=flat-square&logo=c-sharp&logoColor=white)](Installer.cs)
[![Supported Languages](https://img.shields.io/badge/languages-ID%20%7C%20EN%20%7C%20ES%20%7C%20JA-orange.svg?style=flat-square)](#-multi-language-localization)

> **VisionGuard** is a premium, beautifully crafted desktop application built on Electron and powered by a native C# installer. It enforces the clinical **20-20-20 rule** (look at something 20 feet away for 20 seconds every 20 minutes) to prevent Computer Vision Syndrome (CVS) and protect the eye health of developers and heavy computer users.

---

## ✨ Features

- **🎨 Obsidian Dark Glassmorphic UI**: Sleek, modern, high-contrast settings dashboard built with standard CSS, featuring custom HSL gradients, elegant typography, and micro-animations.
- **🖥️ Fullscreen Break Enforcer**: A fullscreen, multi-display supportive eye-break overlay that loads above standard system menus (using Windows screen-saver priority) to guarantee you rest your eyes.
- **⚡ Smart Idle & PC State Detection**: Built-in integration with Electron's `powerMonitor` that pauses the countdown automatically when your Windows screen locks, sleeps, or suspends, and seamlessly resumes when you return.
- **📊 Daily Eye-Care Statistics**: Real-time tracking of screen time, completed breaks, and skipped breaks, including a rolling 7-day database visualization stored safely in `%APPDATA%`.
- **🔌 Background System Tray**: Runs lightweight in the system tray with a dynamic right-click menu, allowing you to force-start a break, pause reminders, or shift languages instantly.
- **🌐 Multi-Language Localization**: Full translation matching settings across English (🇬🇧), Indonesian (🇮🇩), Spanish (🇪🇸), and Japanese (🇯🇵) in the Dashboard, Overlay, System Tray, and Setup wizard.
- **📦 C# Native Setup Pipeline**: Professional multi-lingual Windows Installer (`Installer.cs` & `Uninstaller.cs`) that registers the app officially in the Control Panel's *Add/Remove Programs*, generates shortcuts, and cleans up active processes automatically.

---

## 🛠️ Tech Stack

- **Shell Framework**: [Electron v35.0.0](https://electronjs.org/) (NodeJS 22+ compatible)
- **Frontend Dashboard & Overlay**: HTML5, Vanilla CSS3 (Glassmorphism, custom CSS variables, CSS Keyframes), ES6 JavaScript
- **Native OS Installer**: C# (.NET Framework) with Forms UI & PowerShell registry integration
- **Storage Layer**: Asynchronous local JSON filesystem store

---

## 📂 Project Structure

```bash
VisionGuard/
├── Installer.cs                # Sleek C# installer form code (compiles to Setup.exe)
├── Uninstaller.cs              # Sleek C# uninstaller form code (compiles to Uninstaller.exe)
├── Start-VisionGuard.bat       # Developer launch shortcut
├── main.js                     # Main Electron process (handles timer, windows, & tray)
├── package.json                # Project configuration & Node packages
├── src/                        # Source files
│   ├── dashboard/              # Settings & statistics window
│   │   ├── index.html
│   │   ├── renderer.js
│   │   └── style.css
│   ├── overlay/                # Fullscreen break blocker overlay window
│   │   ├── index.html
│   │   ├── renderer.js
│   │   └── style.css
│   └── shared/                 # Core shared modules
│       ├── store.js            # Safe JSON statistics & settings storage
│       ├── translations.js     # Multilingual translation dictionary
│       ├── create-icon.js      # Core canvas icon generators
│       └── icon.ico            # Active tray and window brand icons
└── LICENSE                     # MIT Open Source License
```

---

## ⚙️ Application State & Communication Flow

This diagram visualizes how the Electron Main Process communicates with the Dashboard, full-screen Overlay, native System Tray, and the local JSON Storage layer.

```mermaid
sequenceDiagram
    autonumber
    participant main as Electron Main (main.js)
    participant tray as System Tray Menu
    participant db as Dashboard UI (Renderer)
    participant ov as Break Overlay (Fullscreen)
    participant store as JSON Database (store.js)

    Note over main: App Bootstrapping
    main->>store: Load current settings & daily stats
    store-->>main: Return config (default: 20-min intervals)
    main->>main: Initialize Tray & start countdown timer
    
    rect rgb(20, 25, 35)
        Note over main, db: Standard Timer Tick
        main->>db: Broadcast secondsRemaining (every 1s)
        db->>db: Update countdown ring & progress percentage
    end

    alt PC Locked / Sleep Triggered
        main->>main: Pause countdown (powerMonitor listener)
    else PC Unlocked / Awakened
        main->>main: Resume countdown
    end

    Note over main: Timer reaches 0:00 (Break Due)
    main->>main: Spawn Fullscreen Overlay Window
    main->>ov: Lock screen, load duration, play chimes
    main->>db: Notify pause countdown

    choice Overlay Interaction
        alt Break Complete (20 seconds finished)
            ov->>main: Send IPC 'break-complete'
            main->>store: Increment completedBreaks & add screenTime
            main->>db: Trigger statistics refresh
        else Skip Break (Clicked skip button)
            ov->>main: Send IPC 'break-skip'
            main->>store: Increment skippedBreaks & reset
            main->>db: Trigger statistics refresh
        end
    end

    main->>ov: Close Overlay Window
    main->>main: Reset countdown to user configured interval
```

---

## 🚀 Quickstart for Developers

To run VisionGuard locally on your computer in development mode, follow these simple steps:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (version 18 or newer).

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/vision-guard.git
cd vision-guard
```

### 2. Install NPM Dependencies
```bash
npm install
```

### 3. Run the Application
You can launch the app through npm scripts:
```bash
npm start
```

Or run the pre-configured Windows launcher:
```bash
Start-VisionGuard.bat
```

---

## 📦 Production Builds (Standalone & Setup Installer)

If you are ready to package VisionGuard for distribution, you can build a standalone executable folder and wrap it into a native, premium C# setup wizard (`VisionGuard-Setup.exe`). 

Follow these steps sequentially in Windows PowerShell:

### 1. Build the Standalone Electron App
We package the Electron source code into a standalone directory containing the chromium engine and NodeJS dependencies using `electron-packager`:

```powershell
# Pack the app into a standalone folder named 'VisionGuard'
npx electron-packager . VisionGuard --platform=win32 --arch=x64 --overwrite --icon=src/shared/icon.ico
```
This generates a folder named `VisionGuard/` in your root directory containing `VisionGuard.exe`.

### 2. Compile the C# Uninstaller
The uninstaller must be compiled first so it can be packaged inside the main installer archive:

```powershell
# Compile the C# Uninstaller code into Uninstall-VisionGuard.exe
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:winexe /out:Uninstall-VisionGuard.exe Uninstaller.cs
```

### 3. Assemble the Distribution Folder
Move the compiled `Uninstall-VisionGuard.exe` into the built `VisionGuard/` standalone folder, so it will be extracted on the user's PC during installation:

```powershell
# Copy the uninstaller inside the packaged Electron folder
Move-Item -Path .\Uninstall-VisionGuard.exe -Destination .\VisionGuard\ -Force
```

### 4. Compress the Package
Compress the entire `VisionGuard/` distribution folder into a file named `app.zip`. The C# installer will extract this archive on the user's system:

```powershell
# Zip the content of the VisionGuard directory (run in PowerShell)
Compress-Archive -Path .\VisionGuard\* -DestinationPath .\app.zip -Force
```

### 5. Compile the C# Native Setup Wizard (VisionGuard-Setup.exe)
Finally, compile the setup C# class (`Installer.cs`) into a professional setup executable, embedding the `app.zip` archive as a manifest resource:

```powershell
# Compile the Installer, embedding app.zip as a resource
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:winexe /out:VisionGuard-Setup.exe /reference:System.IO.Compression.dll /reference:System.IO.Compression.FileSystem.dll /resource:app.zip Installer.cs
```

---

### 🎉 Build Output Summary
After completing the steps above, you will obtain two distributable formats:
1. **Standalone Portability Folder (`VisionGuard/`)**: A folder containing `VisionGuard.exe` which can be shared as a zip and runs instantly without installation.
2. **Native Installer Package (`VisionGuard-Setup.exe`)**: A single-file installation wizard that automates multi-lingual settings, generates desktop/Start Menu icons, adds clean-slate `%APPDATA%` defaults, and officially registers the application in Windows Settings (*Add/Remove Programs*).


---

## 🛡️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Formulated with care by [Rekhzzz](https://github.com/Rekhzzz) & Antigravity. Keep your eyes safe and screen-time productive!*
