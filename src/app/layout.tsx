import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://projectflow.dev'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'ProjectFlow — Inteligência Operacional para Equipes de Tecnologia',
    template: '%s | ProjectFlow',
  },
  description:
    'Controle custo, prazo e produtividade em tempo real. Kanban, SLA, time tracking, insights de IA e agente de suporte integrados numa só plataforma para equipes de tecnologia.',
  keywords: [
    'gestão de projetos',
    'time tracking',
    'SLA',
    'kanban',
    'custo por projeto',
    'inteligência artificial',
    'agente de suporte IA',
    'equipes de tecnologia',
    'ProjectFlow',
    'software de gestão',
    'controle de horas',
    'relatórios de projetos',
  ],
  authors: [{ name: 'ProjectFlow', url: APP_URL }],
  creator: 'ProjectFlow',
  publisher: 'ProjectFlow',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: APP_URL,
    siteName: 'ProjectFlow',
    title: 'ProjectFlow — Inteligência Operacional para Equipes de Tecnologia',
    description:
      'Controle custo, prazo e produtividade em tempo real. Kanban, SLA, time tracking, IA e agente de suporte.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ProjectFlow — Dashboard de gestão operacional',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ProjectFlow — Inteligência Operacional para Equipes de TI',
    description:
      'Controle custo, prazo e produtividade em tempo real. SLA, time tracking, IA e agente de suporte.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: APP_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}