# AI log — Project setup (before the task)

- **Tool:** Claude Code (claude-opus-5-5)
- **Session:** `755f5c16-e15c-4a82-a5c3-1f3e4c4c8d0a`
- **Time:** 2026-10-19 13:30 UTC → 2026-10-20 08:56 UTC (1166 min, 17 user messages)
- **Format:** user messages and Claude replies verbatim; tool calls collapsed to one line each;
  tool outputs and model reasoning omitted; secrets redacted.

---
## 🧑 User — 2026-10-19 13:30 UTC

_[screenshot attached]_

_[screenshot attached]_

я заасайнився на цю роль і мені прислали запрошення на тестове до якого мені треба максимально підготувати проект щоб потім за дві години які вони дають на тестове все встигнути зробити якісно

ось емейл:

---

Hi Ілля Головій,
Thank you for applying to CashMine. We would like to invite you to the next step, a 2-hour practical task.

* What: build a small slice of our app in React Native (Expo, TypeScript) against a test API we host. We send the brief and your API token by email at the start time we confirm, and your 2 hours start then. We do not send any files or code to run.
* AI tools: allowed and expected. We will ask you to include your AI conversations with your submission.
* Before you start: make sure you can create and run a new Expo app on an iOS simulator, an Android emulator or Expo Go. You will also need Node.js and a GitHub account.

Please reply with three possible start times in UTC, between 2026-10-20 00:00 UTC and 2026-10-26 22:00 UTC, for example:

* 2026-10-20 19:00 UTC
* 2026-10-21 19:00 UTC
* 2026-10-22 19:00 UTC

We will confirm one of them.
After the task, the remaining steps are a technical interview (which includes a walkthrough of your task), a culture-fit interview, a reference check and an offer.
Best regards,
Ivan
CashMine

---

тож треба підняти проект новий на найновішій expo і щоб був самий новий React i Typescript і все інше в найкращих бест практісах

<details><summary>7 tool call(s)</summary>

- `update_plan`
- `Bash` — Check installed dev tooling and latest Expo versions
- `update_plan`
- `Bash` — Scaffold new Expo app with default template
- `Bash` — Read template source files and agent docs
- `Bash` — Install deps, stack libraries, and dev tooling
- `Bash` — Check eslint install and rerun lint

</details>

### 🤖 Claude

Проект створено на найновішому Expo SDK 58 (React 19.3, RN 0.88, TypeScript 6). Зараз чищу демо-код шаблону і ставлю архітектуру.

<details><summary>7 tool call(s)</summary>

- `Bash` — Remove template demo screens, components and assets
- `Bash` — Add expo-crypto, adjust app config, read TS base config
- `update_plan`
- `Bash` — Write tsconfig, env validation, API client and token storage
- `Bash` — Write query client, money and formatting utilities
- `Bash` — Write UI primitives, root layout, home screen; typecheck
- `Bash` — Drop web CSS import, typecheck and lint

</details>

### 🤖 Claude

Типи й лінт проходять. Далі — Prettier, Jest-тести, CI і README.

<details><summary>14 tool call(s)</summary>

- `update_plan`
- `Bash` — Configure Prettier, ESLint, Jest and write tests
- `Bash` — Install RN jest preset and rerun tests
- `Bash` — Add CI workflow, conventions, README; run full check
- `Bash` — Fix global typing, rerun check and expo-doctor
- `Bash` — Remove unused themed-view props, list simulators
- `update_plan`
- `Bash` — Boot iPhone 17 Pro simulator
- `control` — attach
- `Bash` — Build and launch iOS dev build on simulator
- `Bash` — Check git state of scaffolded repo
- `Bash` — Wait for iOS build to finish or fail
- `Bash` — Inspect CocoaPods step in build log
- `Bash` — Run pod install with UTF-8 locale

</details>

### 🤖 Claude

На диску закінчилось місце — `pod install` впав з "No space left on device". Дивлюсь, що займає місце (нічого не видаляю).

<details><summary>2 tool call(s)</summary>

- `Bash` — Check free disk space and large dev caches
- `Bash` — Remove generated ios folder, verify, commit baseline

</details>

### 🤖 Claude

Скелет проєкту готовий і закомічений. Типи, лінт і всі 11 тестів проходять, `expo-doctor` показує 20/20. **Але на iOS-симуляторі він ще не запускався**, бо на диску закінчилось місце (про це нижче).

## Що є в проєкті

**Версії:** Expo SDK 58 (найновіший), React Native 0.88, React 19.3, TypeScript 6 у строгому режимі, Expo Router, TanStack Query 5, zod 4, React Compiler. Стек взяв із їхньої вакансії.

| Файл | Що робить |
|---|---|
| [client.ts](cashmine-app/src/lib/api/client.ts) | `request(path, { schema, signal })`: перевіряє кожну відповідь сервера через zod, має таймаут, скасування запиту, Bearer-токен і `Idempotency-Key` |
| [errors.ts](cashmine-app/src/lib/api/errors.ts) | `ApiError` з типами `http` / `network` / `timeout` / `parse` і функцією `getErrorMessage()` для тексту в UI |
| [money.ts](cashmine-app/src/lib/money.ts) | Суми як рядки і `bigint`, без float; відображення обрізає, а не округлює вгору |
| [query-view.tsx](cashmine-app/src/components/ui/query-view.tsx) | Один компонент на всі стани екрана: завантаження, помилка з повтором, порожньо, дані |
| [token-storage.ts](cashmine-app/src/lib/auth/token-storage.ts) | Токен зберігається через SecureStore (Keychain/Keystore) |
| [AGENTS.md](cashmine-app/AGENTS.md) + `CLAUDE.md` | Правила проєкту для AI: структура `features/<name>/{schemas,api,queries}.ts`, правила для грошей і мутацій |
| [README.md](cashmine-app/README.md) | Розділи "Ключові рішення", "Компроміси" і "Використання AI" вже є, лишається заповнити під час тестового |
| `.github/workflows/ci.yml` | CI на GitHub: typecheck, lint, тести |
| `docs/ai-conversations/` | Папка для експорту AI-розмов. Вони просять додати їх до здачі, тож цю розмову теж можна покласти сюди |

`★ Insight ─────────────────────────────────────`
- **Чому zod на кожну відповідь:** у них написано "Correctness first: we move real money". Якщо API раптом поверне `balance: null`, краще показати зрозумілу `parse`-помилку, ніж `NaN` на екрані з балансом. На технічному інтерв'ю буде розбір твого коду, і це сильний аргумент.
- **Чому `mutations.retry: false` + Idempotency-Key:** якщо сервер відповів із таймаутом, переказ міг пройти. Автоматичний повтор без ключа може переказати гроші двічі.
- **Чому `setTimeout` + власний `AbortController`, а не `AbortSignal.any`:** у Hermes підтримка нових статичних методів `AbortSignal` ненадійна. Ручне поєднання сигналів працює скрізь.
`─────────────────────────────────────────────────`

