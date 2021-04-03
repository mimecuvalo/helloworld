import {
  BlockquoteButton,
  BoldButton,
  BulletedListButton,
  CodeBlockButton,
  HeaderButton,
  ImageButton,
  //  LinkButton,
  NumberedListButton,
  StrikethroughButton,
} from './Buttons';
import createInlineToolbarPlugin from '@draft-js-plugins/inline-toolbar';
import createLinkPlugin from '@draft-js-plugins/anchor';
import createSideToolbarPlugin from '@draft-js-plugins/side-toolbar';
import React from 'react';
import { Separator } from '@draft-js-plugins/inline-toolbar';
import { styles as toolbarStyles, useStyles as useToolbarStyles } from './toolbarStyles';
import Toolbar from '@material-ui/core/Toolbar';
import { styles as sideToolbarStyles, useStyles as useSideToolbarStyles } from './sideToolbarStyles';

// TODO(mime): rewrite this one day. it's annoying to work with.
// Plus, this probably conflicts with plugins/Anchor.js :-/
export const linkPlugin = createLinkPlugin({ theme: {} });

export const inlineToolbarPlugin = createInlineToolbarPlugin({
  // TODO(mime): theme migration
  //theme: { toolbarStyles: toolbarStyles },
});
const { InlineToolbar } = inlineToolbarPlugin;
export const sideToolbarPlugin = createSideToolbarPlugin({
  position: 'right',
  // TODO(mime): theme migration
  // theme: {
  //   buttonStyles: toolbarStyles,
  //   toolbarStyles: Object.assign({}, toolbarStyles, sideToolbarStyles),
  //   blockTypeSelectStyles: sideToolbarStyles,
  // },
});
const { SideToolbar } = sideToolbarPlugin;

export default function Toolbars({ AlignmentTool, dividerPlugin }) {
  const { DividerButton } = dividerPlugin;
  const styles = useToolbarStyles();
  const sideStyles = useSideToolbarStyles();

  return (
    <>
      <InlineToolbar>
        {externalProps => (
          <Toolbar className={styles.materialUIToolbar} disableGutters>
            <BoldButton {...externalProps} />
            <StrikethroughButton {...externalProps} />
            <div id="editor-toolbar-link">
              {<linkPlugin.LinkButton {...externalProps} />}
              {/* TODO(mime): theme migration <linkPlugin.LinkButton {...externalProps} theme={toolbarStyles} />*/}
            </div>
            <Separator className={styles.separator} />
            <HeaderButton {...externalProps} />
            <BulletedListButton {...externalProps} />
          </Toolbar>
        )}
      </InlineToolbar>
      <SideToolbar>
        {externalProps => (
          <Toolbar className={sideStyles.materialUIToolbar} disableGutters>
            <ImageButton {...externalProps} />
            <HeaderButton {...externalProps} />
            <DividerButton {...externalProps} />
            <BulletedListButton {...externalProps} />
            <NumberedListButton {...externalProps} />
            <BlockquoteButton {...externalProps} />
            <CodeBlockButton {...externalProps} />
          </Toolbar>
        )}
      </SideToolbar>
      <AlignmentTool />
    </>
  );
}
