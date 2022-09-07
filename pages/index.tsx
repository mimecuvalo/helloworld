import { Experiment, Variant } from 'components/Experiment';
import { F, defineMessages, useIntl } from 'i18n';
import type { GetStaticPropsContext, NextPage } from 'next';
import { addApolloState, initializeApollo } from 'app/apollo';
import { animated, useSpring } from 'react-spring';

import Head from 'next/head';
import Image from 'next/image';
import className from 'classnames';
import gql from 'graphql-tag';
import loadIntlMessages from 'i18n/messages';
import styles from 'styles/Home.module.css';
import { useQuery } from '@apollo/client';

// For things like "alt" text and other strings not in JSX.
const messages = defineMessages({
  greeting: { id: 'logo-id', defaultMessage: 'logo' },
});

// This is an GraphQL query for the Home component which passes the query result to the props.
// It's a more complex example that lets you grab the props value of the component you're looking at.
const HELLO_AND_ECHO_QUERY = gql`
  query helloAndEchoQueries($str: String!) {
    echoExample(str: $str) {
      exampleField
    }

    hello
  }
`;

const Home: NextPage = () => {
  const intl = useIntl();

  // This uses React Spring: https://www.react-spring.io/
  // Gives you some great animation easily for your app.
  const springProps = useSpring({
    opacity: 1,
    bottom: 0,
    from: { opacity: 0, bottom: 100 },
  });

  const { data } = useQuery(HELLO_AND_ECHO_QUERY, {
    variables: { str: '/' },
  });

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return <div>Running offline with service worker.</div>;
  }

  const logoAltText = intl.formatMessage(messages.greeting);

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Next.js: All The Things" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={className(styles.main, 'notranslate')}>
        <animated.div style={{ position: 'relative', ...springProps }}>
          <Image src="/favicon.ico" className={styles.appLogo} alt={logoAltText} width={72} height={72} />
        </animated.div>
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">Next.js!</a>
        </h1>

        <p className={styles.description}>
          Get started by editing <code className={styles.code}>pages/index.tsx</code>
        </p>

        <div className={styles.grid}>
          <a href="https://nextjs.org/docs" className={styles.card}>
            <h2>Documentation &rarr;</h2>
            <p>Find in-depth information about Next.js features and API.</p>
          </a>

          <a href="https://nextjs.org/learn" className={styles.card}>
            <h2>Learn &rarr;</h2>
            <p>Learn about Next.js in an interactive course with quizzes!</p>
          </a>

          <a href="https://github.com/vercel/next.js/tree/canary/examples" className={styles.card}>
            <h2>Examples &rarr;</h2>
            <p>Discover and deploy boilerplate example Next.js projects.</p>
          </a>

          <a
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
            className={styles.card}
          >
            <h2>Deploy &rarr;</h2>
            <p>Instantly deploy your Next.js site to a public URL with Vercel.</p>
          </a>
        </div>

        <h1>
          <F defaultMessage="All The Things Feature test" />
        </h1>
        <p className={styles.p}>
          <F
            defaultMessage="GraphQL variables test (current url path): {url}"
            values={{
              url: data?.echoExample.exampleField,
            }}
          />
        </p>
        <p className={styles.p}>
          <Experiment name="my-experiment">
            <Variant name="on">
              <F defaultMessage="Experiment enabled." />
            </Variant>
            <Variant name="off">
              <F defaultMessage="Experiment disabled" />
            </Variant>
          </Experiment>
        </p>
        <p className={styles.p}>
          <F
            defaultMessage="i18n pluralization test: {itemCount, plural, =0 {no items} one {# item} other {# items}}."
            values={{
              // @ts-ignore not sure why this isn't typed right...
              itemCount: 5000,
            }}
          />
        </p>
        <p className={styles.p}>
          <F
            defaultMessage="i18n html test: <a>visit our website</a> and <cta>see the world</cta>"
            values={{
              a: (msg: string) => (
                <a className="external-link" target="_blank" rel="noopener noreferrer" href="https://www.example.com/">
                  {msg}
                </a>
              ),
              cta: (msg: string) => <strong>{msg}</strong>,
            }}
          />
        </p>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
          className="notranslate"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/img/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  );
};

export default Home;

export async function getStaticProps(ctx: GetStaticPropsContext) {
  const apolloClient = initializeApollo();

  await apolloClient.query({
    query: HELLO_AND_ECHO_QUERY,
    variables: { str: '/' },
  });

  return addApolloState(apolloClient, {
    props: {
      intlMessages: await loadIntlMessages(ctx),
    },
  });
}
