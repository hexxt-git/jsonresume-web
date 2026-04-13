export interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
  hasEOL: boolean;
}

export type TextItems = TextItem[];
export type Line = TextItem[];
export type Lines = Line[];
export type SectionMap = Record<string, Lines>;
export type SubsectionList = Lines[];

export interface TextScore {
  text: string;
  score: number;
  match: boolean;
}

type Score = -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4;
export type FeatureSet =
  | [(item: TextItem) => boolean, Score]
  | [(item: TextItem) => RegExpMatchArray | null, Score, boolean];
