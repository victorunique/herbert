import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CodeEditorPanel } from '../../../src/ui/play/CodeEditorPanel';

const LONG_HINT =
  'Define a:ssssssra and call a to repeat 6 steps and a right turn for 4 sides, then use b(X) with recursion to cover the remaining corridor without exceeding the byte budget.';

describe('CodeEditorPanel HintBar', () => {
  it('does not render hint toggle when hint is undefined or empty', () => {
    const { rerender } = render(
      <CodeEditorPanel
        code=""
        onChangeCode={vi.fn()}
        maxBytes={10}
        basePoints={100}
        diagnostics={[]}
        activeToken={null}
      />,
    );
    expect(screen.queryByTestId('hint-toggle')).toBeNull();

    rerender(
      <CodeEditorPanel
        code=""
        onChangeCode={vi.fn()}
        maxBytes={10}
        basePoints={100}
        diagnostics={[]}
        activeToken={null}
        hint=""
      />,
    );
    expect(screen.queryByTestId('hint-toggle')).toBeNull();
  });

  it('toggles hint visibility and renders full long hint without single-line truncation', () => {
    render(
      <CodeEditorPanel
        code="a:ss"
        onChangeCode={vi.fn()}
        maxBytes={10}
        basePoints={100}
        diagnostics={[]}
        activeToken={null}
        hint={LONG_HINT}
      />,
    );

    const toggleBtn = screen.getByTestId('hint-toggle');
    expect(toggleBtn).toHaveTextContent('Need a Hint?');
    expect(toggleBtn).toHaveClass('whitespace-nowrap', 'shrink-0');
    expect(screen.queryByTestId('hint-text')).toBeNull();

    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveTextContent('Hide Hint');

    const hintText = screen.getByTestId('hint-text');
    expect(hintText).toHaveTextContent(LONG_HINT);
    expect(hintText).not.toHaveClass('truncate');
    expect(hintText).toHaveClass('whitespace-pre-wrap', 'break-words', 'overflow-y-auto');

    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveTextContent('Need a Hint?');
    expect(screen.queryByTestId('hint-text')).toBeNull();
  });
});