## Твій внесок: політика повторних запитів

У [query-client.ts:11](cashmine-app/src/lib/query-client.ts:11) є функція `shouldRetry(failureCount, error)` з `TODO`. Зараз там тимчасово `failureCount < 2`. Це рішення варто написати самому, бо на інтерв'ю його точно спитають. Що врахувати:
- `401` / `422`, тобто будь-яка помилка `error.isClientError`: повтор нічого не змінить.
- `network` / `timeout` / `5xx`: варто повторити, але скільки разів?
- `parse`: сервер змінив формат даних, тож повтор не допоможе.
- `429` (rate limit): повторювати, але з паузою?

Це 5–8 рядків, `isApiError` уже імпортований.

## ⚠️ Що треба вирішити до тестового

1. **Диск заповнений на 100%: вільно близько 1 ГБ із 460 ГБ.** Нативна збірка під iOS потребує 5–10 ГБ, тому `pod install` впав. Я видалив лише згенеровану мною папку `ios/`, більше нічого не чіпав. Що займає місце (усе це кеші, які відновлюються):
   - Android `system-images`: 45 ГБ
   - симулятори iOS: 25 ГБ, плюс старі runtime iOS 17.2 і 18.0 (разом близько 22,5 ГБ на всі три)
   - `~/.gradle`: 21 ГБ
   - `~/.npm`: 7,9 ГБ
   - Xcode DerivedData: 3,7 ГБ
2. **CocoaPods** потребує `export LANG=en_US.UTF-8` у `~/.zshrc`, інакше `pod install` падає.
3. **Немає `gh`**, а для здачі потрібен GitHub. Встановити:
   ```bash
   brew install gh
   ```
4. **Git-автор зараз робочий** (`[REDACTED]`). Для цього репозиторію, мабуть, краще вказати особисту пошту.
5. На порту 8081 висить Metro з `driver-app`. Не завадить, але краще закрити його перед стартом.

Проєкт зараз лежить у тимчасовій папці, яку застосунок створив для цієї сесії. Якщо хочеш зберегти цю роботу, можу перенести сесію в папку, яку ти обереш.

<details><summary>1 tool call(s)</summary>

- `wrap_up`

</details>

## 🧑 User — 2026-10-19 13:51 UTC

Я сам звільню місце на диску, потім скажу — збереш iOS.

### 🤖 Claude

Добре, чекаю. Для збірки iOS треба щонайменше 10–15 ГБ вільного місця: туди підуть Pods, DerivedData і сама збірка.

