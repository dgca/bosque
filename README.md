# Bosque

Bosque (pronounced boh-skeh) is a state management system that imlpements the [Flux](https://facebook.github.io/flux/) pattern, and is focused on developer-friendliness. It ensures your state is always up to date, no matter where you're accessing it.

It can be used with any front-end framework, and it provides helpers to ensure your server-side state can be brought to the client.

*Demo code will use React, though React is not a prerequisite—you can use it with no view framework at all, if you'd like.*

## Getting started

`npm install --save bosque`

## The gist

Bosque creates a single, global state object (the state tree), which you interface with through actions and Stores. Actions are events that you dispatch, which any store can listen to. When a Store hears an event, it calls a callback function which you provide, and the Store can then update the state tree in whatever way it needs to.

### Top three concepts

The following three concepts are the minimum you need to know to get started with Bosque. Here's a bit of info on how they work, and then let's see them in action.

* `Store`
  * `Store` is a base class that you extend in order to write some data to the state tree. Stores must have unique names, as every store is a property on the state tree. Stores listen for actions which were provided to them via their `Store.addListener(action, callback)` or `Store.addTargetedListener(action, callback)` methods.
* `createActions`
  * `createActions` is a function that takes any number of strings as its arguments, and returns a unique action for each string it was provided (e.g. `const fooActions = makeActions('SOME_ACTION');`).
* `dispatch`
  * `dispatch` is a function that dispatches an action, so that any stores which are listening for that action will call their callbacks. `dispatch` takes two arguments, the first is the action to be called, and an optional second argument is the payload which will be given to the Store's action listener's callback function.

## Basic example

```javascript
import {
  Store,
  makeActions,
  dispatch
} from 'bosque';
import React from 'react';

// First we make some actions. `makeActions` takes comma separated strings as its
// arguments, and it returns an action for each string provided.
const demoActions = makeActions('INCREMENT', 'DECREMENT');

// Then, we make a Store subclass to keep track of our data. Our store always extends
// Store. Stores must be instantiated with a unique name.
class DemoStore extends Store {
  constructor(name) {
    super(name);
    // setInitialData takes an Object (see note on setInitialData below), which defines
    // our store's starting values. The Store also uses the keys of this Object to build
    // simple getters, which will make accessing our Store's data easier later on.
    this.setInitialData({
      counter: 0
    });
    // Stores have an addListener method which takes two arguments, an action to listen for,
    // and a callback function which will be called when the action is heard.
    this.addListener(demoActions.INCREMENT, this.increment);
    this.addListener(demoActions.DECREMENT, this.decrement);
  }

  // We define our callbacks, which—in our case—will either increase or decrease the counter,
  // depending on which action is called.
  increment() {
    this.counter = this.counter + 1;
  }
  
  decrement() {
    this.counter = this.counter - 1;
  }
}

const demoStoreInstance = new DemoStore('demoStoreInstance');

// Assume the Demo component is rendering to the DOM
class Demo extends React.Component {
  constructor() {
    super();
    // Stores have a `subscribe` method which lets us call a callback any time a store's values
    // have changed. The first argument is the thing that is subscribing, and the second argument
    // is a callback function to call when the Store's data changes. In our case, any time our
    // demoStoreInstance's data changes, we want to rerender our component.
    demoStoreInstance.subscribe(this, () => this.forceUpdate());
  }

  componentWillUnmount() {
    // You may also `unsubscribe` from the Store.
    demoStoreInstance.unsubscribe(this);
  }

  render() {
    return (
      <div>
        {/*
          Here we're getting the value of counter from our Store (see note on
          getters/setters below)
        */}
        <p>The counter&apos;s current value is {demoStoreInstance.counter}</p>
        {/*
          When the user clicks these buttons, we'll call our `dispatch` function with the
          appropriate action, our store will hear the action getting called, and our action
          listener callbacks will fire, either increasing or decreasing the value of `counter`.
          Because we subscribed to the Store with `this.forceUpdate`, that will be called, and
          our app will rerender. That's it!
        */}
        <button onClick={() => dispatch(demoActions.INCREMENT)}>
          Increase by one
        </button>
        <button onClick={() => dispatch(demoActions.DECREMENT)}>
          Decrease by one
        </button>
      </div>
    );
  }
}
```

**Note about `setInitialData`:** You can pass a regular JS Object, or an `Immutable.Map` to setInitialData. You don't have to use [Immutable](https://facebook.github.io/immutable-js/) with Bosque, but I recommend considering it. Immutable ensures you're never accidentally mutating state tree data (say, by getting a an object from a Store and modifying it directly), and it's provides many convenience methods that are nice to have.

**Note about getting and setting Store data:** When you define your store's initial data with `setInitialData`, the Store creates [getters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get) and [setters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/set) for each top-level property. These getters and setters defer to the Store methods `get` and `set`, which either write or retrieve data from the global state tree. Keep in mind that no data is saved on Stores directly, they are just pointers to the state tree. That said, for convenience, you may access and write Store 'data' (again, just pointers to the state tree) using a more familiar syntax. If you'd like, you can not use the getters and setters at all, and read/write data using `Store.get` and `Store.set`, respectively.

## Bosque's exports

### `Store`

The `Store` parent class provides methods for reading data from/writing data to the state tree. **Stores are meant to be extended**, with the subclass defining the data it is keeping track of, setting up the listeners for any actions it needs to listen to, and defining the callbacks to be called when those actions are heard.

#### Example:

```javascript
class TestStore extends Store(name) {
  constructor(name) {
    super(name);
    this.setInitialData({
      counter: 0
    });
    // Assuming you have a `testActions` object, which was made with the `makeActions` function,
    // you can use the Store.handle method to listen for a given action (e.g. INCREMENT), and
    // call a callback function in your store when that action is heard
    this.handle(testActions.INCREMENT, this._increment));
  }

  _increment() {
    const newValue = this.counter + 1;
    this.counter = newValue;
  }
}

// If you export your store, you can import it in any file and get the latest 
// value of `counter` via `testStoreInstace.counter`
export const testStoreInstance = new TestStore('testStoreInstance');
```

### `makeActions(action1, action2, ...)`

`makeActions` is a function that takes any number of action names as its arguments, and returns an object made of the action names as its keys, and a unique `Symbol` for the values.

#### Example:

```javascript
// You can now use `testActions` to either call the given actions, or listen to them
// in your stores
export const testActions = makeActions('INCREMENT', 'DECREMENT');
```

### `dispatch(action, ?payload, ?storeName)`

`dispatch` emits an action that will be heard by any Stores listening for that action. The action is required, a payload to be given to your Store's callback function is optional, and you may specify the name of a store if you only wish for some stores to hear the action (see Store's `addListener` and `addTargetedListener` methods in the `Store` section below).

