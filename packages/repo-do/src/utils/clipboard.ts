import clipboardy from 'clipboardy';

export class ClipboardUtil {
  async copy(text: string): Promise<boolean> {
    try {
      await clipboardy.write(text);
      return true;
    } catch (error) {
      console.warn('Warning: Failed to copy to clipboard:', (error as Error).message);
      return false;
    }
  }
}

export const clipboardUtil = new ClipboardUtil();