Ось кеші, які можна видаляти без втрат, бо вони згенеруються знову. Видаляєш лише ти:

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData
```

```bash
xcrun simctl delete unavailable
```

```bash
npm cache clean --force
```

Старі iOS runtime (17.2 і 18.0) можна видалити через Xcode: Settings → Components. Також можна прибрати непотрібні Android `system-images` через Android Studio → SDK Manager.

Коли звільниш місце, напиши мені. Я перевірю `df`, задам `LANG=en_US.UTF-8` для CocoaPods, зберу dev build на iPhone 17 Pro і зроблю скріншот запущеного застосунку.

`★ Insight ─────────────────────────────────────`
- Найбільше займає перша збірка: `pod install` завантажує і розпаковує готовий React Native (xcframework), і вже на цьому кроці твоя збірка впала. Наступні збірки інкрементні й набагато легші. Тому краще пройти першу збірку до тестового: на самому тестовому вона з'їла б 5–10 хвилин із тих двох годин.
`─────────────────────────────────────────────────`

## 🧑 User — 2026-10-19 13:58 UTC

окей зараз почистив

<details><summary>2 tool call(s)</summary>

- `update_plan`
- `Bash` — Check free disk space and port 8081

</details>

### 🤖 Claude

Вільно 42 ГБ, цього вистачить із запасом. Запускаю збірку.

<details><summary>7 tool call(s)</summary>

- `update_plan`
- `Bash` — Build and launch iOS dev build on simulator
- `Bash` — Wait for iOS build result
- `Bash` — Wait for app install and bundling
- `Bash` — Wait for Metro bundle to load in app
- `Bash` — Check log after install
- `Bash` — Wait until app opens and bundles

</details>

### 🤖 Claude

Збірка пройшла успішно. Далі зроблю скріншот симулятора й подивлюся, чи застосунок запустився.

<details><summary>6 tool call(s)</summary>

- `control` — screenshot
- `Bash` — Inspect build log tail and running processes
- `Bash` — Stop stuck process and install built app
- `Bash` — Start Metro dev server for dev client
- `Bash` — Wait for Metro, launch app, wait for bundle
- `Bash` — Inspect Metro log

</details>

### 🤖 Claude

Metro запущений. Дивлюсь, що зараз на екрані симулятора.

<details><summary>1 tool call(s)</summary>

- `control` — screenshot

</details>

### 🤖 Claude

CashMine встановився, але сам не відкрився. Відкриваю його через deep link і одразу вказую адресу Metro.

<details><summary>16 tool call(s)</summary>

- `control` — cashmine://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081
- `Bash` — Wait for JS bundle to build
- `control` — screenshot
- `Bash` — Launch app with console to capture crash output
- `Bash` — Inspect expo-modules-core and file-system versions
- `Bash` — Check for prebuilt frameworks in Pods
- `Bash` — Locate Expo precompiled modules cache
- `Bash` — Find cache_root definition
- `Bash` — Read cache logic and list cached precompiled pods
- `Bash` — Compare published patch versions
- `Bash` — Find config key for precompiled modules
- `Bash` — Install expo-build-properties and check option name
- `Bash` — Disable precompiled modules and regenerate iOS project
- `Bash` — Build from source and install on simulator
- `Bash` — Wait for source build result
- `Bash` — Wait for install step after build

</details>

### 🤖 Claude

Збірка з вихідного коду пройшла, застосунок встановлено й відкрито. Перевіряю, що на екрані.

<details><summary>2 tool call(s)</summary>

- `Bash` — Wait for Metro to bundle the app
- `control` — screenshot

</details>

### 🤖 Claude

Застосунок знову не відкрився. Запускаю його з консоллю, щоб побачити, чи ця сама помилка, чи вже інша.

<details><summary>1 tool call(s)</summary>

- `Bash` — Launch with console to see startup errors

</details>

### 🤖 Claude

Тепер не падає: бандл завантажився і JS виконується. Роблю скріншот.

<details><summary>3 tool call(s)</summary>

- `control` — screenshot
- `Bash` — Launch app normally and wait for bundle
- `control` — screenshot

</details>

### 🤖 Claude

Застосунок працює на iOS-симуляторі. Запускаю всі перевірки ще раз і комічу виправлення.

<details><summary>3 tool call(s)</summary>

- `update_plan`
- `Bash` — Run checks and commit the iOS fix
- `wrap_up`

</details>

### 🤖 Claude

Застосунок запускається на iOS-симуляторі (iPhone 17 Pro) і показує картку "Ready" з адресою API. Типи, лінт і 11 тестів проходять, виправлення закомічене. Android ще не перевіряв.

**Через що падав застосунок.** Після того як ти звільнив місце, збірка проходила, але застосунок закривався одразу при запуску. У SDK 58 модулі Expo за замовчуванням ставляться як готові бінарники. Бінарник `ExpoFileSystem 58.0.9` шукає функцію, якої немає в бінарнику `ExpoModulesCore 58.0.23`. Версії в проєкті правильні й найновіші, тобто зламані самі бінарники, які опублікував Expo.

**Що змінив.** В [app.json](cashmine-app/app.json) додав `expo-build-properties` → `ios.usePrecompiledModules: false`. Тепер модулі Expo збираються з вихідного коду: перша збірка довша, зате падіння немає. Налаштування лежить у конфігурації, тож переживе `prebuild --clean`.

`★ Insight ─────────────────────────────────────`
- Готові бінарники модулів у SDK 58 пришвидшують збірку, але якщо їх опублікували не синхронно, падіння буде в рантаймі на `dyld`, а не на етапі збірки. Тому перевіряти треба запуск застосунку, а не лише напис "Build Succeeded".
- Якщо на тестовому побачиш `Symbol not found` після `expo install` нового нативного пакета, причина та сама. Налаштування вже на місці, достатньо перезібрати: `npx expo run:ios`.
`─────────────────────────────────────────────────`

**Як запускати на тестовому:**
- Metro зараз працює у фоні. Наступного разу запускай так:
  ```bash
  npx expo start --dev-client
  ```
  Потім відкрий CashMine на симуляторі. Нативну збірку повторювати не треба, хіба що додаси пакет із нативним кодом.
- Додай `export LANG=en_US.UTF-8` у `~/.zshrc`, інакше CocoaPods знову впаде.

**Що лишилось зробити:**
1. Написати `shouldRetry` у [query-client.ts:11](cashmine-app/src/lib/query-client.ts:11).
2. Перевірити Android-емулятор, якщо плануєш здавати і під нього.
3. Встановити `gh` і поміняти git-автора на особисту пошту.
4. Перенести проєкт із тимчасової папки, бо зараз він живе тільки в цій сесії. Можу перенести сесію в папку, яку ти обереш.

## 🧑 User — 2026-10-19 14:30 UTC

так перенеси це в реальну папку

<details><summary>4 tool call(s)</summary>

- `ToolSearch`
- `request_directory`
- `change_directory`
- `Bash` — Stop Metro and remove temporary logs

</details>

### 🤖 Claude

Сесію переведено в `~/CashMine`. Файли проєкту застосунок скопіює туди, коли закінчиться цей хід, і тоді повідомить, що саме переніс. Поки я їх там не перевіряв.

Скоріше за все, проєкт опиниться в `~/CashMine/cashmine-app` разом з історією git (обидва коміти), `node_modules` і зібраною папкою `ios/`.

Перед перенесенням я зупинив Metro і видалив тимчасові логи збірки. Повідомлення про те, що Metro "failed", з'явилось саме через цю зупинку, це очікувано.

Коли файли перенесуться, запускай звідти:
```bash
cd ~/CashMine/cashmine-app && npx expo start --dev-client
```

Застосунок на симуляторі прив'язаний до старого шляху, тому один раз перезбери його з нової папки:
```bash
cd ~/CashMine/cashmine-app && npx expo run:ios -d "iPhone 17 Pro"
```

## 🧑 User — 2026-10-19 14:37 UTC

напиши коли файли перенесуться

<details><summary>1 tool call(s)</summary>

- `Bash` — Check whether project files arrived in new folder

</details>

### 🤖 Claude

Файли ще не перенеслися: зараз `~/CashMine` порожня, і робоча папка сесії ще не змінилась.

Копіює їх сам застосунок, коли закінчується хід. Після мого попереднього ходу цього не сталося, тож, мабуть, спрацює наприкінці цього. Копіювати вручну я не буду, щоб не конфліктувати з застосунком.

Коли застосунок повідомить, що скопіював, я перевірю `~/CashMine`: що там є `cashmine-app`, git-історія з трьома комітами і що `npm run check` проходить. Тоді напишу тобі. Якщо до наступного твого повідомлення папка буде все ще порожня, скажу про це прямо.

## 🧑 User — 2026-10-19 14:46 UTC

то що там скопіював вже бо я чекаю хочу відкрти код теж в visualStudio

<details><summary>1 tool call(s)</summary>

- `Bash` — Check new folder contents

</details>

### 🤖 Claude

Застосунок так і не скопіював файли: `~/CashMine` досі порожня. Щоб ти не чекав, переношу їх сам.

<details><summary>1 tool call(s)</summary>

- `Bash` — Copy project to ~/CashMine and verify it works

</details>

### 🤖 Claude

Файли на місці. Відкриваю проєкт у VS Code.

<details><summary>1 tool call(s)</summary>

- `Bash` — Verify hidden files and open project in VS Code

</details>

### 🤖 Claude

Застосунок так і не скопіював файли, тому я переніс їх сам. Проєкт тепер лежить у `~/CashMine/cashmine-app` і вже відкритий у VS Code.

Перевірив його в новій папці:
- Git-історія на місці, всі три коміти.
- Прибрані зміни відсутні: `git status` чистий.
- Приховані файли теж скопіювались: `.env.local`, `.github`, `.vscode`, `.prettierrc.json`.
- `npm run check` проходить: 11 тестів, типи і лінт без помилок.

Застосунок на симуляторі ще зібраний зі старої папки. Перед тестовим перезбери його звідси один раз:
```bash
cd ~/CashMine/cashmine-app && npx expo run:ios -d "iPhone 17 Pro"
```

Стару тимчасову копію я не видаляв. Вона зникне разом із цією сесією.

## 🧑 User — 2026-10-19 14:55 UTC

так треба поміняти git-автора на особисту пошту goloviyillya@gmail.com

<details><summary>5 tool call(s)</summary>

- `update_plan`
- `Bash` — Set local git author email for this repo
- `update_plan`
- `Bash` — Rewrite author on all commits
- `wrap_up`

</details>

### 🤖 Claude

Тепер автор у цьому репозиторії — `Illia.Holovii <goloviyillya@gmail.com>`. Три старі коміти переписав на цю пошту, нові коміти теж будуть з нею.

- **Тільки цей репозиторій.** Пошту я задав у локальному конфігу проєкту. Глобальний конфіг з робочою поштою для інших проєктів не змінював.
- **Хеші комітів змінились.** Після переписування в них нові хеші (`06550f4`, `d98f6d1`, `36b9bb7`). Це нічого не ламає, бо коміти ще ніде не пушились.
- **Ім'я автора.** Залишив те, що було в глобальному конфігу: `Illia.Holovii` з крапкою. Якщо на GitHub хочеш "Illia Holovii" з пробілом, скажи, і я поміняю так само.

Remote на GitHub ще не налаштований. Для нього спершу потрібен `gh`:
```bash
brew install gh
```

## 🧑 User — 2026-10-19 17:08 UTC

окей що там ще залишилось зробити?

### 🤖 Claude

Ось що лишилось до тестового, від важливого до менш важливого.

**Обов'язково**
1. **Відповісти Івану з трьома варіантами часу в UTC** (між 20 і 26 жовтня). Враховуй, що вони працюють за корейським часом (UTC+9), тож ранок за UTC для них зручніший.
2. **Встановити `gh` і створити репозиторій на GitHub.** Вони просять GitHub-акаунт, а код здаватимеш, найімовірніше, лінком на репозиторій. Встанови `gh` (`brew install gh`), увійди (`gh auth login`), і я створю приватний репозиторій та запушу код.
3. **Перезібрати iOS з нової папки.** Застосунок на симуляторі ще зібраний зі старого шляху:
   ```bash
   cd ~/CashMine/cashmine-app && npx expo run:ios -d "iPhone 17 Pro"
   ```
4. **Додати `export LANG=en_US.UTF-8` у `~/.zshrc`.** Без цього CocoaPods падає, а на тестовому це забрало б час.

**Бажано**

5. **Написати `shouldRetry`** у [query-client.ts:11](src/lib/query-client.ts:11). Це 5–8 рядків, і на інтерв'ю тебе про це спитають.
6. **Перевірити Android-емулятор.** На iOS все працює, а на Android ще не запускали. Можу зробити це за тебе.
7. **Потренуватися з експортом AI-розмов.** Вони просять додати розмови до здачі. Заздалегідь перевір, як експортувати розмову з Claude, щоб у кінці тестового не витрачати на це час. Цю розмову про підготовку теж можна покласти в `docs/ai-conversations/00-project-setup.md`.

**Під час самого тестового**
- Скопіювати токен і URL з листа в `.env.local` і перезапустити Metro.
- Коли запускаєш AI-агента, давати йому [AGENTS.md](AGENTS.md): там уже описано, як писати фічі в цьому проєкті.
- Залишити хвилин 15 наприкінці на README (розділи "What I built" і "Trade-offs") та на перевірку `npm run check`.

Можу одразу взяти пункт 6, Android. Пункт 2 зможу зробити, щойно встановиш і авторизуєш `gh`.

## 🧑 User — 2026-10-19 17:27 UTC

окей поясни мені крок за кроком всі основні моменти як працювати з проектом expo так як я завжди працював лише з чистим react native

### 🤖 Claude

# Expo для тих, хто працював з чистим React Native

Головна різниця: **у чистому RN ти пишеш нативний код руками, а в Expo ти описуєш, яким він має бути, і Expo генерує його сам.** Нижче основні моменти, на прикладі нашого проєкту.

---

## 1. Папок `ios/` і `android/` у проєкті немає

У чистому RN `ios/` і `android/` лежать у git, і ти правиш `Info.plist`, `AppDelegate`, `build.gradle` руками.

В Expo це працює інакше, і називається це **CNG (Continuous Native Generation)**:
- Ці папки **генеруються** командою `npx expo prebuild` і лежать у `.gitignore` (подивись [.gitignore](.gitignore), там є `/ios` і `/android`).
- **Руками їх не правиш ніколи.** Наступний `prebuild --clean` зітре всі зміни.
- Видалити й згенерувати заново безпечно. Саме так ми й лагодили збірку.

```bash
npx expo prebuild --clean      # перегенерувати ios/ і android/ з нуля
```

## 2. `app.json` замінює ручні правки нативного коду

Що в RN робиться руками, і де це задається в Expo:

| Чистий RN | Expo |
|---|---|
| `Info.plist` → bundle id, назва | `app.json` → `ios.bundleIdentifier`, `name` |
| `AndroidManifest.xml`, дозволи | `app.json` → `android.permissions` |
| URL scheme для deep links | `app.json` → `scheme: "cashmine"` |
| `Podfile`, налаштування збірки | плагін `expo-build-properties` |
| Ручне підключення нативної бібліотеки | **config plugin** у `plugins: [...]` |

**Config plugin** — це функція, яка під час `prebuild` сама вносить потрібні правки в нативний код. У нашому [app.json](app.json) їх кілька:
- `expo-secure-store` додає Keychain-налаштування.
- `expo-build-properties` вимикає готові бінарники модулів. Саме цим ми обійшли падіння застосунку при запуску.

## 3. Пакети ставити тільки через `npx expo install`

```bash
npx expo install react-native-svg     # ✅ правильно
npm install react-native-svg           # ❌ може поставити несумісну версію
```

`expo install` дивиться на версію SDK (у нас 58) і ставить версію пакета, **перевірену з цим SDK**. У чистому RN ти сам вгадуєш сумісні версії, а тут це робить Expo.

Якщо щось зламалось:
```bash
npx expo install --fix    # вирівняти версії під SDK
npx expo-doctor           # діагностика (у нас 20/20)
```

## 4. Expo Go і development build

Це найважливіша відмінність від чистого RN.

| | **Expo Go** | **Development build** (наш варіант) |
|---|---|---|
| Що це | Готовий застосунок з App Store | **Твій** застосунок з dev-меню |
| Нативні модулі | Лише ті, що вбудовані в Expo Go | Будь-які |
| Збирати Xcode? | Ні | Так, один раз |

Ми використовуємо **dev build**, бо так ближче до продакшену і можна ставити будь-які нативні пакети.

**Коли треба перезбирати нативну частину:**
- ✅ Змінив тільки JS/TS: **не треба**, працює Fast Refresh.
- 🔁 Додав пакет з нативним кодом (наприклад `expo-camera`), змінив `app.json` або плагіни: **треба**:
  ```bash
  npx expo run:ios -d "iPhone 17 Pro"
  ```

Як зрозуміти, що перезбирати: якщо в консолі бачиш `Cannot find native module 'X'` або `Symbol not found`, значить нативна частина застаріла.

## 5. Щоденна робота: `expo start` замість `react-native start`

```bash
npx expo start --dev-client
```

Клавіші в терміналі:
- `i` / `a` — відкрити на iOS / Android
- `r` — перезавантажити застосунок
- `j` — відкрити **React Native DevTools** (дебагер, консоль, профайлер)
- `m` — dev-меню на пристрої
- `shift+m` — додаткові інструменти (React Query devtools тощо, якщо додати)

## 6. Expo Router: навігація через файли

Замість React Navigation, де ти вручну оголошуєш `createStackNavigator` і `<Stack.Screen>`, тут **файл = екран**:

```
src/app/
  _layout.tsx          → корінь: провайдери + <Stack>
  index.tsx            → екран "/"
  assets/
    index.tsx          → "/assets"
    [id].tsx           → "/assets/123"   (динамічний параметр)
  (tabs)/              → група: таби, не впливає на URL
    _layout.tsx        → <Tabs>
  transfer/
    confirm.tsx        → "/transfer/confirm"
