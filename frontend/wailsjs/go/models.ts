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

export namespace utils {
	
	export class ChainConfig {
	    symbol: string;
	    name: string;
	    path: string;
	
	    static createFrom(source: any = {}) {
	        return new ChainConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.symbol = source["symbol"];
	        this.name = source["name"];
	        this.path = source["path"];
	    }
	}

}

