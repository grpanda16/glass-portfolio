import { POSTS, getPost } from '../posts';

export const SITE = 'https://www.gyanaranjanpanda.com';

const SUFFIX = ' — Gyanaranjan Panda';

/** Static routes. The prerender script renders exactly these keys, plus posts. */
export const PAGE_SEO = {
  '/': {
    title: 'Gyanaranjan Panda — Java Full Stack Engineer',
    description:
      'Java Full Stack Engineer with 4.5 years building Spring Boot microservices, Kafka event ' +
      'pipelines and React front-ends. Software Engineer at Boeing.',
  },
  '/work': {
    title: 'Work' + SUFFIX,
    description:
      'Four engineering roles since 2021 — Boeing, CureBay, Certiview and TapAcademy — and the ' +
      'Java, Spring, Kafka and cloud stack behind them.',
  },
  '/blog': {
    title: 'Blog' + SUFFIX,
    description:
      'Notes on JWT and Spring Security, Keycloak and OAuth 2.0, idempotent Kafka consumers, ' +
      'JPA performance and structuring Spring Boot microservices.',
  },
  '/projects': {
    title: 'Projects' + SUFFIX,
    description:
      'Platforms built end to end — a B2B pharmacy marketplace and a financial document ' +
      'system — plus live public repositories from GitHub.',
  },
  '/contact': {
    title: 'Contact' + SUFFIX,
    description:
      'Get in touch about Java full-stack, backend and distributed-systems roles. ' +
      'Email, LinkedIn and GitHub.',
  },
};

/** Every URL the prerenderer should emit. */
export const ALL_ROUTES = [
  ...Object.keys(PAGE_SEO),
  ...POSTS.map((p) => `/blog/${p.slug}`),
];

/**
 * Resolves the meta for a path. Used by the prerender script at build time and
 * by the pages at runtime, so the two can never disagree.
 */
export function seoFor(pathname) {
  const path = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;

  if (PAGE_SEO[path]) return { ...PAGE_SEO[path], path, type: 'website' };

  const match = path.match(/^\/blog\/(.+)$/);
  if (match) {
    const post = getPost(match[1]);
    if (post) {
      return {
        title: post.title + SUFFIX,
        description: post.blurb,
        path,
        type: 'article',
        post,
      };
    }
  }

  return { title: 'Not found' + SUFFIX, description: undefined, path, type: 'website' };
}

/** schema.org BlogPosting for an article. */
export function articleJsonLd(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.blurb,
    datePublished: post.date,
    dateModified: post.date,
    keywords: post.tags.join(', '),
    image: `${SITE}/og.png`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE}/blog/${post.slug}` },
    author: { '@type': 'Person', name: 'Gyanaranjan Panda', url: `${SITE}/` },
    publisher: { '@type': 'Person', name: 'Gyanaranjan Panda', url: `${SITE}/` },
  };
}