```

Код:
```tsx
import { Link, router, useLocalSearchParams } from 'expo-router';

<Link href="/assets/123">Open</Link>                       // декларативно
router.push({ pathname: '/assets/[id]', params: { id } });  // з коду
const { id } = useLocalSearchParams<{ id: string }>();      // у [id].tsx
```

- **Типізовані маршрути** увімкнені (`typedRoutes`): опечатка в `href` дасть помилку TypeScript.
- **Deep links працюють автоматично**: посилання `cashmine://assets/123` відкриє потрібний екран. У чистому RN це окреме налаштування `linking`.
- `_layout.tsx` — це обгортка для всіх екранів у папці. Там стоять провайдери (у нас `QueryClientProvider`) і тип навігатора (`Stack`, `Tabs`).
- **Не клади компоненти в `src/app/`**, бо кожен файл там стане маршрутом. Компоненти тримай у `src/components/` або `src/features/`.

## 7. Змінні оточення: `EXPO_PUBLIC_*`

```bash
# .env.local
EXPO_PUBLIC_API_URL=https://...
```

- Сюди потрапляють лише змінні з префіксом `EXPO_PUBLIC_`, і вони **вшиваються в бандл**. Справжні секрети туди класти не можна.
- Звертатися треба тільки буквально: `process.env.EXPO_PUBLIC_API_URL`. Деструктуризація не працює.
- Після зміни `.env.local` **перезапусти Metro**.
- У нас змінні перевіряються через zod у [env.ts](src/lib/env.ts), тож помилка видно одразу при старті.

