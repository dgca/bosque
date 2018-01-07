import Symbol from 'symbol';
import Immutable from 'immutable';
import EventEmitter from 'eventemitter3';

let state = Immutable.Map();
let storeRegistry = Immutable.Map();
class StateEmitter extends EventEmitter {}
class StoreListener extends StateEmitter {}
let emitter = new StateEmitter();
const stateChangeEvent = Symbol('STATE_CHANGE_EVENT');

export function createActions(...actions) {
  return actions.reduce((r, action) => {
    r[action] = Symbol(action);
    return r;
  }, {});
}

export function onStateChange(callback) {
  emitter.addListener(stateChangeEvent, callback);
}

export function callAction(action, payload, storeName) {
  if (storeName && !state.has(storeName)) {
    throw new Error(`Attempted to call action targeted for store '${storeName}', which does not exist!`);
  } else {
    emitter.emit(action, payload, storeName);
  }
}

export function getStore(name) {
  return storeRegistry.get(name);
}

export function destroyStore(storeName) {
  state = state.delete(storeName);
  storeRegistry = storeRegistry.delete(storeName);
}

export class Store {
  constructor(name) {
    this.name = name;
    if (state.has(name)) {
      throw new Error(`A Store with the name '${name}' already exists! Store names must be unique.`);
    }
    storeRegistry = storeRegistry.set(name, this);
    state = state.set(this.name, Immutable.Map());
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
  
  readData(key, defaultValue) {
    return state.getIn([this.name, key], defaultValue);
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
      this.writeData((store) => store.merge(initialData))
    }
  }
  
  getName() {
    return this.name;
  }
}
