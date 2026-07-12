import { hc } from 'hono/client';
import type { AppType } from '../server/app';

const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

export const rpc = hc<AppType>(baseUrl);
export type RpcClient = typeof rpc;