## 8. Модулі `expo-*` замість сторонніх бібліотек

| Задача | Чистий RN (типово) | Expo |
|---|---|---|
| Безпечне сховище | `react-native-keychain` | `expo-secure-store` ✅ у нас |
| UUID / crypto | `react-native-get-random-values` | `expo-crypto` ✅ у нас |
| Біометрія | `react-native-biometrics` | `expo-local-authentication` |
| Пуш-нотифікації | Firebase вручну | `expo-notifications` |
| Буфер обміну | `@react-native-clipboard` | `expo-clipboard` |
| Зображення | `react-native-fast-image` | `expo-image` ✅ встановлено |
| Хаптика | `react-native-haptic-feedback` | `expo-haptics` |

Вони одразу сумісні з SDK, мають config plugins і поводяться однаково на iOS і Android.

## 9. EAS: збірка і реліз у хмарі

На тестовому це не знадобиться, але на інтерв'ю можуть спитати, бо в описі ролі є "own the release process":
- **`eas build`** — збирає `.ipa` / `.aab` у хмарі, сертифікати й підписування бере на себе.
- **`eas submit`** — відправляє збірку в App Store або Google Play.
- **`eas update`** — **OTA-оновлення**: нова версія JS без проходження ревʼю в сторах. Для фінтеху важливо вміти швидко випустити хотфікс.
- **Профілі** (`development` / `preview` / `production`) описуються в `eas.json`.

## 10. Шпаргалка на дві години тестового

```bash
# Старт
cp .env.example .env.local        # вставити URL + токен із листа
npx expo start --dev-client       # → i

# Новий пакет
npx expo install <pkg>            # якщо нативний → npx expo run:ios

# Перед здачею
npm run check                      # typecheck + lint + tests
```

**Якщо щось зламалось, по черзі:**
1. `r` у терміналі (перезавантаження JS)
2. `npx expo start --dev-client --clear` (очистити кеш Metro)
3. `npx expo run:ios` (перезібрати нативну частину)
4. `npx expo prebuild --clean && npx expo run:ios` (повна регенерація)

`★ Insight ─────────────────────────────────────`
- Найчастіша пастка для тих, хто прийшов з чистого RN: залізти в `ios/` і поправити щось руками. Після наступного `prebuild` зміни зникнуть. Правило: все, що ти правив би в Xcode, тепер задається в `app.json` або через config plugin.
- Expo — це не "спрощений RN". Під капотом той самий RN 0.88, плюс інструменти поверх нього. Будь-яку RN-бібліотеку можна підключити через dev build. На інтерв'ю варто показати, що ти розумієш це, а не сприймаєш Expo як обмеження.
- Збій із готовими бінарниками, який ми ловили сьогодні, добре розповісти на технічному інтерв'ю: "застосунок падав на запуску, по `dyld`-логу знайшов несумісні бінарники ExpoModulesCore, обійшов збіркою з вихідного коду через `expo-build-properties`". Це якраз той "correctness first" підхід, про який вони пишуть.
`─────────────────────────────────────────────────`

Якщо хочеш потренуватися перед тестовим, можу підготувати маленьку вправу: зробити екран-список із `[id].tsx` деталями на якомусь публічному API. Так ти один раз пройдеш увесь цикл "маршрут → zod-схема → query-хук → `QueryView`" ще до тестового.

## 🧑 User — 2026-10-19 19:38 UTC

тут трішки оновлень від них

---

Hi Ілля Головій,
Your start time is confirmed: 2026-10-20 13:00 UTC. The brief and your API token will arrive in this thread at that time, and your 2 hours start then. Please check your spam folder if you do not see them.
One change from our first email: please still build the app with Expo (React Native, TypeScript), but deliver it as a web app that we can open on a phone. You will deploy the web build and send us the live link and a public GitHub repository. It does not need to run on iOS or Android.
Before your start time, please check that:

* a new Expo app runs in your browser (`npx expo start --web`)
* you can deploy a static site to a host of your choice, for example EAS Hosting, Vercel, Netlify or Cloudflare Pages

Answers to questions we received:

* Submission: a link to a public GitHub repository with your full commit history, and the live link.
* AI tools: AI may write code. Your AI conversations go in an `ai-logs/` folder in the repository. Exports, share links or screenshots are all fine.
* Libraries: use any you like (state, navigation, testing), as long as they work on web.
* Brief and API: the brief and the API documentation arrive with your token at the start time.
* Your code: the task is for evaluation only. We will not use your code in our product.

Best regards,
Ivan
CashMine

---

онови плиз проект у відповідності до всіх цих умов

<details><summary>3 tool call(s)</summary>

- `update_plan`
- `Bash` — Inspect web deps, license, and deploy tooling
- `Bash` — See SecureStore web behavior

</details>

### 🤖 Claude

SecureStore у вебі — порожня заглушка, тож на вебі токен-сховище впало б. Розділяю сховище на native і web версії.

<details><summary>13 tool call(s)</summary>

- `update_plan`
- `Bash` — Split token storage by platform, drop Expo LICENSE
- `ToolSearch`
- `WebFetch` — https://docs.expo.dev/eas/hosting/get-started/
- `WebFetch` — https://docs.expo.dev/eas/hosting/deployments-and-aliases/
- `update_plan`
- `Bash` — Add web-safe confirm, Screen, TextField, SPA rewrites, scripts
- `update_plan`
- `Bash` — Rename to ai-logs, update AGENTS, README, CI; run checks
- `update_plan`
- `Bash` — Export static web build
- `Bash` — Add launch configs for web previews
- `preview_start`

