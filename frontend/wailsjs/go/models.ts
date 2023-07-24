export namespace database {
	
	export class AccountChainAssets {
	    address: string;
	    assets: string[];
	
	    static createFrom(source: any = {}) {
	        return new AccountChainAssets(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.address = source["address"];
	        this.assets = source["assets"];
	    }
	}
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

}

export namespace main {
	
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
	
	    static createFrom(source: any = {}) {
	        return new TokenConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.symbol = source["symbol"];
	    }
	}
	export class ChainConfig {
	    symbol: string;
	    name: string;
	    path: string;
	    tokens: TokenConfig[];
	
	    static createFrom(source: any = {}) {
	        return new ChainConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.symbol = source["symbol"];
	        this.name = source["name"];
	        this.path = source["path"];
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

