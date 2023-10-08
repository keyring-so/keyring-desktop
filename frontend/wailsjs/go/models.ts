export namespace main {
	
	export class AssetInfo {
	    address: string;
	    symbol: string;
	    img: string;
	    balance?: string;
	    price?: number;
	
	    static createFrom(source: any = {}) {
	        return new AssetInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.address = source["address"];
	        this.symbol = source["symbol"];
	        this.img = source["img"];
	        this.balance = source["balance"];
	        this.price = source["price"];
	    }
	}
	export class ChainDetail {
	    name: string;
	    symbol: string;
	    img: string;
	
	    static createFrom(source: any = {}) {
	        return new ChainDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.symbol = source["symbol"];
	        this.img = source["img"];
	    }
	}
	export class CardChainInfo {
	    chains: ChainDetail[];
	    lastSelectedChain: string;
	
	    static createFrom(source: any = {}) {
	        return new CardChainInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.chains = this.convertValues(source["chains"], ChainDetail);
	        this.lastSelectedChain = source["lastSelectedChain"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CardCredential {
	    puk: string;
	    code: string;
	
	    static createFrom(source: any = {}) {
	        return new CardCredential(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.puk = source["puk"];
	        this.code = source["code"];
	    }
	}
	export class CardInfo {
	    id: number;
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new CardInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	    }
	}
	export class ChainAssets {
	    address: string;
	    symbol: string;
	    img: string;
	    balance?: string;
	    price?: number;
	    assets: AssetInfo[];
	
	    static createFrom(source: any = {}) {
	        return new ChainAssets(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.address = source["address"];
	        this.symbol = source["symbol"];
	        this.img = source["img"];
	        this.balance = source["balance"];
	        this.price = source["price"];
	        this.assets = this.convertValues(source["assets"], AssetInfo);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class FeeInfo {
	    base: string;
	    tip: string;
	
	    static createFrom(source: any = {}) {
	        return new FeeInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.base = source["base"];
	        this.tip = source["tip"];
	    }
	}
	export class InitCardResponse {
	    mnemonic: string;
	    cardInfo: CardInfo;
	
	    static createFrom(source: any = {}) {
	        return new InitCardResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.mnemonic = source["mnemonic"];
	        this.cardInfo = this.convertValues(source["cardInfo"], CardInfo);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace utils {
	
	export class TokenConfig {
	    symbol: string;
	    img: string;
	    priceId: string;
	    decimals: number;
	    address: string;
	
	    static createFrom(source: any = {}) {
	        return new TokenConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.symbol = source["symbol"];
	        this.img = source["img"];
	        this.priceId = source["priceId"];
	        this.decimals = source["decimals"];
	        this.address = source["address"];
	    }
	}
	export class ChainConfig {
	    name: string;
	    symbol: string;
	    img: string;
	    path: string;
	    priceId: string;
	    driver: string;
	    rpcUrl: string;
	    rpcAuth: string;
	    chainId: number;
	    explore: string;
	    decimals: number;
	    testnet: boolean;
	    disable: boolean;
	    tokens: TokenConfig[];
	
	    static createFrom(source: any = {}) {
	        return new ChainConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.symbol = source["symbol"];
	        this.img = source["img"];
	        this.path = source["path"];
	        this.priceId = source["priceId"];
	        this.driver = source["driver"];
	        this.rpcUrl = source["rpcUrl"];
	        this.rpcAuth = source["rpcAuth"];
	        this.chainId = source["chainId"];
	        this.explore = source["explore"];
	        this.decimals = source["decimals"];
	        this.testnet = source["testnet"];
	        this.disable = source["disable"];
	        this.tokens = this.convertValues(source["tokens"], TokenConfig);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

