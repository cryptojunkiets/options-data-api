// env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    DATA_INPUT_PATH: string;
    API_OUTPUT_PATH: string;
  }
}
