import client from './client';
import type { VerificationSession, VerificationStatusResponse, VerificationListItem, StatsResponse } from '../types';

export async function startVerification(
  customerId: string,
  audio: Blob | File
): Promise<{ session_id: string; customer_id: string; status: string }> {
  const form = new FormData();
  form.append('customer_id', customerId);
  form.append('audio', audio, audio instanceof File ? audio.name : 'call.webm');
  const { data } = await client.post('/verification/start', form);
  return data;
}

export async function getVerificationStatus(sessionId: string): Promise<VerificationStatusResponse> {
  const { data } = await client.get(`/verification/${sessionId}/status`);
  return data;
}

export async function getVerificationResult(sessionId: string): Promise<VerificationSession> {
  const { data } = await client.get(`/verification/${sessionId}/result`);
  return data;
}

export async function listVerifications(): Promise<VerificationListItem[]> {
  const { data } = await client.get('/verification');
  return data;
}

export async function getStats(): Promise<StatsResponse> {
  const { data } = await client.get('/stats');
  return data;
}