</details>

### 🤖 Claude

Попередній перегляд ще дивиться на стару тимчасову папку, тому запускаю сервер вручну й відкриваю його за URL.

<details><summary>7 tool call(s)</summary>

- `Bash` — Serve production web build locally
- `Bash` — Check deep-link fallback returns index.html
- `preview_start` — http://localhost:4173
- `resize_window`
- `browser_batch`
- `browser_batch`
- `Bash` — Verify expo start --web serves and bundles

</details>

### 🤖 Claude

Обидва режими працюють. Комічу зміни.

<details><summary>3 tool call(s)</summary>

- `update_plan`
- `Bash` — Run checks and commit web retarget
- `wrap_up`

</details>

## 🧑 User — 2026-10-19 19:43 UTC

думаю краще бо там у мене є акаунт Netlify

<details><summary>3 tool call(s)</summary>

- `update_plan`
- `Bash` — Switch deploy to Netlify and check CLI login
- `Bash` — Fix README deploy table

</details>

### 🤖 Claude

Конфіг переведено на Netlify. Комічу, а потім буде потрібен твій логін.

<details><summary>3 tool call(s)</summary>

- `update_plan`
- `Bash` — Commit Netlify deploy config
- `wrap_up`

</details>

## 🧑 User — 2026-10-19 19:47 UTC

Залогінивсь у Netlify CLI, роби тестовий деплой.

<details><summary>2 tool call(s)</summary>

- `update_plan`
- `Bash` — Check Netlify login and deploy flags

</details>

### 🤖 Claude

Залогінено як goloviyillya@gmail.com. Створюю сайт `cashmine-holovii` і деплою туди production-збірку.

<details><summary>1 tool call(s)</summary>

- `Bash` — Build web and deploy to new Netlify site

</details>

### 🤖 Claude

Деплой пройшов. Додаю `.netlify/` у `.gitignore` (там локальний ID сайту) і перевіряю живий сайт.

<details><summary>2 tool call(s)</summary>

- `Bash` — Ignore .netlify and check live URLs
- `navigate` — https://cashmine-holovii.netlify.app

</details>

### 🤖 Claude

Сайт віддає 401 і "Login Redirect", тобто стоїть захист доступу. Дивлюся, звідки він береться.

<details><summary>3 tool call(s)</summary>

- `Bash` — Inspect 401 headers and site protection settings
- `Bash` — Commit gitignore update
- `wrap_up`

</details>

## 🧑 User — 2026-10-19 19:49 UTC

Так, вимкни Netlify team login на сайті cashmine-holovii через API, щоб він став публічним, і перевір живий сайт на телефонному розмірі.

<details><summary>2 tool call(s)</summary>

- `update_plan`
- `Bash` — Disable Netlify team login and recheck status

</details>

### 🤖 Claude

Захист вимкнено: обидві адреси повертають 200. Перевіряю сайт у браузері на розмірі телефона.

<details><summary>5 tool call(s)</summary>

- `update_plan`
- `resize_window`
- `browser_batch`
- `resize_window`
- `wrap_up`

</details>

### 🤖 Claude

Сайт тепер публічний: **https://cashmine-holovii.netlify.app**

Через API Netlify вимкнув `sso_login` (team login) тільки для `cashmine-holovii`, налаштування команди не змінював. Пароля на сайті й не було.

Що перевірив на живому сайті:
- Через `curl` обидві адреси, `/` і `/assets/123`, повертають `200`, тож 401 більше немає.
- На розмірі телефона (375×812) головна сторінка рендериться в темній темі, у консолі помилок немає.
- `_redirects` працює: прямий перехід на `/assets/123` відкриває застосунок і показує екран Expo Router для неіснуючого маршруту, а не 404 від Netlify.

Зараз на сайті тестові значення з `.env.example`, тому там видно `api.example.com` і "Token: not set". Під час тестового впишеш справжні значення в `.env.local` і запустиш `npm run deploy`. Значення вшиваються під час збірки, тож після кожної їх зміни треба деплоїти заново.

Якщо твоя команда в Netlify вмикає team login для всіх нових сайтів, це спрацює й на інших сайтах. Тестовий робитимемо на цьому ж, тож це не страшно.

Що лишилось:
1. **Публічний GitHub-репозиторій.** Встанови й авторизуй `gh`, і я створю його та запушу всю історію комітів:
   ```bash
   brew install gh && gh auth login
   ```
2. **Відповісти Івану**, що веб-збірка і деплой готові. За бажанням можна додати посилання.
3. **`shouldRetry`** у [query-client.ts:11](src/lib/query-client.ts:11) усе ще чекає на тебе.

## 🧑 User — 2026-10-19 20:07 UTC

в github залогінився
допоможи мені поюзати expo щоб я на завтра був готовий хоча я і всерівно буду все робити за допомогою Claude code

<details><summary>2 tool call(s)</summary>

- `update_plan`
- `Bash` — Check gh auth, secrets in history, API CORS

</details>

### 🤖 Claude

У історії немає секретів, комітився тільки `.env.example`. Створюю публічний репозиторій і пушу.

<details><summary>2 tool call(s)</summary>

- `update_plan`
- `Bash` — Create public GitHub repo and push main

</details>

### 🤖 Claude

Гілка називається `master`, а CI налаштований на `main`. Репозиторій щойно створений, тому перейменовую гілку зараз.

<details><summary>6 tool call(s)</summary>

- `Bash` — Rename branch to main and set as default
- `update_plan`
- `Bash` — Create practice branch and point env at CoinGecko
- `update_plan`
- `Bash` — Write practice markets feature and coin route
- `Bash` — Fix RefreshControl typing

</details>

### 🤖 Claude

Типи проходять. Запускаю dev-сервер і дивлюсь у браузері розміром з телефон.

<details><summary>8 tool call(s)</summary>

- `update_plan`
- `Bash` — Start Expo web dev server
- `Bash` — Wait for dev server
- `resize_window`
- `browser_batch`
- `Bash` — Read dev server log and port owner
- `Bash` — Use static style on linked Pressable
- `browser_batch`

</details>

### 🤖 Claude

Тепер ряд виглядає правильно. Перевіряю перехід на екран деталей.

<details><summary>4 tool call(s)</summary>

- `browser_batch`
- `resize_window`
- `Bash` — Commit practice work locally
- `wrap_up`

</details>

### 🤖 Claude

Репозиторій **https://github.com/IlGoloviy/cashmine-app** тепер публічний. У гілці `main` уся історія, усі коміти від твоєї особистої пошти. GitHub Actions мав запуститись після пушу, але результат CI я не перевіряв.

## Практика: локальна гілка `practice`

