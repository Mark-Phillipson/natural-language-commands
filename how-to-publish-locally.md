# How to Publish the Extension Locally

This guide explains how to package and install your VS Code extension locally for testing and development.

## Prerequisites
- Node.js and npm installed
- VSCE (Visual Studio Code Extension Manager) installed globally:

```pwsh
npm install -g @vscode/vsce
```

## Steps to Publish Locally

1. **Open a terminal in the extension root folder:**
   ```pwsh
   cd c:\Users\MPhil\source\repos\MSP_VSCode_Extension\VSCodeNLCExtension\natural-language-commands
   ```

2. **Build the extension:**
   ```pwsh
   npm run compile
   ```
   _Or for continuous build during development:_
   ```pwsh
   npm run watch
   ```

3. **Package the extension:**
   ```pwsh
   vsce package
   ```
   This will create a `.vsix` file in the current directory.

4. **Install the extension in VS Code:**
   ```pwsh
   code --install-extension natural-language-commands-0.0.1.vsix
   ```
   Replace `<your-extension-name>.vsix` with the actual filename generated in the previous step.

5. **Reload or restart VS Code** to activate the extension.

---

## Notes
- You can uninstall the extension with:
  ```pwsh
  code --uninstall-extension <your-extension-name>
  ```
- For more info, see the [VSCE documentation](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).