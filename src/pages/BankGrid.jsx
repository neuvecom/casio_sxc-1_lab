// 1280スロット（80バンク × 16パッド）の空き状況ビジュアライズ（モック）。
// ※現段階はローカル state のみ。後で Firestore（users/{uid}/slots）と接続する。
import { useMemo, useState } from 'react'
import { BANK_COUNT, PAD_COUNT, SLOT_COUNT, slotId } from '../lib/banks.js'

// スロット種別。クリックで empty → preset → sample → empty と循環（モック）。
const TYPES = ['empty', 'preset', 'sample']
const TYPE_STYLE = {
  empty: 'bg-slate-800 hover:bg-slate-700',
  preset: 'bg-emerald-600 hover:bg-emerald-500',
  sample: 'bg-sky-600 hover:bg-sky-500',
}
const TYPE_LABEL = { empty: '空き', preset: 'プリセット', sample: 'サンプル' }

export default function BankGrid() {
  // slotId -> type。未登録は 'empty' 扱い。
  const [slots, setSlots] = useState({})

  const cycle = (id) => {
    setSlots((prev) => {
      const cur = prev[id] || 'empty'
      const next = TYPES[(TYPES.indexOf(cur) + 1) % TYPES.length]
      return { ...prev, [id]: next }
    })
  }

  const filled = useMemo(
    () => Object.values(slots).filter((t) => t && t !== 'empty').length,
    [slots],
  )

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">バンク空き状況</h1>
          <p className="mt-1 text-sm text-slate-400">
            パッドをクリックすると種別が切り替わります（モック）
          </p>
        </div>
        <div className="text-sm text-slate-300">
          使用 <span className="font-bold text-emerald-400">{filled}</span> / {SLOT_COUNT}
          （空き {SLOT_COUNT - filled}）
        </div>
      </div>

      {/* 凡例 */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
        {TYPES.map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded-sm ${TYPE_STYLE[t].split(' ')[0]}`} />
            {TYPE_LABEL[t]}
          </span>
        ))}
      </div>

      {/* 80バンク × 16パッド */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: BANK_COUNT }, (_, b) => {
          const bank = b + 1
          return (
            <div key={bank} className="rounded-md border border-slate-800 bg-slate-950 p-2">
              <div className="mb-1 text-xs font-medium text-slate-400">Bank {bank}</div>
              <div className="grid grid-cols-4 gap-1">
                {Array.from({ length: PAD_COUNT }, (_, p) => {
                  const pad = p + 1
                  const id = slotId(bank, pad)
                  const type = slots[id] || 'empty'
                  return (
                    <button
                      key={id}
                      onClick={() => cycle(id)}
                      title={`Bank ${bank} - Pad ${pad}：${TYPE_LABEL[type]}`}
                      className={`aspect-square rounded-sm ${TYPE_STYLE[type]}`}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
