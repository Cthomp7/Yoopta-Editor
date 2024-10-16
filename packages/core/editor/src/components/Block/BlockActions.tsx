import { YooEditor, YooptaBlockPath, YooptaBlockData } from '../../editor/types';
import { generateId } from '../../utils/generateId';
import DragIcon from './icons/drag.svg';
import PlusIcon from './icons/plus.svg';
import { buildBlockData } from '../Editor/utils';
import { findSlateBySelectionPath } from '../../utils/findSlateBySelectionPath';
import { ReactEditor } from 'slate-react';
import { Editor, Transforms } from 'slate';
import { useState } from 'react';
import { useFloating, offset, flip, inline, shift, useTransitionStyles } from '@floating-ui/react';
import { BlockOptions } from '../../UI/BlockOptions/BlockOptions';
import { getRootBlockElement } from '../../utils/blockElements';
import { useActionMenuToolRefs } from './hooks';
import { Overlay } from '../../UI/Overlay/Overlay';
import { Portal } from '../../UI/Portal/Portal';

type ActionsProps = {
  block: YooptaBlockData;
  editor: YooEditor;
  dragHandleProps: any;
  showActions: boolean;
  onChangeActiveBlock: (id: string) => void;
};

const BlockActions = ({ block, editor, dragHandleProps, onChangeActiveBlock, showActions }: ActionsProps) => {
  const [isBlockOptionsOpen, setIsBlockOptionsOpen] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<boolean>(false);

  const {
    isActionMenuOpen,
    actionMenuRefs,
    hasActionMenu,
    actionMenuStyles,
    onChangeActionMenuOpen,
    onCloseActionMenu,
    actionMenuRenderProps,
    ActionMenu,
  } = useActionMenuToolRefs({ editor });

  const { refs, floatingStyles, context } = useFloating({
    placement: 'right-start',
    open: isBlockOptionsOpen,
    onOpenChange: setIsBlockOptionsOpen,
    middleware: [inline(), flip(), shift(), offset()],
  });

  const { isMounted, styles: blockOptionsTransitionStyles } = useTransitionStyles(context, {
    duration: 100,
  });

  const { setActivatorNodeRef, attributes, listeners } = dragHandleProps;

  const onPlusClick = () => {
    const slate = findSlateBySelectionPath(editor, { at: [block.meta.order] });
    const blockEntity = editor.blocks[block.type];

    if (!slate) return;

    const blockEl = document.querySelector(`[data-yoopta-block-id="${block.id}"]`);
    const rootElement = getRootBlockElement(blockEntity.elements);

    let string: undefined | string;
    if (!blockEntity.hasCustomEditor) {
      string = Editor.string(slate, [0]);
    }

    const isEmptyString = typeof string === 'string' && string.trim().length === 0;

    if (hasActionMenu && isEmptyString && rootElement?.props?.nodeType !== 'void') {
      editor.setSelection([block.meta.order]);
      editor.focusBlock(block.id);

      actionMenuRefs.setReference(blockEl);
      onChangeActionMenuOpen(true);
    } else {
      const defaultBlock = buildBlockData({ id: generateId() });
      const nextPath: YooptaBlockPath = [block.meta.order + 1];

      editor.setSelection([block.meta.order]);
      editor.insertBlock(defaultBlock, { at: nextPath, focus: true });

      if (hasActionMenu) {
        setTimeout(() => {
          if (blockEl) actionMenuRefs.setReference(blockEl.nextSibling as HTMLElement);
          onChangeActionMenuOpen(true);
        }, 0);
      }
    }
  };

  const onSelectBlock = (event: React.MouseEvent) => {
    event.stopPropagation();
    onChangeActiveBlock(block.id);

    const slate = findSlateBySelectionPath(editor, { at: [block.meta.order] });
    editor.focusBlock(block.id);

    if (!slate) return;

    setTimeout(() => {
      const currentBlock = editor.blocks[block.type];

      if (!currentBlock.hasCustomEditor) {
        ReactEditor.blur(slate);
        ReactEditor.deselect(slate);
        Transforms.deselect(slate);
      }

      editor.setBlockSelected([block.meta.order], { only: true });
      editor.setSelection([block.meta.order]);

      setIsBlockOptionsOpen(true);
    }, 10);
  };

  const onDragButtonRef = (node: HTMLElement | null) => {
    setActivatorNodeRef(node);
    refs.setReference(node);
  };

  const blockOptionsFloatingStyle = { ...floatingStyles, ...blockOptionsTransitionStyles };

  return (
    <div contentEditable={false} data-hovered-state-open={showActions} className={`yoopta-block-actions`}>
      {isActionMenuOpen && hasActionMenu && (
        <Portal id="yoo-block-options-portal">
          <Overlay lockScroll className="yoo-editor-z-[100]" onClick={onCloseActionMenu}>
            <div style={actionMenuStyles} ref={actionMenuRefs.setFloating}>
              <ActionMenu {...actionMenuRenderProps} />
            </div>
          </Overlay>
        </Portal>
      )}
      <button type="button" onClick={onPlusClick} className="yoopta-block-actions-plus">
        <PlusIcon />
      </button>
      <button
        type="button"
        className="yoopta-block-actions-drag"
        ref={onDragButtonRef}
        {...attributes}
        {...listeners} // something in the listeners is preventing an onDragEnd trigger, removing this breaks the entire dnd functionality
        onClick={onSelectBlock}
        onDragStart={() => setDragStart(true)}
        onMouseUp={(event) => {
          console.log(
            'screen x & y: ',
            event.screenX,
            ' ',
            event.screenY,
            '\n page x & y: ',
            event.pageX,
            ' ',
            event.pageY,
            '\n client x & y: ',
            event.clientX,
            ' ',
            event.clientY,
          );
          if (dragStart) {
            const parent = (event.target as HTMLElement).parentElement?.parentElement;
            if (parent) parent.style.pointerEvents = 'none';

            const { clientX, clientY } = event;
            const droppedElement = document.elementFromPoint(clientX, clientY);
            if (droppedElement) {
              function findBlock(element) {
                while (element) {
                  if (element.hasAttribute('data-yoopta-block-id')) {
                    const id = element.getAttribute('data-yoopta-block-id');
                    return id;
                  }
                  element = element.parentElement;
                }
                return null;
              }
              const droppedBlockId = findBlock(droppedElement);
              console.log('droppedBlockId: ', droppedBlockId);
              if (!editor.children[droppedBlockId])
                window.postMessage({ message: 'onBlockDropped', id: droppedBlockId, block, clientX, clientY });
            }
            setDragStart(false);
            if (parent) parent.style.pointerEvents = 'auto';
          }
        }}
        onMouseDown={(e) => e.stopPropagation()} // Removing causing were visual issues with dnd
        draggable={true}
      >
        <DragIcon />
      </button>
      <BlockOptions
        isOpen={isMounted}
        refs={refs}
        style={blockOptionsFloatingStyle}
        onClose={() => setIsBlockOptionsOpen(false)}
      />
    </div>
  );
};

export { BlockActions };
