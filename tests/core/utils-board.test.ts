import {
  generateBoard,
  rowIndexToChessRow,
  columnIndexToChessColumn,
  chessColumnToColumnIndex,
  chessRowToRowIndex,
} from '../../src/core/utils';

import type { SquareMatrix } from '../../src/core/types';

describe('Board generation utilities', () => {
  it('creates orientation-aware boards for non-standard sizes', () => {
    const files = 5;
    const ranks = 3;

    const whiteBoard: SquareMatrix = generateBoard({ files, ranks, orientation: 'white' });
    expect(whiteBoard).toHaveLength(ranks);
    expect(whiteBoard[0]).toHaveLength(files);
    expect(whiteBoard[0][0].square).toBe('a3');
    expect(whiteBoard[0][files - 1].square).toBe('e3');
    expect(whiteBoard[ranks - 1][0].square).toBe('a1');

    const blackBoard: SquareMatrix = generateBoard({ files, ranks, orientation: 'black' });
    expect(blackBoard[0]).toHaveLength(files);
    expect(blackBoard[0][0].square).toBe('e1');
    expect(blackBoard[0][files - 1].square).toBe('a1');
    expect(blackBoard[ranks - 1][files - 1].square).toBe('a3');
  });

  it('maps between matrix indices and chess labels using custom coordinates', () => {
    const fileLabels = ['west', 'mid', 'east', 'far'];
    const rankLabels = ['10', '20', '30', '40'];
    const totalFiles = fileLabels.length;
    const totalRanks = rankLabels.length;

    const leftMost = columnIndexToChessColumn({
      columnIndex: 0,
      totalFiles,
      orientation: 'black',
      fileLabels,
    });
    expect(leftMost).toEqual({ columnIndex: 0, fileIndex: 3, fileLabel: 'far' });

    const middleFile = chessColumnToColumnIndex({
      column: 'mid',
      totalFiles,
      orientation: 'black',
      fileLabels,
    });
    expect(middleFile).toEqual({ columnIndex: 2, fileIndex: 1, fileLabel: 'mid' });

    const topRow = rowIndexToChessRow({
      rowIndex: 0,
      totalRanks,
      orientation: 'white',
      rankLabels,
    });
    expect(topRow).toEqual({ rowIndex: 0, rankIndex: 3, rankLabel: '40' });

    const secondRowIndex = chessRowToRowIndex({
      row: '30',
      totalRanks,
      orientation: 'white',
      rankLabels,
    });
    expect(secondRowIndex).toEqual({ rowIndex: 1, rankIndex: 2, rankLabel: '30' });
  });
});
