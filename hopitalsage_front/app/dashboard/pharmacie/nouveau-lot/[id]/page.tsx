// app/dashboard/pharmacie/nouveau-lot/[id]/page.tsx

interface PageProps {
  params: {
    id: string
  }
}

export default function Page({ params }: PageProps) {
  const { id } = params;

  return (
    <div>
      <h1>Détail du lot avec l’ID : {id}</h1>
    </div>
  );
}
