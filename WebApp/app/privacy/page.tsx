import { LEGAL_DOCUMENTS } from '@/features/legal/content';
import { LegalPage } from '@/features/legal/LegalPage';
import { legalMetadata } from '@/features/legal/metadata';

/** Readable signed in or out, so it lives outside the auth-gated route groups. */
export const metadata = legalMetadata('privacy');

export default function Page() {
  return <LegalPage doc={LEGAL_DOCUMENTS.privacy} />;
}
