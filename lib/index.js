'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Store = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.createActions = createActions;
exports.onStateChange = onStateChange;
exports.callAction = callAction;
exports.getStore = getStore;
exports.destroyStore = destroyStore;

var _symbol = require('symbol');

var _symbol2 = _interopRequireDefault(_symbol);

var _immutable = require('immutable');

var _immutable2 = _interopRequireDefault(_immutable);

var _eventemitter = require('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var state = _immutable2.default.Map();
var storeRegistry = _immutable2.default.Map();

var StateEmitter = function (_EventEmitter) {
  _inherits(StateEmitter, _EventEmitter);

  function StateEmitter() {
    _classCallCheck(this, StateEmitter);

    return _possibleConstructorReturn(this, (StateEmitter.__proto__ || Object.getPrototypeOf(StateEmitter)).apply(this, arguments));
  }

  return StateEmitter;
}(_eventemitter2.default);

var StoreListener = function (_StateEmitter) {
  _inherits(StoreListener, _StateEmitter);

  function StoreListener() {
    _classCallCheck(this, StoreListener);

    return _possibleConstructorReturn(this, (StoreListener.__proto__ || Object.getPrototypeOf(StoreListener)).apply(this, arguments));
  }

  return StoreListener;
}(StateEmitter);

var emitter = new StateEmitter();
var stateChangeEvent = (0, _symbol2.default)('STATE_CHANGE_EVENT');

function createActions() {
  for (var _len = arguments.length, actions = Array(_len), _key = 0; _key < _len; _key++) {
    actions[_key] = arguments[_key];
  }

  return actions.reduce(function (r, action) {
    r[action] = (0, _symbol2.default)(action);
    return r;
  }, {});
}

function onStateChange(callback) {
  emitter.addListener(stateChangeEvent, callback);
}

function callAction(action, payload, storeName) {
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

var Store = exports.Store = function () {
  function Store(name) {
    _classCallCheck(this, Store);

    this.name = name;
    if (state.has(name)) {
      throw new Error('A Store with the name \'' + name + '\' already exists! Store names must be unique.');
    }
    storeRegistry = storeRegistry.set(name, this);
    state = state.set(this.name, _immutable2.default.Map());
  }

  _createClass(Store, [{
    key: 'writeData',
    value: function writeData(key, value) {
      if (typeof key === 'function') {
        var updater = key;
        state = state.set(this.name, updater(state.get(this.name)));
      } else {
        state = state.setIn([this.name, key], value);
      }
      emitter.emit(stateChangeEvent);
    }
  }, {
    key: 'readData',
    value: function readData(key, defaultValue) {
      return state.getIn([this.name, key], defaultValue);
    }
  }, {
    key: 'handle',
    value: function handle(action, handler) {
      var _this3 = this;

      emitter.addListener(action, function () {
        var payload = arguments.length <= 0 ? undefined : arguments[0];
        handler.call(_this3, payload);
      });
    }
  }, {
    key: 'handleTargeted',
    value: function handleTargeted(action, handler) {
      var _this4 = this;

      emitter.addListener(action, function () {
        var storeName = arguments.length <= 1 ? undefined : arguments[1];
        if (_this4.name !== storeName) {
          return;
        }
        var payload = arguments.length <= 0 ? undefined : arguments[0];
        handler.call(_this4, payload);
      });
    }
  }, {
    key: 'setInitialData',
    value: function setInitialData(initialData) {
      if (initialData && !this.initialData) {
        this.initialData = initialData;
        this.writeData(function (store) {
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