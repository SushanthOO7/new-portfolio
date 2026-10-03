const WORDS_PER_MINUTE = 225;

function zeroPrefix(value) {
  return value < 10 ? `0${value}` : String(value);
}

function formatTimecode(milliseconds) {
  const hours = milliseconds / 1000 / 60 / 60;
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const s = Math.floor(((hours - h) * 60 - m) * 60);
  const c = Math.floor(((((hours - h) * 60 - m) * 60 - s) * 1000) / 10);
  return `${zeroPrefix(h)}:${zeroPrefix(m)}:${zeroPrefix(s)}:${zeroPrefix(c)}`;
}

export function getArticleReadingTime(body) {
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  return formatTimecode((words / WORDS_PER_MINUTE) * 60 * 1000);
}

export function getSortedArticles(articles) {
  return [...articles].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function loadSortedArticles() {
  const { getCollection } = await import('astro:content');
  return getSortedArticles(await getCollection('articles'));
}
