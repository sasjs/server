/**
 * The CSV read the Studio's table view is built from.
 *
 * A CSV file on a drive is a file an analyst exported, so the parser has to read
 * what real exports contain: quoting, doubled quotes inside a quoted field,
 * commas and line breaks inside quotes, CRLF or LF line endings, and a UTF-8 BOM
 * on the first cell. No dependency: a spreadsheet preview is not worth a parser
 * with its own release schedule, and the shapes are few.
 *
 * Ragged rows are kept as they are - the table pads them, because a row with
 * three cells under a four-column header is a fact about the file, not a reason
 * to refuse it.
 */

/** Rows kept for the preview: a 200k-row export must not lock the tab. */
export const MAX_PREVIEW_ROWS = 200

export interface CsvTable {
  /** The first row, which the view renders as a header. */
  header: string[]
  rows: string[][]
  /** How many rows the file holds, whatever the preview kept. */
  totalRows: number
  /** Columns the header declares - the widest row is not used. */
  columns: number
  /** True when the preview stopped before the file did. */
  truncated: boolean
}

const stripBom = (text: string): string =>
  text.charCodeAt(0) === 0xfeff ? text.slice(1) : text

/**
 * The records in a CSV document.
 *
 * A quote only opens a quoted field at the START of one, which is what makes an
 * apostrophe in `O'Brien` a character rather than the beginning of a quoted run.
 */
export const parseCsv = (text: string): string[][] => {
  const body = stripBom(text.replace(/\r\n/g, '\n'))
  const records: string[][] = []

  let record: string[] = []
  let field = ''
  let quoted = false

  for (let index = 0; index < body.length; index++) {
    const character = body[index]

    if (quoted) {
      if (character === '"') {
        if (body[index + 1] === '"') {
          field += '"'
          index++
          continue
        }

        quoted = false
        continue
      }

      field += character
      continue
    }

    if (character === '"' && field === '') {
      quoted = true
      continue
    }

    if (character === ',') {
      record.push(field)
      field = ''
      continue
    }

    if (character === '\n') {
      record.push(field)
      records.push(record)
      record = []
      field = ''
      continue
    }

    field += character
  }

  // The last record has no line ending; a trailing newline leaves nothing to add.
  if (field !== '' || record.length) {
    record.push(field)
    records.push(record)
  }

  return records
}

/**
 * A CSV document as the table view wants it: a header, the rows it keeps, and
 * whether it stopped early.
 *
 * An empty document is an empty table rather than an error - an analyst who saves
 * a new file and opens it gets a table with nothing in it, which is what the file
 * says.
 */
export const csvTable = (
  text: string,
  maxRows: number = MAX_PREVIEW_ROWS
): CsvTable => {
  const records = parseCsv(text)
  const [header = [], ...body] = records

  return {
    header,
    rows: body.slice(0, maxRows),
    totalRows: body.length,
    columns: header.length,
    truncated: body.length > maxRows
  }
}
