import client from './client';
import type { EnrollmentRecord } from '../types';

export async function enrollCustomer(customerId: string, audio: Blob | File): Promise<{ customer_id: string; status: string }> {
  const form = new FormData();
  form.append('customer_id', customerId);
  form.append('audio', audio, audio instanceof File ? audio.name : 'recording.webm');
  const { data } = await client.post('/enroll', form);
  return data;
}

export async function getEnrollmentStatus(customerId: string): Promise<EnrollmentRecord> {
  const { data } = await client.get(`/enroll/${customerId}`);
  return data;
}
