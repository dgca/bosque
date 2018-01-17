import 'babel-polyfill';
import {
  Map,
  List
} from 'immutable';
import EventEmitter from 'eventemitter3';

export default function bosque() {
  let state = Map();
  let storeRegistry = Map();
  class StateEmitter extends EventEmitter {}
  const emitter = new StateEmitter();
  const stateChangeEvent = Symbol('STATE_CHANGE_EVENT');
  let isPendingEmit = false;
  let config = {
    defaultSubscriberFunc(subscriber) {
      if (typeof subscriber.forceUpdate === 'function') {
        subscriber.forceUpdate();
      }
    },
    createGetters: true,
    createSetters: true
  };

  function makeActions(...actions) {
    return actions.reduce((r, action) => {
      r[action] = Symbol(action);
      return r;
    }, {});
  }

  function addStateChangeListener(callback) {
    emitter.addListener(stateChangeEvent, callback);
  }

  function removeStateChangeListener(callback) {
    emitter.addListener(stateChangeEvent, callback);
  }

  function dispatch(action, payload, storeName) {
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
    if (!state.has(storeName)) {
      return false;
    }
    state = state.delete(storeName);
    storeRegistry = storeRegistry.delete(storeName);
    return true;
  }

  function hydrate(x) {
    state = state.merge(x);
  }

  function getState() {
    return state.toObject();
  }

  function configBosque(settings) {
    config = settings;
  }

  class Store {
    constructor(name) {
      this._name = name;
      if (state.has(name)) {
        throw new Error(`A Store with the name '${name}' already exists! Store names must be unique.`);
      }
      storeRegistry = storeRegistry.set(name, this);
      state = state.set(this._name, Map());
      this._subscribers = List();
    }

    get(path, defaultValue) {
      const isStringPath = typeof path === 'string';
      if (!(isStringPath || Array.isArray(path))) {
        throw new Error('First argument passed to Store.get must be a string or array');
      }
      const pathAsArr = isStringPath
        ? [path]
        : path;
      return state.getIn([this._name, ...pathAsArr], defaultValue);
    }

    set(updater, value) {
      if (typeof updater === 'function') {
        state = state.set(this._name, updater(state.get(this._name)));
      } else if (Array.isArray(updater)) {
        state = state.setIn([this._name, ...updater], value);
      } else {
        state = state.setIn([this._name, updater], value);
      }
      if (isPendingEmit) {
        return;
      }
      isPendingEmit = true;
      setTimeout(() => {
        emitter.emit(stateChangeEvent);
        this._subscribers.forEach((sub) => {
          sub.get('func')(sub.get('subscriber'));
        });
        isPendingEmit = false;
      }, 0);
    }

    makeSetter(prop) {
      return (value) => {
        this.set(prop, value);
      };
    }

    addListener(action, handler) {
      emitter.addListener(action, (...args) => {
        const payload = args[0];
        handler.call(this, payload);
      });
    }

    addTargetedListener(action, handler) {
      emitter.addListener(action, (...args) => {
        const storeName = args[1];
        if (this._name !== storeName) {
          return;
        }
        const payload = args[0];
        handler.call(this, payload);
      });
    }

    setInitialData(initialData) {
      if (initialData && !this.initialData) {
        this.initialData = initialData;
        this.set((store) => store.merge(initialData));
      }
      const keys = Map.isMap(initialData)
        ? initialData.keySeq().toJS()
        : Object.keys(initialData);
      keys.forEach((key) => {
        const options = {};
        if (config.createGetters) {
          options.get = () => this.get(key);
        }
        if (config.createSetters) {
          options.set = (value) => {
            this.set(key, value);
          };
        }
        if (config.createGetters || config.createSetters) {
          Object.defineProperty(this, key, options);
        }
      });
    }

    subscribe(subscriber, func = config.defaultSubscriberFunc) {
      this._subscribers = this._subscribers.push(Map({
        subscriber,
        func
      }));
    }

    unsubscribe(subscriber) {
      this._subscribers = this._subscribers.filterNot((sub) => {
        return sub.get('subscriber') === subscriber;
      });
    }

    getName() {
      return this._name;
    }
  }

  return {
    makeActions,
    addStateChangeListener,
    removeStateChangeListener,
    dispatch,
    getStore,
    destroyStore,
    hydrate,
    getState,
    configBosque,
    Store
  };
}

export const {
  makeActions,
  addStateChangeListener,
  removeStateChangeListener,
  dispatch,
  getStore,
  destroyStore,
  hydrate,
  getState,
  configBosque,
  Store
} = bosque();
