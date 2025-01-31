# Popups management for React SPA

> This package from 🇷🇺 Russia with love!
>
> You can read this readme in [Russian](./readme.ru.md).

## Motivation / Features

- [x] Components in the popup have a domain area environment
- [x] No need for a centralized popup store
- [x] Popups can be opened from anywhere in the application
- [x] Simple API
- [x] Can be used outside of React (e.g., in STM)
- [ ] Microfrontends support

> This package does not implement the UI of modal windows.
> It is only intended _to manage them_ in the application.

You can use it with any UI popups in React, such as modal windows from Material-UI, Ant Design, react-modal, or any others.

## Little bit of theory / Vocabulary

__Popup__ - A UI component with content that can be shown or hidden depending on the value of a certain props variable.

> Popups themselves do not contain the business logic of the application.

Popups can be divided into dynamic and static, as well as local and global.

__Dynamic popup__ - The content of such a popup is mounted and unmounted only when the popup is opened and closed.

__Static popup__ - The content of such a popup is mounted and unmounted along with the domain area in which it will be used.

In such components, it does not make sense to use `useEffect` on mount, most likely this hook will trigger long before the popup is opened.

> As a rule, such popups retain their state between openings, which can be useful in some tasks.

__Actions__ - components that are containers for popups.

In the simplest case, they contain the business logic of the application, needed only to open and close popups.

_example:_
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

You can place actions anywhere in the application where it is convenient for you.

It is recommended to do this in the domain area where the popup will be used, as you will be able to use props, contexts, and hooks from this area.

> Not all popups (rather almost none) should be completely global.

__Local popups__ - popups that open only in one specific place in the application. An action with such a popup is conveniently placed directly in the component where it will be used.

_example:_
```tsx
<>
  <Button onClick={() => openPopup("popup-example")}>Open popup</Button>
  <ExampleAction>local popup content</ExampleAction>
</>
```

__Global popups__ - popups that can be opened from anywhere in a specific domain area of the application. An action with such a popup is conveniently placed in the root component of the domain area.

> As a rule, these are popups that can be opened from different places in the application.

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

At the same time, if the user leaves the domain area, the popup will be unmounted.

## Usage
For each action, you need to create a unique `intent: string` - a key to open the popup with this action.

```tsx
import type { FC, PropsWithChildren } from "react";
import { usePopup } from "react-use-popup";

// It is convenient to describe the intent in the action component and export it from there
export const intent = "popup-example";

const ExampleAction: FC<PropsWithChildren> = props => {
  const { children } = props;

  // use the intent to get the popup open state
  const visible = usePopup(intent);

  return (
    <Popup visible={visible}>
      {children}
    </Popup>
  );
};
```

To open a popup, just call the open method with the desired `intent`.
```tsx
import { openPopup } from "react-use-popup";
import { intent } from "./ExampleAction";
...
<Button onClick={() => openPopup(intent)}>Open popup</Button>
```

This works both in React and outside of it (redux, effector, sagas, etc.)

> _Why?_
> `CustomEvent` is used to manage popups.
> The context is `window`, which is available everywhere.

To close a popup, you need to call the close method with the same `intent`.
```tsx
import { closePopup } from "react-use-popup";
import { intent } from "./ExampleAction";
...
<Button onClick={() => closePopup(intent)}>Close popup</Button>
```

You can also set handlers that will be called when the popup is opened/closed.

## Handbook

### Passing parameters to the component in the popup
Just pass them as props.
Or use contexts, hooks, etc. from your domain area.

> You can use `useEffect` on props as usual.

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

In dynamic popups, it is convenient to use `useEffect` on mount.

```tsx
const Article: FC<{ id: UUID }> = props => {
  const { id } = props;

  useEffect(() => {
    fetchArticle(id);
  }, []);

  return <div>Article content</div>;
};
```

### Passing parameters when opening
> This is relevant for static popups.
> In dynamic popups, it is probably easier to use `useEffect` on mount (see above).

You can pass an object with parameters to the popup open method.

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

These parameters will be passed to the open handler and you will be able to process them.

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

In this case, it is not recommended to change the props of the component in the popup.

It is better to call the method from the component directly (see below).

### Loading data when opening a popup
The idea is that the logic of the component inside the popup does not know that it is in a popup.

However, if we cannot use `useEffect` on mount (for example, in static popups), then we can pass control outside (preferably using `ref / useImperativeHandle`).

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

This avoids unnecessary re-renders and also allows exporting additional methods.

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

### Submitting a form from a popup before closing
- The form in the popup manages the logic of sending data to the server itself, and to close the popup after a successful submission, you need to call the popup close method. To do this, pass it to the form.
- And from the form, export the submit controller and attach it to the button in the popup.

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
Inside the component that will be in the popup, we describe the logic of submission, as we are directly in the business logic of the application.
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
Here the form manages the logic of sending itself to the server.

* if there is an error - show the error
* if successful - then after sending, close the popup

### Opening a second popup for confirmation

Just create another action specifically for confirmation (maybe you can even make it universal).

Now just open the new action on top of the old one and pass it the confirm form handler.

### Working with the router - reacting to URL changes
```tsx
const { pathname } = useLocation();

useEffect(() => {
  if (!pathname.endsWith("/popup")) return;

  openPopup(intent);
 }, [pathname]);
```

> Changing the URL when opening a popup does not make sense - it is better to just change the URL + use the code above → the behavior will be the same.

### Bonus - multi-instance

This is when the same popup is open, but several windows are open at the same time, and the content is different.

> This can be resolved at the Action level.

The only thing is that since the history is custom, you will need to not use the `usePopup` hook, but make the handlers yourself - they should create an instance of the popup and add it to the list that will be rendered in this Action.

> issue: [Multi-instance support](//github.com/xaota/react-use-popup/issues/4)

### Installation
```shell
$ npm install react-use-popup
```

## API / Types
#### openPopup
> `openPopup<OpenParams>(intent: string, detail?: OpenParams): void`

opens a popup with the specified `intent` and passes parameters to the open handler.

#### closePopup
> `closePopup<CloseParams>(intent: string, detail?: CloseParams): void`

closes a popup with the specified `intent` and passes parameters to the close handler.

#### usePopup [react-hook]

> `usePopup(intent: string, hooks?: UsePopupHooks<OpenParams, CloseParams>): boolean`

returns the open state of the popup with the specified `intent` and allows you to set open and close handlers.
```ts
type UsePopupHooks<OpenParams, CloseParams> = {
  open?: (detail: OpenParams) => void;
  close?: (detail: CloseParams) => void;
}
```

---

- [Contribution guidelines for this project](contributing.md)


## ROADMAP

- [ ] [Close data processing](//github.com/xaota/react-use-popup/issues/2)
- [ ] [Custom prefix for open/close events](//github.com/xaota/react-use-popup/issues/3)
- [ ] [Multi-instance support](//github.com/xaota/react-use-popup/issues/4)
