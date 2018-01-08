import 'babel-polyfill';
import {Map} from 'immutable';
import EventEmitter from 'eventemitter3';

export default function bosque() {
  let state = Map();
  let storeRegistry = Map();
  class StateEmitter extends EventEmitter {}
  const emitter = new StateEmitter();
  const stateChangeEvent = Symbol('STATE_CHANGE_EVENT');

  function createActions(...actions) {
    return actions.reduce((r, action) => {
      r[action] = Symbol(action);
      return r;
    }, {});
  }

  function onStateChange(callback) {
    emitter.addListener(stateChangeEvent, callback);
  }

  function callAction(action, payload, storeName) {
    if (storeName && !state.has(storeName)) {
      throw new Error(`Attempted to call action targeted for store '${storeName}', which does not exist!`);
    } else {
      emitter.emit(action, payload, storeName);
    }
  }

  function getStore(name) {
    return storeRegistry.get(name);
  }

  function destroyStore(storeName) {
    state = state.delete(storeName);
    storeRegistry = storeRegistry.delete(storeName);
  }

  class Store {
    constructor(name) {
      this.name = name;
      if (state.has(name)) {
        throw new Error(`A Store with the name '${name}' already exists! Store names must be unique.`);
      }
      storeRegistry = storeRegistry.set(name, this);
      state = state.set(this.name, Map());
    }

    readData(path, defaultValue) {
      const isStringPath = typeof path === 'string';
      if (!(isStringPath || Array.isArray(path))) {
        throw new Error('First argument passed to Store.readData must be a string or array');
      }
      const pathAsArr = isStringPath
        ? [path]
        : path;
      return state.getIn([this.name, ...pathAsArr], defaultValue);
    }

    writeData(key, value) {
      if (typeof key === 'function') {
        const updater = key;
        state = state.set(this.name, updater(state.get(this.name)))
      } else {
        state = state.setIn([this.name, key], value);
      }
      emitter.emit(stateChangeEvent);
    }

    handle(action, handler) {
      emitter.addListener(action, (...args) => {
        const payload = args[0];
        handler.call(this, payload);
      });
    }

    handleTargeted(action, handler) {
      emitter.addListener(action, (...args) => {
        const storeName = args[1];
        if (this.name !== storeName) {
          return;
        }
        const payload = args[0];
        handler.call(this, payload);
      });
    }

    setInitialData(initialData) {
      if (initialData && !this.initialData) {
        this.initialData = initialData;
        this.writeData((store) => store.merge(initialData));
      }
    }

    getName() {
      return this.name;
    }
  }

  return {
    createActions,
    onStateChange,
    callAction,
    getStore,
    destroyStore,
    Store
  };
}

const {
  createActions,
  onStateChange,
  callAction,
  getStore,
  destroyStore,
  Store
} = bosque();

module.exports = {
  createActions,
  onStateChange,
  callAction,
  getStore,
  destroyStore,
  Store
};
