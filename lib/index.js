'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Store = exports.configBosque = exports.getState = exports.hydrate = exports.destroyStore = exports.getStore = exports.dispatch = exports.removeStateChangeListener = exports.addStateChangeListener = exports.makeActions = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = bosque;

var _immutable = require('immutable');

var _es6Symbol = require('es6-symbol');

var _es6Symbol2 = _interopRequireDefault(_es6Symbol);

var _eventemitter = require('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function bosque() {
  var state = (0, _immutable.Map)();
  var storeRegistry = (0, _immutable.Map)();

  var StateEmitter = function (_EventEmitter) {
    _inherits(StateEmitter, _EventEmitter);

    function StateEmitter() {
      _classCallCheck(this, StateEmitter);

      return _possibleConstructorReturn(this, (StateEmitter.__proto__ || Object.getPrototypeOf(StateEmitter)).apply(this, arguments));
    }

    return StateEmitter;
  }(_eventemitter2.default);

  var emitter = new StateEmitter();
  var stateChangeEvent = (0, _es6Symbol2.default)('STATE_CHANGE_EVENT');
  var isPendingEmit = false;
  var config = {
    defaultSubscriberFunc: function defaultSubscriberFunc(subscriber) {
      if (typeof subscriber.forceUpdate === 'function') {
        subscriber.forceUpdate();
      }
    },

    createGetters: true,
    createSetters: true
  };

  function makeActions() {
    for (var _len = arguments.length, actions = Array(_len), _key = 0; _key < _len; _key++) {
      actions[_key] = arguments[_key];
    }

    return actions.reduce(function (r, action) {
      r[action] = (0, _es6Symbol2.default)(action);
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
      throw new Error('Attempted to call action targeted for store \'' + storeName + '\', which does not exist!');
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

  var Store = function () {
    function Store(name) {
      _classCallCheck(this, Store);

      this._name = name;
      if (state.has(name)) {
        throw new Error('A Store with the name \'' + name + '\' already exists! Store names must be unique.');
      }
      storeRegistry = storeRegistry.set(name, this);
      state = state.set(this._name, (0, _immutable.Map)());
      this._subscribers = (0, _immutable.List)();
    }

    _createClass(Store, [{
      key: 'get',
      value: function get(path, defaultValue) {
        var isStringPath = typeof path === 'string';
        if (!(isStringPath || Array.isArray(path))) {
          throw new Error('First argument passed to Store.get must be a string or array');
        }
        var pathAsArr = isStringPath ? [path] : path;
        return state.getIn([this._name].concat(_toConsumableArray(pathAsArr)), defaultValue);
      }
    }, {
      key: 'set',
      value: function set(updater, value) {
        var _this2 = this;

        if (typeof updater === 'function') {
          state = state.set(this._name, updater(state.get(this._name)));
        } else if (Array.isArray(updater)) {
          state = state.setIn([this._name].concat(_toConsumableArray(updater)), value);
        } else {
          state = state.setIn([this._name, updater], value);
        }
        if (isPendingEmit) {
          return;
        }
        isPendingEmit = true;
        setTimeout(function () {
          emitter.emit(stateChangeEvent);
          _this2._subscribers.forEach(function (sub) {
            sub.get('func')(sub.get('subscriber'));
          });
          isPendingEmit = false;
        }, 0);
      }
    }, {
      key: 'makeSetter',
      value: function makeSetter(prop) {
        var _this3 = this;

        return function (value) {
          _this3.set(prop, value);
        };
      }
    }, {
      key: 'addListener',
      value: function addListener(action, handler) {
        var _this4 = this;

        emitter.addListener(action, function () {
          var payload = arguments.length <= 0 ? undefined : arguments[0];
          handler.call(_this4, payload);
        });
      }
    }, {
      key: 'addTargetedListener',
      value: function addTargetedListener(action, handler) {
        var _this5 = this;

        emitter.addListener(action, function () {
          var storeName = arguments.length <= 1 ? undefined : arguments[1];
          if (_this5._name !== storeName) {
            return;
          }
          var payload = arguments.length <= 0 ? undefined : arguments[0];
          handler.call(_this5, payload);
        });
      }
    }, {
      key: 'setInitialData',
      value: function setInitialData(initialData) {
        var _this6 = this;

        if (initialData && !this.initialData) {
          this.initialData = initialData;
          this.set(function (store) {
            return store.merge(initialData);
          });
        }
        var keys = _immutable.Map.isMap(initialData) ? initialData.keySeq().toJS() : Object.keys(initialData);
        keys.forEach(function (key) {
          var options = {};
          if (config.createGetters) {
            options.get = function () {
              return _this6.get(key);
            };
          }
          if (config.createSetters) {
            options.set = function (value) {
              _this6.set(key, value);
            };
          }
          if (config.createGetters || config.createSetters) {
            Object.defineProperty(_this6, key, options);
          }
        });
      }
    }, {
      key: 'subscribe',
      value: function subscribe(subscriber) {
        var func = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : config.defaultSubscriberFunc;

        this._subscribers = this._subscribers.push((0, _immutable.Map)({
          subscriber: subscriber,
          func: func
        }));
      }
    }, {
      key: 'unsubscribe',
      value: function unsubscribe(subscriber) {
        this._subscribers = this._subscribers.filterNot(function (sub) {
          return sub.get('subscriber') === subscriber;
        });
      }
    }, {
      key: 'getName',
      value: function getName() {
        return this._name;
      }
    }]);

    return Store;
  }();

  return {
    makeActions: makeActions,
    addStateChangeListener: addStateChangeListener,
    removeStateChangeListener: removeStateChangeListener,
    dispatch: dispatch,
    getStore: getStore,
    destroyStore: destroyStore,
    hydrate: hydrate,
    getState: getState,
    configBosque: configBosque,
    Store: Store
  };
}

var _bosque = bosque();

var makeActions = _bosque.makeActions,
    addStateChangeListener = _bosque.addStateChangeListener,
    removeStateChangeListener = _bosque.removeStateChangeListener,
    dispatch = _bosque.dispatch,
    getStore = _bosque.getStore,
    destroyStore = _bosque.destroyStore,
    hydrate = _bosque.hydrate,
    getState = _bosque.getState,
    configBosque = _bosque.configBosque,
    Store = _bosque.Store;
exports.makeActions = makeActions;
exports.addStateChangeListener = addStateChangeListener;
exports.removeStateChangeListener = removeStateChangeListener;
exports.dispatch = dispatch;
exports.getStore = getStore;
exports.destroyStore = destroyStore;
exports.hydrate = hydrate;
exports.getState = getState;
exports.configBosque = configBosque;
exports.Store = Store;


if (typeof window !== 'undefined') {
  window.bosque = bosque;
}