Цю гілку я не пушив, тож у репозиторій для здачі вона не потрапить. Це повна мініфіча на CoinGecko, побудована так само, як ти будуватимеш фічі завтра. Я перевірив її в браузері розміром з телефон: список рендериться, клік відкриває `/coins/bitcoin` з кнопкою "назад", у консолі помилок немає.

Пройди файли в такому порядку. Це той самий цикл, який буде на тестовому:

| Крок | Файл | Що вивчити |
|---|---|---|
| 1 | [schemas.ts](src/features/markets/schemas.ts) | Як описати відповідь API через zod, звідки беруться типи |
| 2 | [api.ts](src/features/markets/api.ts) | Виклик `request()` з `query` і `signal` |
| 3 | [queries.ts](src/features/markets/queries.ts) | Фабрика ключів і хуки `useQuery` |
| 4 | [index.tsx](src/app/index.tsx) | Екран: хук → `QueryView` → `FlatList` |
| 5 | [coin-row.tsx](src/features/markets/components/coin-row.tsx) | `Link` з typed route |
| 6 | [coins/[id].tsx](src/app/coins/[id].tsx) | Динамічний маршрут і `useLocalSearchParams` |

`★ Insight ─────────────────────────────────────`
- **Веб-пастка, на яку ми наткнулися:** `<Link asChild>` з `<Pressable style={({pressed}) => ...}>`. На native все працює, а на вебі `Link` підміняє стиль-функцію, і верстка ряду розвалюється. Я виправив це і залишив коментар у коді. Завтра, якщо верстка поламалась тільки у вебі, першою перевір стиль-функцію.
- **`Stack.Screen` всередині екрана** (`<Stack.Screen options={{ title: coin.name }} />`) — це спосіб Expo Router задати заголовок з даних. У React Navigation ти зробив би те саме через `navigation.setOptions`.
- **Фабрика ключів** (`marketKeys.coin(id)`) окупиться на мутаціях. Після переказу пишеш `invalidateQueries({ queryKey: marketKeys.all })`, і оновлюються саме потрібні дані.
`─────────────────────────────────────────────────`

## Твоя вправа: екран деталей

Зараз у [coins/[id].tsx:17](src/app/coins/[id].tsx:17) стоїть `TODO`: показано тільки назву монети. Допиши рендер `coin` (тип `CoinDetail` уже виведено зі схеми):
- Іконка (`expo-image`, `coin.image.large`), ціна, ринкова капіталізація (`formatFiat`), зміна за 24 год, зелена або червона, як у `CoinRow`.
- `coin.description.en` приходить з HTML-тегами. Вирішити, як його показати, — частина вправи: обрізати теги регуляркою, показати перші N символів чи взагалі прибрати опис.

Це 10–20 рядків. Після них ти один раз сам пройдеш шлях "дані → UI" в цьому проєкті.

## Як працювати завтра з Claude Code

1. **13:00 UTC, приходить лист.** Скопіюй URL і токен у `.env.local` і перезапусти `npm run web`.
2. **Дай Claude Code увесь бриф і документацію API** та попроси спершу план фіч без коду. Він автоматично прочитає [AGENTS.md](AGENTS.md) і знатиме структуру `features/` і правила для грошей.
3. **Роби по одній фічі:** схема → API → queries → екран, як у `practice`. Після кожної фічі запускай `npm run check`, перевіряй у браузері на розмірі телефона і роби коміт. Вони дивитимуться всю історію комітів, тож маленькі коміти краще за один великий.
4. **Деплой роби рано, а не в кінці.** Щойно запрацює перший екран, запусти `npm run deploy`. Якщо API заблокує запити через CORS, ти побачиш це о 13:30, а не о 14:55.
5. **За 15 хвилин до кінця:** заповни README ("What I built", "Trade-offs"), експортуй AI-розмови в `ai-logs/`, зроби фінальний деплой і `git push`.

Щоб повернутися на чисту гілку перед тестовим:
```bash
git switch main
```

Після цього перевір `.env.local`. На `practice` я записав туди URL CoinGecko, а файл не в git, тому при перемиканні гілок він не змінюється.

## 🧑 User — 2026-10-20 08:04 UTC

_[screenshot attached]_

_[screenshot attached]_

_[screenshot attached]_

в гітхабі зараз бачу що ci check валиться

<details><summary>3 tool call(s)</summary>

- `update_plan`
- `Bash` — Reproduce npm ci in a fresh clone
- `Bash` — Inspect CI run for node/npm versions

</details>

### 🤖 Claude

Версії Node і npm на CI такі самі, як у тебе. Тоді різниця має бути в локальному конфігу npm. Перевіряю `~/.npmrc`.

<details><summary>7 tool call(s)</summary>

- `Bash` — Show npm config differences
- `update_plan`
- `Bash` — Regenerate lockfile without legacy peer deps in clone
- `update_plan`
- `Bash` — Run every CI step in a clean clone
- `update_plan`
- `Bash` — Commit fix in clone, push to local main and GitHub

</details>

### 🤖 Claude

Запушено. Твоя гілка `practice` і зміни в `[id].tsx` залишились як були. Чекаю, поки на GitHub закінчиться CI.

<details><summary>2 tool call(s)</summary>

- `Bash` — Wait for CI run and show step results
- `wrap_up`

</details>

### 🤖 Claude

CI тепер зелений. Ось результат останнього запуску на `main`:

`npm ci` ✅ · typecheck ✅ · lint ✅ · tests ✅ · build:web ✅

**Причина.** У твоєму `~/.npmrc` стоїть `legacy-peer-deps=true`. Через нього npm не записав peer-залежності в `package-lock.json`, зокрема `@react-native/metro-config` і babel-плагіни. Локально все працювало, бо твій npm поводиться так само. На CI цього налаштування немає, тож там npm бачив, що в lock-файлі бракує пакетів, і `npm ci` падав.

**Виправлення:**
- Додав у проєкт `.npmrc` з `legacy-peer-deps=false`. Налаштування проєкту мають пріоритет над глобальними, тож lock-файл тепер однаковий на твоєму маку і на CI. Глобальний `~/.npmrc` я не змінював, бо він може бути потрібен іншим твоїм проєктам.
- Перегенерував `package-lock.json`. Конфліктів peer-залежностей не з'явилося, тобто `legacy-peer-deps` цьому проєкту взагалі не потрібен.
- Перед пушем повторив усі кроки CI в чистому клоні без `.env.local`, і все пройшло.

**Твоя робота.** Ти зараз на гілці `practice`, і в `src/app/coins/[id].tsx` є твої незакомічені зміни. Щоб не зачепити їх, я робив виправлення в окремому клоні і передав коміт прямо в `main`, твої файли лишились як були. Щоб забрати виправлення в `practice`, закоміть свої зміни й виконай:
```bash
git merge main
```

