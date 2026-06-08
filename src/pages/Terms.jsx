// 利用規約（公開ページ）。
// ※これは一般的な雛形です。公開前に内容をご確認ください（できれば専門家チェック推奨）。
export default function Terms() {
  return (
    <article className="max-w-none text-slate-200">
      <h1 className="text-2xl font-bold">利用規約</h1>
      <p className="mt-2 text-sm text-slate-400">最終更新日: 2026-06-08</p>

      <p className="mt-4 text-sm leading-relaxed">
        本規約は、ヘボ談（以下「運営者」）が提供する SXC-1 Lab（以下「本サービス」）の
        利用条件を定めるものです。利用者は本規約に同意のうえ本サービスを利用するものとします。
      </p>

      <Section title="1. 適用">
        <p>本規約は、本サービスの利用に関する運営者と利用者の一切の関係に適用されます。</p>
      </Section>

      <Section title="2. 利用登録・アカウント">
        <p>
          本サービスは Google アカウントまたはメールアドレスによる認証を用います。利用者は
          自己の責任でアカウントを管理するものとします。
        </p>
      </Section>

      <Section title="3. 禁止事項">
        <ul className="list-disc pl-5">
          <li>法令または公序良俗に違反する行為</li>
          <li>他者へのなりすまし、不正アクセス、本サービスの運営を妨害する行為</li>
          <li>本サービスのサーバーやネットワークに過度の負荷をかける行為</li>
          <li>第三者の権利を侵害する内容の投稿・登録</li>
        </ul>
      </Section>

      <Section title="4. 投稿・登録内容の取り扱い">
        <p>
          利用者が登録・送信した内容（メモ、フィードバック等）は、本サービスの提供・改善の
          目的で運営者が利用できるものとします。
        </p>
      </Section>

      <Section title="5. サービスの変更・停止">
        <p>
          運営者は、事前の通知なく本サービスの内容を変更・中断・終了することがあります。本サービスは
          個人開発であり、現状有姿（as is）で提供されます。
        </p>
      </Section>

      <Section title="6. 免責事項">
        <ul className="list-disc pl-5">
          <li>本サービスの内容（プリセット情報等）の正確性・完全性を保証しません。</li>
          <li>データの消失・破損について、運営者は責任を負いません。重要なデータは利用者ご自身でも管理してください。</li>
          <li>本サービスの利用により生じた損害について、運営者は一切の責任を負いません。</li>
        </ul>
      </Section>

      <Section title="7. 規約の変更">
        <p>運営者は、必要に応じて本規約を変更できるものとします。変更後の規約は本サービス上に掲示した時点で効力を生じます。</p>
      </Section>

      <Section title="8. 準拠法・裁判管轄">
        <p>本規約は日本法に準拠します。本サービスに関して紛争が生じた場合、運営者の所在地を管轄する裁判所を第一審の専属的合意管轄とします。</p>
      </Section>

      <Section title="9. お問い合わせ">
        <p>
          運営者: ヘボ談 ／ メール: <a className="text-emerald-400 underline" href="mailto:tsunomegane@gmail.com">tsunomegane@gmail.com</a>
        </p>
      </Section>
    </article>
  )
}

function Section({ title, children }) {
  return (
    <section className="mt-6 text-sm leading-relaxed">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2 text-slate-300">{children}</div>
    </section>
  )
}
