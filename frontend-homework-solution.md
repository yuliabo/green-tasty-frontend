# Frontend домашка — Owner Review: рішення (Рівень 1)

**Фіча:** Owner групового бронювання бачить, що обрав кожен гість, і підтверджує спільне замовлення для ресторану.
**Проєкт:** `frontend/restaurant-frontend-app`
**Сторінка:** `http://localhost:4200/reservations/demo-reservation/group-order?demo`
**Статус:** Практичне + Рівень 1 готові (тести зелені). Рівні 2–3 — в роботі.

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

## Скріни

On googledrive

## Чи використовувався AI

Так, використовувався. Конкретно:

- **AI робив:** зіставлення вимог, розкиданих по кількох файлах (`homework-frontend.md`, `homework-design/README.md`, `CLAUDE.md`); ревью HTML/SCSS-пропозицій; дві чернетки стилів картки, згенеровані AI, були перевірені й прийняті лише після правки (сирий hex замінено на змінні палітри `abstracts/colors`, прибрано чужий шрифт Inter і хак з негативним margin на .chip); перевірка, чи не зіпсували зміни існуючі тести.
- **AI НЕ робив:** не писав TS/HTML логіку сторінки (сигнали, поля, пайпи — написані вручну мною); не приймав рішень за структурою (сторінка замість модалки — за `homework-design/README.md`).
- **Як перевірено результат:** не «на слово AI», а тестами `npm run test:hw` + чотирма гейтами нижче + ручним переглядом у браузері на 375 px.

## Як перевірено (фактичні результати)

```
npx tsc -p tsconfig.app.json  --noEmit   # без виводу (ok)
npx tsc -p tsconfig.spec.json --noEmit   # без виводу (ok)
BACKEND_URL=https://example.com npm run build
  # Initial total 766.12 kB; "Bundle check passed"
npm run test:hw
  # Executed 39 of 39 SUCCESS — TOTAL: 39 SUCCESS
```

Примітка: повний `npm test` показує 46 FAILED із 269 — ці тести **були червоними в `main`
до цих змін** (умова: «решта тестів проєкту до домашки не належить — частина з них уже червона в main»),
жоден із них не стосується файлів домашки (всі зміни — тільки `group-orders`).

Ручна перевірка: сторінка відкрита з `?demo` (мок-логін Owner), переглянута на десктопі та 375 px.
