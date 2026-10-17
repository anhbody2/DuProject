import type { App } from 'antd';

type MessageApi = ReturnType<typeof App.useApp>['message'];

let messageApi: MessageApi | null = null;

/** Called once by `<ToastBridge />` inside antd's `<App>` so toasts pick up the theme. */
export const bindToast = (api: MessageApi) => {
  messageApi = api;
};

/** Short brand-styled notice at the bottom of the screen (antd message, see base.css). */
export function toast(content: string) {
  messageApi?.open({ content, duration: 3 });
}
