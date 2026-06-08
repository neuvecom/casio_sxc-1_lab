// プライバシーポリシー（公開ページ）。
// ※これは一般的な雛形です。公開前に内容をご確認ください（できれば専門家チェック推奨）。
export default function Privacy() {
  return (
    <article className="prose-invert max-w-none text-slate-200">
      <h1 className="text-2xl font-bold">プライバシーポリシー</h1>
      <p className="mt-2 text-sm text-slate-400">最終更新日: 2026-06-08</p>

      <p className="mt-4 text-sm leading-relaxed">
        ヘボ談（以下「運営者」）は、SXC-1 Lab（以下「本サービス」）における利用者の個人情報の
        取扱いについて、以下のとおりプライバシーポリシーを定めます。
      </p>

      <Section title="1. 取得する情報">
        <ul className="list-disc pl-5">
          <li>アカウント情報：メールアドレス（Google ログイン時は Google アカウントの基本情報・表示名）</li>
          <li>利用データ：本サービス上で登録したバンク・プリセット・メモ・お気に入り等</li>
          <li>フィードバック：お問い合わせ・要望・不具合報告として送信された内容</li>
          <li>
            アクセス解析情報：端末・ブラウザ情報、利用状況、識別子、Cookie 等
            （Google の Firebase の機能により取得）
          </li>
        </ul>
      </Section>

      <Section title="2. 利用目的">
        <ul className="list-disc pl-5">
          <li>本サービスの提供・維持・改善</li>
          <li>不具合対応およびお問い合わせ対応</li>
          <li>利用状況の分析（サービス改善のため）</li>
        </ul>
      </Section>

      <Section title="3. 外部サービスへの情報送信について">
        <p>
          本サービスは Google LLC が提供する Firebase（Authentication / Cloud Firestore /
          Hosting / Analytics）を利用しており、上記情報の保存・処理を同社に委託しています。
          これに伴い、利用者の情報の一部が Google に送信され、米国等の国外のサーバーで
          処理される場合があります。Firebase / Google の取扱いについては同社のプライバシーポリシー
          （<a className="text-emerald-400 underline" href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">https://policies.google.com/privacy</a>）
          をご確認ください。
        </p>
      </Section>

      <Section title="4. 第三者提供">
        <p>
          運営者は、法令に基づく場合を除き、利用者の同意なく個人情報を第三者へ提供しません
          （上記の業務委託先である Google を除く）。
        </p>
      </Section>

      <Section title="5. データの保管・削除">
        <p>
          利用者は、アカウントや登録データの削除を希望する場合、下記の問い合わせ先まで
          ご連絡ください。合理的な範囲で速やかに対応します。
        </p>
      </Section>

      <Section title="6. 安全管理">
        <p>
          運営者は、取得した情報の漏えい・滅失・毀損の防止に努めます。なお、本サービスは
          個人開発であり、可用性・完全性を保証するものではありません。
        </p>
      </Section>

      <Section title="7. お問い合わせ窓口">
        <p>
          運営者: ヘボ談<br />
          メール: <a className="text-emerald-400 underline" href="mailto:tsunomegane@gmail.com">tsunomegane@gmail.com</a>
        </p>
      </Section>

      <Section title="8. 本ポリシーの変更">
        <p>
          本ポリシーは、必要に応じて変更することがあります。重要な変更がある場合は本サービス上で
          お知らせします。
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