#### Example:

```javascript
// When this button is clicked, the `testActions.INCREMENT` will be emitted, and any Stores
// listening for this action will call their callback handlers
<button onClick={() => dispatch(testActions.INCREMENT)}>
  Bump it
</button>
```

### `getStore(name: string): Store | undefined`

`getStore` returns a given Store instance by its name. If no Store instance with that name was found, it will return `undefined`;

#### Example:

```javascript
const someStore = getStore('testStoreInstance');
console.log(`The testStoreInstance has a counter value of ${someStore.counter}`);
```

### `destroyStore(storeName)`

`destroyStore` lets you you clean up the state tree by removing the entry for that store's name, and it also removes the Store instance from the Store registry. The function will return true if a Store by that name was found and deletion was successful, and false if no entry for that name was found.

#### Example:

```javascript
const someStore = getStore('testStoreInstance');
console.log(someStore.counter); // 0
destroyStore('testStoreInstance');
console.log(someStore.counter); // undefined
```

### `addStateChangeListener(callback)`

`addStateChangeListener` lets you set a callback function that will be called whenever the global state tree has changed. This will happen when _any_ Store has modified the state tree.

#### Example:

```javascript
function someCoolFunc() {
  console.log('The state changed!');
}
addStateChangeListener(someCoolFunc);
```

