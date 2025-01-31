# Popups management for React SPA

> You can read this readme in [English](./readme.md).

## Motivation / Features

- [x] Компоненты в попапе имеют окружение доменной области
- [x] Не хочется иметь централизованное хранилище попапов
- [x] Можно открывать попапы из любого места приложения
- [x] Простая API
- [x] Можно использовать вне реакта (например, в STM)
- [ ] Поддержка microfrontends

> Этот пакет не реализует UI модальных окон.
> Он предназначен только _для управления ими_ в приложении

Вы можете использовать его с любыми UI-попапами в React, например, с модальными окнами из Material-UI, Ant Design, react-modal или любыми другими

## Little bit of theory / Vocabulary

__Попап__ - UI-компонент с контентом, который может быть показан либо скрыт в зависимости от значения некой props-переменной.

> Сами попапы не содержат в себе бизнес-логику приложения.

Попапы можно разделить на динамические и статическиме, а также на локальные и глобальные.

__Динамический попап__ - Содержимое такого попапа маунтится и анмаунтится только при открытии и закрытии попапа.

__Статический попап__ - Содержимое такого попапа маунтится и анмаунтится вместе с доменной областью в которой будет использоваться.

В таких компонентах не имеет смысла использовать `useEffect` на маунт, скорее всего этот хук сработает задолго до открытия попапа.

> Как правило, такие попапы сохраняют состояния между открытиями, что может быть полезно в некоторых задачах

__Экшены__ - компоненты которые являются контейнерами для попапов.

В самом простом случае они содержат бизнес-логику приложения, нужны только для открытия и закрытия попапов.

_пример:_
```tsx
import type { FC, PropsWithChildren } from "react";
import { usePopup } from "react-use-popup";

const ExampleAction: FC<PropsWithChildren> = props => {
  const { children } = props;
  const visible = usePopup("popup-example");

  return (
    <Popup visible={visible}>
      {children}
    </Popup>
  );
};
```

Вы можете располагать экшены в любом месте приложения, где вам удобно.

Рекомендуется делать это в доменной области, где будет использоваться попап, так как вы сможете использовать пропсы, контексты и хуки из этой области.

> Далеко не все попапы (скорее практически никакие) не должны быть прям совсем глобальными.

__Локальные попапы__ - попапы, которые открываются только в одном конкретном месте приложения. Экшн с таким попапом удобно располагать прямо в компоненте, где он будет использоваться.

```tsx
<>
  <Button onClick={() => openPopup("popup-example")}>Open popup</Button>
  <ExampleAction>local popup content</ExampleAction>
</>
```

__Глобальные попапы__ - попапы, которые могут быть открыты из любого места конкретной доменной области приложения. Экшн с таким попапом удобно располагать в корневом компоненте доменной области.

> Как правило это попапы, которые могут быть открыты из разных мест приложения

```tsx
<>
  <...>
      <Button onClick={() => openPopup("popup-example")}>Open popup</Button>
  </...>

  <...>
      <Button onClick={() => openPopup("popup-example")}>Open popup</Button>
  </...>

  <ExampleAction>global popup content</ExampleAction>
</>
```

При этом если пользователь покинет доменную область, попап будет размонтирован.

## Usage
Для каждого экшена нужно завести уникальный `intent: srting` - ключ для открытия попапа с этим экшеном

```tsx
import type { FC, PropsWithChildren } from "react";
import { usePopup } from "react-use-popup";

// Удобно описывать intent в компоненте экшена и экспортировать из него
export const intent = "popup-example";

const ExampleAction: FC<PropsWithChildren> = props => {
  const { children } = props;

  // использование intent для получения состояния открытия попапа
  const visible = usePopup(intent);

  return (
    <Popup visible={visible}>
      {children}
    </Popup>
  );
};
```

Для открытия попапа надо просто вызвать метод открытия с нужным `intent`.
```tsx
import { openPopup } from "react-use-popup";
import { intent } from "./ExampleAction";
...
<Button onClick={() => openPopup(intent)}>Open popup</Button>
```

Это работает и в реакте и за его пределами (redux, эффектор, саги и т.д.)

> _Почему?_
> Для управления поапами используется `CustomEvent`.
> Контекстом выступает `window`, который доступен везде.

Для закрытия попапа нужно вызвать метод закрытия с тем же `intent`.
```tsx
import { closePopup } from "react-use-popup";
import { intent } from "./ExampleAction";
...
<Button onClick={() => closePopup(intent)}>Close popup</Button>
```

Вы также можете установить обработчики, которые будут вызваны при открытии / закрытии попапа

## Handbook

### Передача параметров в компонент в попапе
Просто передайте их как пропсы.
Или используйте контексты, хуки и т.д. из вашей доменной области

> Вы можете использовать `useEffect` на пропсы как обычно

```tsx
import type { UUID } from "node:crypto";
import type { FC } from "react";
import { useParams } from "react-router";
import { usePopup } from "react-use-popup";

export const intent = "popup-example";

const ExampleAction: FC = props => {
  const { articleId } = useParams() as { articleId: UUID };
  const visible = usePopup(intent);

  return (
    <Popup visible={visible}>
      <Article id={articleId} />
    </Popup>
  );
};
```

В динамических попапах удобно использовать `useEffect` на маунт

```tsx
const Article: FC<{ id: UUID }> = props => {
  const { id } = props;

  useEffect(() => {
    fetchArticle(id);
  }, []);

  return <div>Article content</div>;
};
```

### Передача параметров при открытии
> Это актуально для статических попапов.
> В динамических попапах вероятно проще использовать `useEffect` на маунт (см. выше)

