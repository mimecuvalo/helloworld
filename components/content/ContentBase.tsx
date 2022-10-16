import { Content, UserPublic } from 'data/graphql-generated';

import { F } from 'i18n';
import Head from 'next/head';
import { PropsWithChildren } from 'react';
import SiteMap from './SiteMap';
import { styled } from 'components';

const Container = styled('div')`
  display: flex;
  align-items: flex-start;
  flex-direction: column;

  & > header {
    display: none;
  }
`;

const ArticleNavContainer = styled('div')`
  display: flex;
  align-items: flex-start;
`;

const Footer = styled('footer')`
  width: 154px;
  margin-left: 6px;
  padding: 10px 0;
  font-size: 11px;
  text-align: center;
`;

export default function ContentBase(
  props: PropsWithChildren<{
    content: Content;
    className?: string;
    contentOwner: Pick<UserPublic, 'title' | 'description'>;
    title: string;
    username: string;
  }>
) {
  const { children, content, className, contentOwner, title, username } = props;

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <Container id="hw-content" className={className}>
        <header>
          <h1>{`${contentOwner.title}` + (title ? ` - ${title}` : '')}</h1>
          <h2>{contentOwner.description}</h2>
        </header>

        <ArticleNavContainer>
          <SiteMap content={content} username={username} />

          {children}
        </ArticleNavContainer>

        <Footer>
          <F
            defaultMessage="powered by {br} {link}"
            values={{
              br: () => <br />,
              link: () => (
                <a href="https://github.com/mimecuvalo/helloworld" rel="generator">
                  Hello, world.
                </a>
              ),
            }}
          />
        </Footer>
      </Container>
    </>
  );
}
