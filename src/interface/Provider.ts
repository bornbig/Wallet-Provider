/**
 * WalletProvider 
 * @license MIT 
 * @author https://github.com/libertypie
 */

 import Status from "../classes/Status"

interface Provider {
   
    connect(): any;
    disconnect(): Promise<Status>;
    getProvider(): any;
    isSupported(): boolean;
    isConnected(): boolean;
    getChainId(): Promise<string>;
    
    onConnect(callback: Function): void;
    onDisconnect(callback: Function): void;
    onError(callback: Function): void;
    onAccountsChanged(callback: Function): void;
    onChainChanged(callback: Function): void;
    onMessage(callback: Function): void;

 }

 export default Provider;