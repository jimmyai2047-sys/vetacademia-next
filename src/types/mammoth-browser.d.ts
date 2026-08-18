declare module "mammoth/mammoth.browser.min.js" {
  interface MammothResult {
    value: string;
    messages: unknown[];
  }
  interface MammothInput {
    arrayBuffer: ArrayBuffer;
    [key: string]: unknown;
  }
  interface MammothImage {
    read: (format: string) => Promise<string>;
    contentType: string;
    alt?: string;
  }
  interface MammothImageConverter {
    imgElement: (
      cb: (image: MammothImage) => Promise<{ src: string; alt?: string }>
    ) => unknown;
  }
  const mammoth: {
    convertToHtml: (
      input: MammothInput,
      options?: { convertImage?: unknown }
    ) => Promise<MammothResult>;
    images: MammothImageConverter;
  };
  export default mammoth;
}

declare module "mammoth" {
  interface MammothResult {
    value: string;
    messages: unknown[];
  }
  interface MammothImage {
    read: (format: string) => Promise<string>;
    contentType: string;
    alt?: string;
  }
  interface MammothImageConverter {
    imgElement: (
      cb: (image: MammothImage) => Promise<{ src: string }>
    ) => unknown;
  }
  const mammoth: {
    convertToHtml: (
      input: { buffer: Buffer },
      options?: { convertImage?: unknown }
    ) => Promise<MammothResult>;
    images: MammothImageConverter;
  };
  export default mammoth;
}
