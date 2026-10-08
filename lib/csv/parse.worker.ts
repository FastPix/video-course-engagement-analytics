import { buildDataset } from '@/lib/model/dataset';
import type { LoadOptions } from '@/lib/types';

addEventListener('message', (e: MessageEvent<{ texts: string[]; opts?: LoadOptions }>) => {
  postMessage(buildDataset(e.data.texts, e.data.opts));
});
