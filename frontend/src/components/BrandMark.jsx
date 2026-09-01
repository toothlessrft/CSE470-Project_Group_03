// ArchiveEarth mark: a classical portico set off-centre in a solid disc.
// The two roof courses and the three columns break past the disc edge, leaving
// a crescent standing on the left — the same construction as a struck seal.
//
// Built from two paths: the disc with the portico envelope knocked out of it
// (evenodd), then the courses and columns painted back in. Both inherit
// `currentColor`, so the mark works on the dark app bar and on light pages.
//
// `size` defaults to em units so the mark scales with whatever type it sits
// beside. Keep the geometry in step with public/logo.svg and render_logo.py.

// Disc, with the portico envelope removed.
const DISC = "M48 8a42 42 0 1 0 0 84 42 42 0 0 0 0-84Z" + "M36 58 62 20l30 22v58H36Z";

// Roof courses and columns, painted back over the void.
const PORTICO =
  // upper course
  "M36 58 62 20l30 22v10L62 30 36 68Z" +
  // lower course
  "M36 72 62 34l30 22v10L62 44 36 82Z" +
  // three columns, rising from under the eaves
  "M45 68.8 52 58.6V98h-7Z" +
  "M57 51.3 62 44l2 1.5V98h-7Z" +
  "M69 49.1 76 54.3V98h-7Z";

export default function BrandMark({ size = "1.35em", ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={DISC} fillRule="evenodd" clipRule="evenodd" />
      <path d={PORTICO} />
    </svg>
  );
}
