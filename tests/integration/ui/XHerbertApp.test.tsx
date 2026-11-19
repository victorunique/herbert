import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { App } from '../../../src/App';

describe('XHerbert Full UI Integration Tests (Play, Learn, Create & Theme)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('toggles Light/Dark theme and opens the H Language Reference drawer', () => {
    render(<App />);
    const themeBtn = screen.getByTestId('theme-toggle');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    fireEvent.click(themeBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    fireEvent.click(screen.getByTestId('reference-btn'));
    expect(screen.getByTestId('reference-drawer')).toBeInTheDocument();
  });

  it('supports hybrid code input, live byte counting, step forward/backward debugging, and solving a level', () => {
    render(<App />);
    const editor = screen.getByTestId('code-editor') as HTMLTextAreaElement;

    // Tap quick symbol buttons 's', 's'
    fireEvent.click(screen.getByTestId('quick-key-s'));
    fireEvent.click(screen.getByTestId('quick-key-s'));
    expect(editor.value).toBe('ss');
    expect(screen.getByTestId('byte-counter')).toHaveTextContent('2 / 6 Bytes');

    // Enter recursive code a(X):sa(X-1)\na(4)
    fireEvent.change(editor, { target: { value: 'a(X):sa(X-1)\na(4)' } });
    expect(screen.getByTestId('byte-counter')).toHaveTextContent('8 / 6 Bytes');

    // Step forward 1 step and inspect call stack
    fireEvent.click(screen.getByTestId('btn-step-forward'));
    expect(screen.getByTestId('step-counter')).toHaveTextContent('1');
    expect(screen.getByTestId('call-stack-panel')).toHaveTextContent('a');

    // Step backward restores step 0
    fireEvent.click(screen.getByTestId('btn-step-back'));
    expect(screen.getByTestId('step-counter')).toHaveTextContent('0');

    // Enter optimal 4-byte solution a:sa\na and instant-run to victory
    fireEvent.change(editor, { target: { value: 'a:sa\na' } });
    expect(screen.getByTestId('byte-counter')).toHaveTextContent('4 / 6 Bytes');
    fireEvent.click(screen.getByTestId('btn-instant-run'));
    expect(screen.getByTestId('solved-banner')).toBeInTheDocument();
  });

  it('switches levels via the Level Selector Modal including rectangular 35x25 maps', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('level-selector-btn'));
    expect(screen.getByTestId('level-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('select-level-c4-wide-boulevard-35x25'));
    expect(screen.getByTestId('current-level-title')).toHaveTextContent('4-2: Grand Boulevard (35x25)');
    expect(screen.getByTestId('grid-dimensions-badge')).toHaveTextContent('35x25');
  });

  it('navigates to Learn mode, loads sample solution, and completes a tutorial lesson', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('nav-learn'));
    expect(screen.getByTestId('tutorial-workspace')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('tutorial-use-solution'));
    fireEvent.click(screen.getByTestId('tutorial-run-verify'));
    expect(screen.getByTestId('tutorial-lesson-status')).toHaveTextContent(/Completed/i);
  });

  it('navigates to Create mode, resizes grid to odd rectangular 31x27, saves custom level, and batch-imports .txt files', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('nav-create'));
    expect(screen.getByTestId('editor-workspace')).toBeInTheDocument();

    const widthSelect = screen.getByTestId('editor-width-select') as HTMLSelectElement;
    const heightSelect = screen.getByTestId('editor-height-select') as HTMLSelectElement;
    fireEvent.change(widthSelect, { target: { value: '31' } });
    fireEvent.change(heightSelect, { target: { value: '27' } });
    expect(screen.getByTestId('editor-dim-indicator')).toHaveTextContent('31 x 27');

    const nameInput = screen.getByTestId('editor-name-input') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'My Odd Arena' } });
    fireEvent.click(screen.getByTestId('editor-save-btn'));
    expect(screen.getByTestId('custom-levels-list')).toHaveTextContent('My Odd Arena');
  });
});
