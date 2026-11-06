import JSZip from 'jszip';

/** Column index of a cell reference such as "C5" (A = 0) */
const columnIndex = (ref: string): number => {
  const letters = ref.replace(/[^A-Z]/gi, '').toUpperCase();
  return letters.split('').reduce((sum, ch) => sum * 26 + (ch.charCodeAt(0) - 64), 0) - 1;
};

const parseXml = (xml: string): Document => new DOMParser().parseFromString(xml, 'application/xml');

const textOf = (node: Element | null): string =>
  Array.from(node?.getElementsByTagName('t') || [])
    .map((t) => t.textContent || '')
    .join('');

/**
 * Reads the first sheet of an .xlsx file into objects keyed by the header row (the first row).
 * Only plain cell values are read (text, numbers, shared and inline strings), which is all a user list needs.
 */
export const readXlsxRows = async (file: File): Promise<Record<string, string>[]> => {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());

  const sharedXml = await zip.file('xl/sharedStrings.xml')?.async('string');
  const shared = sharedXml
    ? Array.from(parseXml(sharedXml).getElementsByTagName('si')).map((si) => textOf(si))
    : [];

  const sheetName = Object.keys(zip.files)
    .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0];
  if (!sheetName) throw new Error('The Excel file has no sheet.');
  const sheet = parseXml(await zip.file(sheetName)!.async('string'));

  const grid: string[][] = Array.from(sheet.getElementsByTagName('row')).map((row) => {
    const cells: string[] = [];
    Array.from(row.getElementsByTagName('c')).forEach((cell) => {
      const type = cell.getAttribute('t');
      const raw = cell.getElementsByTagName('v')[0]?.textContent ?? '';
      let value = raw;
      if (type === 's') value = shared[Number(raw)] ?? '';
      else if (type === 'inlineStr') value = textOf(cell);
      cells[columnIndex(cell.getAttribute('r') || 'A1')] = value;
    });
    return Array.from(cells, (v) => v ?? '');
  });

  const [header = [], ...body] = grid;
  return body.map((cells) => {
    const row: Record<string, string> = {};
    header.forEach((name, i) => {
      if (name) row[name] = cells[i] ?? '';
    });
    return row;
  });
};
