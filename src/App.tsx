import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { albums } from "./data/albums";
import { Confetti } from "./components/Confetti";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { Album, Guess, GuessResult } from "./types";
import { isLooseMatch, splitSongs } from "./utils/normalize";

const EMPTY_GUESS: Guess = {
  title: "",
  artist: "",
  year: "",
  songs: "",
  checked: false,
};

const QUIZ_ALBUM_COUNT = 7;
const totalAttributes = 4;

const pickRandomAlbums = (source: Album[], count: number) => {
  const copy = [...source];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
};

const isYearMatch = (input: string, year: number) => {
  const trimmed = input.trim();
  if (!trimmed) return false;
  const parsed = Number.parseInt(trimmed, 10);
  if (Number.isNaN(parsed)) return false;

  if (trimmed.length <= 2) {
    return 1900 + parsed === year;
  }

  return parsed === year;
};

const evaluateGuess = (album: Album, guess: Guess): GuessResult => {
  const titleCorrect = isLooseMatch(guess.title, album.title);
  const artistCorrect = isLooseMatch(guess.artist, album.artist);
  const yearCorrect = isYearMatch(guess.year, album.year);

  const entries = splitSongs(guess.songs);
  const matchedTracks = new Set<number>();

  entries.forEach((entry) => {
    album.tracks.forEach((track, index) => {
      if (isLooseMatch(entry, track)) {
        matchedTracks.add(index);
      }
    });
  });

  const songMatches = matchedTracks.size;
  const songTotal = album.tracks.length;
  const songThreshold = Math.max(1, Math.ceil(songTotal * 0.4));
  const songsCorrect = songMatches >= songThreshold;

  const correctCount =
    Number(titleCorrect) +
    Number(artistCorrect) +
    Number(yearCorrect) +
    Number(songsCorrect);

  return {
    titleCorrect,
    artistCorrect,
    yearCorrect,
    songsCorrect,
    songMatches,
    songTotal,
    correctCount,
  };
};

const getFieldClass = (
  checked: boolean,
  correct: boolean,
  partial = false
) => {
  if (!checked) return "field";
  if (correct) return "field field--correct";
  if (partial) return "field field--partial";
  return "field field--wrong";
};

const isPerfectResult = (result: GuessResult) =>
  result.titleCorrect &&
  result.artistCorrect &&
  result.yearCorrect &&
  result.songMatches > 0;

