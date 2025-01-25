declare module 'youtube-transcript-api' {
  interface TranscriptEntry {
    text: string;
    start: number;
    duration: number;
  }

  const TranscriptAPI: {
    getTranscript(videoID: string, config?: any): Promise<TranscriptEntry[]>;
    validateID(videoID: string, config?: any): Promise<boolean>;
  };

  export default TranscriptAPI;
}
