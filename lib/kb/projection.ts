export interface Point2D {
  x: number;
  y: number;
}

function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

function unit(vector: number[]): number[] {
  const norm = Math.sqrt(dot(vector, vector)) || 1;
  return vector.map((value) => value / norm);
}

function powerIteration(rows: number[][], dim: number, iterations = 64): number[] {
  let component = unit(Array.from({ length: dim }, (_, i) => Math.sin(i + 1)));
  for (let step = 0; step < iterations; step++) {
    const next = new Array(dim).fill(0);
    for (const row of rows) {
      const projection = dot(row, component);
      for (let i = 0; i < dim; i++) next[i] += projection * row[i];
    }
    component = unit(next);
  }
  return component;
}

function deflate(rows: number[][], component: number[]): number[][] {
  return rows.map((row) => {
    const projection = dot(row, component);
    return row.map((value, i) => value - projection * component[i]);
  });
}

function normalizeAxis(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  if (span === 0) return values.map(() => 0.5);
  return values.map((value) => (value - min) / span);
}

export function project2D(vectors: number[][]): Point2D[] {
  const count = vectors.length;
  if (count === 0) return [];
  if (count === 1) return [{ x: 0.5, y: 0.5 }];

  const dim = vectors[0].length;
  const mean = new Array(dim).fill(0);
  for (const vector of vectors) for (let i = 0; i < dim; i++) mean[i] += vector[i];
  for (let i = 0; i < dim; i++) mean[i] /= count;

  const centered = vectors.map((vector) => vector.map((value, i) => value - mean[i]));
  const pc1 = powerIteration(centered, dim);
  const pc2 = powerIteration(deflate(centered, pc1), dim);

  const xs = normalizeAxis(centered.map((row) => dot(row, pc1)));
  const ys = normalizeAxis(centered.map((row) => dot(row, pc2)));
  return xs.map((x, i) => ({ x, y: ys[i] }));
}
