import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { renderFoaf } from 'server/social/foaf-xml';
import { HOST, user, userRemote } from './fixtures';

const RDF_NS = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const FOAF_NS = 'http://xmlns.com/foaf/0.1/';

function parse(xml: string) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  expect(doc.querySelector('parsererror')).toBeNull();
  return doc;
}

const agents = (doc: Document) => [...doc.getElementsByTagNameNS(FOAF_NS, 'Agent')];
const about = (el: Element) => el.getAttributeNS(RDF_NS, 'about');
const resources = (root: Element | Document, tag: string) =>
  [...root.getElementsByTagNameNS(FOAF_NS, tag)].map((el) => el.getAttributeNS(RDF_NS, 'resource'));

describe('renderFoaf', () => {
  const alice = user();
  const profile = `https://${HOST}/alice`;
  const bob = userRemote({ username: 'bob', profileUrl: 'https://remote.example/bob' });
  const carol = userRemote({ id: 6, username: 'carol', profileUrl: 'https://remote.example/carol' });

  it('is well-formed RDF declaring the foaf, sioc and rdf namespaces', () => {
    const xml = renderFoaf(HOST, alice, [], []);
    const root = parse(xml).documentElement;

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?><rdf:RDF')).toBe(true);
    expect(root.tagName).toBe('rdf:RDF');
    expect(root.getAttribute('xmlns')).toBe(FOAF_NS);
    expect(root.getAttribute('xmlns:sioc')).toBe('http://rdfs.org/sioc/ns#');
    expect(root.getAttribute('xmlns:rdf')).toBe(RDF_NS);
  });

  it('makes the profile the maker and primary topic of the document', () => {
    const doc = parse(renderFoaf(HOST, alice, [], []));
    const document = doc.getElementsByTagNameNS(FOAF_NS, 'PersonalProfileDocument')[0];

    expect(document.getAttributeNS(RDF_NS, 'about')).toBe('');
    expect(resources(document, 'maker')).toEqual([profile]);
    expect(resources(document, 'primaryTopic')).toEqual([profile]);
  });

  it('publishes the email as a sha1 of the mailto uri, never the address itself', () => {
    const xml = renderFoaf(HOST, alice, [], []);
    const expected = crypto.createHash('sha1').update('mailto:alice@example.com').digest('hex');

    expect(parse(xml).getElementsByTagNameNS(FOAF_NS, 'mbox_sha1sum')[0].textContent).toBe(expected);
    expect(xml).not.toContain('alice@example.com');
  });

  it('describes the self agent with its account and weblog', () => {
    const doc = parse(renderFoaf(HOST, alice, [], []));
    const self = agents(doc)[0];
    const account = self.getElementsByTagNameNS(FOAF_NS, 'OnlineAccount')[0];

    expect(about(self)).toBe(profile);
    expect(resources(self, 'weblog')).toEqual([profile]);
    expect(account.getAttributeNS(RDF_NS, 'about')).toBe(`${profile}#acct`);
    expect(account.getElementsByTagNameNS(FOAF_NS, 'accountName')[0].textContent).toBe('alice');
    expect(resources(account, 'accountServiceHomepage')).toEqual([`https://${HOST}/`]);
    expect(resources(account, 'accountProfilePage')).toEqual([profile]);
  });

  it('emits sioc:follows for everyone the user follows', () => {
    const doc = parse(renderFoaf(HOST, alice, [], [bob, carol]));
    const follows = [...doc.getElementsByTagName('sioc:follows')].map((el) => el.getAttributeNS(RDF_NS, 'resource'));

    expect(follows).toEqual([`${bob.profileUrl}#acct`, `${carol.profileUrl}#acct`]);
  });

  it('only claims foaf:knows for mutuals, not one-way follows', () => {
    const mutual = userRemote({ profileUrl: 'https://remote.example/mutual', follower: true, following: true });
    const doc = parse(renderFoaf(HOST, alice, [], [bob, mutual]));
    const self = agents(doc)[0];

    expect(resources(self, 'knows')).toEqual([mutual.profileUrl]);
  });

  it('adds an agent per follower that knows and follows the local user', () => {
    const doc = parse(renderFoaf(HOST, alice, [bob, carol], []));
    const [self, ...followers] = agents(doc);

    expect(about(self)).toBe(profile);
    expect(followers.map(about)).toEqual([bob.profileUrl, carol.profileUrl]);
    expect(resources(followers[0], 'knows')).toEqual([profile]);
    expect(
      [...followers[0].getElementsByTagName('sioc:follows')].map((el) => el.getAttributeNS(RDF_NS, 'resource'))
    ).toEqual([`${profile}#acct`]);
  });

  it('includes the logo image only when the user has one', () => {
    const withLogo = parse(renderFoaf(HOST, user({ logo: '/resource/logo.png' }), [], []));
    expect(withLogo.getElementsByTagNameNS(FOAF_NS, 'Image')[0].getAttributeNS(RDF_NS, 'about')).toBe(
      `https://${HOST}/resource/logo.png`
    );

    expect(parse(renderFoaf(HOST, user({ logo: null }), [], [])).getElementsByTagNameNS(FOAF_NS, 'img')).toHaveLength(
      0
    );
  });

  it('escapes remote-controlled urls and names so a peer cannot inject markup', () => {
    const hostile = userRemote({
      username: 'ev<il>',
      profileUrl: 'https://remote.example/?a=1&b="2"',
    });
    const xml = renderFoaf(HOST, alice, [hostile], [hostile]);
    const doc = parse(xml);

    expect(xml).toContain('a=1&amp;b=&quot;2&quot;');
    expect(doc.getElementsByTagNameNS(FOAF_NS, 'accountName')[1].textContent).toBe('ev<il>');
    expect(about(agents(doc)[1])).toBe('https://remote.example/?a=1&b="2"');
  });

  it('renders a valid document for a user with no friends at all', () => {
    const doc = parse(renderFoaf(HOST, alice, [], []));

    expect(agents(doc)).toHaveLength(1);
    expect([...doc.getElementsByTagName('sioc:follows')]).toHaveLength(0);
  });
});
