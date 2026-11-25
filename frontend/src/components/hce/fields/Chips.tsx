'use client';

/**
 * Chips - componente compartido para seleccion multiple de etiquetas.
 * Usado en OcupacionEscolaridadForm, ActividadFuncionalForm y sus variantes nino.
 */
export function Chips({
  opciones,
  seleccionadas,
  onToggle,
  disabled = false,
}: {
  opciones: string[];
  seleccionadas: string[];
  onToggle: (valor: string) => void;
  disabled?: boolean;
}) {
  if (opciones.length === 0) {
    return <p className="text-xs text-gray-400">Sin etiquetas configuradas.</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {opciones.map((op) => {
        const activa = seleccionadas.includes(op);
        return (
          <button
            key={op}
            type="button"
            onClick={() => onToggle(op)}
            aria-pressed={activa}
            disabled={disabled}
            className={`px-2.5 py-1 rounded-full text-xs border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              activa
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400'
            }`}
          >
            {op}
          </button>
        );
      })}
    </div>
  );
}