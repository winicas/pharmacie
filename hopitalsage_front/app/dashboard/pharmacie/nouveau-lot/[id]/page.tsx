// app/dashboard/pharmacie/nouveau-lot/[id]/page.tsx

export default function Page({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Modifier le lot {id}</h1>
      {/* Ton formulaire ou affichage ici */}
    </div>
  );
}
