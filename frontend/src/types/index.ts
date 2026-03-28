export interface EnrollmentRecord {
  customer_id: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  audio_path: string;
  embedding_path: string | null;
  speaker_label: string | null;
  created_at: string;
  updated_at: string;
  error: string | null;
}

export interface SpeakerSegment {
  speaker: string;
  text: string;
  start_ms: number;
  end_ms: number;
  audio_duration_s: number;
}

export interface VerificationResult {
  score: number;
  decision: 'match' | 'uncertain' | 'fraud_suspected';
  risk_level: 'low' | 'medium' | 'high';
  recommended_action: 'allow_sim_swap' | 'step_up_verification' | 'freeze_account';
  selected_speaker: string;
  customer_speech_seconds: number;
  notes: string;
  transcript_segments: SpeakerSegment[];
}

export interface VerificationSession {
  session_id: string;
  customer_id: string;
  status: 'uploaded' | 'transcribing' | 'diarized' | 'speaker_selected' | 'voice_compared' | 'completed' | 'failed';
  call_audio_path: string;
  transcript_id: string | null;
  selected_speaker: string | null;
  result: VerificationResult | null;
  created_at: string;
  updated_at: string;
  error: string | null;
}

export interface VerificationStatusResponse {
  session_id: string;
  status: VerificationSession['status'];
  pipeline_step: number;
  error: string | null;
}

export interface VerificationListItem {
  session_id: string;
  customer_id: string;
  status: string;
  created_at: string;
  decision: string | null;
  score: number | null;
}

export interface StatsResponse {
  total_enrollments: number;
  verifications_today: number;
  fraud_detected: number;
  avg_score: number;
}
