export interface SubtitleSegment {
  id: string;
  start: number;
  end: number;
  text: string;
}

export type FontFamilyType = 'Arial' | 'Roboto' | 'Montserrat' | 'Poppins';
export type FontSizeType = 'small' | 'medium' | 'large' | 'auto';
export type FontColorType = 'white' | 'yellow' | 'green' | 'blue';
export type PositionType = 'top' | 'center' | 'bottom';

export interface SubtitleStyle {
  fontFamily: FontFamilyType;
  fontSize: FontSizeType;
  fontColor: FontColorType;
  position: PositionType;
  outline: boolean;
}

export interface VideoMetadata {
  name: string;
  size: number;
  duration: number;
  resolution: string;
  url: string | null;
}

export interface AppStats {
  totalVideos: number;
  totalSubtitles: number;
  totalDuration: number;
}
