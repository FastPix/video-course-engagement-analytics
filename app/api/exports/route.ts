// Exports API is UI only in v1. The calling logic is written by hand (see docs/DECISIONS.md).
export function GET() {
  return Response.json({ error: 'Not implemented' }, { status: 501 });
}

export const POST = GET;
