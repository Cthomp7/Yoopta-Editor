import { useEffect } from 'react';
import Prism from 'prismjs';
import { cx, RenderElementProps } from '@yopta/editor';

import 'prism-material-themes/themes/material-default.css';
import { CodeElement } from '../types';
import s from './CodeRender.module.scss';

function CodeRender({ element, attributes, children }: RenderElementProps<CodeElement>) {
  useEffect(() => {
    import(`prismjs/components/prism-${element.data.language}`).then(() => {
      Prism.highlightAll();
      console.log('imported for: ', element.data.language);
    });
  }, [element.data.language]);

  return (
    <code className={s.code} {...attributes}>
      {element.data.filename && <span className={s.filename}>{element.data.filename}</span>}
      <pre className={cx(s.pre, `language-${element.data.language}`)}>
        <span contentEditable={false} className={s.filename}>
          {element.data.filename || '/code/index.tsx'}
        </span>
        {children}
      </pre>
    </code>
  );
}

CodeRender.displayName = 'Code';

export { CodeRender };
