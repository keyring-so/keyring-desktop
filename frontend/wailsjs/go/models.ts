export namespace database {
	
	export class AccountChainInfo {
	    chains: string[];
	    lastSelectedChain: string;
	
	    static createFrom(source: any = {}) {
	        return new AccountChainInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.chains = source["chains"];
	        this.lastSelectedChain = source["lastSelectedChain"];
	    }
	}
	export class AccountCredential {
	    puk: string;
	    code: string;
	
	    static createFrom(source: any = {}) {
	        return new AccountCredential(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.puk = source["puk"];
	        this.code = source["code"];
	    }
	}

}

export namespace main {
	
	export class AssetInfo {
	    name: string;
	    balance?: string;
	    price?: number;
	
	    static createFrom(source: any = {}) {
	        return new AssetInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.balance = source["balance"];
	        this.price = source["price"];
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
	    assets: AssetInfo[];
	
	    static createFrom(source: any = {}) {
	        return new ChainAssets(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.address = source["address"];
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

}

export namespace utils {
	
	export class TokenConfig {
	    symbol: string;
	    priceId: string;
	
	    static createFrom(source: any = {}) {
	        return new TokenConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.symbol = source["symbol"];
	        this.priceId = source["priceId"];
	    }
	}
	export class ChainConfig {
	    symbol: string;
	    name: string;
	    path: string;
	    priceId: string;
	    disable: boolean;
	    tokens: TokenConfig[];
	
	    static createFrom(source: any = {}) {
	        return new ChainConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.symbol = source["symbol"];
	        this.name = source["name"];
	        this.path = source["path"];
	        this.priceId = source["priceId"];
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

