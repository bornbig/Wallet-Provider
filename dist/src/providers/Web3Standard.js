"use strict";
/**
 * WalletProvider
 * @license MIT
 * @author https://github.com/libertypie
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ErrorCodes_1 = __importDefault(require("../classes/ErrorCodes"));
var Status_1 = __importDefault(require("../classes/Status"));
var ProviderEventRegistry_1 = __importDefault(require("../classes/ProviderEventRegistry"));
var Web3Standard = /** @class */ (function (_super) {
    __extends(Web3Standard, _super);
    function Web3Standard(provider, providerPackage) {
        if (providerPackage === void 0) { providerPackage = null; }
        var _this = _super.call(this) || this;
        _this._provider = null;
        _this.chainId = null;
        /**
         * isOnconnectEventTriggered
         * This will track if onconnect event was called or not, because on page
         * reopen, we will need to retrigger the event
         * this will prevent multiple events
         */
        _this.isOnconnectEventTriggered = false;
        _this._accounts = [];
        _this._providerPackage = null;
        _this._provider = provider;
        _this._providerPackage = providerPackage;
        _this.initialize();
        return _this;
    } //end fun
    /**
     * set up provider events
     */
    Web3Standard.prototype.initialize = function () {
        var _this = this;
        if (typeof this._provider == 'undefined')
            return;
        this._provider.autoRefreshOnNetworkChange = false;
        //console.log(this._provider)
        //on connect
        this._provider.on('connect', function (chainId) {
            if (!_this.isOnconnectEventTriggered)
                _this._onConnectCallback(chainId);
        });
        /**
         * disconnect
         */
        this._provider.on('disconnect', function (err) {
            _this._onDisconnectCallback(err);
        });
        this._provider.on('error', function (error) {
            _this._onErrorCallback(error);
        });
        this._provider.on('chainChanged', function (chainId) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getAccounts()];
                    case 1:
                        _a.sent();
                        this._onChainChangedCallback(chainId);
                        return [2 /*return*/];
                }
            });
        }); });
        this._provider.on('accountsChanged', function (accounts) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this._accounts = accounts;
                this._onAccountsChangedCallback(accounts);
                return [2 /*return*/];
            });
        }); });
        this._provider.on('message', function (message) {
            _this._onMessageCallback(message);
        });
    }; //end fun
    /**
     * wether the provider is supported in the browser
     */
    Web3Standard.prototype.isSupported = function () {
        return (typeof this._provider !== 'undefined');
    };
    /**
     * connect
     */
    Web3Standard.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, account, resultObj, e_1;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this.isSupported()) {
                            return [2 /*return*/, Status_1.default.error("wallet_not_found")
                                    .setCode(ErrorCodes_1.default.wallet_not_found)];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 4, , 5]);
                        _a = this;
                        return [4 /*yield*/, this._provider.request({ method: 'eth_requestAccounts' })];
                    case 2:
                        _a._accounts = _c.sent();
                        account = this._accounts[0];
                        _b = {
                            account: account
                        };
                        return [4 /*yield*/, this.getChainId()];
                    case 3:
                        resultObj = (_b.chainId = _c.sent(),
                            _b.provider = this._provider,
                            _b);
                        if (!this.isOnconnectEventTriggered && this.isConnected()) {
                            this._onConnectCallback(resultObj);
                        }
                        return [2 /*return*/, Status_1.default.successPromise("", resultObj)];
                    case 4:
                        e_1 = _c.sent();
                        this._onConnectErrorCallback(e_1);
                        return [2 /*return*/, Promise.resolve(Status_1.default.error(e_1.message).setCode(e_1.code))];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * getChainId
     */
    Web3Standard.prototype.getChainId = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.chainId = this._provider.chainId;
                return [2 /*return*/, Promise.resolve(this.chainId)];
            });
        });
    };
    /**
     * getAccounts
     */
    Web3Standard.prototype.getAccounts = function () {
        return this._accounts || [];
    }; //end fun 
    /**
     * isConnected
     */
    Web3Standard.prototype.isConnected = function () {
        return this._provider.isConnected();
    };
    /**
     * disconnect
     * @param callback
     */
    Web3Standard.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this._provider.disconnect();
                this._onDisconnectCallback();
                return [2 /*return*/, Status_1.default.successPromise("")];
            });
        });
    };
    /**
     * onConnect
     */
    Web3Standard.prototype.onConnect = function (callback) {
        if (callback === void 0) { callback = function () { }; }
        this._onConnectCallback = callback;
    };
    /**
     * getProvider
     */
    Web3Standard.prototype.getProvider = function () {
        return this._provider;
    };
    return Web3Standard;
}(ProviderEventRegistry_1.default));
exports.default = Web3Standard;