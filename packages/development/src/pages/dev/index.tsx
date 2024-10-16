import YooptaEditor, { createYooptaEditor, YooEditor, YooptaBlockData, YooptaContentValue } from '@yoopta/editor';
import { useEffect, useMemo, useRef, useState } from 'react';

import { MARKS } from '../../utils/yoopta/marks';
import { YOOPTA_PLUGINS } from '../../utils/yoopta/plugins';
import { TOOLS } from '../../utils/yoopta/tools';
import { FixedToolbar } from '../../components/FixedToolbar/FixedToolbar';
import { BlockData } from 'aws-sdk/clients/ebs';

export type YooptaChildrenValue = Record<string, YooptaBlockData>;

const EDITOR_STYLE = {
  width: 750,
};

const BasicExample = () => {
  const editor: YooEditor = useMemo(() => createYooptaEditor(), []);
  const editor2: YooEditor = useMemo(() => createYooptaEditor(), []);
  const selectionRef = useRef<HTMLDivElement>(null);
  const selectionRefTwo = useRef<HTMLDivElement>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [value, setValue] = useState<YooptaContentValue>();
  const [value2, setValue2] = useState<YooptaContentValue>();

  const editors = [editor, editor2];

  interface FindBlockData {
    editor: YooEditor;
    blockData: YooptaBlockData;
  }

  const findBlock = (id: string): FindBlockData | null => {
    for (const editor of editors) {
      if (editor.children[id]) {
        return { editor, blockData: editor.children[id] };
      }
    }
    return null; // Return null if no match is found
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.message === 'onBlockDropped') {
        const { id, block } = event.data as { id: string; block: YooptaBlockData };
        
        const siblingBlock = findBlock(id);
        if (siblingBlock?.editor && siblingBlock?.blockData) {
          const { editor, blockData } = siblingBlock;
          let blockClone = structuredClone(block);
          blockClone.meta.order = blockData.meta.order + 1;
          console.log("block.meta.order: ", blockData.meta.order, "blockClone.meta.order: ", blockClone.meta.order)
          editor.insertBlock(blockClone, {at: [blockClone.meta.order]});
          // editor.moveBlock(block.id as string, [blockClone.meta.order]);
        }
        const oldBlock = findBlock(block.id);
        if (oldBlock) {
          const { editor, blockData } = oldBlock;
          editor.deleteBlock({ fromPaths: [blockData.meta.order] });
        }
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [editors]);

  useEffect(() => {
    editor.on('change', (value: YooptaChildrenValue) => {
      setValue(value);
    });
  }, [editor]);

  useEffect(() => {
    editor2.on('change', (value: YooptaChildrenValue) => {
      setValue2(value);
    });
  }, [editor2]);

  return (
    <>
      <div className="px-[100px] max-w-[900px] mx-auto my-10 flex flex-col items-center" ref={selectionRef}>
        <h1>Editor Instance #1</h1>
        <FixedToolbar editor={editor} />
        <YooptaEditor
          id={'editor-1'}
          editor={editor}
          plugins={YOOPTA_PLUGINS}
          selectionBoxRoot={selectionRef}
          marks={MARKS}
          autoFocus={true}
          placeholder="Type / to open menu"
          tools={TOOLS}
          readOnly={readOnly}
          style={EDITOR_STYLE}
          value={value}
        />
      </div>
      <p draggable>here is a draggable element</p>
      <div className="px-[100px] max-w-[900px] mx-auto my-10 flex flex-col items-center" ref={selectionRefTwo}>
        <h1>Editor Instance #2</h1>
        <FixedToolbar editor={editor} />
        <YooptaEditor
          id={'editor-2'}
          editor={editor2}
          plugins={YOOPTA_PLUGINS}
          selectionBoxRoot={selectionRefTwo}
          marks={MARKS}
          autoFocus={true}
          placeholder="Type / to open menu"
          tools={TOOLS}
          readOnly={readOnly}
          style={EDITOR_STYLE}
          value={value2}
        />
      </div>
    </>
  );
};

export default BasicExample;
