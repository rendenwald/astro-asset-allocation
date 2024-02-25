import type { PaginateFunction } from 'astro';
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { Strategy } from '~/types';
import { APP_STRATEGY } from '~/utils/config';
import { cleanSlug, trimSlash, STRATEGY_BASE, STRATEGY_PERMALINK_PATTERN, STRATEGY_CATEGORY_BASE, STRATEGY_TAG_BASE
 } from './permalinks';

const generatePermalink = async ({
  id,
  slug,
  publishDate,
  category,
}: {
  id: string;
  slug: string;
  publishDate: Date;
  category: string | undefined;
}) => {
  const year = String(publishDate.getFullYear()).padStart(4, '0');
  const month = String(publishDate.getMonth() + 1).padStart(2, '0');
  const day = String(publishDate.getDate()).padStart(2, '0');
  const hour = String(publishDate.getHours()).padStart(2, '0');
  const minute = String(publishDate.getMinutes()).padStart(2, '0');
  const second = String(publishDate.getSeconds()).padStart(2, '0');

  const permalink = STRATEGY_PERMALINK_PATTERN.replace('%slug%', slug)
    .replace('%id%', id)
    .replace('%category%', category || '')
    .replace('%year%', year)
    .replace('%month%', month)
    .replace('%day%', day)
    .replace('%hour%', hour)
    .replace('%minute%', minute)
    .replace('%second%', second);

  return permalink
    .split('/')
    .map((el) => trimSlash(el))
    .filter((el) => !!el)
    .join('/');
};

const getNormalizedStrategy = async (strategy: CollectionEntry<'strategy'>): Promise<Strategy> => {
  const { id, slug: rawSlug = '', data } = strategy;
  const { Content, remarkPluginFrontmatter } = await strategy.render();

  const {
    publishDate: rawPublishDate = new Date(),
    updateDate: rawUpdateDate,
    title,
    excerpt,
    image,
    tags: rawTags = [],
    category: rawCategory,
    author,
    draft = false,
    metadata = {},
  } = data;

  const slug = cleanSlug(rawSlug); // cleanSlug(rawSlug.split('/').pop());
  const publishDate = new Date(rawPublishDate);
  const updateDate = rawUpdateDate ? new Date(rawUpdateDate) : undefined;
  const category = rawCategory ? cleanSlug(rawCategory) : undefined;
  const tags = rawTags.map((tag: string) => cleanSlug(tag));

  return {
    id: id,
    slug: slug,
    permalink: await generatePermalink({ id, slug, publishDate, category }),

    publishDate: publishDate,
    updateDate: updateDate,

    title: title,
    excerpt: excerpt,
    image: image,

    category: category,
    tags: tags,
    author: author,

    draft: draft,

    metadata,

    Content: Content,
    // or 'content' in case you consume from API

    readingTime: remarkPluginFrontmatter?.readingTime,
  };
};

const getRandomizedStrategies = (array: Strategy[], num: number) => {
  const newArray: Strategy[] = [];

  while (newArray.length < num && array.length > 0) {
    const randomIndex = Math.floor(Math.random() * array.length);
    newArray.push(array[randomIndex]);
    array.splice(randomIndex, 1);
  }

  return newArray;
};

const load = async function (): Promise<Array<Strategy>> {
  const strategies = await getCollection('strategy');
  const normalizedStrategies = strategies.map(async (strategy) => await getNormalizedStrategy(strategy));

  const results = (await Promise.all(normalizedStrategies))
    .sort((a, b) => b.publishDate.valueOf() - a.publishDate.valueOf())
    .filter((strategy) => !strategy.draft);

  return results;
};

let _strategies: Array<Strategy>;

/** */
export const isStrategyEnabled = APP_STRATEGY.isEnabled;
export const isRelatedStrategiesEnabled = APP_STRATEGY.isRelatedStrategiesEnabled;
export const isStrategyListRouteEnabled = APP_STRATEGY.list.isEnabled;
export const isStrategyPostRouteEnabled = APP_STRATEGY.strategy.isEnabled;
export const isStrategyCategoryRouteEnabled = APP_STRATEGY.category.isEnabled;
export const isStrategyTagRouteEnabled = APP_STRATEGY.tag.isEnabled;

export const strategyListRobots = APP_STRATEGY.list.robots;
export const strategyPostRobots = APP_STRATEGY.strategy.robots;
export const strategyCategoryRobots = APP_STRATEGY.category.robots;
export const strategyTagRobots = APP_STRATEGY.tag.robots;

