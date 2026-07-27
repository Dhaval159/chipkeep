type PerfMark = {
  name: string
  time: number
}

const marks: PerfMark[] = []
const sessionId = Date.now()

export function perfMark(name: string): void {
  marks.push({ name, time: performance.now() })
}

function markTime(name: string): number {
  const m = marks.find((x) => x.name === name)
  return m ? m.time : 0
}

export function perfMeasure(from: string, to: string, label: string): void {
  const fromT = markTime(from)
  const toT = markTime(to)
  if (fromT && toT) {
    const dur = (toT - fromT).toFixed(2)
    console.log(`[PERF][${sessionId}] ${label}: ${dur}ms  (${from} → ${to})`)
  } else {
    console.log(`[PERF][${sessionId}] ${label}: MISSING (from=${fromT}, to=${toT})`)
  }
}

export function perfFlush(label: string): void {
  console.log(`[PERF][${sessionId}] === END ${label} ===`)
}

export function perfReset(): void {
  marks.length = 0
}