// app/dashboard/pharmacie/nouveau-lot/[id]/page.tsx
export const dynamic = 'force-dynamic';

interface Props {
  params: {
    id: string;
  };
}

export default function Page({ params }: Props) {
  const { id } = params;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">📝 Modifier le lot {id}</h1>
      {/* Formulaire ou contenu ici */}
    </div>
  );
}
