// Declaração de tipos para Google Analytics gtag
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: {
        send_page_view?: boolean;
        page_title?: string;
        page_location?: string;
        [key: string]: any;
      }
    ) => void;
    dataLayer: any[];
  }
}

export {};
