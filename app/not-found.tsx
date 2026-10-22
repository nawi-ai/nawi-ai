import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl text-center">
      <h1 className="text-3xl font-extrabold">Esa página no está</h1>
      <p className="mt-3 text-lg text-muted">Volvamos a una aventura que sí existe.</p>
      <Button href="/" className="mt-6">
        Ir al inicio
      </Button>
    </div>
  );
}
