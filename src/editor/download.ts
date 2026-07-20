function trigger(filename: string, href: string): void {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
}

export function downloadText(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  trigger(filename, url);
  URL.revokeObjectURL(url);
}

export function downloadDataURL(filename: string, dataURL: string): void {
  trigger(filename, dataURL);
}
