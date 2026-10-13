// 로컬 확인용: npx tsx --env-file=.env scripts/auto-rag/try.ts "질문1" "질문2"
import handler from '../../api/rag/auto';

for (const question of process.argv.slice(2)) {
  await new Promise<void>(resolve => {
    const res: any = {
      statusCode: 200,
      status(c: number) { this.statusCode = c; return this; },
      json(d: any) {
        console.log(`\n### Q: ${question} [${this.statusCode}]`);
        console.log(d.error || d.answer);
        resolve();
      },
    };
    handler({ method: 'POST', body: { question } } as any, res);
  });
}
