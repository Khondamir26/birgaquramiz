import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Biz haqimizda',
  description:
    'Birga Quramiz — O\'zbekistondagi qurilish materiallari marketplace. Kompaniya tarixi, maqsadlar va jamoa haqida.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'Biz haqimizda | Birga Quramiz',
    description: 'Birga Quramiz platformasi haqida batafsil ma\'lumot.',
    url: '/about',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