Вы можете передать объект с параметрами в метод открытия попапа

```tsx
import { openPopup } from "react-use-popup";
import { intent } from "./ExampleAction";
...
const openHandler = useCallback(
  () => openPopup(intent, { userId }),
  [userId]
);
...
<Button onClick={openHandler}>Open popup</Button>
```

Эти параметры будут переданы в перехватчик открытия и вы сможете обработать их

```tsx
const ExampleAction: FC = () => {
  const visible = usePopup(intent, {
    open: ({ userId }) => sendAnalytics("popup opened", intent, userId)
  });

  return (
    <Popup visible={visible}>
      ...
    </Popup>
  );
};
```

В этом кейсе не рекомендуется менять пропсы компонента в попапе.

Лучше вызвать метод из компонента напрямую (см. ниже)

### Загрузка данных при открытии попапа
Идея в том чтобы логика компонента внутри попапа не знала о том, что он находится в попапе.

Однако, если мы не можем использовать `useEffect` на маунт (например в статических попапах), то можно передать управление наружу (лучше всего с помощью `ref / useImperativeHandle`)

```tsx
const ExampleAction: FC = () => {
  const ref = useRef(null);

  const visible = usePopup(intent, {
    open: ({ userId }) => ref.current?.loadData(userId)
  });

  return (
    <Popup visible={visible}>
      <PopupContent ref={ref} />
    </Popup>
  );
};
```

Это позволяет избежать лишних ререндеров а также позволяет экспортировать дополнительные методы

```tsx
const PopupContent = props => {
  const { ref } = props;
  const [data, setData] = useState(null);

  const loadData = useCallback(async (userId: UUID) => {
    const data = await fetchData(userId);
    setData(data);
  }, []);

  useImperativeHandle(ref, () => ({ loadData }), [loadData]);

  return <div>{data}</div>;
};
```

### Отправка формы из попапа перед закрытием
- Форма в попапе сама управляет логикой отправки данных сервер, а чтобы попап закрылся после успешной отправки, нужно вызвать метод закрытия попапа. Для этого передадим его в форму
- А из формы экспортируем контроллер отправки и повесим его на кнопку в попапе

```tsx
import { closePopup, usePopup } from "react-use-popup";

export const intent = "popup-example";

const closeHandler = () => closePopup(intent);

const ExampleAction: FC = () => {
  const ref = useRef(null);
  const visible = usePopup(intent);

  return (
    <Popup visible={visible}>
      <PopupContent closePopup={closeHandler} ref={ref} />

      <SubmitButton onClick={() => ref.current?.sendForm()} />
    </Popup>
  );
};
```
Внутри компонента, который будет в попапе мы описываем логику отправки, так как находимся непосредственно в бизнес-логике приложения.
```tsx
const PopupContent = props => {
  const { closeHandler, ref } = props;

  const sendForm = useCallback(async (userId: UUID) => {
    try {
      await sendFormData(userId);
      closeHandler();
    } catch (error) {
      console.error(error);
    }
  }, [closeHandler]);

  useImperativeHandle(ref, () => ({ sendForm }), [sendForm]);

  return <form>...</form>;
};
```
Тут форма сама управляет логикой отправки себя на сервер

* если ошибка - показываем ошибку
* если успех - тогда после отправки закрываем попап

### Открытие второго попапа для подтверждения

Просто создайте еще один экшн именно для подтверждения (мб можно даже универсальный сделать)

теперь просто открываем новый экшн поверх старого и передаем ему обработчик confirm формы

### Работа с роутером - реакция на изменение url
```tsx
const { pathname } = useLocation();

useEffect(() => {
  if (!pathname.endsWith("/popup")) return;

  openPopup(intent);
 }, [pathname]);
```

> Изменение урла при открытии попапа не имеет смысла - лучше просто изменить урл + использовать код выше → поведение будет тоже самое

### Бонус - мультиинстансинг

это когда попап один и тот же, при этом открыто несколько окон одновременно, а содержимое разное

> Тут можно разрулить на уровне Action

Единственное, так как история кастомная, нужно будет не использовать хук `usePopup`, а самостоятельно сделать обработчики - они должны создавать инстанс попапа и добавлять в список, который будет рендериться в этом Action

> issue: [Поддержка мультиинстансинга](//github.com/xaota/react-use-popup/issues/4)

### Installation
```shell
$ npm install react-use-popup
```

## API / Types
#### openPopup
> `openPopup<OpenParams>(intent: string, detail?: OpenParams): void`

открывает попап с указанным `intent` и передает параметры в обработчик открытия

#### closePopup
> `closePopup<CloseParams>(intent: string, detail?: CloseParams): void`

закрывает попап с указанным `intent` и передает параметры в обработчик закрытия

#### usePopup [react-hook]

> `usePopup(intent: string, hooks?: UsePopupHooks<OpenParams, CloseParams>): boolean`

возвращает состояние открытия попапа с указанным `intent` и позволяет установить обработчики открытия и закрытия
```ts
type UsePopupHooks<OpenParams, CloseParams> = {
  open?: (detail: OpenParams) => void;
  close?: (detail: CloseParams) => void;
}
```

---

- [Contribution guidelines for this project](contributing.md)


## ROADMAP

- [ ] [Обработка данных закрытия](//github.com/xaota/react-use-popup/issues/2)
- [ ] [Кастомный prefix для событий открытия / закрытия](//github.com/xaota/react-use-popup/issues/3)
- [ ] [Поддержка мультиинстансинга](//github.com/xaota/react-use-popup/issues/4)
