# Frontend домашка — Owner Review: рішення (Рівні 1–2)

**Фіча:** Owner групового бронювання бачить, що обрав кожен гість, і підтверджує спільне замовлення для ресторану.
**Проєкт:** `frontend/restaurant-frontend-app`
**Сторінка:** `http://localhost:4200/reservations/demo-reservation/group-order?demo`
**Статус:** Практичне + Рівні 1–2 готові (`npm run test:hw` — 52/52 GREEN).

## Як запустити

```bash
cd frontend/restaurant-frontend-app
npm ci
npm start          # http://localhost:4200
# відкрити: http://localhost:4200/reservations/demo-reservation/group-order?demo
```

## Що зроблено

### Практичне завдання

- `ParticipantCardComponent` (`src/app/components/group-orders/participant-card/`) — standalone-картка учасника:
  - стан тільки через `input()`/`computed()` (без Subject/BehaviorSubject);
  - заголовок `Owner: …` / `Guest: …`, статус кошика — `<span class="chip">` **текстом** (`Submitted` / `Still choosing`), а не лише кольором;
  - рядки страв: фото або перша літера на зеленому колі, назва, кількість (`× 2`), ціна через `currency`-пайп;
  - `Subtotal` з верхньою розділовою лінією.
- Сторінка `GroupOrderPageComponent` (`src/app/pages/group-order-page/`) + маршрут `/reservations/:id/group-order`.

### Рівень 1 — верстка екрана Owner Review (статичні дані, без HTTP)

- **Шапка** з `GROUP_ORDER_PREVIEW.invite`: адреса (`LocationAddress`), дата (`StartTime | date: 'mediumDate'`), час (`shortTime`, діапазон `StartTime – EndTime`), `4 of 5 guests` (`participants().length` + `MaxGuestCount`). Іконки з `src/assets/svg/` (`address`, `calendar-green`, `clock-green`, `people-green`) через `<img alt="">`.
- **Grand Total** = `GROUP_ORDER_PREVIEW.sessions.total` через `currency`-пайп, зеленим (`color.$green-600`).
- **Семантика:** один `<main>`, один `<h1>`, список учасників `<ul>`/`<li>`, картка — `<article>`.
- **Стилі** (`.scss` поруч із компонентом, `styleUrl` у `@Component`):
  - оболонка: фон сторінки `#F7F7F7` (`color.$neutral-100`), контент-колонка `min(640px, 100%)` по центру, скинутий `h1`, meta-рядок з іконками, список карток на `grid`;
  - картка на сірому фоні: білий фон `#FFFFFF` з `border` замість важкої тіні (значення — з Figma); аватар-коло; вирівнювання цін через `tabular-nums`;
  - **кольори тільки з `app/shared/styles/abstracts/colors`** (`@use … as color`, без `@import` і без raw hex; виняток — одна напівпрозора тінь картки в `rgba()`);
  - медіа-правило `420px`: картка й рядки стискуються, назви страв переносяться;
  - за макетом додано декоративну іконку-кошик біля страв (через CSS mask, без інтерактиву): редагування чужих кошиків бекенд не вміє і в обсяг ДЗ не входить.
  - перевірка тестами на практиці: перша версія іконки як `<img>` зламала тест «фото страви має розмір 40×40» (тест бере перший `<img>` у картці — ним став смітник). Виправлено без правки тесту: іконка стала декоративним `<span>` із CSS mask; знову 39/39 SUCCESS.
- **Адаптив:** перевірено DevTools — екран не ламається на 375 px.

### Рівень 2 — живі дані, стани, Submit (усього 52 тести: 26 helpers + 8 картка + 5 сервіс + 13 сторінка)

- **`GroupOrdersService`** (`src/app/services/group-orders/`, новий) — 5 HTTP-методів, кожен покритий тестом:
  `getGroupInvite$` (ланцюг: існуючий `GuestInviteService.getInviteToken$` → токен → `getInvite$`),
  `getSessions$`, `getOwnerSessionId$`, `getStatus$`, `submit$` (POST, `Observable<SubmittedDish[]>`).
  Сервіси лишаються «чистим RxJS» — Observable, які легко мокати spy-ами; сигнали живуть лише на межі компонента.
- **Дані сторінки:** `getGroupInvite$(reservationId)` → `switchMap` (другий запит стартує з відповіді першого — інакше `undefined.GroupReservationId`) → `forkJoin({ sessions, status, owner })`;
  статичний `GROUP_ORDER_PREVIEW` замінений на сигнальні поля + `computed`-похідні (`participants`, `consolidated`, `total`, `unsubmittedCount`, `hasDishes`, `sentOut`).
- **«My Pre-Order»:** картка дістає `isMe` (порівняння сесії з `getOwnerSessionId$`).
- **Головна пастка — Grand Total $540, а не $760:** `consolidatePreOrder()` рахує лише підтверджені кошики (Olena «Still choosing» на 220 не входить). Сторінка чесно пояснює різницю жовтою плашкою «1 participant hasn't submitted their cart yet…».
- **Стани екрана:** завантаження винесено в метод `load()` (не одноразовий `ngOnInit`) — кнопка «Try again» перевантажує запит (`getGroupInvite$` викликається вдруге); `errorStatus` → 404
  «Group reservation not found»; `hasDishes()` → «Participants haven't added any dishes yet»;
  `loading`-сигнал на час запиту. Усі три стани перевірені тільки тестами: демо-перехоплювач на ці запити завжди відповідає успіхом, тож в браузері я їх не відтворювала і скрінів цих станів не маю.
