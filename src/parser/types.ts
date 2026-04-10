export interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
  hasEOL: boolean;
}

export type Line = TextItem[];
export type Lines = Line[];
export type Sections = Record<string, Lines>;

export type FeatureSet =
  | [matcher: (item: TextItem) => boolean, score: number]
  | [matcher: (item: TextItem) => RegExpMatchArray | null, score: number, returnMatchOnly: true];
