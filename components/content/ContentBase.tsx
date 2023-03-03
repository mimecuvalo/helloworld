import { Content, UserPublic } from 'data/graphql-generated';
import { CssBaseline, GlobalStyles } from '@mui/material';
import { Grid, Typography, styled } from 'components';
import { themeGlobalCss, themes } from 'styles/theme';

import ContentHead from './ContentHead';
import { PropsWithChildren } from 'react';
import SiteMap from './SiteMap';
import { ThemeProvider } from '@mui/material/styles';

const Container = styled('div', { label: 'ContentBaseContainer' })`
  display: flex;
  align-items: flex-start;
  flex-direction: column;

  & > header {
    display: none;
  }
`;

export default function ContentBase(
  props: PropsWithChildren<{
    content?: Content;
    className?: string;
    contentOwner: UserPublic;
    title: string;
    username: string;
    host: string;
  }>
) {
  const { children, content, className, contentOwner, host, title, username } = props;

  return (
    <ThemeProvider theme={themes[contentOwner.theme as keyof typeof themes]}>
      <CssBaseline />
      <GlobalStyles styles={() => themeGlobalCss[contentOwner.theme as keyof typeof themes]} />
      <ContentHead host={host} content={content} contentOwner={contentOwner} title={title} username={username} />
      <Container id="hw-content" className={className}>
        {/* TODO(mime): why is this here? a11y? */}
        <header>
          <Typography variant="h1">{title}</Typography>
          <Typography variant="h2">{contentOwner.description}</Typography>
        </header>

        <Grid container flexWrap="nowrap" alignItems="flex-start">
          <SiteMap content={content} username={username} />
          {children}
        </Grid>
      </Container>
    </ThemeProvider>
  );
}