### `removeStateChangeListener(callback)`

`removeStateChangeListener` lets you remove any state change listeners you previously added.

### `hydrate(stateObject)`

`hydrate` takes an object or `Immutable.Map` as its argument, and it will merge this object with the current state tree. This lets you do things like set up server-side rendering by building the state tree on the server, send it to the client, and rebuild the previous state by merging it into the current state.

#### Example:

```javascript
hydrate({
  testStoreInstance: {
    counter: 10
  },
  someOtherStore: {
    animals: ['dog', 'cat', 'horse'],
    otherValue: 'writing documentation is fun'
  }
})
```

### `getState()`

`getState` returns the current state of the state tree as an Object. Note that the state tree is always an Immutable.Map.

### `configBosque(optionsObject)`

`configBosque` lets you configure some properties of Bosque, by providing a config object. The options you may provide are:

* **defaultSubscriberFunc:** This lets you specify the default callback function invoked when a given Store's values have changed. If no callback function is specified, the default callback will check if the subscriber has a `forceUpdate` method, and if so, it will call it when Store data has changed. This is a convenience for anyone using React. See `Store.subscribe` below.
* **createGetters:** This lets you specify whether or not you want your Store's initial data properties to create getters for each store property. It defaults to true.
* **createSetters:** This lets you specify whether or not you want your Store's initial data properties to create setters for each store property. It defaults to true.

### `bosque` (default)

`bosque` returns an object with all aforementioned functionality. This lets you create a separate instance of Bosque. **This is not necessary**, but is provided in case you'd like to have multiple discreet state trees.

## Store methods

### `Store.setInitialData(initialData)`

`setInitialData` defines what data your store will set in the state tree. Pass an Object or `Immutable.Map` to `setInitialData` with any properties your Store will be housing, and default values for each property.

### `Store.addListener(action, callback)`

`addListener` will add a listener for the specified action. When that action is heard, the callback function will be called with the payload that was given to the `dispatch` function, if one was provided. Note that any store that adds a listener via `addListener` method will call its callback function, even if the option store name argument was given to `dispatch`.

### `Store.addTargetedListener(action, callback)`

`addTargetedListener` will add a targeted listener for the specified action. When that action is heard, the callback function will be called with the payload that was given to the `dispatch` function, if one was provided. Unlike `addListener`, the callback will only be called if the Store instance's name matches the store name argument given to `dispatch`.

### `Store.makeSetter(storeProperty)`

`makeSetter` is a shorthand for creating action listener callbacks. `makeSetter` returns a function that will update a given Store property with whatever payload was passed along with an action being listened to. Often times, your callback will simply listen for an action, and update its Store's value with the value passed to it. To simplify this, you can just write (for example) `this.handle(testActions.SET_VALUE, this.makeSetter('value'))`.

### `Store.get(pathToProperty)`

`get` returns the value of Store's state tree property. When looking up the value of a property, simply pass a the name of that property as a tring. Alternatively, you may pass an array of strings, in order to do a deeply nested object lookup.

### `Store.set(updater, value)`

`set` allows you to set the value of a Store's state tree property. To set the value of a property directly, simply use a string for the `updater` argument. Alternatively, `updater` may be an array of strings, in order update the value of a deeply nested object.

### `Store.subscribe(subscriber, callback)`

Store instances maintain a list of subscribers and their callbacks on themselves. `subscribe` allows you to add subhscribers to this list. After a Store updates its state tree data, the Store will iterate through its subscribers and call each subscriber's callback. The callback will be given the subscriber as its argument.

If you're using React, and you want a component to update itself after the Store updates, you may omit the callback argument, as the default callback will look for a `forceUpdate` method on the subscriber, and call it, if one exists.

If you're using another framework, and you want the convenience of omitting the callback argument,you can override the default with the `configBosque` function.

### `Store.unsubscribe(unsubscribe)`

`unsubscribe` removes a subscriber from a Store instance.

### `Store.getName()`

`getName` returns the name of a Store instance.