`★ Insight ─────────────────────────────────────`
- Глобальний `legacy-peer-deps=true` часто ставлять, щоб позбутися помилки ERESOLVE в одному проєкті, а потім забувають, що він діє на всі. Lock-файл тоді виходить неповним, і CI ламається.
- Тут допомогла перевірка `npm ci` у свіжому клоні: так видно саме те, що бачить CI, а не те, що вже лежить у твоєму `node_modules`. Перед завтрашньою здачею варто зробити те саме: клонувати публічний репозиторій і запустити `npm ci && npm run build:web`. Так ти побачиш, що рецензенти зможуть запустити проєкт.
`─────────────────────────────────────────────────`

## 🧑 User — 2026-10-20 08:48 UTC

окей я заранив і ios i android апки все запускається
що мені треба ще підготувати до того як я розпочну тестове
і ще врахуй що я буду робити тестове в новій сесії щоб воно одразу логи з запитів записувало згідно вимог до тестового чи як взагалі краще з цим зробити?

<details><summary>1 tool call(s)</summary>

- `ToolSearch`

</details>

### 🤖 Claude

Чудово, що все запускається на всіх трьох платформах. Нижче список того, що ще варто зробити, і пропозиція, як влаштувати AI-логи.

## Що доробити до старту

**Обов'язково**
1. **Дописати `shouldRetry`** у [query-client.ts:11](src/lib/query-client.ts:11). Зараз там `TODO` з тимчасовою реалізацією і два попередження лінтера. Рецензенти побачать це в публічному репозиторії ще до того, як ти почнеш тестове. Можеш дописати сам або попросити мене.
2. **Перед стартом повернутися на чистий `main`:**
   ```bash
   git switch main && cp .env.example .env.local
   ```
   Гілка `practice` локальна, тож у репозиторій для здачі вона не потрапить.
3. **Час:** 13:00 UTC — це **16:00 за Києвом**, бо Україна ще на літньому часі до 25 жовтня. Перевір і папку «Спам», вони прямо про це попереджають.
4. **Залогінитися заздалегідь:** `gh auth status` і `npx netlify-cli status`. Це займає хвилину, але сесії бувають протерміновані.

**Бажано**

5. Підготувати **стартовий промпт** для нової сесії (є нижче), щоб о 16:00 одразу вставити його разом із брифом.
6. Відкрити поруч вкладки: Netlify dashboard, GitHub репозиторій, документацію API, коли прийде лист.

## AI-логи: як краще

Вимога: AI-розмови кладуться в `ai-logs/` у публічному репозиторії. Підходять експорт, посилання або скріншоти.

**Головний ризик — токен API.** Ти вставиш лист із токеном у сесію, і він потрапить у транскрипт. Якщо закомітити сирий транскрипт у публічний репозиторій, токен буде в публічному доступі. Тому писати логи автоматично просто в репозиторій погана ідея. Потрібен крок, який вирізає токен.

**Що раджу:**
- Claude Code **і так зберігає кожну сесію** локально (`~/.claude/projects/…/<id>.jsonl`), окремо записувати нічого не треба. Загубити розмову не вийде, навіть якщо застосунок впаде.
- Я заздалегідь напишу скрипт `npm run ai-logs`, який:
  1. бере транскрипт сесії Claude Code для цього проєкту;
  2. перетворює його на читабельний Markdown (повідомлення, рішення AI, які файли змінено);
  3. **автоматично вирізає токен** зі значень у `.env.local`, а заразом і будь-що схоже на Bearer-токени;
  4. записує `ai-logs/01-task.md`.
- Наприкінці тестового ти запускаєш одну команду, переглядаєш файл і комітиш.
- Цю сесію з підготовкою тим самим скриптом експортую як `ai-logs/00-project-setup.md`. Перевіряючі побачать чесну історію: що було підготовлено заздалегідь і що зроблено за дві години.

**Про нову сесію:** відкривай її саме в `~/CashMine/cashmine-app`. Тоді Claude Code одразу підхопить [AGENTS.md](AGENTS.md) і [CLAUDE.md](CLAUDE.md) з усіма правилами проєкту, а скрипт знайде транскрипт за шляхом проєкту.

## Стартовий промпт для нової сесії

```
Це 2-годинне тестове для CashMine. Проєкт уже підготовлено, правила в AGENTS.md — дотримуйся їх.
Ціль: мобільний веб (Expo web), деплой на Netlify (npm run deploy), публічний репо з історією комітів.

Ось бриф і документація API: <вставити>
Токен і URL я вже вписав у .env.local — не виводь токен у чат і не комітить його.

1. Спершу дай план фіч за пріоритетом під 2 години (MVP → nice-to-have), без коду.
2. Потім роби по одній фічі: schemas → api → queries → екран, після кожної npm run check + коміт.
3. Задеплой одразу після першого робочого екрана, щоб рано побачити CORS-проблеми.
```

`★ Insight ─────────────────────────────────────`
- Вони просять AI-логи, щоб побачити, **як ти працюєш з AI**: чи ставиш чіткі задачі, чи перевіряєш результат, чи помічаєш помилки AI. Тому читабельний Markdown кращий за сирий zip: рецензент реально його прочитає. А пункт про токен у стартовому промпті сам по собі покаже, що ти пам'ятаєш про безпеку.
- Окремий лог підготовки — це про прозорість. В історії комітів видно, що каркас створено напередодні, тож краще показати це самому, ніж чекати питання на інтерв'ю.
`─────────────────────────────────────────────────`

<details><summary>1 tool call(s)</summary>

- `wrap_up`

</details>

## 🧑 User — 2026-10-20 08:53 UTC

Зроби скрипт npm run ai-logs, експортуй цю сесію як 00-project-setup, і допиши shouldRetry за мене з поясненням рішень.

<details><summary>9 tool call(s)</summary>

- `update_plan`
- `Bash` — Locate this session's transcript files
- `Bash` — Analyze transcript JSONL structure
- `Bash` — Check TanStack retry failureCount semantics
- `update_plan`
- `Bash` — Create main worktree and install deps
- `Write` — /Users/clusterone/CashMine/wt-main/scripts/ai-logs.mjs
- `Bash` — Add npm script and dry-run export to temp file
- `Bash` — Test redaction on a fake transcript

</details>

### 🤖 Claude

Усі три витоки вирізано, у файлі 0 збігів. Тепер `shouldRetry`.

<details><summary>6 tool call(s)</summary>

- `update_plan`
- `Read` — /Users/clusterone/CashMine/wt-main/src/lib/query-client.ts
- `Edit` — /Users/clusterone/CashMine/wt-main/src/lib/query-client.ts
- `Edit` — /Users/clusterone/CashMine/wt-main/src/lib/query-client.ts
- `Write` — /Users/clusterone/CashMine/wt-main/src/lib/__tests__/query-client.test.ts
- `Bash` — Format and run typecheck, lint, tests

</details>

### 🤖 Claude

Усі 24 тести проходять, попереджень лінтера більше немає. Оновлюю README й `ai-logs/README.md`, а потім експортую цю сесію.

<details><summary>3 tool call(s)</summary>

- `update_plan`
- `Bash` — Document ai-logs script in READMEs
- `Bash` — Export this session and scan for sensitive data

</details>

