export const durationByGroup: Record<number, number> = {
  3: 8,
  4: 10,
  5: 12,
  6: 14,
}

export const getDurationInFrames = (groupCount: number, fps: number) => {
  const seconds = durationByGroup[groupCount] ?? 8
  return seconds * fps
}

export const colorA = '#00c8ff'
export const colorB = '#0402f8'
