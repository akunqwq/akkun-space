export interface NewsItem {
  title: string;
  link: string;
  description: string;
  source: string;
  category: string;
  image?: string;
}

export interface NewsSource {
  name: string;
  type: 'scrape' | 'rss';
  url: string;
  category: string;
}
