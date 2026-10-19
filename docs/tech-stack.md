# Editing the Tech Stack

Edit `src/data/tech-stack.json` to add, remove, or reorder technologies. The current entries are temporary examples. Changes appear after rebuilding or immediately in the development server.

```json
{
  "id": "react",
  "title": "React",
  "categories": ["frontend"],
  "logo": "/images/tech/react.svg",
  "logoLight": "/images/tech/react-light.svg"
}
```

- `id`: required unique lowercase identifier; use hyphens between words. Keep it stable when renaming a technology.
- `title`: required display name and accessible label.
- `categories`: one or more of `frontend`, `backend`, `ai`, `devops`, `tools`. Multiple categories make the technology appear in each matching filter.
- `logo`: required path under `/images/`, relative to `public`. Add the corresponding SVG, PNG, WebP, or AVIF file there. Prefer square SVGs with a tight viewBox. Use light-colored artwork here when the mark needs contrast on dark tiles.
- `logoLight`: optional alternative artwork for light mode; omitted values use `logo` in both themes.

For example, `/images/tech/react.svg` resolves to `public/images/tech/react.svg`. No remote image requests are needed at runtime. Use trusted SVGs and preserve the relevant brand and license requirements.

Array order determines initial placement. The twelve starter entries reproduce the reference's eleven outer logos and one inner logo. Smaller filtered sets redistribute automatically. Hover, keyboard focus, and touch reveal the name and categories; these tiles do not link elsewhere. Avoid excessively large lists because closely packed logos become hard to target.

An empty array is supported. All category controls remain available and an empty filter displays “No technologies added yet.” Invalid entries, duplicate IDs, unsupported categories, and missing local artwork stop the build with an error identifying the entry and field.

The section lives after Projects at `#tech-stack`. Its typography, paths, and logo tiles are live HTML/SVG/CSS; no section background image is used. Orbital animation pauses on hover/focus, outside the viewport, and when the document is hidden. Visitors can pause it explicitly. Reduced-motion mode and no JavaScript retain a static readable composition; filters require JavaScript.

## Asset sources

Starter logos come from [Devicon](https://github.com/devicons/devicon) and [Simple Icons](https://github.com/simple-icons/simple-icons). See `public/images/tech/NOTICE.md` for provenance and licenses. The center symbol reuses the portfolio's existing navbar brand path.
