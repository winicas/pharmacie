interface PageProps {
  params: { id: string };
}

export default function Page({ params }: PageProps) {
  const produitId = parseInt(params.id, 10);

  return (
    <div>
      ID du produit : {produitId}
    </div>
  );
}
