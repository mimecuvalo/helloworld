import './CodeMirror.css';
import AppBar from '@material-ui/core/AppBar';
import classNames from 'classnames';
import Editor from '../editor';
import ErrorBoundary from '../error/ErrorBoundary';
import { F } from '../../shared/i18n';
import React, { Component } from 'react';
import styles from './templates/Simple.module.css';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

let CodeMirror;

export default class ContentEditor extends Component {
  constructor(props) {
    super(props);

    this.contentEditor = React.createRef();

    this.state = {
      code: null,
      content: null,
      hasUnsavedChanges: false,
      loaded: false,
      style: null,
      tabValue: 0,
    };
  }

  componentDidMount = async () => {
    window.addEventListener('beforeunload', this.handleOnBeforeUnload);

    // We don't import this at the top because server-side, holy god, what a mess.
    CodeMirror = (await import('react-codemirror')).default;
    await import('codemirror/mode/css/css');
    await import('codemirror/mode/javascript/javascript');

    this.setState({ loaded: true });
  };

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.handleOnBeforeUnload);
  }

  handleOnBeforeUnload = evt => {
    if (this.state.hasUnsavedChanges) {
      evt.returnValue = 'You have unfinished changes!';
    }
  };

  setUnsavedChanges(hasUnsavedChanges) {
    this.setState({ hasUnsavedChanges });
  }

  export() {
    const { content } = this.props;

    return {
      style: this.state.style || content.style,
      code: this.state.code || content.code,
      content: this.state.content || content.content,
    };
  }

  handleStyleChange = style => {
    this.setState({
      hasUnsavedChanges: true,
      style,
    });
  };

  handleCodeChange = code => {
    this.setState({
      hasUnsavedChanges: true,
      code,
    });
  };

  handleContentChange = () => {
    this.setState({
      hasUnsavedChanges: true,
      content: this.contentEditor.current.export(),
    });
  };

  handleTabChange = (evt, tabValue) => {
    this.setState({ tabValue });
  };

  render() {
    const { content } = this.props;
    const codeMirrorOptions = {
      lineNumbers: true,
    };

    let tab = (
      <div key="content" className={classNames(styles.view, 'hw-view')}>
        <Editor content={content} ref={this.contentEditor} onChange={this.handleContentChange} />
      </div>
    );

    if (this.state.loaded) {
      switch (this.state.tabValue) {
        case 1:
          tab = (
            <CodeMirror
              key="css"
              value={this.state.style || content.style}
              onChange={this.handleStyleChange}
              options={Object.assign({ mode: 'css' }, codeMirrorOptions)}
            />
          );
          break;
        case 2:
          tab = (
            <CodeMirror
              key="js"
              value={this.state.code || content.code}
              onChange={this.handleCodeChange}
              options={Object.assign({ mode: 'javascript' }, codeMirrorOptions)}
            />
          );
          break;
        default:
          break;
      }
    }

    return (
      <>
        <AppBar position="static">
          <Tabs value={this.state.tabValue} onChange={this.handleTabChange}>
            <Tab label={<F msg="Content" />} />
            <Tab label={<F msg="CSS" />} />
            <Tab label={<F msg="JS" />} />
          </Tabs>
        </AppBar>

        <ErrorBoundary>{tab}</ErrorBoundary>
      </>
    );
  }
}