export const strategyPostsPerPage = APP_STRATEGY?.strategyPostsPerPage;

/** */
export const fetchStrategies = async (): Promise<Array<Strategy>> => {
  if (!_strategies) {
    _strategies = await load();
  }

  return _strategies;
};

/** */
export const findStrategiesBySlugs = async (slugs: Array<string>): Promise<Array<Strategy>> => {
  if (!Array.isArray(slugs)) return [];

  const strategies = await fetchStrategies();

  return slugs.reduce(function (r: Array<Strategy>, slug: string) {
    strategies.some(function (strategy: Strategy) {
      return slug === strategy.slug && r.push(strategy);
    });
    return r;
  }, []);
};

/** */
export const findStrategiesByIds = async (ids: Array<string>): Promise<Array<Strategy>> => {
  if (!Array.isArray(ids)) return [];

  const strategies = await fetchStrategies();

  return ids.reduce(function (r: Array<Strategy>, id: string) {
    strategies.some(function (strategy: Strategy) {
      return id === strategy.id && r.push(strategy);
    });
    return r;
  }, []);
};

/** */
export const findLatestStrategies = async ({ count }: { count?: number }): Promise<Array<Strategy>> => {
  const _count = count || 4;
  const strategies = await fetchStrategies();

  return strategies ? strategies.slice(0, _count) : [];
};

/** */
export const getStaticPathsStrategyList = async ({ paginate }: { paginate: PaginateFunction }) => {
  if (!isStrategyEnabled || !isStrategyListRouteEnabled) return [];
  return paginate(await fetchStrategies(), {
    params: { strategy: STRATEGY_BASE || undefined },
    pageSize: strategyPostsPerPage,
  });
};

/** */
export const getStaticPathsStrategyPost = async () => {
  if (!isStrategyEnabled || !isStrategyPostRouteEnabled) return [];
  return (await fetchStrategies()).flatMap((strategy) => ({
    params: {
      strategy: strategy.permalink,
    },
    props: { strategy },
  }));
};

/** */
export const getStaticPathsStrategyCategory = async ({ paginate }: { paginate: PaginateFunction }) => {
  if (!isStrategyEnabled || !isStrategyCategoryRouteEnabled) return [];

  const strategies = await fetchStrategies();
  const categories = new Set<string>();
  strategies.map((strategy) => {
    typeof strategy.category === 'string' && categories.add(strategy.category.toLowerCase());
  });

  return Array.from(categories).flatMap((category) =>
    paginate(
      strategies.filter((strategy) => typeof strategy.category === 'string' && category === strategy.category.toLowerCase()),
      {
        params: { category: category, strategy: STRATEGY_CATEGORY_BASE || undefined },
        pageSize: strategyPostsPerPage,
        props: { category },
      }
    )
  );
};

/** */
export const getStaticPathsStrategyTag = async ({ paginate }: { paginate: PaginateFunction }) => {
  if (!isStrategyEnabled || !isStrategyTagRouteEnabled) return [];

  const strategies = await fetchStrategies();
  const tags = new Set<string>();
  strategies.map((strategy) => {
    Array.isArray(strategy.tags) && strategy.tags.map((tag) => tags.add(tag.toLowerCase()));
  });

  return Array.from(tags).flatMap((tag) =>
    paginate(
      strategies.filter((strategy) => Array.isArray(strategy.tags) && strategy.tags.find((elem) => elem.toLowerCase() === tag)),
      {
        params: { tag: tag, strategy: STRATEGY_TAG_BASE
 || undefined },
        pageSize: strategyPostsPerPage,
        props: { tag },
      }
    )
  );
};

/** */
export function getRelatedStrategies(allStrategies: Strategy[], currentSlug: string, currentTags: string[]) {
  if (!isStrategyEnabled || !isRelatedStrategiesEnabled) return [];

  const relatedStrategies = getRandomizedStrategies(
    allStrategies.filter((strategy) => strategy.slug !== currentSlug && strategy.tags?.some((tag) => currentTags.includes(tag))),
    APP_STRATEGY.relatedStrategiesCount
  );

  if (relatedStrategies.length < APP_STRATEGY.relatedStrategiesCount) {
    const moreStrategies = getRandomizedStrategies(
      allStrategies.filter((strategy) => strategy.slug !== currentSlug && !strategy.tags?.some((tag) => currentTags.includes(tag))),
      APP_STRATEGY.relatedStrategiesCount - relatedStrategies.length
    );
    relatedStrategies.push(...moreStrategies);
  }

  return relatedStrategies;
}
