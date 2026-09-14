import { HomeView } from '../components/home/HomeView';
import { loadHomeContent } from '../content/load-home';
import { t } from '../messages/t';

export const revalidate = 300;

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