export default function App() {
  const [quizAlbums, setQuizAlbums] = useState(() =>
    pickRandomAlbums(albums, QUIZ_ALBUM_COUNT)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confettiSeed, setConfettiSeed] = useState(1);
  const [confettiActive, setConfettiActive] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [guesses, setGuesses] = useLocalStorage<Record<string, Guess>>(
    "album-quiz-guesses-v1",
    {}
  );

  const isResults = currentIndex === quizAlbums.length;
  const album = quizAlbums[Math.min(currentIndex, quizAlbums.length - 1)];
  const guess = guesses[album.id] ?? EMPTY_GUESS;
  const result = useMemo(() => evaluateGuess(album, guess), [album, guess]);

  const handleInputChange = (field: keyof Guess) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setGuesses((prev) => ({
        ...prev,
        [album.id]: {
          ...guess,
          [field]: value,
        },
      }));
    };

  const triggerConfetti = () => {
    setConfettiSeed((seed) => seed + 1);
    setConfettiActive(true);
    window.setTimeout(() => setConfettiActive(false), 1200);
  };

  const handleCheck = () => {
    const nextGuess = { ...guess, checked: true };
    const nextResult = evaluateGuess(album, nextGuess);

    setGuesses((prev) => ({
      ...prev,
      [album.id]: nextGuess,
    }));

    if (isPerfectResult(nextResult)) {
      triggerConfetti();
    }
  };

  const handleReset = () => {
    setGuesses((prev) => ({
      ...prev,
      [album.id]: { ...EMPTY_GUESS },
    }));
  };

  const handleResetAll = () => {
    const confirmed = window.confirm(
      "Start over and clear all answers? This cannot be undone."
    );
    if (!confirmed) return;

    setGuesses({});
    setRevealed({});
    setCurrentIndex(0);
    setQuizAlbums(pickRandomAlbums(albums, QUIZ_ALBUM_COUNT));
    setConfettiActive(false);
  };

  const handlePrevious = () => {
    setCurrentIndex((index) =>
      index === 0 ? quizAlbums.length - 1 : index - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((index) =>
      index === quizAlbums.length - 1 ? quizAlbums.length : index + 1
    );
  };

  const checkedCount = quizAlbums.filter((item) => guesses[item.id]?.checked)
    .length;
  const correctAlbumCount = useMemo(
    () =>
      quizAlbums.reduce((count, item) => {
        const storedGuess = guesses[item.id];
        if (!storedGuess?.checked) {
          return count;
        }
        const albumResult = evaluateGuess(item, storedGuess);
        return count + Number(isPerfectResult(albumResult));
      }, 0),
    [guesses, quizAlbums]
  );
  const allCorrect = correctAlbumCount === quizAlbums.length;
  const isRevealed = revealed[album.id] ?? false;
  const scoreLabel = guess.checked
    ? `${result.correctCount}/${totalAttributes} attributes`
    : "Not checked";

  useEffect(() => {
    if (isResults && allCorrect) {
      triggerConfetti();
    }
  }, [allCorrect, isResults]);

  return (
    <div className="app">
      <Confetti seed={confettiSeed} active={confettiActive} />
      <header>
        <h1>CoverUp</h1>
        <p>
          70s & 80s edition. Name the album, artist, year, and a few tracks to
          prep your team for the quiz night.
        </p>
        <div className="progress">
          <span className="progress__chip">
            Checked: {checkedCount}/{quizAlbums.length}
          </span>
          <button className="button-ghost" onClick={handleResetAll}>
            Reset everything
          </button>
        </div>
      </header>

      {isResults ? (
        <section className="layout">
          <div className="form-card results-card">
            <h2>Results</h2>
            <p className="results-card__score">
              You got {correctAlbumCount}/{quizAlbums.length} questions correct.
            </p>
            <div className="results-card__status">
              {allCorrect
                ? "Perfect run! You nailed every album."
                : "Review the albums to push for a perfect score."}
            </div>
            <div className="actions">
              <button
                className="button-secondary"
                onClick={() => setCurrentIndex(quizAlbums.length - 1)}
              >
                Back to last album
              </button>
              <button className="button-ghost" onClick={() => setCurrentIndex(0)}>
                Start over
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="layout">
          <div className="cover-card">
            <img src={album.coverUrl} alt="Album cover art" loading="lazy" />
            <div className="album-meta">
              <div>
                <div className="album-meta__title">
                  Album {currentIndex + 1} of {quizAlbums.length}
                </div>
                <div className="field__hint">
                  {isRevealed
                    ? `${album.title} • ${album.artist}`
                    : "Reveal when you're ready."}
                </div>
              </div>
              <div className="album-meta__year">
                {isRevealed ? album.year : "??"}
              </div>
            </div>
            {isRevealed && (
              <div className="album-tracks">
                <div className="album-tracks__label">Tracks</div>
                <ol className="album-tracks__list">
                  {album.tracks.map((track, index) => (
                    <li key={`${track}-${index}`}>{track}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <div className="form-card">
            <h2>Write your answers</h2>

            <div className={getFieldClass(guess.checked, result.titleCorrect)}>
              <label htmlFor="title">Album title</label>
              <input
                id="title"
                type="text"
                placeholder="e.g. Hounds of Love"
                value={guess.title}
                onChange={handleInputChange("title")}
              />
              {guess.checked && (
                <p
                  className={`field__result ${result.titleCorrect ? "ok" : "miss"}`}
                >
                  {result.titleCorrect ? "Correct title" : "Not quite"}
                </p>
              )}
            </div>

            <div className={getFieldClass(guess.checked, result.artistCorrect)}>
              <label htmlFor="artist">Artist</label>
              <input
                id="artist"
                type="text"
                placeholder="e.g. Kate Bush"
                value={guess.artist}
                onChange={handleInputChange("artist")}
              />
              {guess.checked && (
                <p
                  className={`field__result ${
                    result.artistCorrect ? "ok" : "miss"
                  }`}
                >
                  {result.artistCorrect ? "Correct artist" : "Not quite"}
                </p>
              )}
            </div>

            <div className={getFieldClass(guess.checked, result.yearCorrect)}>
              <label htmlFor="year">Release year</label>
              <input
                id="year"
                type="text"
                placeholder="e.g. 85 or 1985"
                value={guess.year}
                onChange={handleInputChange("year")}
              />
              <span className="field__hint">Two-digit years are accepted.</span>
              {guess.checked && (
                <p className={`field__result ${result.yearCorrect ? "ok" : "miss"}`}>
                  {result.yearCorrect ? "Correct year" : "Not quite"}
                </p>
              )}
            </div>

            <div
              className={getFieldClass(
                guess.checked,
                result.songsCorrect,
                result.songMatches > 0 && !result.songsCorrect
              )}
            >
              <label htmlFor="songs">Songs (comma separated)</label>
              <textarea
                id="songs"
                rows={3}
                placeholder="e.g. Running Up That Hill, Cloudbusting, Hounds of Love"
                value={guess.songs}
                onChange={handleInputChange("songs")}
              />
              <span className="field__hint">
                Partial credit counts. Try 2+ tracks for a bonus.
              </span>
              {guess.checked && (
                <p
                  className={`field__result ${
                    result.songsCorrect
                      ? "ok"
                      : result.songMatches > 0
                        ? "partial"
                        : "miss"
                  }`}
                >
                  {result.songMatches}/{result.songTotal} tracks matched
                </p>
              )}
            </div>

            <div className="actions">
              <button className="button-primary" onClick={handleCheck}>
                Check answers
              </button>
              <button className="button-ghost" onClick={handleReset}>
                Clear this album
              </button>
              <button
                className="button-ghost"
                onClick={() =>
                  setRevealed((prev) => ({
                    ...prev,
                    [album.id]: !isRevealed,
                  }))
                }
              >
                {isRevealed ? "Hide answer" : "Reveal answer"}
              </button>
            </div>

            <div className="nav">
              <div className="nav__buttons">
                <button className="button-secondary" onClick={handlePrevious}>
                  Previous
                </button>
                <button className="button-secondary" onClick={handleNext}>
                  Next
                </button>
              </div>
              <div className="score">{scoreLabel}</div>
            </div>

            <p className="footer-note">
              Tip: Get the title, artist, year, and at least one track to trigger the
              confetti.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
