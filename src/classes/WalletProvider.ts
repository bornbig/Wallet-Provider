/**
 * WalletProvider 
 * @license MIT 
 * @author https://github.com/libertypie
 */

 const  path = require("path")
import MicroModal from 'micromodal'; 
import MainCssStyles from "../assets/styles/main.css";
//import ErrorCodes from './ErrorCodes';
import Exception from "./Exception"
import Status from "./Status"

 export default class WalletProvider {

    /**
     * default config 
     */
    private config = {
        providers: {
            "web3_wallets": {}
        },
        modalClass: "",
        modalTitle: "Select Wallet",
        cacheProvider: true,
        showLoader: true,
        debug: false
    }

    /**
     * providers 
     */
    providerModules: any = {
        "web3_wallets":         "EthereumProvider",
        "binance_chain_wallet": "BinanceChainProvider",
        "walletconnect":        "WalletConnectProvider",
        "portis":               "PortisProvider",
        "frame":                "FrameProvider",
        "authereum":            "AuthereumProvider",
        "walletlink":           "WalletLinkProvider",
        "torus":                "TorusProvider"
    }

    //modal
    private modalId: string = "__wallet__provider" 

    //is modal visible
    private isModalVisible: boolean = false;

    //provider cache name 
    private providerCacheName = "__wallet_provider_cache"

    //selected provider 
    selectedProviderName  = null;

    //  events
    eventNames = [
        "message",
        "modalOpen",
        "modalClose",
        "connect",
        "disconnect",
        "accountsChanged",
        "chainChanged",
        "error",
        "connectError"
    ];

    registeredEvents: any = {};

    constructor(options = {}){

        if(typeof options != 'object'){
            throw new Exception("opts_must_be_object","Options must be an object")
            return
        }

        this.config = Object.assign(this.config,options);

        let hasWeb3Support = (window as any).ethereum ||  (window as any).web3; 

        if(!this.config.providers.hasOwnProperty("web_wallets") && hasWeb3Support){
            this.config.providers = {...{web3_wallets: {}}, ...this.config.providers}
        }

        //lets make 

        //process and validate enabled providers 
        this.validateEnabledProviders();


        //inject modal
        this._injectModalMarkup();

        if(this.config.showLoader){           
             document.querySelector(".modal__overlay").addEventListener("click",(event)=>{
                 event.preventDefault()
                 event.stopImmediatePropagation();
             })
        }

        MicroModal.init({       
            onShow: modal => this._onModalShow(modal), 
            onClose: modal => this._onModalClose(modal),   
            openClass: 'is-open',
            disableScroll: false,
            disableFocus: false,
            awaitOpenAnimation: false, 
            awaitCloseAnimation: false,
            debugMode: this.config.debug
        });
        
        //check for provider cache
        if(this.config.cacheProvider && this.isProviderCached()){
            let cachedProviderName = this.getProviderCache()
            this.selectedProviderName = cachedProviderName;    
        }

    } //end fun 

    /**
     * hasProviderCache
     */
    isProviderCached(): boolean {

        let providerNameCache = this.getProviderCache()

        if(providerNameCache == null) return false;

        if(!this.providerModules.hasOwnProperty(providerNameCache)) return false;

        return true;
    } //end fun 

    /**
     * getProviderCache
     * @return string 
     */
    private getProviderCache(): any {
        return (window as any).localStorage.getItem(this.providerCacheName) || null 
    }//end 

    /**
     * save provider name in cache
     * @param string the provider name 
     */
    private cacheProviderName(providerName: string) {
        (window as any).localStorage.setItem(this.providerCacheName, providerName) 
    }//end fun 

    /**
     * removeProviderCache
     */
    removeProviderCache(): boolean {
        (window as any).localStorage.removeItem(this.providerCacheName)
        return true;
    }

    /**
     * process provider configs
     */
    private validateEnabledProviders(){
        
        //let check enabled providers 
        let enabledProviders = this.config.providers;

        for(let provider of Object.keys(enabledProviders)){
            if(!this.providerModules.hasOwnProperty(provider)){
                
                let exception = new Exception("unknown_provider",`Unknown provider name ${provider}`);

                this.dispatchEvent("error",exception);
                
                throw exception;
            }   
        }
        
    } //end fun

    /**
     * trigger  onError Event 
     * @param string
     */
    private dispatchEvent(eventName: string, data: any){
        let eventCallback: any = this.registeredEvents[eventName] || null;
        if(typeof eventCallback == 'function'){
            eventCallback(data)
        }
    }

    /**
     * on Modal show event
     */
    private _onModalShow(modal: any){
        this.isModalVisible = true;
        this.dispatchEvent("modalOpen",modal);
    }

    /**
     * on modal close  event
     * @param any 
     */
    private _onModalClose(modal: any){
        this.isModalVisible = false;
        this.dispatchEvent("modalClose",modal);
        this.hideLoader()
    }

    /**
     * show the modal
     */
    async showModal(): Promise<string>{
        
        if(!this.isModalVisible){
            MicroModal.show(this.modalId,{
                onShow: modal => this._onModalShow(modal), 
                onClose: modal => this._onModalClose(modal),    
            })
        }

        this.selectedProviderName = await this.handleProviderItemClick();

        this.handleDisableProviderItemClickEvent();

        return this.selectedProviderName;
    }

    /**
     * hide the modal
     */
    closeModal(){
        MicroModal.close(this.modalId,{
            onClose: modal => this._onModalClose(modal),   
        })
    }

    /**
     * toggle modal
     */
    toggleModal(){
        if(this.isModalVisible){
            this.closeModal()
        } else {
            this.showModal()
        }
    }

    /**
     * events
     * @param eventName 
     */
    on(eventName: string, callback: Function = ()=>{}) {
        
        if(!this.eventNames.includes(eventName)){
            throw new Error(`Unknown Event ${eventName}`)
        }

        (this.registeredEvents as any)[eventName] = callback;
    } //end fun


    /**
     * modalMarkup
     */
    private _injectModalMarkup(): void {

        let modalId = this.modalId;

        let _this = this;

        //lets check if the class is created already
        let styleId = document.getElementById("wallet_provider__style")

        if(styleId == null){
            var style = document.createElement('style');
            style.setAttribute("id","wallet_provider__style")
            style.innerHTML = MainCssStyles;
            document.head.appendChild(style);
        }
        
        let providersMarkup = "";

        for(let provider of Object.keys(this.config.providers)){

            let enabledProviderInfo = this.config.providers[provider];
            let providerDescText = enabledProviderInfo.connect_text || "";
            let providerName = enabledProviderInfo.name || provider.replace(/(\_)+/g," ");

            if(provider == "web3_wallets"){
                providerDescText = `
                    <div class="flex flex_row supported_wallets flex_wrap">
                        <div class="flex flex_row">
                            <div class="sub_icon metamask_16"></div>
                            <div>MetaMask</div>
                        </div>
                        <div class="flex flex_row">
                            <div class="sub_icon brave_16"></div>
                            <div>Brave</div>
                        </div>
                        <div class="flex flex_row">
                            <div class="sub_icon trustwallet_16"></div>
                            <div>Trust Wallet</div>
                        </div>
                    </div>
                `;
            }

            providersMarkup  += `
                <a href="#" data-provider="${provider}" class="m__col provider_item_btn">
                    <div class="provider_item">
                        <div class="icon ${provider}_icon"></div>
                        <h1 class="title">${providerName}</h1>
                        <div class="provider_info">
                            ${providerDescText}
                        </div>
                    </div>
                </a>
            `;
        } //end for loop

        let modalMarkup = `
            <div class="wallet_provider__wrapper">
                <div class="modal micromodal-slide" id="${modalId}" class="modal" aria-hidden="true">
                    <div class="modal__overlay" tabindex="-1" data-micromodal-close>
                        <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="${modalId}-title">
                            <header class="modal__header">
                                <h2 class="modal__title" id="${modalId}-title">
                                    ${this.config.modalTitle}
                                </h2>
                                <button class="modal__close" aria-label="Close modal" data-micromodal-close></button>
                            </header>
                            <main class="modal__content" id="${modalId}-content">
                              <div class="m__row">
                                ${providersMarkup}
                              </div>
                              <div class="spinner_overlay hide">
                               <div class="spinner_wrapper">
                                    <div class="spinner">
                                        <div class="double-bounce1"></div>
                                        <div class="double-bounce2"></div>
                                    </div>
                                </div>
                              </div>
                            </main>
                        </div>
                    </div>
                </div>
            </div>
        `;

        let modalNode = document.createElement("div");
        modalNode.innerHTML = modalMarkup;

        document.body.appendChild(modalNode)
    }

    /**
     * showLoader
     */
    showLoader(){
        if(!this.config.showLoader) return;
        let wpc = document.querySelector(".wallet_provider__wrapper");
        let spo = wpc.querySelector(".spinner_overlay");
        let mc =  wpc.querySelector(".modal__container");
        wpc.querySelector(".modal__close").classList.add("hide")
        spo.classList.remove('hide')
        spo.setAttribute("style","height:"+mc.scrollHeight+"px")
    }

    /**
     * hide the loader
     */
    hideLoader(){
        if(!this.config.showLoader) return;
        let wpc = document.querySelector(".wallet_provider__wrapper");
        let spo = wpc.querySelector(".spinner_overlay");
        wpc.querySelector(".modal__close").classList.remove("hide")
        spo.classList.add('hide')
        wpc.querySelector(".modal__container").classList.remove("no_scroll");
    }

    /**
     * handleProviderItemClick
     */
    async handleProviderItemClick(): Promise<string> {

        let _this = this;

        return new Promise((resolve,reject)=>{
            Array.from(document.querySelectorAll(".provider_item_btn")).forEach((el)=>{

                //provider 
                let provider = (el as any).dataset.provider || null;
    
                if(provider  == null) return false;
    
                el.addEventListener("click",(e)=>{
                    e.preventDefault()
                    
                    //return selected provider
                    resolve(provider)
                })
            })
        })
    }

    //disable click event
    handleDisableProviderItemClickEvent(){
        Array.from(document.querySelectorAll(".provider_item_btn")).forEach((el)=>{
            el.removeEventListener("click",()=>{})
        });
    }

    /**
     * connect
     */
    async connect(): Promise<Status>{

        if(this.selectedProviderName == null){
           this.selectedProviderName = await this.showModal();
        }
        
        let resultStatus = await this._proccessConnect(this.selectedProviderName);

        this.selectedProviderName = null;

        this.closeModal();

        return resultStatus;
    }//end fun

    /**
     * _proccessConnect
     */
    private async _proccessConnect(providerName: string): Promise<Status> {  
        
        let providerModule = await this.getProviderModule(providerName)

        //lets  add options
        let providerInfo = this.config.providers[providerName] || {}

        let providerInst = new providerModule()

        let defaultFun = () => {}

        //lets now register  some events 
        providerInst.onConnect(this.registeredEvents.connect || defaultFun)
        providerInst.onDisconnect(this.registeredEvents.disconnect || defaultFun)
        //providerInst.onPermissionRequest(this.registeredEvents.permissionRequest || defaultFun)
        providerInst.onError(this.registeredEvents.error || defaultFun)
        providerInst.onAccountsChanged(this.registeredEvents.accountChange || defaultFun)
        providerInst.onChainChanged(this.registeredEvents.chainChange || defaultFun)
        providerInst.onConnectError(this.registeredEvents.connectError || defaultFun)
        providerInst.onMessage(this.registeredEvents.message || defaultFun)

        //show the loader 
        this.showLoader();
        try{

            //initialize 
            await providerInst._initialize(providerInfo);
            let connectStatus = await providerInst.connect() as Status;

            //if success, and provider cache is enabled, lets cache the provider
            if(connectStatus.isError()){
                return Promise.resolve(connectStatus);
            }

            let cacheProvider = this.config.cacheProvider || true;

            if(cacheProvider){
                this.cacheProviderName(providerName)
            }

            return  Promise.resolve(connectStatus);
        } catch(e){

            if(this.config.debug){
                console.log("Connect Error", e, e.stack)
            }

            return Status.error(e.message || "connect_failed")
        } finally {
            this.closeModal()
            this.hideLoader();
        }       
   
    } //end fun

    /**
     * getProviderModule
     */
    async getProviderModule(providerName: string): Promise<any> {
        let providerModule = this.providerModules[providerName] || null;
        
        if(providerModule == null){
            let err = new Exception("unknown_provider",`Unknown provider name ${providerName}`)
            throw err; 
        }

        let module =  await import(`../providers/${providerModule}`);

        return module.default;
    } //end

} //end class

