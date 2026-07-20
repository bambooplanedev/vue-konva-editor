import { ref } from 'vue';

export const toastMessage = ref<string | null>(null);
let timer: ReturnType<typeof setTimeout> | undefined;

export function showToast(message: string): void {
  toastMessage.value = message;
  clearTimeout(timer);
  timer = setTimeout(() => (toastMessage.value = null), 4000);
}
