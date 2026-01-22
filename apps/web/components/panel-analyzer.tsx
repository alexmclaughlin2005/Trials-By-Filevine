'use client';

/**
 * Panel Analyzer Component
 *
 * Analyzes jury panel composition and provides strategic recommendations
 */

import { usePanelAnalysis } from '@/hooks/use-archetype-classifier';

interface PanelAnalyzerProps {
  panelId: string;
}

const ARCHETYPE_COLORS: Record<string, string> = {
  bootstrapper: 'bg-red-100 text-red-800',
  crusader: 'bg-green-100 text-green-800',
  scale_balancer: 'bg-blue-100 text-blue-800',
  captain: 'bg-purple-100 text-purple-800',
  chameleon: 'bg-gray-100 text-gray-800',
  scarred: 'bg-yellow-100 text-yellow-800',
  calculator: 'bg-indigo-100 text-indigo-800',
  heart: 'bg-pink-100 text-pink-800',
  trojan_horse: 'bg-orange-100 text-orange-800',
  maverick: 'bg-teal-100 text-teal-800',
};

const ARCHETYPE_NAMES: Record<string, string> = {
  bootstrapper: 'The Bootstrapper',
  crusader: 'The Crusader',
  scale_balancer: 'The Scale-Balancer',
  captain: 'The Captain',
  chameleon: 'The Chameleon',
  scarred: 'The Scarred',
  calculator: 'The Calculator',
  heart: 'The Heart',
  trojan_horse: 'The Trojan Horse',
  maverick: 'The Maverick',
};

export function PanelAnalyzer({ panelId }: PanelAnalyzerProps) {
  const { data, isLoading, error } = usePanelAnalysis(panelId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-filevine-gray-600">
          <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-filevine-primary border-t-transparent" />
          <p>Analyzing panel composition...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-4">
        <p className="text-sm text-red-800">
          Failed to load panel analysis. Please try again.
        </p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const getFavorabilityColor = (rec: string) => {
    if (rec.includes('plaintiff-favorable')) return 'text-green-600';
    if (rec.includes('defense-favorable')) return 'text-red-600';
    return 'text-blue-600';
  };

  const getClassificationProgress = () => {
    const percentage = (data.classifiedJurors / data.totalJurors) * 100;
    return percentage;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-xl font-semibold text-filevine-gray-900">
          Panel Analysis: {data.caseName}
        </h2>
        <div className="flex items-center gap-6 text-sm text-filevine-gray-600">
          <div>
            <span className="font-medium">Total Jurors:</span> {data.totalJurors}
          </div>
          <div>
            <span className="font-medium">Classified:</span> {data.classifiedJurors}
          </div>
          <div>
            <span className="font-medium">Our Side:</span>{' '}
            <span className="capitalize">{data.ourSide}</span>
          </div>
        </div>

        {/* Classification Progress */}
        {data.classifiedJurors < data.totalJurors && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-filevine-gray-600">
              <span>Classification Progress</span>
              <span>{getClassificationProgress().toFixed(0)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-filevine-primary"
                style={{ width: `${getClassificationProgress()}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-filevine-gray-600">
              {data.totalJurors - data.classifiedJurors} juror(s) not yet classified
            </p>
          </div>
        )}
      </div>

      {/* Favorability Assessment */}
      <div className="rounded-lg border-2 border-filevine-primary bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-filevine-gray-900">
          Panel Favorability
        </h3>

        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <div className="text-sm font-medium text-filevine-gray-700">
              Plaintiff Danger
            </div>
            <div className="mt-2 text-3xl font-bold text-red-600">
              {data.favorability.plaintiffDangerAverage}/5
            </div>
          </div>

          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <div className="text-sm font-medium text-filevine-gray-700">
              Defense Danger
            </div>
            <div className="mt-2 text-3xl font-bold text-green-600">
              {data.favorability.defenseDangerAverage}/5
            </div>
          </div>
        </div>

        <div
          className={`mt-4 rounded-md bg-blue-50 p-4 text-center text-lg font-semibold ${getFavorabilityColor(
            data.favorability.recommendation
          )}`}
        >
          {data.favorability.recommendation}
        </div>
      </div>

      {/* Archetype Distribution */}
      <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-filevine-gray-900">
          Archetype Distribution
        </h3>

        <div className="space-y-3">
          {data.composition
            .sort((a, b) => b.count - a.count)
            .map((item) => (
              <div key={item.archetype} className="flex items-center gap-4">
                <div className="w-48">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      ARCHETYPE_COLORS[item.archetype] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {ARCHETYPE_NAMES[item.archetype] || item.archetype}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="h-8 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-8 rounded-full ${
                        ARCHETYPE_COLORS[item.archetype]?.split(' ')[0] || 'bg-gray-300'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="w-24 text-right">
                  <span className="text-sm font-semibold text-filevine-gray-900">
                    {item.count} ({item.percentage.toFixed(0)}%)
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Juror List */}
      <div className="rounded-lg border border-filevine-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-filevine-gray-900">
          Classified Jurors
        </h3>

        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                  Juror #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                  Archetype
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                  Confidence
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data.jurors.map((juror) => (
                <tr key={juror.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-filevine-gray-900">
                    {juror.jurorNumber || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-filevine-gray-900">
                    {juror.firstName} {juror.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        ARCHETYPE_COLORS[juror.classifiedArchetype] ||
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {ARCHETYPE_NAMES[juror.classifiedArchetype] ||
                        juror.classifiedArchetype}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-filevine-gray-900">
                    {juror.archetypeConfidence
                      ? `${(juror.archetypeConfidence * 100).toFixed(0)}%`
                      : '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        juror.status === 'available'
                          ? 'bg-green-100 text-green-800'
                          : juror.status === 'seated'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {juror.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strategic Insights */}
      <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-6">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-yellow-900">
          <span>💡</span>
          Strategic Insights
        </h3>

        <ul className="space-y-2 text-sm text-yellow-800">
          {data.composition.some((c) => c.archetype === 'captain' && c.count > 1) && (
            <li>
              ⚠️ Multiple Captains detected - High risk of conflict and hung jury (35%)
            </li>
          )}
          {data.composition.some((c) => c.archetype === 'maverick') && (
            <li>
              ⚠️ Maverick present - Increased hung jury risk (+15%) and unpredictability
            </li>
          )}
          {data.composition.some((c) => c.archetype === 'chameleon' && c.percentage > 25) && (
            <li>
              ✅ High Chameleon presence - Panel will likely follow majority quickly
            </li>
          )}
          {data.composition.some((c) => c.archetype === 'bootstrapper' && c.count >= 3) && (
            <li>
              {data.ourSide === 'plaintiff'
                ? '⚠️ Multiple Bootstrappers - Strong defense lean, consider strikes'
                : '✅ Multiple Bootstrappers - Favorable defense composition'}
            </li>
          )}
          {data.composition.some((c) => c.archetype === 'crusader' && c.count >= 3) && (
            <li>
              {data.ourSide === 'plaintiff'
                ? '✅ Multiple Crusaders - Favorable plaintiff composition'
                : '⚠️ Multiple Crusaders - Strong plaintiff lean, consider strikes'}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
