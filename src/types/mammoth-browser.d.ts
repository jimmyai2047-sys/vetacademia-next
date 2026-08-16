declare module "mammoth/mammoth.browser.min.js" {
  interface MammothResult {
    value: string;
    messages: unknown[];
  }
  interface MammothInput {
    arrayBuffer: ArrayBuffer;
  }
  const mammoth: {
    convertToHtml: (input: MammothInput) => Promise<MammothResult>;
  };
  export default mammoth;
}
