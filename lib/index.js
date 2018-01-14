'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = bosque;

require('babel-polyfill');

var _immutable = require('immutable');

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
  var stateChangeEvent = Symbol('STATE_CHANGE_EVENT');

  function makeActions() {
    for (var _len = arguments.length, actions = Array(_len), _key = 0; _key < _len; _key++) {
      actions[_key] = arguments[_key];
    }

    return actions.reduce(function (r, action) {
      r[action] = Symbol(action);
      return r;
    }, {});
  }

  function onStateChange(callback) {
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
    state = state.delete(storeName);
    storeRegistry = storeRegistry.delete(storeName);
  }

  function hydrate(x) {
    state = state.merge(x);
  }

  function getState() {
    return state;
  }

  var Store = function () {
    function Store(name) {
      _classCallCheck(this, Store);

      this.name = name;
      if (state.has(name)) {
        throw new Error('A Store with the name \'' + name + '\' already exists! Store names must be unique.');
      }
      storeRegistry = storeRegistry.set(name, this);
      state = state.set(this.name, (0, _immutable.Map)());
    }

    _createClass(Store, [{
      key: 'get',
      value: function get(path, defaultValue) {
        var isStringPath = typeof path === 'string';
        if (!(isStringPath || Array.isArray(path))) {
          throw new Error('First argument passed to Store.get must be a string or array');
        }
        var pathAsArr = isStringPath ? [path] : path;
        return state.getIn([this.name].concat(_toConsumableArray(pathAsArr)), defaultValue);
      }
    }, {
      key: 'set',
      value: function set(key, value) {
        if (typeof key === 'function') {
          var updater = key;
          state = state.set(this.name, updater(state.get(this.name)));
        } else {
          state = state.setIn([this.name, key], value);
        }
        emitter.emit(stateChangeEvent);
      }
    }, {
      key: 'addListener',
      value: function addListener(action, handler) {
        var _this2 = this;

        emitter.addListener(action, function () {
          var payload = arguments.length <= 0 ? undefined : arguments[0];
          handler.call(_this2, payload);
        });
      }
    }, {
      key: 'addTargetedListener',
      value: function addTargetedListener(action, handler) {
        var _this3 = this;

        emitter.addListener(action, function () {
          var storeName = arguments.length <= 1 ? undefined : arguments[1];
          if (_this3.name !== storeName) {
            return;
          }
          var payload = arguments.length <= 0 ? undefined : arguments[0];
          handler.call(_this3, payload);
        });
      }
    }, {
      key: 'setInitialData',
      value: function setInitialData(initialData) {
        if (initialData && !this.initialData) {
          this.initialData = initialData;
          this.set(function (store) {
            return store.merge(initialData);
          });
        }
      }
    }, {
      key: 'getName',
      value: function getName() {
        return this.name;
      }
    }]);

    return Store;
  }();

  return {
    makeActions: makeActions,
    onStateChange: onStateChange,
    dispatch: dispatch,
    getStore: getStore,
    destroyStore: destroyStore,
    hydrate: hydrate,
    getState: getState,
    Store: Store
  };
}

var _bosque = bosque(),
    makeActions = _bosque.makeActions,
    onStateChange = _bosque.onStateChange,
    dispatch = _bosque.dispatch,
    getStore = _bosque.getStore,
    destroyStore = _bosque.destroyStore,
    hydrate = _bosque.hydrate,
    getState = _bosque.getState,
    Store = _bosque.Store;

module.exports = {
  makeActions: makeActions,
  onStateChange: onStateChange,
  dispatch: dispatch,
  getStore: getStore,
  destroyStore: destroyStore,
  hydrate: hydrate,
  getState: getState,
  Store: Store
};