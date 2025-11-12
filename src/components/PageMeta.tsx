import React, { useEffect } from 'react';

type Props = {
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
  children?: React.ReactNode;
};

const DEFAULT_TITLE_SUFFIX = 'Nexus Ventures';
// Use a public static image so crawlers can fetch it without JS-built paths
const DEFAULT_OG_IMAGE = '/logo.png';

const upsertMeta = (selector: string, attr: string, value: string) => {
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    // determine whether selector is by name or property
    if (selector.includes("name=")) {
      const nameMatch = selector.match(/name\s*=\s*"([^"]+)"/);
      if (nameMatch) el.setAttribute('name', nameMatch[1]);
    } else if (selector.includes("property=")) {
      const propMatch = selector.match(/property\s*=\s*"([^"]+)"/);
      if (propMatch) el.setAttribute('property', propMatch[1]);
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
};

const upsertLink = (rel: string, href: string) => {
  let link = document.querySelector(`link[rel=\"${rel}\"]`) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
};

const PageMeta: React.FC<Props> = ({ title, description, image, canonical, children }) => {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${DEFAULT_TITLE_SUFFIX}` : DEFAULT_TITLE_SUFFIX;
    document.title = fullTitle;

    // description
    if (description) {
      upsertMeta('meta[name="description"]', 'content', description);
      upsertMeta('meta[property="og:description"]', 'content', description);
      upsertMeta('meta[name="twitter:description"]', 'content', description);
    }

    // title metas
    upsertMeta('meta[property="og:title"]', 'content', fullTitle);
    upsertMeta('meta[name="twitter:title"]', 'content', fullTitle);

    // image
    const img = image ?? DEFAULT_OG_IMAGE;
    upsertMeta('meta[property="og:image"]', 'content', img);
    upsertMeta('meta[name="twitter:image"]', 'content', img);

    // type
    upsertMeta('meta[property="og:type"]', 'content', 'website');

    // twitter card
    upsertMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');

    // canonical
    const canonicalHref = canonical ?? (window.location.origin + window.location.pathname + window.location.search);
    upsertLink('canonical', canonicalHref);

    // no cleanup — allow next PageMeta to overwrite
  }, [title, description, image, canonical]);

  return <>{children}</>;
};

export default PageMeta;
