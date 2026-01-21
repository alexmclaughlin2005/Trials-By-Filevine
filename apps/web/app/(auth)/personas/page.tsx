import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function PersonasPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Persona Library</h1>
          <p className="text-muted-foreground">
            Behavioral personas for juror classification
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Persona
        </Button>
      </div>

      {/* Personas Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <PersonaCard
          name="Tech Pragmatist"
          description="Analytical thinker with technical background, values data and logic"
          type="system"
          attributes={['Analytical', 'Data-driven', 'Skeptical']}
        />
        <PersonaCard
          name="Community Caretaker"
          description="Empathetic, values relationships and community welfare"
          type="system"
          attributes={['Empathetic', 'Community-focused', 'Collaborative']}
        />
        <PersonaCard
          name="Business Realist"
          description="Practical decision-maker focused on outcomes and pragmatism"
          type="system"
          attributes={['Pragmatic', 'Results-oriented', 'Risk-aware']}
        />

        {/* Add new persona card */}
        <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
          <div>
            <Plus className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Create a custom persona
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonaCard({
  name,
  description,
  type,
  attributes,
}: {
  name: string;
  description: string;
  type: string;
  attributes: string[];
}) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="text-lg font-semibold">{name}</h3>
        <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium">
          {type}
        </span>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      <div className="flex flex-wrap gap-2">
        {attributes.map((attr) => (
          <span
            key={attr}
            className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
          >
            {attr}
          </span>
        ))}
      </div>
      <Button variant="outline" size="sm" className="mt-4 w-full">
        View Details
      </Button>
    </div>
  );
}
