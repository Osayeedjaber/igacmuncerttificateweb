import { redirect } from 'next/navigation';

export default function CertificateDetailPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/admin/dashboard/certificates/${params.id}`);
}
