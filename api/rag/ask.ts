import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ragQuery } from '../../lib/rag/rag';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question } = req.body || {};
  if (!question || !String(question).trim()) {
    return res.status(400).json({ error: '질문이 비어있습니다.' });
  }

  try {
    const result = await ragQuery(String(question).trim());
    res.json(result);
  } catch (err: any) {
    console.error('[RAG Error]', err?.message);
    res.status(500).json({ error: '서버 오류: ' + (err?.message || '알 수 없는 오류') });
  }
}
