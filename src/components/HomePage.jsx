export default function HomePage({ playerName, onGoToCalendar }) {
  return (
    <div className="py-6">
      {/* Welcome */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-4 text-center">
        <div className="text-4xl mb-3">🎾</div>
        <h2 className="text-xl font-bold text-padel-blue mb-1">
          Welkom, {playerName}!
        </h2>
        <p className="text-sm text-gray-500">
          Plan je padel-wedstrijden met je groep
        </p>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <h3 className="text-sm font-bold text-padel-blue mb-3">
          Hoe werkt het?
        </h3>
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <span className="text-lg shrink-0 w-8 h-8 bg-padel-green/10 rounded-lg flex items-center justify-center">📅</span>
            <div>
              <p className="text-sm font-semibold text-gray-700">Kies een datum</p>
              <p className="text-xs text-gray-400">Selecteer een dag in de kalender</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-lg shrink-0 w-8 h-8 bg-padel-green/10 rounded-lg flex items-center justify-center">👆</span>
            <div>
              <p className="text-sm font-semibold text-gray-700">Tik op een tijdslot</p>
              <p className="text-xs text-gray-400">Eén tik boekt automatisch 1 uur</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-lg shrink-0 w-8 h-8 bg-padel-green/10 rounded-lg flex items-center justify-center">👆</span>
            <div>
              <p className="text-sm font-semibold text-gray-700">Sleep voor langere periodes</p>
              <p className="text-xs text-gray-400">Of gebruik de knoppen Ochtend / Middag / Avond</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-lg shrink-0 w-8 h-8 bg-padel-green/10 rounded-lg flex items-center justify-center">✅</span>
            <div>
              <p className="text-sm font-semibold text-gray-700">4 spelers = Match!</p>
              <p className="text-xs text-gray-400">Het slot wordt groen. Iemand kan het definitief maken.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
        <h3 className="text-sm font-bold text-padel-blue mb-3">Legenda</h3>
        <div className="grid grid-cols-2 gap-2.5 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-padel-green/20 ring-1 ring-padel-green/40 shrink-0" />
            Match beschikbaar
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] bg-padel-blue text-white px-1.5 py-0.5 rounded-full font-bold shrink-0">DEF</span>
            Definitief geboekt
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-padel-green shrink-0" />
            Jouw naam
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-100 ring-1 ring-gray-200 shrink-0" />
            Andere speler
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={onGoToCalendar}
        className="w-full py-4 rounded-2xl bg-padel-green text-white font-bold text-lg shadow-lg hover:bg-padel-green-dark active:scale-[0.98] transition-all"
      >
        📅 Bekijk de kalender
      </button>
    </div>
  )
}
