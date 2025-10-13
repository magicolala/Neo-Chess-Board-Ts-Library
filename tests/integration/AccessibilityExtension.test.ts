import { fireEvent } from '@testing-library/dom';

import { NeoChessBoard } from '../../src/core/NeoChessBoard';
import { createAccessibilityExtension } from '../../src/core/extensions/AccessibilityExtension';

describe('AccessibilityExtension', () => {
  let mount: HTMLDivElement;

  beforeEach(() => {
    mount = document.createElement('div');
    document.body.appendChild(mount);
  });

  afterEach(() => {
    mount.remove();
  });

  test('renders accessible outputs and keeps text in sync with moves', () => {
    const board = new NeoChessBoard(mount, {
      interactive: false,
      extensions: [createAccessibilityExtension()],
    });

    const extensionRoot = mount.querySelector(
      '[data-accessibility-extension="true"]',
    ) as HTMLElement;
    expect(extensionRoot).toBeTruthy();

    const fenOutput = extensionRoot.querySelector('[data-fen-output="true"]') as HTMLElement;
    const brailleOutput = extensionRoot.querySelector(
      '[data-braille-output="true"]',
    ) as HTMLElement;
    const moveList = extensionRoot.querySelector('[data-move-list="true"]') as HTMLOListElement;

    expect(fenOutput?.textContent).toContain(' w ');
    expect(brailleOutput?.textContent?.split('\n')).toHaveLength(8);

    const movePlayed = board.submitMove('e2e4');
    expect(movePlayed).toBe(true);

    expect(fenOutput.textContent).toContain(' b ');
    expect(moveList.textContent).toContain('1. e4');

    board.destroy();
  });

  test('supports keyboard navigation for selecting moves', () => {
    const board = new NeoChessBoard(mount, {
      interactive: false,
      extensions: [createAccessibilityExtension()],
    });

    const extensionRoot = mount.querySelector(
      '[data-accessibility-extension="true"]',
    ) as HTMLElement;
    const status = extensionRoot.querySelector('[data-status="true"]') as HTMLElement;
    const moveList = extensionRoot.querySelector('[data-move-list="true"]') as HTMLOListElement;

    const e2Button = extensionRoot.querySelector('button[data-square="e2"]') as HTMLButtonElement;
    const e3Button = extensionRoot.querySelector('button[data-square="e3"]') as HTMLButtonElement;
    const e4Button = extensionRoot.querySelector('button[data-square="e4"]') as HTMLButtonElement;

    e2Button.focus();
    fireEvent.keyDown(e2Button, { key: 'Enter' });
    expect(e2Button.getAttribute('aria-pressed')).toBe('true');

    fireEvent.keyDown(e2Button, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(e3Button);

    fireEvent.keyDown(e3Button, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(e4Button);

    fireEvent.keyDown(e4Button, { key: 'Enter' });

    expect(moveList.textContent).toContain('1. e4');
    expect(status.textContent).toContain('Move played');

    board.destroy();
  });
});
