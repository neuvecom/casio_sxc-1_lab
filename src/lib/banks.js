// SXC-1 のバンク／パッド定数とユーティリティ。
export const BANK_COUNT = 80 // バンク数（1〜80）
export const PAD_COUNT = 16 // 1バンクあたりのパッド数（1〜16）
export const SLOT_COUNT = BANK_COUNT * PAD_COUNT // 1280

// slotId: "b{bank}-p{pad}" 形式（bank: 1〜80, pad: 1〜16）
export const slotId = (bank, pad) => `b${bank}-p${pad}`

export const parseSlotId = (id) => {
  const m = /^b(\d+)-p(\d+)$/.exec(id)
  if (!m) return null
  return { bank: Number(m[1]), pad: Number(m[2]) }
}
