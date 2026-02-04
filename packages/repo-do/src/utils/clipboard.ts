import clipboardy from 'clipboardy';

export class ClipboardUtil {
  async copy(text: string): Promise<boolean> {
    try {
      await clipboardy.write(text);
      return true;
    } catch (error) {
      const platform = process.platform;
      let hint = '';
      
      if (platform === 'linux') {
        hint = ' Install xsel or xclip: sudo apt install xsel (Debian/Ubuntu) or sudo dnf install xsel (Fedora)';
      } else if (platform === 'darwin') {
        hint = ' This should work on macOS, please check your system permissions.';
      } else if (platform === 'win32') {
        hint = ' This should work on Windows, please check your system permissions.';
      }
      
      console.warn(`Warning: Failed to copy to clipboard.${hint}`);
      return false;
    }
  }
}

export const clipboardUtil = new ClipboardUtil();
