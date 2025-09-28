# Colorfy Browser Extension 🎨

A powerful Chrome extension that allows you to customize website colors with multiple style management, beautiful color palettes, and an intuitive interface.

![Colorfy Logo](assets/logos/logo_32.png)

## ✨ Features

- **🎨 Multi-Style Management**: Create up to 5 different color styles per website
- **🌈 Rich Color Palettes**: Choose from beautiful pre-made color schemes
- **⚡ Real-time Switching**: Instantly switch between different color styles
- **💾 Smart Storage**: Efficient storage management with expandable website/style deletion
- **🌙 Dark Mode Support**: Complete dark mode implementation across all interfaces
- **📱 Modern UI**: Beautiful, responsive interface with gradient backgrounds
- **🔧 Advanced Options**: Comprehensive settings page with storage management

## 🚀 Installation

### For Users
1. Download from the Chrome Web Store (link coming soon)
2. Click "Add to Chrome"
3. Grant necessary permissions
4. Start customizing websites!

### For Developers
1. Clone this repository:
   ```bash
   git clone https://github.com/nikolamand/Colorfy.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the cloned folder
5. The extension is now ready for development!

## 🎯 How to Use

1. **Click the Colorfy extension icon** in your browser toolbar
2. **Select an element** on the webpage you want to recolor
3. **Choose a color** from the beautiful palette or use the color picker
4. **Create multiple styles** using the style selector dropdown
5. **Switch between styles** instantly or edit them using the management modal

### 🎨 Multi-Style System
- **Original Style**: Always available, shows the unmodified webpage
- **Custom Styles**: Create up to 5 different color schemes per website
- **Style Management**: Use the "Edit" button to rename, delete, or organize styles

## 🛠️ Technical Details

### Built With
- **Manifest V3** - Latest Chrome extension standard
- **Vanilla JavaScript** - No frameworks, pure performance
- **Modern CSS** - Beautiful gradients, animations, and responsive design
- **Chrome Storage API** - Efficient data persistence with versioning

### Architecture
- **Modular Design**: Clean separation of concerns across multiple modules
- **Storage Versioning**: Automatic migration system for updates
- **Multi-style Support**: Advanced data structure supporting multiple color schemes
- **Dark Mode**: Complete theming system with automatic detection

## 📚 Documentation

For detailed technical documentation, see the [docs](./docs) folder:
- [Project Structure](./docs/PROJECT_STRUCTURE.md)
- [Multi-Style Features](./docs/MULTI_STYLE_FEATURES.md)
- [File Structure](./docs/FILE_STRUCTURE.md)

## 🔄 Recent Updates

### Version 1.1.0 - Multi-Style Features
- ✅ Multiple color styles per website
- ✅ Advanced storage management modal
- ✅ Enhanced UI with style selector
- ✅ Complete dark mode implementation
- ✅ Modern options page redesign

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Author

**Nikola Mandić** - [@nikolamand](https://github.com/nikolamand)

---

<sub><sup>*Available on the [Chrome Web Store](https://chromewebstore.google.com/detail/colorfy/nbdflkflpbgpfmnchfpjmobfgaahnbec)! 🚀*</sup></sub>



## 🔒 Permissions

### Storage Permission
This extension requires `unlimitedStorage` permission to accommodate users who extensively customize colors across many websites. With the new multi-style functionality allowing multiple color schemes per website, storage needs can grow significantly for power users. This permission ensures the extension can store unlimited color customizations without hitting Chrome's storage quotas, providing a seamless experience regardless of how many websites and styles users create.
