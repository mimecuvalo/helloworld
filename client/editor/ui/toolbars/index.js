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
import createInlineToolbarPlugin from 'draft-js-inline-toolbar-plugin';
import createLinkPlugin from 'draft-js-anchor-plugin';
import createSideToolbarPlugin from 'draft-js-side-toolbar-plugin';
import React, { Component } from 'react';
import { Separator } from 'draft-js-inline-toolbar-plugin';
import sideToolbarStyles from './SideToolbar.module.css';
import styles from './Toolbar.module.css';
import Toolbar from '@material-ui/core/Toolbar';

// TODO(mime): rewrite this one day. it's annoying to work with.
// Plus, this probably conflicts with plugins/Anchor.js :-/
export const linkPlugin = createLinkPlugin({ theme: {} });

export const inlineToolbarPlugin = createInlineToolbarPlugin({
  theme: { toolbarStyles: styles },
});
const { InlineToolbar } = inlineToolbarPlugin;
export const sideToolbarPlugin = createSideToolbarPlugin({
  position: 'right',
  theme: {
    buttonStyles: styles,
    toolbarStyles: Object.assign({}, styles, sideToolbarStyles),
    blockTypeSelectStyles: sideToolbarStyles,
  },
});
const { SideToolbar } = sideToolbarPlugin;

export default class Toolbars extends Component {
  render() {
    const { AlignmentTool, dividerPlugin } = this.props;
    const { DividerButton } = dividerPlugin;

    return (
      <>
        <InlineToolbar>
          {externalProps => (
            <Toolbar className={styles.materialUIToolbar} disableGutters>
              <BoldButton {...externalProps} />
              <StrikethroughButton {...externalProps} />
              <linkPlugin.LinkButton {...externalProps} theme={styles} />
              <Separator className={styles.separator} />
              <HeaderButton {...externalProps} />
              <BulletedListButton {...externalProps} />
            </Toolbar>
          )}
        </InlineToolbar>
        <SideToolbar>
          {externalProps => (
            <Toolbar className={sideToolbarStyles.materialUIToolbar} disableGutters>
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
}
