import { useState, type ReactElement } from 'react';
import { CAMPAIGN_LEVELS } from '../../content/campaignLevels';
import { createInitialSnapshot } from '../../core/gridEngine';
import { GridCanvas } from '../common/GridCanvas';
import { CodeEditorPanel } from '../play/CodeEditorPanel';

export function ComponentHarness(props: { readonly target: string }): ReactElement {
  const sampleLevel = CAMPAIGN_LEVELS[0]!;
  const [code, setCode] = useState<string>('a(X):sa(X-1)\na(4)');

  if (props.target === 'grid') {
    return (
      <div data-testid="isolated-harness-grid" className="p-6 min-h-screen flex flex-col gap-4">
        <h1 className="text-lg font-bold">Isolated GridCanvas Manual Test Harness</h1>
        <GridCanvas level={sampleLevel} snapshot={createInitialSnapshot(sampleLevel)} />
      </div>
    );
  }
  return (
    <div data-testid="isolated-harness-editor" className="p-6 min-h-screen flex flex-col gap-4 max-w-xl">
      <h1 className="text-lg font-bold">Isolated CodeEditorPanel Manual Test Harness</h1>
      <CodeEditorPanel
        code={code}
        onChangeCode={setCode}
        maxBytes={15}
        basePoints={100}
        diagnostics={[]}
        activeToken={null}
      />
    </div>
  );
}
