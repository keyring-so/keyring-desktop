export namespace database {
	
	export class AccountChainInfo {
	    chain: string;
	    address: string;
	
	    static createFrom(source: any = {}) {
	        return new AccountChainInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.chain = source["chain"];
	        this.address = source["address"];
	    }
	}

}

