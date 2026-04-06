# SQL.js Offline Setup

This folder will contain the sql.js library files needed for offline operation.

## Quick Start

### Option 1: Automatic Download (Windows)
1. Double-click `download-sqljs.bat` in the root folder
2. Wait for the download to complete
3. You're done! The app now works offline

### Option 2: Manual Download
1. Download these files:
   - https://sql.js.org/dist/sql-wasm.js → save as `sql-wasm.js`
   - https://sql.js.org/dist/sql-wasm.wasm → save as `sql-wasm.wasm`

2. Place both files in this folder (lib/)

3. Your folder structure should look like:
   ```
   Conference Room Form V0.2.1/
   ├── lib/
   │   ├── sql-wasm.js
   │   └── sql-wasm.wasm
   ├── js/
   ├── css/
   ├── index.html
   └── ...
   ```

### Option 3: Using Node.js + npm (Advanced)
```bash
npm install sql.js
# Copy node_modules/sql.js/dist/sql-wasm.* to this lib folder
```

## How It Works

- The app first tries to load sql.js from the `lib/` folder (offline mode)
- If the files aren't found, it falls back to loading from CDN automatically
- Once the local files are downloaded, internet is not required

## File Sizes
- sql-wasm.js: ~1 MB
- sql-wasm.wasm: ~7 MB
- **Total: ~8 MB**

## Offline Status

After downloading, the entire app will work completely offline:
- ✓ Create rooms and save to local database
- ✓ Export/import database files
- ✓ Generate sample data
- ✓ View and search records
- ✓ No internet connection required

## Version Info
- sql.js version: Latest stable
- Download date: [When you run the script]
- Source: https://sql.js.org

---

**Note:** If you delete the files in this folder, the app will automatically switch back to using the CDN.
