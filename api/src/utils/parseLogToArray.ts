export interface LogLine {
  line: string
}

export const parseLogToArray = (content?: string): LogLine[] => {
  if (!content) return []

  return content.split('\n').map((line) => ({ line: line }))
}
