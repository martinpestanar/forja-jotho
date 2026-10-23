declare module '@thenick775/mgba-wasm' {
  export interface mGBAEmulator {
    FS: {
      readFile(path: string): Uint8Array;
      writeFile(path: string, data: Uint8Array): void;
      unlink?(path: string): void;
    };
    FSInit(): Promise<void>;
    loadGame(path: string): void;
    pauseGame(): void;
    resumeGame(): void;
    quitGame?(): void;
  }

  export default function mGBA(options: { canvas: HTMLCanvasElement }): Promise<mGBAEmulator>;
}
