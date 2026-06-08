// スロット編集モーダル。種別（空き/プリセット/サンプル）・割当・メモを設定する。
import { useEffect, useState } from 'react'

const TYPES = [
  { value: 'empty', label: '空き' },
  { value: 'preset', label: 'プリセット' },
  { value: 'sample', label: 'サンプル' },
]

export default function SlotModal({ bank, pad, initial, presets, onSave, onClose }) {
  const [type, setType] = useState(initial?.type || 'empty')
  const [presetId, setPresetId] = useState(initial?.presetId || '')
  const [sampleName, setSampleName] = useState(initial?.sampleName || '')
  const [memo, setMemo] = useState(initial?.memo || '')
  const [busy, setBusy] = useState(false)

  const selectedPreset = presets.find((p) => p.id === presetId)

  // Esc で閉じる
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSave = async () => {
    setBusy(true)
    try {
      await onSave({ type, presetId, sampleName, memo })
      onClose()
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    'w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-950 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold">
          Bank {bank} - Pad {pad}
        </h2>

        {/* 種別選択 */}
        <div className="mt-4 flex gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
                type === t.value
                  ? 'bg-emerald-600 text-white'
                  : 'border border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* プリセット選択 */}
        {type === 'preset' && (
          <label className="mt-4 block text-sm">
            プリセット
            <select
              className={`${inputClass} mt-1`}
              value={presetId}
              onChange={(e) => setPresetId(e.target.value)}
            >
              <option value="">（選択してください）</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}（{p.category}）
                </option>
              ))}
            </select>
            {presets.length === 0 && (
              <span className="mt-1 block text-xs text-amber-400">
                登録済みプリセットがありません。管理者ページで登録してください。
              </span>
            )}
          </label>
        )}

        {/* 選択中プリセットの詳細 */}
        {type === 'preset' && selectedPreset && (
          <div className="mt-3 rounded-md border border-slate-800 bg-slate-900 p-3 text-sm">
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-300">
              {selectedPreset.category && <span>カテゴリ: {selectedPreset.category}</span>}
              {selectedPreset.bpm != null && <span>{selectedPreset.bpm} BPM</span>}
            </div>
            {selectedPreset.description && (
              <p className="mt-1 text-slate-400">{selectedPreset.description}</p>
            )}
          </div>
        )}

        {/* サンプル名 */}
        {type === 'sample' && (
          <label className="mt-4 block text-sm">
            サンプル名
            <input
              className={`${inputClass} mt-1`}
              value={sampleName}
              onChange={(e) => setSampleName(e.target.value)}
              placeholder="例：自分のキック録音"
            />
          </label>
        )}

        {/* メモ（空き以外） */}
        {type !== 'empty' && (
          <label className="mt-4 block text-sm">
            メモ
            <textarea
              rows={2}
              className={`${inputClass} mt-1`}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </label>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={busy}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
