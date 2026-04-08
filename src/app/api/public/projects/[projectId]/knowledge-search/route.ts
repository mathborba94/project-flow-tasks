import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import OpenAI from 'openai'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 5) {
      return NextResponse.json({ articles: [] })
    }

    // Get org from project
    const project = await prisma.project.findUnique({
      where: { id: projectId, allowPublicTasks: true },
      select: { organizationId: true },
    })

    if (!project) {
      return NextResponse.json({ articles: [] })
    }

    const org = await prisma.organization.findUnique({
      where: { id: project.organizationId },
      select: { slug: true, publicKnowledgeBase: true },
    })

    if (!org?.publicKnowledgeBase || !org.slug) {
      return NextResponse.json({ articles: [] })
    }

    // Fetch all published articles from public categories
    const articles = await prisma.knowledgeBase.findMany({
      where: {
        organizationId: project.organizationId,
        status: 'PUBLISHED',
        OR: [
          { categoryId: null },
          { category: { includeInPublic: true } },
        ],
      },
      select: {
        id: true,
        title: true,
        content: true,
        category: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    })

    if (articles.length === 0) {
      return NextResponse.json({ articles: [] })
    }

    // Build article list for AI ranking
    const articleList = articles.map((a, i) => ({
      index: i,
      id: a.id,
      title: a.title,
      excerpt: a.content.replace(/[#*_`\[\]]/g, '').slice(0, 200).trim(),
      categoryName: a.category?.name ?? null,
    }))

    let topArticles: typeof articleList = []

    if (articles.length <= 3) {
      topArticles = articleList
    } else {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

        const articlesSummary = articleList
          .map(a => `[${a.index}] ${a.title}: ${a.excerpt}`)
          .join('\n')

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          max_tokens: 60,
          temperature: 0,
          messages: [
            {
              role: 'system',
              content:
                'Você é um assistente que seleciona artigos da base de conhecimento relevantes para uma solicitação. Responda APENAS com os índices dos 3 artigos mais relevantes, separados por vírgula. Ex: 0,4,7',
            },
            {
              role: 'user',
              content: `Solicitação: "${query}"\n\nArtigos disponíveis:\n${articlesSummary}`,
            },
          ],
        })

        const raw = completion.choices[0]?.message?.content ?? ''
        const indices = raw
          .split(',')
          .map(s => parseInt(s.trim(), 10))
          .filter(n => !isNaN(n) && n >= 0 && n < articleList.length)
          .slice(0, 3)

        topArticles = indices.length > 0
          ? indices.map(i => articleList[i])
          : articleList.slice(0, 3)
      } catch {
        // Fallback to first 3 on OpenAI error
        topArticles = articleList.slice(0, 3)
      }
    }

    return NextResponse.json({
      orgSlug: org.slug,
      articles: topArticles.map(a => ({
        id: a.id,
        title: a.title,
        excerpt: a.excerpt,
        categoryName: a.categoryName,
      })),
    })
  } catch {
    return NextResponse.json({ articles: [] })
  }
}
