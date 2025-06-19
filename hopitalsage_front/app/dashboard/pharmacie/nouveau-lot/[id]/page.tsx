// app/dashboard/produit/[id]/page.tsx

interface PageProps {
  params: { id: string };
}

export default function Page({ params }: PageProps) {
  const produitId = parseInt(params.id);

  return (
    <div>
      ID du produit : {produitId}
    </div>
  );
}
