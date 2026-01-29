export type Album = {
  id: string;
  title: string;
  artist: string;
  year: number;
  tracks: string[];
  coverUrl: string;
};

export type Guess = {
  title: string;
  artist: string;
  year: string;
  songs: string;
  checked: boolean;
};

export type GuessResult = {
  titleCorrect: boolean;
  artistCorrect: boolean;
  yearCorrect: boolean;
  songsCorrect: boolean;
  songMatches: number;
  songTotal: number;
  correctCount: number;
};
