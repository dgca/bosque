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

// Then, we make a Store. Our store always extends Store. Stores must be instantiated
// with a unique name.
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
    demoStoreInstance.subscribe(this, this.forceUpdate);
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
        <p>The counter&apos;s current value is {demoStoreInstance.counter}</p>;
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

*Note about `setInitialData`:* You can pass a regular JS Object, or an Immutable.Map to setInitialData. You don't have to use [Immutable](https://facebook.github.io/immutable-js/) with Bosque, but I recommend considering it. Immutable ensures you're never accidentally mutating store data (say, by getting a store value and modifying it directly instead of ), and it's a

*Note about getting and setting Store data:* When you define your store's initial data with `setInitialData`, the Store creates [getters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get) and [setters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/set) for each top-level property. These getters and setters defer to the Store methods `get` and `set`, which either write or retrieve data from the global state tree. Keep in mind that no data is saved on Stores directly, they are just pointers to the state tree. That said, for convenience, you may access and write Store 'data' (again, just pointers to the state tree) using a more familiar syntax. If you'd like, you can not use the getters and setters at all, and read/write data using `Store.get` and `Store.set`, respectively.

## Bosque's exports

* bosque (default)
* makeActions
* onStateChange
* dispatch
* getStore
* destroyStore
* hydrate
* getState
* configBosque
* Store