- **Submit Pre-Order:** діалог — спільний `<app-modal>` проєкту (`shared/custom-components/modal/`). Подвійний клік закритий двома шарами: `[disabled]="submitting()"` (бачить користувач) + `if (this.submitting()) return` у методі (гарантія для сервера). Після успіху: `sent` → бейдж «Sent to Restaurant», кнопка зникає (read-only за `02-sent-to-restaurant.png`). При помилці submit скидається лише `submitting` — екран живий, кнопка знову активна.
- **Експеримент 2×2 із подвійним кліком:** перевірила захист (guard / disabled / обидва / жодного). Без обох шарів `submit$` викликався двічі; з будь-яким одним — рівно раз. Висновок: прапорець `submitting` — джерело істини, `disabled` і `if` — два незалежних виконавці.
- **Витік підписок:** обидва `subscribe` зібрані в `Subscription`-сінк, `ngOnDestroy` відписує все.
- **Моки:** демо-бекенд скидає стан після перезавантаження — Submit можна тиснути знову; другий submit без перезавантаження дає чесні 400 «Group reservation was submitted.» — як справжній бекенд.
- **Стилі бейджа:** «Collecting pre-orders» — (`$neutral-200`/`$neutral-600`),
  «Sent to Restaurant» — (`$orange-100`/`$orange-600`)

## Скріни

On googledrive

## Чи використовувався AI

Так, використовувався.

### Рівень 1

- **AI робив:** зіставлення вимог, розкиданих по кількох файлах (`homework-frontend.md`, `homework-design/README.md`, `CLAUDE.md`); ревью HTML/SCSS-пропозицій; дві чернетки стилів картки, згенеровані AI, були перевірені й прийняті лише після правки (сирий hex замінено на змінні палітри `abstracts/colors`, прибрано чужий шрифт Inter і хак з негативним margin на .chip); перевірка, чи не зіпсували зміни існуючі тести.
- **AI НЕ робив:** не писав TS/HTML логіку сторінки (сигнали, поля, пайпи — написані вручну мною); не приймав рішень за структурою (сторінка замість модалки — за `homework-design/README.md`).
- **Як перевірено результат:** не «на слово AI», а тестами `npm run test:hw` + чотирма гейтами нижче + ручним переглядом у браузері на 375 px.

### Рівень 2

- **AI робив:** читання заморожених тестів як специфікації (так знайдено пастки: `hasn.t` у regex вимагає скорочення, а не «has not»; тест бере перший `<img>` у картці); покрокове ревью (сервіс → дані → стани → submit), яке зловило IDE-заглушку з `throw` замість реалізації та `( click)` з пробілом — прив'язку, що мовчки не працює; дизайн `load()` + станів помилки виведено з вимоги тесту «викликано вдруге».
- **AI НЕ робив:** не писав код сервісу, станів і submit-логіки. Загалом з АІ все можна було б написати швидше, але мене цікавила практика на цьому проекті. Код в GroupOrderPageComponent можна написати краще, але в мене ще трохи бракує знань — і це те, заради чого тут практика.
- **Як перевірено результат:** знову ж не на слово: `npm run test:hw` (52 GREEN), чотири гейти, ручний прохід Submit-сцени в браузері. Гіпотези перевіряла власними експериментами — матрицею 2×2 (guard × disabled) для захисту від подвійного кліка.

## Як перевірено (фактичні результати)

```
npx tsc -p tsconfig.app.json  --noEmit   # без виводу (ok)
npx tsc -p tsconfig.spec.json --noEmit   # без виводу (ok)
BACKEND_URL=https://example.com npm run build
  # Initial total 643.05 kB; "Bundle check passed: no configuration placeholders left."
  # (попередження budget 500 kB / dayjs-ESM — наявний борг проєкту, не домашки)
npm run test:hw
  # Executed 52 of 52 SUCCESS — TOTAL: 52 SUCCESS
```

Примітка: повний `npm test` показує 46 FAILED із 269 — ці тести **були червоними в `main`
до цих змін** (умова: «решта тестів проєкту до домашки не належить — частина з них уже червона в main»),
жоден із них не стосується файлів домашки (всі зміни — тільки `group-orders`).

Ручна перевірка: сторінка відкрита з `?demo` (мок-логін Owner), переглянута на десктопі та 375 px;
проклікана вся Submit-сцена (діалог → «Sent to Restaurant» → кнопка зникла). Перед кожним Submit —
перезавантаження сторінки, бо мок-бекенд одноразовий.

## Баги, які зелені тести не піймали (два кейси)

1. **Іконка-смітник зламала чужий тест.** Додавання `<img>` з `trash.svg` перед фото страви
   червоним зробило тест «фото страви має розмір 40×40» — він бере перший `<img>` у картці.
   Тест урятував ситуацію; виправлено без правки тесту — іконка стала декоративним
   `<span>` із CSS mask (дата: 41/52 → 42/52 GREEN).

2. **Тест перевіряє одне — браузер бачить решту.** Для жовтої плашки AI запропонував
   «елегантний» тернарник-склейку `hasn{{ … ? "'" : "'ve" }}t`. На 1 учаснику виходить
   коректне «hasn't» (саме цей випадок фіксує тест — він зелений), а на 2+ — нісенітниця
   **«hasn'vet»**. Усі тести лишалися зеленими; баг помічено очима в браузері на демо
   з двома непідтвердженими учасниками. Виправлено на читабельне
   `{{ n === 1 ? "hasn't" : "haven't" }}`. Висновок: тести гарантують лише те, що
   перевіряють, — решту має бачити людина.
