# How to Publish the Extension (Locally & Marketplace)

This guide explains how to package, install, and publish your VS Code extension both locally and to the Visual Studio Code Marketplace.

---

## 🚀 Local Publishing (for Testing & Development)

### Prerequisites
- Node.js and npm installed
- VSCE (Visual Studio Code Extension Manager) installed globally:
  ```pwsh
  npm install -g @vscode/vsce
  ```

### Steps
1. **Open a terminal in the extension root folder:**
   ```pwsh
   cd c:\Users\MPhil\source\repos\MSP_VSCode_Extension\VSCodeNLCExtension\natural-language-commands
   ```
2. **Build the extension:**
   ```pwsh
   npm run compile
   ```
   _Or for continuous build:_
   ```pwsh
   npm run watch
   ```
3. **Package the extension:**
   ```pwsh
   vsce package
   ```
   This creates a `.vsix` file in the current directory.
4. **Install the extension in VS Code:**
   ```pwsh
   code --install-extension <your-extension-name>.vsix
   ```
5. **Reload or restart VS Code** to activate the extension.

---

## 🌍 Publishing to the VS Code Marketplace

### Prerequisites
- Microsoft account (sign in at https://marketplace.visualstudio.com/manage)
- [VSCE](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) installed globally
- [Azure DevOps CLI](https://aka.ms/azure-devops-cli) (`tfx-cli`) installed globally:
  ```pwsh
  npm install -g tfx-cli
  ```

### Steps
1. **Create a Publisher** (only once):
   ```pwsh
   vsce create-publisher <publisher-name>
   ```
   Follow the prompts to link your publisher to your Microsoft account.
2. **Build and package your extension:**
   ```pwsh
   npm run compile
   vsce package
   ```
3. **Publish the extension:**
   ```pwsh
   vsce publish minor
   ```
   - The first time, you’ll be prompted for a Personal Access Token (PAT) from Azure DevOps ([generate here](https://dev.azure.com)).
4. **Verify your extension** on the [Marketplace](https://marketplace.visualstudio.com/vscode).
5. **Update your extension** in the future by bumping the version in `package.json` and running `vsce publish` again.

---

## 📝 Notes
- Make sure your `README.md`, `CHANGELOG.md`, and `package.json` are complete and accurate.
- Test your extension thoroughly before publishing.
- Use `vsce publish minor` or `vsce publish patch` to auto-increment the version.
- Uninstall a local extension with:
  ```pwsh
  code --uninstall-extension <your-extension-name>
  ```
- For more info, see the [VSCE documentation](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).
