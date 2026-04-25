import { useMindMapStore } from '../../store/mindmap'
import { getThemeNames, getActiveThemeName, setColorTheme } from '../../lib/color-themes'
import type { ThemeName } from '../../types'

export function MapPanel() {
  const store = useMindMapStore()
  const doc = store.document

  if (!doc) return null

  const { backgroundColor, gridEnabled } = doc.settings

  return (
    <div className="panel-section">
      <h3 className="panel-title">Map</h3>

      <div className="panel-row">
        <label className="panel-label">Background</label>
        <input
          type="color"
          value={backgroundColor}
          onChange={e => store.setMapBackground(e.target.value)}
          className="panel-color"
        />
      </div>

      <div className="panel-row">
        <label className="panel-label">Grid</label>
        <input
          type="checkbox"
          checked={gridEnabled}
          onChange={e => store.setGridEnabled(e.target.checked)}
          className="panel-checkbox"
        />
      </div>

      <div className="panel-row">
        <label className="panel-label">Theme</label>
        <select
          value={getActiveThemeName()}
          onChange={e => {
            setColorTheme(e.target.value as ThemeName)
          }}
          className="panel-select"
        >
          {getThemeNames().map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="panel-row">
        <button
          onClick={() => store.autoArrange()}
          className="panel-btn-wide"
        >Auto-arrange</button>
      </div>
    </div>
  )
}
