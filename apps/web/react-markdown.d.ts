declare module 'react-markdown' {
  import { ComponentType, ReactNode } from 'react';
  import { PluggableList } from 'unified';

  export interface ReactMarkdownProps {
    children: string;
    remarkPlugins?: PluggableList;
    rehypePlugins?: PluggableList;
    className?: string;
    components?: Record<string, ComponentType<any>>;
    [key: string]: any;
  }

  const ReactMarkdown: ComponentType<ReactMarkdownProps>;
  export default ReactMarkdown;
}
