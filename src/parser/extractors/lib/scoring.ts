import type { TextItems, TextScore, FeatureSet } from '../../types';

function computeScores(items: TextItems, featureSets: FeatureSet[]): TextScore[] {
  const scores: TextScore[] = items.map((item) => ({
    text: item.text,
    score: 0,
    match: false,
  }));

  items.forEach((item, idx) => {
    featureSets.forEach(([matcher, score, extractMatch]) => {
      const result = matcher(item);
      if (!result) return;

      const matched = extractMatch && typeof result === 'object' ? result[0] : item.text;
      const entry = scores[idx];

      if (matched === item.text) {
        entry.score += score;
        if (extractMatch) entry.match = true;
      } else {
        scores.push({ text: matched, score, match: true });
      }
    });
  });

  return scores;
}

export function selectBestMatch(
  items: TextItems,
  featureSets: FeatureSet[],
  requirePositiveScore = true,
  joinTiedResults = false,
): readonly [string, TextScore[]] {
  const scores = computeScores(items, featureSets);

  const best = scores.reduce<{ texts: string[]; highest: number }>(
    (acc, { text, score }) => {
      if (score > acc.highest) return { texts: [text], highest: score };
      if (score === acc.highest) return { texts: [...acc.texts, text], highest: score };
      return acc;
    },
    { texts: [], highest: -Infinity },
  );

  if (requirePositiveScore && best.highest <= 0) return ['', scores] as const;

  const text = joinTiedResults ? best.texts.map((s) => s.trim()).join(' ') : (best.texts[0] ?? '');

  return [text, scores] as const;
}
