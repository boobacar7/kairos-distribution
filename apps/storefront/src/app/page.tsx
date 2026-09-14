import { HomeView } from '../components/home/HomeView.js';
import { HOME_REVALIDATE_SECONDS, loadHomeContent } from '../content/load-home.js';
import { t } from '../messages/t.js';

export const revalidate = HOME_REVALIDATE_SECONDS;

export default async function HomePage() {
  const content = await loadHomeContent();

  const faqJsonLd =
    content.faq.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: content.faq.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        }
      : null;

  return (
    <>
      <h1 className="sr-only">{t('brand.fullName')}</h1>
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      ) : null}
      <HomeView content={content} />
    </>
  );
}
